# Mumma's Bite — Architecture & Production-Readiness Audit

> **Scope:** Full-repository analysis at commit `a8b7d0b` (branch `main`, 40 commits).
> **Nature:** Analysis and architecture only. No production code was modified.
> **Verdict up front:** The app demonstrates a working happy path. It is **not safe to run against real money or real customers today.** There are two independently sufficient reasons to take the deployment offline until fixed (§36, C-1 and C-2).

---

# 1. Executive Summary

### What exists

A monolithic Express 5 + Mongoose 9 backend serving a Vite/React 19 SPA from `server/public`. Auth (email/password, Google OAuth, Firebase phone OTP), products, categories, a server-priced cart, and a Razorpay checkout that creates an order, opens Razorpay Checkout, and verifies the HMAC signature on return. Orders can be listed, viewed, and cancelled by their owner.

The parts that are genuinely well done:
- **Cart pricing is server-side.** `Cart.model.js:27-83` recomputes every line total from the `Product` collection on save. The client cannot inject a price into the cart. This is the single most important thing most junior e-commerce projects get wrong, and it is right here.
- **Order items are snapshotted** (`Order.model.js:3-33`) — name, price, quantity, image are copied onto the order rather than joined live.
- **HMAC signature verification is cryptographically correct** (`order.routes.js:145-148`): `sha256(order_id|payment_id)` keyed with the secret. The formula and ordering match Razorpay's spec.
- **Module layout has already started** (`modules/auth`, `modules/cart`, `modules/user`) with a controller/service/route split.
- OTPs are stored hashed with a TTL index (`OtpToken.model.js`), not in plaintext.

### What is broken

The payment system has **no server-side source of truth**. Specifically:

1. **`POST /api/order/create-order` accepts a client-supplied `amount`** (`order.routes.js:12-26`). Any authenticated user can order a ₹5,000 cart for ₹1. The cart-derived path exists but is only used when `amount` is absent — the client chooses which.
2. **A Firebase Admin service-account private key is hardcoded in `server/config/firebase.config.js:5` and pushed to `origin/main`** on GitHub. This is a full-admin credential for project `dragowar-7fb2c`. It must be revoked, not merely deleted.
3. **There is no webhook.** Payment success is recorded only if the customer's browser survives long enough to call `/verify`. Close the tab after paying and the money is captured with the order permanently stuck at `PENDING`.
4. **Stock is never decremented.** `grep -rn stock server/` shows reads only. Overselling is unbounded.
5. **`cartId` is not ownership-checked** (`order.routes.js:28,69`), so one user can build an order from another user's cart and, on verify, wipe that cart.

### Framing for the reusable-template goal

The template ambition is the right instinct, and the `modules/` split shows you're already reaching for it. But **do not extract a template from this code yet.** Templating a payment flow that trusts the client and has no webhook would replicate those defects into every future client project — a bug in a template is a bug shipped N times. The correct sequence is: make *this* checkout correct, prove it with tests, and *then* extract. §33 and §39 lay out that sequence. Extraction is Phase 9, not Phase 1.

### Honest scope estimate

Roughly **3–4 weeks of focused work** to make this safe for a first real client, and most of it is not glamorous: credential rotation, a payments rewrite, an inventory transaction, an admin surface so orders can actually be fulfilled, and tests around the money paths.

---

# 2. Current Project Understanding

**Domain:** D2C artisanal chocolates/bakery ("Mumma's Bite"), single-vendor, India-only, INR, physical goods requiring delivery.

**Topology:** Single Express process serves both API and the built SPA. `client/vite.config.js` sets `outDir: '../server/public'`, so `npm run build` in `client/` emits directly into the server's static dir. Single-origin in production — which conveniently sidesteps most CORS and cookie-`SameSite` pain, and is a good choice for this scale.

```
client/  Vite + React 19 SPA  ──build──▶  server/public/
server/  Express 5 API + static host + SPA catch-all
         MongoDB Atlas (Mongoose 9)
         Razorpay (payments) · Firebase Admin (phone OTP verify)
         ImageKit (images) · Fast2SMS (unused) · whatsapp-web.js (unused)
```

**Repository facts:**
- Remote: `https://github.com/senpai60/Mumma-sBite.git`, branches `main`, `viv`. `HEAD == origin/main`.
- `.env` files are correctly untracked (root, `server/`, `client/` all gitignored). Good.
- **But** secrets are hardcoded as *fallbacks inside tracked source*, which defeats that (§36 C-1, C-2).
- `server/public/` (the built SPA) **is committed**. Build output in git — noise in diffs, drift between source and deployed bundle.
- `server/.wwebjs_auth/` — a full Chromium profile with WhatsApp session cookies — sits in the working tree. Correctly gitignored, but it should not live in the server directory at all.
- `server/seed_mini_items.js` is untracked and uncommitted.
- Zero tests, zero CI, zero README at the repo root, no Dockerfile, no deployment manifest.

---

# 3. Current Architecture

## 3.1 Backend entry & middleware chain

`server/bin/www` → `connectDB()`, `initWhatsapp()`, then imports `app.js` and listens.

**`server/app.js:30-46` — the middleware order contains a real defect:**

```js
app.use(cors(corsOptions));       // 30
app.use(passport.initialize());   // 31
app.use(errorHandler);            // 32  ◀── ERROR HANDLER REGISTERED BEFORE ROUTES
app.use(logger("dev"));           // 33
app.use(express.json());          // 34
app.use(express.urlencoded(...)); // 35
app.use(cookieParser());          // 36
app.use(express.static(...));     // 37
// ...routes mounted at 39-46
```

Express dispatches errors *forward* from the point of failure. An error thrown in a route at stack position ~12 will never reach an error handler registered at position 2. **`errorHandler` is dead code.** Every `next(new AppError(...))` in the codebase falls through to Express's built-in finalhandler, which returns an **HTML** body — not the `{success:false, message}` JSON contract the frontend's `err?.response?.data?.message` reads everywhere. Frontend error messages silently degrade to generic fallbacks.

Also missing from the chain: `helmet`, any rate limiter, any body-size limit beyond the 100 kb default, any request-ID/correlation middleware.

**`server/app.js:55-57` — SPA catch-all:**
```js
app.get(/.*/, (req, res) => res.sendFile(.../public/index.html));
```
Unknown `GET /api/*` returns **HTTP 200 + HTML**, not a 404 JSON. A frontend typo yields `Unexpected token '<'` instead of a clear 404. The catch-all must exclude `/api`.

**`server/routes/index.js:7`** calls `res.render('index')` with **no view engine configured**. Currently masked because `express.static` (line 37) serves `public/index.html` for `GET /` first. It is a latent 500 the moment static serving changes. Dead code — delete it.

## 3.2 Route inventory (complete)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | — | No validation lib; phone-only path broken (§37) |
| POST | `/api/auth/login` | — | **No rate limit** |
| POST | `/api/auth/logout` | `protect` | `clearCookie` w/o matching attrs (§37) |
| POST | `/api/auth/otp/send` | — | **No rate limit** — SMS bombing / cost abuse |
| POST | `/api/auth/otp/verify` | — | **No attempt limit** — 6-digit brute force |
| POST | `/api/auth/otp/verify-firebase` | — | Firebase ID token verify |
| GET | `/api/auth/google` + `/callback` | passport | |
| GET/PATCH | `/api/users/me` | `protect` | `updateUserById` allow-lists fields — **correct** |
| GET | `/api/cart` | `protect` | Returns stored totals without recompute (stale) |
| POST/PATCH/DELETE | `/api/cart/items…` | `protect` | Ownership via `req.user.id` — **correct** |
| GET | `/api/products`, `/:id`, `/categories` | — | Public. No pagination. |
| **POST** | **`/api/products`** | **NONE** | **Anyone can create products + upload to ImageKit** |
| **POST** | **`/api/products/inject`** | **NONE** | **Anyone can bulk-insert 10 products** |
| POST | `/api/order/` , `/create-order` | `optionalProtect` | **Client-controlled amount; cart IDOR** |
| POST | `/api/order/verify`, `/verify-payment` | `optionalProtect` | **No ownership binding, no amount check** |
| **POST** | **`/api/create-order`** | **NONE** | App-level duplicate — `req.user` always undefined |
| **POST** | **`/api/verify-payment`** | **NONE** | App-level duplicate |
| GET | `/api/order/user` | `protect` | No pagination |
| GET | `/api/order/:orderId` | `protect` | Ownership checked — **correct** |
| POST | `/api/order/:orderId/cancel` | `protect` | Ownership checked; **ignores paymentStatus** |
| GET | `/health` | — | Liveness only; doesn't check Mongo |

**There are no admin routes whatsoever.** No way to move an order `PLACED → PROCESSING → SHIPPED → DELIVERED`. The status enum and the frontend's `StatusTimeline` (`OrderDetailsPage.jsx:62`) describe a lifecycle that **no code can advance**. Every real order is frozen at `PLACED` forever.

## 3.3 Structural inconsistency

Three competing organizational patterns coexist:

- `modules/{auth,cart,user}/` — controller + service + routes (the good pattern)
- `routes/` + `controllers/` + `services/` for products (the Express-generator pattern)
- `modules/order/order.routes.js` — **routes, controller logic, business logic, and Razorpay calls all in one 317-line file**, with handlers exported and *also* re-mounted at app level

Products additionally has a **10-item hardcoded product array inside the controller** (`products.controller.js:124-215`) that duplicates `utils/seeder.js:67-178` with different category values (`"chocolates"` string vs. resolved ObjectIds). `injectProducts` would fail schema validation on `category` — it passes a string where an ObjectId ref is required.

## 3.4 Frontend architecture

- `App.jsx` — 7 routes; guard is `user ? <Page/> : <AuthPage/>`. Correctly treated as UX only; the backend enforces separately.
- `AuthContext` — `verifyUser()` on mount hits `/api/users/me`. Login/register/OTP/Google. `loginUser` **swallows errors into `console.error`** and returns normally, so a wrong password produces no user-visible feedback.
- `CartContext` — server-backed; every mutation replaces local state with the server's response. Correct, no local price math.
- **Two different env var names for the same thing:** `orderApi.js:4` uses `VITE_SERVER_URL`; `authApi.js`, `cartApi.js`, `productsApi.js`, `PaymentPage.jsx:18` use `VITE_SERVER_UR**I**`. Both are set in `client/.env`, masking the inconsistency until someone sets only one.

---

# 4. Current Payment Flow (as actually implemented)

Traced from `PaymentPage.jsx:211` through `order.routes.js`.

```
CartPage ──"Proceed"──▶ /payment
                             │
     PaymentPage validates form client-side
     "OTP verification" ── SEE §5.1: THIS IS A NO-OP ──┐
                             │                          │
     POST /api/order/create-order  {cartId, deliveryDetails}   [optionalProtect]
                             │
     ┌───────────────────────▼──────────────────────────────┐
     │ createOrderHandler (order.routes.js:11)              │
     │  IF req.body.amount present → TRUST IT (only ≥100)   │ ◀── CRITICAL
     │  ELSE Cart.findById(cartId)   (no owner check)       │ ◀── CRITICAL
     │        amount = cart.grandTotal × 100                │
     │  razorpay.orders.create({amount, receipt, notes})    │
     │  ── SECOND Cart.findById(cartId) (duplicate query) ──│
     │  IF userId && cartId → Order.create(PLACED/PENDING)  │
     │  return {order_id, key_id, orderId, amount…}         │
     └───────────────────────┬──────────────────────────────┘
                             │
     new window.Razorpay(options).open()      ◀── checkout.js loaded... where?
                             │
              ┌──────────────┴───────────────┐
        user pays                       user dismisses
              │                               │
      handler(response)              ondismiss → setIsSubmitting(false)
              │                        ORDER REMAINS PLACED/PENDING FOREVER
     POST /api/order/verify {razorpayOrderId, paymentId, signature}
                             │
     ┌───────────────────────▼──────────────────────────────┐
     │ verifyPaymentHandler (order.routes.js:127)           │
     │  HMAC sha256(order_id|payment_id) — CORRECT          │
     │  ✗ no auth requirement (optionalProtect)             │
     │  ✗ no order.userId === req.user.id check             │
     │  ✗ no amount check vs Razorpay                       │
     │  ✗ no payment status check (authorized vs captured)  │
     │  ✗ no already-PAID guard                             │
     │  Cart.findById(order.cartId) → products = []         │
     │  order.paymentStatus = "PAID"; save()                │
     └───────────────────────┬──────────────────────────────┘
                             │
     clearCart() ──▶ navigate(`/orders/${orderId}`)
```

**No webhook endpoint exists anywhere in the codebase.** The dotted line from Razorpay's servers back to ours does not exist. This is the structural flaw from which most of §6's failure scenarios follow.

## 4.1 Data ownership at each step

| Data | Created by | Trusted? | Should be |
|---|---|---|---|
| Line prices | Server (`Cart.pre('save')`) | ✅ | ✅ correct today |
| Cart totals | Server | ⚠️ stale on read | Recompute at checkout |
| **Payment amount** | **Client (optional)** | ❌ **trusted** | **Server only** |
| `cartId` | Client | ❌ **not owner-checked** | Derive from `req.user` |
| `deliveryDetails` | Client | ❌ unvalidated, `Mixed` | Validated schema |
| Signature | Razorpay | ✅ verified | ✅ + fetch payment |
| Order status | Server | ✅ | ✅ + transition guard |

## 4.2 Razorpay Checkout script is never loaded

`PaymentPage.jsx:255` calls `new window.Razorpay(options)`. Nothing in `client/index.html`, `main.jsx`, or `PaymentPage.jsx` loads `https://checkout.razorpay.com/v1/checkout.js`. Unless it's injected somewhere not visible in source, this throws `Razorpay is not defined` — caught by the `catch` at line 262 and shown as a generic alert. **Verify this against a running instance**; if the script is genuinely missing, checkout is broken in a way that would be caught immediately by the E2E test in §30.

---

# 5. Current Order Flow

**Order creation is unconditional and eager.** An `Order` row is written *before* any payment attempt (`order.routes.js:84`), and nothing ever cleans it up. Abandoned checkouts become permanent `PLACED` orders that the customer sees in `/orders` labelled **"Order Placed — Your order has been placed successfully"** (`OrdersPage.jsx` / `OrderDetailsPage.jsx:26`). A customer who opens checkout and walks away is told their order succeeded. That is a support-ticket generator and, at volume, a trust problem.

Note the silent-failure branch: if `userId` or `cartId` is missing, the Razorpay order is created but **no DB order is written** (`order.routes.js:68`), and the response's `orderId` falls back to the Razorpay order id (line 109). The frontend then navigates to `/orders/<razorpay_order_id>`, which `Order.findById()` cannot cast → 500. The customer may have paid, with no order record at all.

## 5.1 The checkout OTP gate is a no-op

```js
// PaymentPage.jsx:23    const { user } = useAuth();
// PaymentPage.jsx:150   await user.sendOtp?.(digits);
// PaymentPage.jsx:186   await user.verifyOtp?.(...)
```

`sendOtp`/`verifyOtp` live on the **context value**, not on the **user object**. `user.sendOtp` is `undefined`; optional chaining swallows it; the `await` resolves; and line 191 sets `mobileVerified: true`. **Any six digits "verify" the phone, and no SMS is ever sent.** Since the backend never checks phone verification either, this is a correctness/UX bug rather than a broken security boundary — but the UI actively lies to the user.

## 5.2 Cancellation ignores payment state

`order.routes.js:291` gates on `status ∈ {PLACED, PROCESSING}` and never inspects `paymentStatus`. A customer who has **paid** can cancel; the order flips to `CANCELLED`, **no refund is initiated**, `paymentStatus` stays `PAID`, and the money sits with you against a cancelled order. Reconciliation and consumer-protection problem both.

---

# 6. Current Database Architecture

## 6.1 Entity map (what exists)

```
User ──1:1── Cart ──*── {Product, qty, lineTotal}
 │                          │
 │                          ▼
 └──1:*── Order ──embeds──▶ [OrderItem snapshot]
 │           └── razorpayOrderId (unique) · razorpayPaymentId (no index, not unique)
 │           └── cartId ──▶ Cart   ◀── dangling after cart is emptied
 │
 ├──1:1── Favorite (model exists, NO routes — dead)
 └──1:1── OtpToken (by phone, TTL)

Category ──1:*── Product   (Product.orderedUserIds[] — written by nothing)
```

## 6.2 Entities the brief asks about

| Entity | Status |
|---|---|
| User, Product, Cart, CartItem, Order, OrderItem, Category | ✅ exists |
| **Payment** | ❌ **absent** — two string fields on `Order` |
| **Address** | ❌ absent — free-text `User.address`, unvalidated `Order.deliveryDetails` subdoc |
| **Coupon** | ❌ absent |
| **Inventory** | ❌ absent — bare `Product.stock`, never mutated |
| **Shipment** | ❌ absent |
| **Refund** | ❌ absent — `REFUNDED` enum value with no code path |
| **WebhookEvent** | ❌ absent |
| **AuditLog** | ❌ absent |

## 6.3 Integrity problems

1. **`Order.amount` is a float in rupees** (`Order.model.js:74`). `Cart` does `Math.round(x*100)/100` — a rounding *patch*, not a fix. Money must be integer minor units (§11).
2. **`Order.notes` is `Mixed`** and receives raw `deliveryDetails` (`order.routes.js:94`) — duplicating `deliveryDetails` and accepting arbitrary client JSON into the DB.
3. **`Order.amount` is not reconciled against `products[]`.** `amount` comes from `cart.grandTotal` (stale, stored) while snapshots use *currently populated* prices. If a price changed after the last cart save, the sum of line items ≠ `amount`. No invariant enforces it.
4. **`razorpayPaymentId` has no unique index** — the same payment could be attached to two orders.
5. **`Order.cartId` dangles.** Verify empties the cart in place; the reference survives pointing at an empty cart.
6. **`Product.orderedUserIds`** is declared and never written. Dead field — and a PII-bearing unbounded array if it ever were used.
7. **No soft delete on `Product`.** Hard-deleting a product orphans `Order.products[].productId`. The snapshot saves the display, but `populate` yields `null` and `OrderDetailsPage` may render blanks.
8. **No transactions anywhere.** Order creation + (future) stock decrement + cart clear must be atomic.
9. **`connectDB` swallows connection failure** (`db.config.js:11-17`) — the server boots healthy with no database and 500s every request. `/health` returns `OK`. Must fail fast or report Mongo state.

## 6.4 Indexes

Present: `Order.userId`, `Order.razorpayOrderId` (unique), `Order.status`, `Order.paymentStatus`, `Cart.user` (unique), `Category.name/slug` (unique), `User.email` (unique sparse), `OtpToken.phone` (unique) + TTL.

Missing: `Order {userId:1, createdAt:-1}` (the exact shape of `order.routes.js:199`), `Order.razorpayPaymentId` (unique sparse), `Product.category`, `Product {title:'text'}`, `User.phone` (unique sparse — its absence permits duplicate phone accounts).

---

# 7. Current Authentication Architecture

**Mechanism:** JWT in `httpOnly` cookies. Access 15 min, refresh 7 days (`token.util.js`). `protect` verifies, then re-fetches the user from Mongo on every request — one extra query per request, but it means role/deletion changes take effect immediately. Reasonable tradeoff at this scale.

**Problems:**

1. **There is no refresh endpoint.** `grep -rn "refresh"` confirms the refresh token is *minted and stored and never consumed*. Every user is hard-logged-out after 15 minutes with no renewal — including mid-checkout.
2. **`protect` accepts a token from `req.body.token`** (`auth.middleware.js:16`). Combined with cookie auth, `credentials:true`, and `sameSite:'none'` in production, and **no CSRF token anywhere**, state-changing endpoints are CSRF-reachable.
3. **`logout` cannot clear cookies in production.** `res.clearCookie("accessToken")` (`auth.controller.js:67`) omits the `sameSite:'none'`/`secure:true`/path attributes the cookie was *set* with (`cookie.util.js:5-18`). Browsers require attribute match. The cookie survives logout until expiry.
4. **No server-side revocation.** No denylist/jti. A stolen token is valid for its full life.
5. **`COOKIE_DOMAIN` is read into `ENV_CONFIG` and never used.**
6. **Role enum is `["admin","premium user","basic user"]`** — strings with spaces, no `STAFF`, and **nothing in the codebase ever checks `role`.** There is no `requireRole` middleware. `admin` is decorative.
7. **No password policy server-side.** The 6-char minimum is client-only (`AuthContext.jsx:55`); `POST /api/auth/register` accepts `"a"`.
8. **bcrypt cost 10** — acceptable; 12 preferred for new systems.

---

# 8. Current Cart Architecture

**The strongest subsystem.** Server-owned, one cart per user (unique index), all prices recomputed from `Product` on every save, stock checked on add/update, ownership always via `req.user.id`. The client genuinely cannot manipulate cart pricing.

Gaps:

- **No guest cart.** `router.use(protect)` on all cart routes. A visitor must log in before adding anything — a well-documented conversion killer in D2C. No merge-on-login logic exists (nor is it needed until guest carts do).
- **Totals go stale on read.** `getCart` returns stored `grandTotal` without recomputation (`cart.service.js:26-30` only recomputes if `subtotal === undefined`). A price change is invisible until the cart is next mutated — and checkout consumes that stale number.
- **`Cart.pre('save')` is not atomic w.r.t. concurrency.** Two simultaneous `addToCart` calls read-modify-write the same doc; last write wins.
- **GST is hardcoded at 18%** (`Cart.model.js:73`) while the UI labels it **"GST (5%)"** (`PaymentPage.jsx:549`). Indian restaurant/bakery GST is commonly 5% or 18% depending on classification. **The code and the label disagree, and the customer is shown the wrong rate.** This needs a real answer from the client's accountant, not a guess.
- **Shipping is hardcoded** — ₹49, free ≥ ₹1000 (`Cart.model.js:74`). Fine as a default; must be config for template reuse.
- No variants/SKU, no cart expiry, no coupon hook, no handling of a product deleted while in cart.

**Should cart data be trusted at order creation?** No — not because the client can tamper with it (it can't), but because it is a *cache*. At checkout the server must re-read products, re-validate availability and price, and recompute totals fresh.

---

# 9. Current Security Assessment

Full table in §36. Summary: **2 CRITICAL, 9 HIGH, 8 MEDIUM, 5 LOW.**

The two criticals are qualitatively different from the rest:
- **C-1 (leaked Firebase admin key)** is already exposed on a public-remote repository. Rotation is required *regardless of any code change*, and no code fix reduces the exposure of the key that is already published.
- **C-2 (client-controlled amount)** is directly, trivially monetizable by any logged-in customer with browser devtools.

Everything else can be sequenced. These two cannot.

---

# 10. Payment System Audit

### 10.1 What's correct
The HMAC construction (`sha256(razorpay_order_id + "|" + razorpay_payment_id)` keyed with the secret) is exactly right, and the secret never leaves the server. Razorpay orders are created server-side. `notes` carry delivery context. Credit where due.

### 10.2 What's wrong

**a. `amount` from the request body — CRITICAL**
```js
// order.routes.js:12,18-26
const { amount, currency = "INR", receipt, cartId, deliveryDetails } = req.body;
if (amount !== undefined && amount !== null) {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount < 100) { /* reject */ }
  orderAmountInPaise = Math.round(numericAmount);   // ◀── client's number, used as-is
}
```
`POST /api/order/create-order {cartId:"<mine>", amount:100, deliveryDetails:{…}}` → Razorpay order for ₹1, DB order carrying the **full cart's items** (line 84-95 rebuilds `products` from the cart independently of `amount`), `paymentStatus` → `PAID` on verify. Complete goods for ₹1. `RazorpayCheckoutButton.jsx` even demonstrates the amount-passing call shape.

**Fix: delete the `amount` branch entirely.** The server derives the amount from the authenticated user's cart. There is no legitimate client-supplied-amount use case here.

**b. `cartId` not ownership-checked — CRITICAL**
`Cart.findById(cartId)` at lines 28 and 69 — never `{_id: cartId, user: req.user.id}`. User A supplies User B's `cartId`: A gets an order containing B's items at B's total, and on verify (line 163-167) **B's cart is emptied**. Cross-tenant read + destructive write.

**Fix: never accept `cartId`. Look up `Cart.findOne({user: req.user.id})`.**

**c. `optionalProtect` on order creation and verification — HIGH**
`order.routes.js:189-192` uses `optionalProtect`; `app.js:45-46` mounts the same handlers with **no middleware at all**. Consequences: unauthenticated callers can create Razorpay orders (merchant-account noise, and a griefing vector); `verifyPaymentHandler` never binds the order to a caller. Both duplicate app-level routes are redundant — delete them.

**d. Verification checks the signature and nothing else — HIGH**
A valid signature proves *"this order_id/payment_id pair came from Razorpay."* It proves **nothing** about amount, currency, capture state, or who the payer was. Missing:
```js
const payment = await razorpay.payments.fetch(payment_id);
payment.order_id === order_id
payment.status  === "captured"       // "authorized" ≠ money in your account
payment.amount  === order.amountPaise
payment.currency === order.currency
order.userId.equals(req.user.id)     // ownership
order.paymentStatus === "PENDING"    // idempotency guard
```
Without the `captured` check, an authorized-but-uncaptured payment marks the order `PAID` and you ship goods for money you never received.

**e. No webhook — HIGH.** See §28.

**f. No idempotency guard.** Re-POSTing `/verify` re-runs the cart clear and re-saves. Benign today only by luck; once stock decrement and email are added to that path, a double-submit double-decrements stock and double-emails.

**g. Hardcoded key/secret fallback — HIGH**
```js
// config/razorpay.js:5-6
const key_id     = ENV_CONFIG.RAZORPAY_KEY_ID     || "rzp_test_TP3XVMwuVQCgUo";
const key_secret = ENV_CONFIG.RAZORPAY_KEY_SECRET || "YBLHj1BAIhBcwOawOYl1LFY6";
```
Committed in `13f9d2f`, live on `origin/main`. Test-mode, so no direct financial loss — but the *secret* is what signs verifications. Rotate it, and note the pattern: a missing env var must **crash at boot**, never silently fall back.

**h. `error.error` echoed to the client** (`order.routes.js:122`) leaks Razorpay's raw error object; line 116 even instructs the *customer* to check Render environment variables.

**i. Rupee floats.** `orderAmountInPaise/100` (line 90) stores rupees-as-float on the order, then verify never compares against Razorpay's integer paise. §11.

---

# 11. Correct Production D2C Payment Flow

```
Cart (server-priced)
   │
   ▼
POST /api/checkout/quote          ← re-reads products, re-validates stock,
   │                                applies coupon/shipping/tax, returns
   │                                a signed, expiring Quote (no DB order)
   ▼
POST /api/checkout/orders  [auth, Idempotency-Key]
   │  ┌── MongoDB transaction ──────────────────────────┐
   │  │ 1. re-derive totals from Product (never client) │
   │  │ 2. reserve stock (atomic conditional update)    │
   │  │ 3. INSERT Order  status=PENDING_PAYMENT         │
   │  │ 4. INSERT Payment status=CREATED                │
   │  └─────────────────────────────────────────────────┘
   │  5. razorpay.orders.create({amount: order.totalPaise,
   │       receipt: order.orderNumber})   ← AFTER commit
   │  6. persist razorpayOrderId
   ▼
Razorpay Checkout (browser)
   │
   ├─────────────────────────┬──────────────────────────┐
   ▼                         ▼                          ▼
handler()              webhook (authoritative)     user abandons
POST /verify           POST /api/webhooks/razorpay        │
   │                         │                     TTL job releases
   │  BOTH funnel into a single idempotent         reservation,
   └────────▶ settlePayment(paymentId) ◀───────────  order → EXPIRED
                     │
      ┌──────────────▼─────────────────────────────┐
      │ verify signature                           │
      │ razorpay.payments.fetch()                  │
      │ assert amount/currency/order_id/captured   │
      │ assert order.userId === caller (verify path)│
      │ if order.paymentStatus === PAID → return OK │ ◀── idempotent
      │ transaction: Payment→CAPTURED,              │
      │   Order→CONFIRMED, reservation→committed,   │
      │   cart cleared, AuditLog, OutboxEvent       │
      └──────────────┬─────────────────────────────┘
                     ▼
        async: confirmation email/SMS
```

**The load-bearing idea:** the frontend handler and the webhook are **two racing notifications of the same fact**, and both call one idempotent `settlePayment()`. Neither is trusted alone. The webhook is authoritative because it survives the browser closing; the handler exists only to make the UI feel instant.

---

# 12. Correct Checkout Flow & When to Collect Information

```
Browse → Cart → [Identify] → Address → Shipping → Coupon → Tax → Review → Pay → Confirm
```

| Data | Collect when | Rationale |
|---|---|---|
| Cart contents | Browsing | — |
| Email **or** phone | Start of checkout | Required to send confirmation and to reach the customer on failure |
| Name | With address | — |
| Shipping address + PIN | Before totals are final | PIN drives shipping cost and serviceability |
| Billing address | Only if it differs | Don't ask twice by default |
| Phone OTP | **Only if the phone is the auth identity** | Verifying a delivery phone at checkout adds friction for near-zero benefit; it is not fraud control. The current flow's OTP gate is both fake (§5.1) and misplaced. |
| Payment details | Razorpay's iframe, never your server | PCI scope |
| Account creation | **Offered after payment**, pre-filled | Never block a purchase on signup |

**Recommendation: add guest checkout.** Requiring login before the cart (`cart.routes.js:14`) is the single largest conversion cost in the current design. Model it as a `Customer` keyed on email/phone with a nullable `userId`, so a guest order can be claimed later.

**Do not collect:** date of birth, gender, or full billing address for digital-only receipts. Every extra PII field is retention and breach surface (§27).

---

# 13. Order State Machine

Today one `status` field conflates three orthogonal lifecycles, which is why the enum can't express "paid but not yet packed" or "delivered and refunded."

**Split into three fields on `Order`:**

```
paymentStatus:     PENDING → AUTHORIZED → PAID → PARTIALLY_REFUNDED → REFUNDED
                        └──▶ FAILED

fulfillmentStatus: UNFULFILLED → PROCESSING → PACKED → SHIPPED → DELIVERED
                        └──────────────────────────────▶ RETURNED

orderStatus (derived, for display):
     PENDING_PAYMENT → CONFIRMED → IN_PROGRESS → COMPLETED
              └──▶ EXPIRED    └──▶ CANCELLED
```

`orderStatus` should be **computed**, not independently writable — that removes the whole class of "order says CANCELLED but payment says PAID" inconsistencies the current cancel route creates.

**Transition matrix (fulfillment):**

| From → To | UNFULFILLED | PROCESSING | PACKED | SHIPPED | DELIVERED | RETURNED |
|---|---|---|---|---|---|---|
| **UNFULFILLED** | — | ✅ *(requires paymentStatus=PAID)* | ❌ | ❌ | ❌ | ❌ |
| **PROCESSING** | ⬅️ admin+reason | — | ✅ | ❌ | ❌ | ❌ |
| **PACKED** | ❌ | ⬅️ admin+reason | — | ✅ | ❌ | ❌ |
| **SHIPPED** | ❌ | ❌ | ❌ | — | ✅ | ❌ |
| **DELIVERED** | ❌ | ❌ | ❌ | ❌ | — | ✅ *(within return window)* |
| **RETURNED** | ❌ | ❌ | ❌ | ❌ | ❌ | — |

Cancellation: allowed while `fulfillmentStatus ∈ {UNFULFILLED, PROCESSING}`. **If `paymentStatus === PAID`, cancellation must initiate a refund** — this is precisely what `order.routes.js:291` fails to do today.

Implement as a single `assertTransition(entity, from, to, actor)` helper. Clients never send a status; they invoke named actions (`/ship`, `/cancel`) and the server decides.

---

# 14. Payment State Machine

```
        CREATED ──razorpay order created
           │
           ├──▶ ATTEMPTED ──▶ AUTHORIZED ──capture──▶ CAPTURED ──┐
           │         │                                            │
           │         └──▶ FAILED ──retry──▶ ATTEMPTED             │
           │                                                       │
           └──▶ EXPIRED (TTL, no attempt)                          │
                                                                   ▼
                                              REFUND_PENDING ──▶ REFUNDED
                                                             └─▶ PARTIALLY_REFUNDED
                                                             └─▶ REFUND_FAILED
```

Key transitions:
- `CREATED → ATTEMPTED`: `payment.authorized` webhook or handler callback.
- `AUTHORIZED → CAPTURED`: **only** on confirmed capture (`payment.captured` webhook, or `payments.fetch().status === 'captured'`). **This is the only transition that may set `Order.paymentStatus = PAID`.** Today's code sets `PAID` from a signature alone.
- Any → `REFUND_*`: driven by `refund.*` webhooks, never by an admin's optimistic UI click.

A **`Payment` collection is required** (§39). One order can have many payment attempts (failure → retry), which two string fields on `Order` cannot represent. Retry after failure is common in India (UPI timeouts, bank declines) and today it either collides on the unique `razorpayOrderId` index or silently orphans the first order.

---

# 15. Cart / Checkout State

Introduce a short-lived **Quote** between cart and order:

| Concern | Cart | Quote | Order |
|---|---|---|---|
| Lifetime | Indefinite | 15 min | Permanent |
| Prices | Live | **Frozen** | Snapshotted |
| Stock | Checked | **Reserved** | Committed |
| Mutable by user | Yes | No | No |

This gives clean answers to two otherwise-unanswerable questions: *"what happens if the cart changes after the Razorpay order is created?"* (nothing — the quote is frozen and the Razorpay order is bound to it) and *"what if the price changed?"* (honour the quote if unexpired, else force re-quote with a visible diff).

**Verdict:** MUST HAVE, but implementable as fields on `Order` (`quoteExpiresAt`, `status: PENDING_PAYMENT`) rather than a separate collection. Don't build a Quote collection yet.

---

# 16. Inventory Architecture

**Current state: `Product.stock` exists, is validated on cart add, and is *never decremented anywhere*.** Verified by exhaustive grep. Every product can be sold infinitely.

**Overselling today (stock = 1):**
```
A: addToCart → stock(1) >= 1 ✅        B: addToCart → stock(1) >= 1 ✅
A: pays ✅                              B: pays ✅
stock still 1. Two customers, one chocolate box.
```

**Fix — atomic conditional decrement.** MongoDB guarantees single-document atomicity, so this needs no lock:

```js
const res = await Product.updateOne(
  { _id: productId, stock: { $gte: qty } },   // condition and update in ONE op
  { $inc: { stock: -qty, reserved: +qty } },
  { session }
);
if (res.modifiedCount === 0) throw new OutOfStockError(productId);
```

The loser's `updateOne` matches zero documents; the transaction aborts; a clean 409 is returned. **MongoDB Atlas is already in use, so multi-document transactions are available** — no infrastructure change needed.

**Reservation model:** decrement on order creation, hold `reserved` until payment settles or the quote expires. A periodic job releases expired reservations. This is the honest model for D2C — reserving at checkout is what prevents the "you paid, we're out of stock" refund spiral.

**Defer:** variants/SKUs, multi-warehouse, backorders, low-stock alerts (nice-to-have, cheap later).

---

# 17. Product Architecture

Current `Product` (`title, description, price, category, tags[], imageUrl, stock, orderedUserIds[]`) is thin but not wrong for a single-vendor catalogue of ~10 SKUs.

**Add before first client (MUST):**
- `slug` (unique) — SEO and stable URLs
- `isActive` / `deletedAt` — **soft delete**, so historical orders keep resolvable references
- `pricePaise` (integer) replacing float `price`
- `compareAtPrice` — strike-through pricing, universally expected in D2C
- `images[]` replacing single `imageUrl`

**Should have:** `sku`, `weightGrams` (shipping needs it), `taxRate` (GST varies by product class — see §8), `shortDescription`.

**Remove:** `orderedUserIds[]` — written by nothing, unbounded, PII-bearing.

**Defer:** variants. Real, but a significant modelling change; only build when a client sells sized/flavoured goods.

Also: **delete the hardcoded `products` array in `products.controller.js:124-215`** and the `/inject` route. `utils/seeder.js` already does this properly. Two seed sources with different `category` shapes will drift, and `/inject` is unauthenticated.

---

# 18. Coupon Architecture

Nothing exists. For a D2C launch this is close to mandatory — the launch discount is usually the marketing plan.

```js
Coupon {
  code: String (unique, uppercase),
  type: "PERCENTAGE" | "FIXED",
  value: Number,
  maxDiscountPaise: Number,      // caps "20% off" on a large cart
  minCartValuePaise: Number,
  validFrom, validUntil: Date,
  totalUsageLimit, perUserLimit: Number,
  usedCount: Number,
  appliesTo: { productIds[], categoryIds[] },
  firstOrderOnly: Boolean,
  isActive: Boolean
}
CouponRedemption { couponId, userId, orderId, discountPaise }  // unique {couponId,userId,orderId}
```

Non-negotiables: **all math server-side** (the client sends only `code`); re-validate at order creation, not just on apply; increment `usedCount` **inside the order transaction** using `updateOne({_id, usedCount:{$lt:limit}}, {$inc:{usedCount:1}})` so the limit can't be raced; **no stacking** (one coupon per order) until there's a real reason.

**Priority:** SHOULD HAVE — BUILD BEFORE FIRST REAL CLIENT.

---

# 19. Shipping Architecture

Currently: flat ₹49, free ≥ ₹1000, hardcoded in `Cart.model.js:74`. Fine for launch; wrong to hardcode in a template.

Keep it provider-agnostic:

```js
interface ShippingProvider {
  isServiceable(pincode): Promise<bool>
  getRates(originPin, destPin, weightGrams, valuePaise): Promise<Rate[]>
  createShipment(order): Promise<{trackingNumber, labelUrl, courier}>
  track(trackingNumber): Promise<ShipmentStatus>
}
```
Ship `FlatRateProvider` (config-driven) now; add Shiprocket/Delhivery adapters when a client needs them.

**Build now:** PIN-code format validation, serviceability list, config-driven flat rate + free threshold, `Shipment { orderId, courier, trackingNumber, status, shippedAt, deliveredAt }`, manual tracking entry by admin.
**Defer:** live courier API integration, label generation, weight-based rates, COD.

**Note:** COD is 40–60% of Indian D2C volume. It is out of scope here, but flag it to any client early — it changes the payment state machine materially.

---

# 20. Refund / Return Architecture

Nothing exists. `Order.paymentStatus` has `REFUNDED` and `PARTIALLY_REFUNDED` values that **no code can ever set**.

**Build now (MUST):** admin-initiated full refund via `razorpay.payments.refund()`, a `Refund` collection, `refund.processed`/`refund.failed` webhooks, and **automatic refund initiation when a PAID order is cancelled** (closing the §5.2 hole).

**Build before first client (SHOULD):** partial refunds (per line item), a customer-visible refund status, restocking on refund.

**Defer:** the full RMA workflow (`Return requested → approved → pickup → inspection → refund`). Real D2C needs it eventually, but early volumes are handled fine over WhatsApp with a manual admin refund. Building an RMA state machine before you have returns is premature.

---

# 21. Notification Architecture

Currently: **zero transactional notifications.** A customer pays and receives nothing. For a real store that's a launch blocker — order confirmation is the #1 support-ticket deflector.

Keep the provider swappable:
```js
interface NotificationProvider { send({to, template, data}): Promise<void> }
// EmailProvider (Resend/SES/Brevo) · SmsProvider (Fast2SMS) · WhatsAppProvider
```

Drive it from an **outbox table written inside the settlement transaction**, drained by a worker. Notifications must never be sent inline in the request path — a mail-provider timeout must not fail a payment that already succeeded.

| Event | Email | SMS | Priority |
|---|---|---|---|
| Order confirmed | ✅ | ✅ | **MUST — BUILD NOW** |
| Payment failed | ✅ | — | SHOULD |
| Shipped + tracking | ✅ | ✅ | **MUST before first client** |
| Delivered | ✅ | — | SHOULD |
| Cancelled / Refund initiated / completed | ✅ | — | MUST (with refunds) |
| Account created | ✅ | — | NICE |

**Note on `whatsapp-web.js`:** it's initialized at boot (`bin/www:10`) and `sendWhatsappMessage` is **called by nothing**. It launches a headless Chromium on every start — heavy, fragile on small hosts, and it's an unofficial library that automates a personal WhatsApp account. For a client project use the official WhatsApp Business API. **Remove it** (§37).

---

# 22. Admin Architecture

**There are no admin routes.** No order can be advanced past `PLACED`. Whatever else is built, the store cannot operate without this.

Minimum viable back-office API (behind `protect` + `requireRole('admin','staff')`):

```
GET   /api/admin/orders            filter status/date/customer, paginated
GET   /api/admin/orders/:id
POST  /api/admin/orders/:id/transition   { to, note }   ← guarded by §13 matrix
POST  /api/admin/orders/:id/ship         { courier, trackingNumber }
POST  /api/admin/orders/:id/refund       { amountPaise?, reason }
GET   /api/admin/products  · POST · PATCH · DELETE(soft)
PATCH /api/admin/products/:id/stock      { delta, reason }  ← audited
GET   /api/admin/customers               paginated, PII-access audited
GET   /api/admin/coupons   · POST · PATCH
GET   /api/admin/audit-logs
GET   /api/admin/metrics                 revenue, AOV, top products
```

Permissions:

| Action | CUSTOMER | STAFF | ADMIN |
|---|---|---|---|
| Create order / view *own* orders | ✅ | ✅ | ✅ |
| Cancel own (pre-fulfillment) | ✅ | ✅ | ✅ |
| View all orders / advance fulfillment | ❌ | ✅ | ✅ |
| **Issue refunds** | ❌ | ❌ | ✅ |
| Manage products / inventory / coupons | ❌ | ✅ | ✅ |
| Manage users & roles / view audit logs | ❌ | ❌ | ✅ |

Note the deliberate split: STAFF fulfils, only ADMIN moves money.

**Do not build an admin SPA yet.** A well-secured admin API plus a simple table UI is enough for a first client. Build the API, defer the polish.

---

# 23. API Architecture

Adapt, don't rewrite. Recommended surface:

```
/api/auth        register login logout refresh(NEW) otp/*
/api/users/me
/api/addresses                      NEW  (CRUD saved addresses)
/api/products    · /categories
/api/cart
/api/checkout    quote · orders     NEW  (replaces /api/order/create-order)
/api/orders      GET / · /:id · /:id/cancel
/api/payments    /:id/verify        (replaces /api/order/verify)
/api/webhooks    /razorpay          NEW  (raw body, no auth, signature-verified)
/api/coupons     /validate          NEW
/api/admin/*                        NEW
```

**Immediately: delete `app.js:45-46`** — the app-level `/api/create-order` and `/api/verify-payment` duplicates with no middleware whatsoever. Four routes into two handlers with three different auth postures is exactly how a fix lands on one path and misses another.

Per-endpoint contract, using the most important one:

**`POST /api/checkout/orders`**
- Auth: required (`protect`). Idempotency: **required** (`Idempotency-Key` header).
- Body: `{ addressId | address, couponCode?, notes? }` — **no `amount`, no `cartId`, no prices.**
- Validation: address schema, PIN serviceable, cart non-empty, all products active & in stock.
- 201 `{ orderId, orderNumber, razorpayOrderId, amountPaise, currency, keyId }`
- Errors: `400` invalid address · `409 CART_EMPTY` / `OUT_OF_STOCK` (with per-item detail) / `PRICE_CHANGED` · `422` coupon invalid · `502` gateway unavailable.
- Side effects: reserves stock, creates Order + Payment, creates Razorpay order, writes AuditLog.

---

# 24. Database Architecture (target)

Collections to add: **`Payment`**, **`Address`**, **`WebhookEvent`**, **`AuditLog`**, `Coupon`, `CouponRedemption`, `Refund`, `Shipment`, `OutboxEvent`.

`Order` gains: `orderNumber` (unique, human-readable e.g. `MB-2026-00042`), `subtotalPaise`, `discountPaise`, `shippingPaise`, `taxPaise`, `totalPaise`, `fulfillmentStatus`, `quoteExpiresAt`, `cancelledAt`, `cancellationReason`, `shippingAddress` (embedded snapshot), `billingAddress`.

> **Why embed an address snapshot rather than reference `Address`?** If the customer edits their saved address next month, the historical order must still show where it was *actually* shipped. Same reasoning as item snapshots.

**Indexes to add:** `Order {userId:1, createdAt:-1}`, `Order.orderNumber` (unique), `Order.razorpayOrderId` (unique sparse), `Payment.razorpayPaymentId` (unique sparse), `WebhookEvent.eventId` (**unique — this is the idempotency mechanism**), `Coupon.code` (unique), `Product {slug:1}` (unique) / `{category:1, isActive:1}`, `User.phone` (unique sparse).

**Transactions required (Atlas already supports these):**
1. Order creation: reserve stock + insert Order + insert Payment + reserve coupon
2. Payment settlement: Payment→CAPTURED + Order→CONFIRMED + commit reservation + clear cart + AuditLog + OutboxEvent
3. Cancellation: Order→CANCELLED + release stock + initiate refund record
4. Refund completion: Refund→COMPLETED + Order.paymentStatus + restock

**Backups:** Atlas continuous backup + PITR must be enabled before go-live. Not currently configured as far as the repo shows.

---

# 25. Security Architecture (target)

Defence in depth, roughly in order of cost-effectiveness:

1. **Secrets** — `envSchema.parse(process.env)` at boot; **crash on missing**, never fall back to a literal. No secret in tracked source, ever.
2. **Transport** — HTTPS only, HSTS, `helmet()`.
3. **CORS** — explicit allowlist from env. Delete the `yourdomain.com` placeholder and its wildcard regex.
4. **Auth** — access 15 m + **working** refresh rotation; `sameSite:'strict'` (achievable since API and SPA are same-origin); `clearCookie` with matching attributes; revocation list.
5. **CSRF** — same-origin + `sameSite:'strict'` largely closes it; **remove the `req.body.token` acceptance path** regardless.
6. **AuthZ** — `requireRole()` + explicit ownership assertions. Never `findById` alone on a user-scoped resource; always `findOne({_id, user: req.user.id})`.
7. **Validation** — Zod at every boundary; strip unknown keys (kills mass assignment by default).
8. **Rate limits** — global 100/15 min; auth 5/15 min per IP; **OTP send 3/hour per phone *and* per IP**; OTP verify 5 attempts then invalidate; webhooks generous but bounded.
9. **Payments** — server-derived amounts; `payments.fetch()` cross-check; webhook signature verification; idempotency keys.
10. **Data** — no PII in logs, no OTPs in logs (currently violated), no stack traces to clients in production.

---

# 26. Error Handling

Fix the ordering bug first (`app.js:32` → move to *after* all routes). Then:

```js
{ success:false, error:{ code:"OUT_OF_STOCK", message:"…", details:[…], requestId:"req_…" } }
```

- `AppError` gains `code` and `isOperational`.
- **Operational** errors (validation, 404, business rules) → real status + safe message.
- **Programmer/unexpected** errors → log full stack server-side with `requestId`; return a generic 500 quoting only the `requestId`. Today `error.middleware.js:19` returns stacks whenever `NODE_ENV !== 'production'` — and `NODE_ENV` defaults to `development` (`env.config.js:19`), so a host that forgets to set it leaks stacks in production. **Invert the default: safe unless explicitly development.**
- Add a 404 JSON handler for `/api/*` before the SPA catch-all.
- Wrap async handlers in `catchAsync` to remove ~200 lines of repeated try/catch.

---

# 27. Idempotency Strategy

| Operation | Duplicate cause | Mechanism |
|---|---|---|
| Order creation | Double-click, retry | `Idempotency-Key` header → `IdempotencyKey{key, userId, requestHash, responseBody}`, unique index; replay stored response |
| Razorpay order create | Network retry | Reuse existing `razorpayOrderId` if the order already has one |
| **Payment verification** | Handler + webhook race | `if (order.paymentStatus === 'PAID') return 200` **before** any side effect |
| **Webhook delivery** | Razorpay retries on non-2xx | `WebhookEvent.eventId` **unique index**; duplicate insert → 200, skip |
| Refund | Admin double-click | Razorpay refund idempotency key = `refund_{orderId}_{n}` |
| Stock decrement | Any retry | Conditional `updateOne` inside a transaction; second attempt matches 0 docs |

The single highest-value line of code in this section is the already-PAID early return in `settlePayment` — it makes the handler/webhook race harmless.

---

# 28. Webhook Strategy

**Does this project need webhooks? Yes — unconditionally.** Without one, payment success depends on the customer's browser staying alive through the redirect. Mobile users background the app; UPI flows leave the browser entirely and often don't come back. A meaningful fraction of successful payments will never be recorded. This is the difference between a demo and a store.

```
POST /api/webhooks/razorpay
  ├─ express.raw({type:'application/json'})        ← MUST precede express.json()
  ├─ verify X-Razorpay-Signature (HMAC + WEBHOOK_SECRET, timing-safe compare)
  ├─ parse; extract event id + type
  ├─ INSERT WebhookEvent{eventId} → duplicate key? → 200 OK, done
  ├─ process by type (payment.captured, payment.failed, order.paid,
  │                   refund.created, refund.processed, refund.failed)
  ├─ mark processed
  └─ return 200 FAST  (< 5s; heavy work goes to the outbox)
```

Rules: **always 200 on a duplicate** (a non-2xx makes Razorpay retry forever); never assume once-only delivery; never assume ordering (`payment.captured` can precede your own `/verify`); store the raw payload for forensics; the signature secret is a **separate** value from the API key secret.

`server/package-lock.json` shows the `razorpay` SDK already vendors `standardwebhooks` — the verification helper is available today.

---

# 29. Logging / Monitoring / Audit

Current Winston setup (daily rotation, 30 d, error + combined) is a good base. Problems:

- **`logger.info(\`Access granted to user: ${user._id}\`)` on every authenticated request** (`auth.middleware.js:43`) — pure noise that will bury real signal and consume disk.
- **`console.log(\`🔑 [DEMO OTP FOR ${phone}]: ${otp}\`)`** in `otp.service.js:59` **and** `sms.config.js:52` — **plaintext OTPs plus phone numbers in logs.** Anyone with log access can authenticate as any user. Remove; if a dev bypass is needed, gate it on `NODE_ENV === 'development'` and a `DEV_OTP_ECHO` flag.
- `console.log`/`console.error` scattered through `order.routes.js` and `passport.config.js:10` bypass the logger entirely.
- **Logs are written to the local filesystem** — ephemeral on Render/Railway/Fly. Ship to a service (Better Stack, Axiom, or platform-native) or lose them on every deploy.

Add: JSON structured logs in production, `requestId` (`AsyncLocalStorage`) on every line, error tracking (Sentry), a `/health` that actually pings Mongo, uptime monitoring, and payment-specific alerting (**alert on any order `PENDING > 30 min` with a captured Razorpay payment** — that alarm is what catches settlement bugs before customers do).

**Never log:** passwords, JWTs, Razorpay secrets, webhook secrets, OTPs, full addresses, full phone numbers (mask to last 4).

## Audit trail

For a client-facing commerce system, yes — build it. Not for compliance theatre, but because "who marked this order shipped?" and "why was this refunded?" are questions you *will* be asked.

```js
AuditLog { actorId, actorRole, action, entityType, entityId,
           before, after, reason, ip, userAgent, requestId, createdAt }
```
Append-only, never updated/deleted. Log: order created, payment verified, every status transition, refunds, stock adjustments, product/coupon changes, role changes, admin PII access. Index `{entityType, entityId, createdAt:-1}`.

---

# 30. Testing Strategy

Currently **zero tests**, no test runner, no CI. For code that moves money that's the largest single risk multiplier — every fix in this report is unverifiable without them.

Stack: Vitest (matches the Vite toolchain) + Supertest + `mongodb-memory-server` + `nock` for Razorpay.

**Priority 1 — write alongside the payment fixes, non-negotiable:**
- Amount derived from cart, **client `amount` ignored** ← guards C-2 forever
- Cart ownership enforced at checkout ← guards C-3
- Signature verification: valid / tampered / missing / wrong-secret
- `/verify` rejects orders belonging to another user
- `/verify` is idempotent (call twice → one settlement)
- Webhook: valid sig / bad sig / duplicate eventId / unknown event
- Order settles correctly when the webhook arrives **before** `/verify`, and vice versa
- Stock decrements exactly once; concurrent purchase of the last unit → exactly one success
- Money math: totals, GST, shipping threshold, rounding, coupon caps
- State transitions: every allowed and forbidden pair in §13

**Priority 2:** auth (register/login/expiry/refresh), cart CRUD + stock validation, order listing scoped to owner, admin RBAC on every admin route.

**Priority 3 (E2E, Playwright):** browse → cart → checkout → pay (Razorpay test mode) → confirmation; failed payment; retry; cancel; refund.

CI: GitHub Actions on PR — lint, unit, integration. Block merge on red.

**Definition of done for the payment rewrite: every Priority-1 test passes.**

---

# 31. Deployment Strategy

Cost-conscious and appropriate to the scale. **No Kubernetes, no microservices, no Kafka, no Redis yet** — nothing in the current or near-term requirements justifies them.

```
Cloudflare DNS + TLS
      │
      ├─ Frontend: Vercel/Netlify (or keep single-origin: Express serves the SPA)
      └─ Backend:  Render / Railway / Fly.io — 1 instance, autoscale off
                   MongoDB Atlas M0→M10 (backups + PITR ON)
                   ImageKit (already integrated)
                   Resend/Brevo (email)
                   Sentry (errors) + Better Stack (logs + uptime)
```

**Recommendation: keep the single-origin deployment.** `vite.config.js` already builds into `server/public`. One service, one domain, no CORS in production, `sameSite:'strict'` cookies become viable. Simpler *and* more secure.

**But: stop committing `server/public/`.** Build in CI on deploy. Committed build output guarantees eventual drift between source and what's actually served.

Requirements before go-live: HTTPS with redirect; `RAZORPAY_WEBHOOK_SECRET` set and the webhook URL registered in the Razorpay dashboard; `/health` checking Mongo; Atlas backups on; env vars in the platform's secret store; **an IP allowlist on Atlas** (not `0.0.0.0/0`); zero-downtime deploys.

**Redis: DO NOT BUILD YET.** Justified only when you need distributed rate limiting across >1 instance, or a job queue with retry semantics beyond what a DB-backed outbox gives you. Neither applies at one instance.

---

# 32. Environment Strategy

Three environments — `development` (local, Razorpay **test**, local/shared Mongo), `staging` (deployed, Razorpay **test**, separate DB, real webhooks — *this is where you test webhooks properly*), `production` (Razorpay **live**, separate DB, separate everything).

**Fix in `config/env.config.js`:**
1. **Validate at boot with Zod and crash on missing required vars.** Today every var is an unvalidated `process.env` read, so a typo surfaces as a runtime 500 hours later.
2. **`NODE_ENV` must default to `production`**, not `development` (line 19). The current default means a host that forgets to set it gets dev-mode stack traces and non-secure cookies.
3. **Delete the `RAZORPAY_API_KEY`/`RAZORPAY_SECRET` aliases** (lines 27-30). Four names for two values, cross-defaulting into each other — a debugging trap.
4. Add: `RAZORPAY_WEBHOOK_SECRET`, `SENTRY_DSN`, `EMAIL_API_KEY`, `ADMIN_EMAILS`.
5. Add a **live-key guard**: refuse to boot if `NODE_ENV !== 'production'` and `RAZORPAY_KEY_ID` starts with `rzp_live_`.

**Frontend:** standardize on **one** of `VITE_SERVER_URL` / `VITE_SERVER_URI` (§3.4). Remember `VITE_*` vars are **compiled into the public bundle** — `VITE_RAZORPAY_KEY_ID` is fine (it's a publishable key); never put a secret behind a `VITE_` prefix. Also drop `dotenv` from `client/package.json` — it does nothing in a browser build and invites exactly that mistake.

---

# 33. Reusable Backend Template Architecture

**The core judgement: this is the right long-term goal and the wrong immediate move.** Extracting a template now would freeze the client-trusted amount, the missing webhook, and the absent stock decrement into every future project. Fix first, extract second (Phase 9, §39).

When you do extract, the split is:

**Core / reusable (~80%)** — config + env validation, error handling, logging, auth (JWT, refresh, RBAC, OTP), users, addresses, validation middleware, rate limiting, security middleware, idempotency, webhook receiver framework, audit log, outbox/notifications, admin scaffolding, pagination, test harness, deployment templates.
Also *structurally* reusable but business-shaped: cart, checkout/order engine, payment abstraction, inventory, coupon engine, shipping abstraction, refunds.

**Client-specific (~20%)** — product schema and catalogue taxonomy, tax rules (**GST rate varies by product class — see §8**), shipping rules and provider choice, branding/templates, business workflows, custom fields.

Make these **configurable, not forkable**:
```js
// config/commerce.config.js
{ currency:"INR", minorUnits:100,
  tax:{ strategy:"FLAT_GST", ratePercent:5, inclusive:false },
  shipping:{ strategy:"FLAT", flatRatePaise:4900, freeAboveP:100000 },
  checkout:{ allowGuest:true, quoteTtlMinutes:15, reserveStock:true },
  payments:{ provider:"razorpay", autoCapture:true, requireWebhook:true },
  orders:{ numberPrefix:"MB", allowCancelUntil:"PACKED" } }
```

Provider interfaces (`PaymentProvider`, `ShippingProvider`, `NotificationProvider`, `StorageProvider`) let a future client swap Razorpay for Stripe/Cashfree without touching the order engine — that is where the real leverage is.

Target onboarding: `clone → npm i → cp .env.example .env → configure commerce.config → customize product schema → seed → deploy`. **Realistic target: 1–2 days to a working client backend.**

---

# 34. Current Code vs Production Architecture

| Area | Current State | Production Requirement | Gap | Priority |
|---|---|---|---|---|
| Secrets | Firebase key + Razorpay secret hardcoded, pushed to GitHub | Env-only, validated, crash on missing | **Rotate + purge** | **P0** |
| Payment amount | Client-suppliable | Server-derived only | Delete `amount` branch | **P0** |
| Cart ownership @ checkout | `findById(cartId)`, no owner check | Derive from `req.user` | Cross-tenant IDOR | **P0** |
| Payment verification | Signature only | + fetch, amount, currency, captured, ownership, idempotency | 6 checks missing | **P0** |
| Webhooks | None | Signed, idempotent, authoritative | Entire subsystem | **P0** |
| Inventory | Never decremented | Atomic reserve + commit in txn | Unbounded overselling | **P0** |
| Admin API | **None** | Full back-office + RBAC | Orders can't be fulfilled | **P0** |
| Error handling | Registered before routes → dead | After routes, coded, safe | Ordering bug | **P1** |
| Validation | Ad-hoc `if (!x)` | Zod at every boundary | No library | **P1** |
| Rate limiting | None | Global + auth + OTP + webhook | Absent | **P1** |
| Auth refresh | Token minted, never used | Working rotation | 15-min logouts | **P1** |
| Product write auth | **Unauthenticated** | Admin-only | Open endpoint | **P1** |
| Order model | Flat, float rupees | Paise ints, 3 statuses, full breakdown | Restructure | **P1** |
| Payment entity | 2 strings on Order | `Payment` collection | Absent | **P1** |
| Transactions | None | 4 critical paths | Absent | **P1** |
| Refunds | Enum only | Full lifecycle + webhooks | Absent | **P1** |
| Notifications | None | Order/ship/refund | Absent | **P1** |
| Auto-seed on boot | `deleteMany({})` possible | Explicit CLI script | **Destructive** | **P1** |
| Tests | **Zero** | Unit + integration + E2E | Absent | **P1** |
| Guest checkout | Login required | Guest supported | Conversion cost | **P2** |
| Coupons | None | Server-side engine | Absent | **P2** |
| Audit log | None | Append-only | Absent | **P2** |
| Pagination | None | Cursor/offset everywhere | Absent | **P2** |
| Addresses | Free-text string | `Address` + snapshots | Absent | **P2** |
| Shipping | Hardcoded | Provider-agnostic | Not configurable | **P2** |
| Structure | 3 competing patterns | One convention | Refactor | **P2** |
| Observability | Local files, noisy, OTPs logged | Structured, shipped, scrubbed | Rework | **P2** |
| Docs | None | README + runbook | Absent | **P2** |
| Returns/RMA | None | Deferred workflow | Absent | **P3** |
| Variants | None | Deferred | Absent | **P3** |

---

# 35. Missing Features (consolidated)

**MUST — BUILD NOW:** webhooks · server-derived amounts · inventory decrement · admin API + RBAC · refunds · order confirmation notifications · validation layer · rate limiting · working refresh · transactions · payment idempotency · destructive-seed removal · Priority-1 tests.

**MUST — BEFORE FIRST REAL CLIENT:** `Payment`/`Address`/`AuditLog`/`WebhookEvent` collections · paise migration · guest checkout · coupons · pagination · structured logging + error tracking · shipment tracking · README + runbook · CI.

**SHOULD HAVE:** saved addresses · partial refunds · low-stock alerts · order timeline UI · admin dashboard UI · product search/filter · abandoned-cart recovery · invoice PDF.

**NICE TO HAVE:** wishlist (`Favorite` model already exists, unused) · reviews · loyalty · referrals · analytics dashboard · multi-currency.

**FUTURE / SCALE (DO NOT BUILD YET):** Redis · job queue (BullMQ) · read replicas · CDN for API · microservices · Elasticsearch · multi-warehouse · marketplace/multi-vendor.

---

# 36. Security Vulnerabilities

| # | Vulnerability | Location | Attack scenario | Impact | Sev | Fix |
|---|---|---|---|---|---|---|
| **C-1** | **Firebase Admin private key hardcoded & pushed to GitHub** | `config/firebase.config.js:5-16` | Anyone reading the repo mints admin credentials for project `dragowar-7fb2c`; `verifyIdToken` trust is broken; forge any user's phone-auth token → account takeover | **Full compromise of the Firebase project & auth trust chain** | **CRITICAL** | **Revoke the key in GCP IAM now**, load from env, purge history, rotate |
| **C-2** | **Client-controlled payment amount** | `order.routes.js:12,18-26` | Logged-in user POSTs `{cartId, amount:100}` → ₹1 for the full cart | **Direct, unlimited revenue loss** | **CRITICAL** | Delete the `amount` branch; derive from server cart |
| H-1 | **Cart IDOR at checkout** | `order.routes.js:28,69` | Pass another user's `cartId`: read their cart contents; on verify, **wipe their cart** | Cross-tenant read + destructive write | **HIGH** | `Cart.findOne({user: req.user.id})`; never accept `cartId` |
| H-2 | **No webhook → lost payments** | absent | Customer pays, closes tab; `/verify` never fires; money captured, order `PENDING` forever | Revenue captured w/o fulfilment; chargebacks | **HIGH** | Implement §28 |
| H-3 | **Verification lacks amount/capture/ownership checks** | `order.routes.js:145-172` | Authorized-but-uncaptured payment marks order `PAID`; no binding to caller | Goods shipped for uncollected money | **HIGH** | `payments.fetch()` + assert amount/currency/`captured`/owner |
| H-4 | **Payment endpoints unauthenticated** | `order.routes.js:189-192`; `app.js:45-46` | `optionalProtect` / no middleware at all | Anonymous order creation; unbound verification | **HIGH** | `protect` on all; delete app-level duplicates |
| H-5 | **No stock decrement** | codebase-wide | Two buyers, one unit, both succeed | Overselling, refunds, reputation | **HIGH** | Atomic conditional `$inc` in a transaction |
| H-6 | **Unauthenticated product creation** | `routes/products.routes.js:16-17` | `POST /api/products` with an image → arbitrary catalogue entries + ImageKit storage abuse; `/inject` bulk-inserts | Defacement, storage cost, SEO poisoning | **HIGH** | `protect` + `requireRole('admin')`; delete `/inject` |
| H-7 | **No rate limiting anywhere** | `app.js` | OTP send loop → SMS cost + user harassment; 6-digit OTP brute force (no attempt cap, 5-min window); login brute force | Financial + account takeover | **HIGH** | `express-rate-limit`; OTP attempt counter w/ invalidation |
| H-8 | **Destructive auto-seed at boot** | `utils/seeder.js:212-219` | Any product with a `pexels` URL + ImageKit configured → `Product.deleteMany({})` **and** `Category.deleteMany({})` on every restart | **Production catalogue wipe**, orphaned order refs | **HIGH** | Remove from boot; explicit `npm run seed`, dev-only |
| H-9 | **Paid orders cancellable with no refund** | `order.routes.js:291` | Customer pays then cancels; order `CANCELLED`, `paymentStatus` still `PAID`, money retained | Consumer-protection + reconciliation failure | **HIGH** | Check `paymentStatus`; auto-initiate refund |
| M-1 | Razorpay key+secret hardcoded fallback | `config/razorpay.js:5-6` | Test secret published in `13f9d2f`; pattern will repeat with live keys | Signature-verification secret exposed | **MEDIUM** | Env-only; crash if missing; rotate |
| M-2 | CSRF | `auth.middleware.js:16`, `cookie.util.js:8` | Cookie auth + `sameSite:'none'` + `credentials:true` + body-token acceptance, no CSRF token | Forced state changes | **MEDIUM** | `sameSite:'strict'` (same-origin deploy); drop `req.body.token` |
| M-3 | Error handler unreachable | `app.js:32` | Registered before routes → never runs | HTML errors, broken client messages, inconsistent statuses | **MEDIUM** | Move after all routes |
| M-4 | Stack traces leak by default | `error.middleware.js:19` + `env.config.js:19` | `NODE_ENV` defaults to `development`; host forgets to set it → stacks to clients | Info disclosure | **MEDIUM** | Default to `production` |
| M-5 | **OTPs + phone numbers logged in plaintext** | `otp.service.js:58-60`, `sms.config.js:50-54` | Log access → authenticate as any user | Account takeover via logs | **MEDIUM** | Remove; gate behind explicit dev flag |
| M-6 | Logout can't clear cookies in prod | `auth.controller.js:67-68` | `clearCookie` attrs don't match how they were set | Session persists after logout | **MEDIUM** | Match `sameSite`/`secure`/`path` |
| M-7 | Placeholder CORS origin + wildcard | `corsOptions.config.js:10,26` | `https://www.yourdomain.com` and `/\.yourdomain\.com$/` allowlisted — a real registrable domain | Credentialed cross-origin access | **MEDIUM** | Env-driven allowlist only |
| M-8 | Razorpay errors echoed to client | `order.routes.js:113-122` | Raw provider error + "check Render env vars" shown to customers | Info disclosure | **MEDIUM** | Log server-side; generic client message |
| L-1 | No password policy server-side | `auth.controller.js:38` | 1-char passwords accepted (client-only check) | Weak credentials | **LOW** | Zod min 8 + complexity |
| L-2 | No JWT revocation | `token.util.js` | Stolen token valid to expiry | Extended session hijack | **LOW** | jti denylist |
| L-3 | Duplicate phone accounts | `User.model.js:18` | `phone` lacks unique index | Data integrity | **LOW** | Unique sparse index |
| L-4 | Unbounded list responses | `order.routes.js:199`, `products.service.js:5` | No pagination | DoS / perf | **LOW** | Paginate |
| L-5 | Upload MIME trusted from client | `upload.middleware.js:11` | `mimetype` is client-supplied | Malicious file stored | **LOW** | Magic-byte sniffing |

### Immediate response for C-1 (do this before any code work)

1. **Revoke** the service-account key `fdc6cf407a976328794b617e288970ae27838ece` in GCP IAM → Service Accounts → Keys. This is the only step that actually stops the exposure.
2. Audit Firebase Auth logs for unfamiliar activity.
3. Generate a new key; load **only** from `FIREBASE_*` env vars; delete every hardcoded fallback.
4. Rotate the Razorpay test secret too (M-1).
5. Purge from history (`git filter-repo` / BFG) and force-push — **after** rotation, and understanding that anything already cloned or indexed remains compromised. Rotation is the fix; history purge is cleanup.

---

# 37. Technical Debt

**Delete outright:**
- `app.js:45-46` — duplicate unauthenticated payment routes
- `routes/index.js` — `res.render` with no view engine
- `controllers/products.controller.js:124-229` — duplicate seed array + `/inject`
- `config/whatsapp.config.js` + `bin/www:10` — `sendWhatsappMessage` called by nothing; boots a headless Chromium every start; unofficial library automating a personal account. Also delete `server/.wwebjs_auth/` from the working tree.
- `config/sms.config.js` — `sendSms` unused (`otp.service.js` reimplements Fast2SMS inline)
- `components/RazorpayCheckoutButton.jsx` — unused, and it demonstrates the client-amount anti-pattern
- `Product.orderedUserIds` — written by nothing
- `dotenv` in `client/package.json` — no-op in a browser build
- `test_fast2sms.js`, `seed_mini_items.js` (untracked) — move under `scripts/`
- `server/public/` from git — build in CI instead

**Correctness bugs (not security):**
1. **Phone-only registration is broken** — `auth.service.js:7-9`: with `email === undefined`, Mongoose strips the undefined value, leaving `$or: [{}, {phone}]`; `{}` matches every document, so `findOne` returns an arbitrary user and registration always throws *"User already exists"* once any user exists. Build the `$or` array conditionally.
2. **Checkout OTP gate is a no-op** — `PaymentPage.jsx:150,186` (§5.1).
3. **GST 18% in code vs "GST (5%)" in the UI** — `Cart.model.js:73` vs `PaymentPage.jsx:549`. Needs the client's actual GST classification.
4. **`VITE_SERVER_URL` vs `VITE_SERVER_URI`** — `orderApi.js:4` disagrees with every other API module.
5. **Login errors swallowed** — `AuthContext.jsx:27-30` logs and returns; a wrong password produces no UI feedback.
6. **Silent no-order path** — `order.routes.js:68`: no `userId`/`cartId` → Razorpay order created, no DB order; frontend then navigates to `/orders/<razorpay_id>` → cast error 500.
7. **Stale cart totals vs fresh snapshot prices** — `Order.amount` (stored `grandTotal`) can disagree with the sum of `products[]`.
8. **`Order.notes` duplicates `deliveryDetails`** as unvalidated `Mixed`.
9. **`connectDB` swallows failure** — server boots without a DB and `/health` still reports `OK`.
10. **`cart.total === cart.grandTotal`** — two fields, one value.
11. **`CartPage.jsx:22-24`** — `useEffect` depends on `cart` and calls `fetchCart` when falsy; refetch loop risk if the cart stays null on error.

---

# 38. Recommended Folder Structure

Evolve toward the pattern `modules/{auth,cart,user}` already establishes — don't impose a new one.

```
server/
  src/
    config/        env.js(Zod) db.js razorpay.js commerce.config.js logger.js cors.js
    middlewares/   auth.js rbac.js validate.js rateLimit.js error.js idempotency.js requestId.js
    modules/
      auth/  users/  addresses/  products/  categories/  cart/
      checkout/      # quote + order creation orchestration
      orders/        # lifecycle, state machine, cancellation
      payments/      # provider-agnostic + razorpay adapter
      webhooks/      # receiver + handlers
      inventory/  coupons/  shipping/  refunds/  admin/  notifications/
                     # each: *.routes.js *.controller.js *.service.js *.schema.js *.model.js
    shared/        errors/ utils/ types/ pagination.js money.js
    jobs/          releaseExpiredReservations.js processOutbox.js reconcilePayments.js
    app.js  server.js
  tests/           unit/ integration/ e2e/ fixtures/
  scripts/         seed.js migrate/
```

**Why this and not a flat structure:** the modules that need the most careful review (checkout, payments, webhooks, inventory) become individually reviewable and individually testable, and the core/client-specific boundary from §33 falls out naturally along module lines.

**Correct middleware order in `app.js`:**
```
requestId → helmet → cors → rateLimit
→ express.raw (webhooks ONLY, before json)
→ express.json → urlencoded → cookieParser → morgan/pino
→ /api routes → /api 404 handler
→ static + SPA catch-all (excluding /api)
→ errorHandler          ◀── LAST
```

---

# 39. Phased Implementation Roadmap

Reordered from the brief's suggestion for one reason: **credential rotation and the money-loss bugs precede everything**, and **admin capability moves much earlier** — a store whose orders can never leave `PLACED` cannot operate, no matter how good the payment code is.

---
### PHASE 0 — Emergency (day 1, hours)
**Rotate Firebase key. Rotate Razorpay secret. Remove all hardcoded fallbacks. Delete `app.js:45-46`. Add `protect`+`requireRole` to product writes. Remove `seedDatabase()` from boot.**
*DoD:* no secret in tracked source; `git grep -i "BEGIN PRIVATE KEY"` clean; missing env crashes at boot; unauthenticated `POST /api/products` → 401.
**Priority: P0 — BUILD NOW.**

---
### PHASE 1 — Payment correctness (week 1) ⬅️ *the critical path*
Server-derived amounts · cart ownership from `req.user` · `protect` on all payment routes · full verification (fetch + amount + currency + captured + ownership + already-PAID guard) · **webhook endpoint** with signature + `WebhookEvent` idempotency · `Payment` collection · paise integers · single idempotent `settlePayment()`.
*Deps:* Phase 0. *Security:* closes C-2, H-1..H-4, M-1.
*Edge cases:* all 20 in §6 of the brief, notably webhook-before-verify, double-verify, retry-after-failure.
*Tests:* every Priority-1 test in §30.
*DoD:* client cannot influence the amount; payment recorded even with the browser closed immediately after paying; double-verify settles once; test suite green.
**Priority: P0 — BUILD NOW.**

---
### PHASE 2 — Order lifecycle & inventory (week 2)
Three-status model + transition matrix · atomic stock reserve/commit/release · MongoDB transactions · order expiry job · cancellation that triggers refunds · `AuditLog`.
*Security:* closes H-5, H-9. *DoD:* concurrent purchase of the last unit → exactly one success; forbidden transitions rejected; abandoned orders expire and release stock.
**Priority: P0 — BUILD NOW.**

---
### PHASE 3 — Admin & fulfilment (week 2–3)
`requireRole` middleware · admin order/product/inventory/customer routes · shipment tracking fields · order-transition endpoints.
*DoD:* an admin can take an order from `CONFIRMED` to `DELIVERED`; every admin action is audited; no admin route reachable as a customer.
**Priority: P0 — BUILD NOW** (without it the store cannot operate).

---
### PHASE 4 — Hardening (week 3)
Zod validation everywhere · rate limiting (global/auth/OTP) · error-handler ordering + coded errors · working refresh rotation · `sameSite:'strict'` · `helmet` · remove OTP logging · `/api` 404 handler.
*Security:* closes H-6, H-7, M-2..M-6, L-1.
**Priority: P1 — BEFORE FIRST REAL CLIENT.**

---
### PHASE 5 — Refunds & notifications (week 3–4)
Refund lifecycle + webhooks · outbox + worker · order-confirmed / shipped / refund emails + SMS.
**Priority: P1 — BEFORE FIRST REAL CLIENT.**

---
### PHASE 6 — Commerce completeness (week 4)
Guest checkout · `Address` collection + snapshots · coupon engine · pagination everywhere · product `slug`/`isActive`/soft delete.
**Priority: P1–P2.**

---
### PHASE 7 — Observability & ops (week 4–5)
Structured JSON logs + `requestId` · Sentry · real `/health` · **stuck-payment alerting** · Atlas backups + PITR · reconciliation job.
**Priority: P1 — BEFORE FIRST REAL CLIENT.**

---
### PHASE 8 — Testing & CI (continuous, formalized week 5)
Vitest + Supertest + memory Mongo · Priority 1→3 · GitHub Actions blocking merge · Playwright E2E.
**Priority: P1 — write during Phases 1–3, not after.**

---
### PHASE 9 — Template extraction (week 6+)
`src/` restructure · provider interfaces · `commerce.config.js` · `.env.example` completion · README + runbook + ADRs · `create-d2c-backend` scaffold.
*Definition of done:* **a second, different D2C store stands up from the template in under two days.**
**Priority: P2 — AFTER the first client validates the architecture.**

---
### DO NOT BUILD YET
Redis · BullMQ · microservices · GraphQL · Elasticsearch · multi-vendor · multi-currency · variants · full RMA · loyalty · mobile app. Revisit each only when a concrete requirement forces it.

---

# 40. Exact Next Task

```
NEXT TASK
─────────────────────────────────────────────────────────────
Rotate the leaked Firebase service-account key and eliminate
every hardcoded credential fallback from tracked source.
─────────────────────────────────────────────────────────────
```

**Why this and not the payment fix:** C-2 (client-controlled amount) is worse in impact, but it is *bounded* — it costs you margin on orders placed by people who found it. C-1 is **unbounded and already public**: the key is on `origin/main` right now, and every hour it stays valid is more exposure. It is also the only task on this list where writing code doesn't help — the key must be revoked in GCP first. Revocation takes ten minutes; the payment rewrite takes a week. Do the ten-minute one first, then start Phase 1 the same day.

**Steps**
1. GCP Console → IAM → Service Accounts → `firebase-adminsdk-fbsvc@dragowar-7fb2c` → **delete key `fdc6cf407a976328794b617e288970ae27838ece`**.
2. Review Firebase Auth + GCP audit logs for unfamiliar activity.
3. Create a replacement key; store it in the host's secret manager.
4. Razorpay dashboard → regenerate API keys (M-1).

**Files affected**
- `server/config/firebase.config.js` — delete the inline private key and all `||` literal fallbacks; read `FIREBASE_PROJECT_ID / PRIVATE_KEY / PRIVATE_KEY_ID / CLIENT_EMAIL / CLIENT_ID / CLIENT_CERT_URL` from env; **throw at boot if any is missing.**
- `server/config/razorpay.js:5-6` — delete both literal fallbacks; throw if unset.
- `server/config/env.config.js` — add the `FIREBASE_*` block; add Zod validation; default `NODE_ENV` to `production`; drop the `RAZORPAY_API_KEY`/`RAZORPAY_SECRET` aliases.
- `server/.env.example` — document every new variable.
- `server/.env` — populate locally (already gitignored).

**Database changes:** none.
**API changes:** none.
**Security changes:** closes C-1 and M-1.

**Tests**
- Boot with a required var missing → process exits non-zero with a clear message.
- Boot with all vars present → Firebase Admin and Razorpay initialize.
- `git grep -i "BEGIN PRIVATE KEY"` and `git grep "rzp_test_"` return nothing in tracked files.
- Regression: `POST /api/auth/otp/verify-firebase` still verifies a valid token.

**Definition of done**
Old key revoked in GCP · Razorpay keys rotated · zero credential literals in tracked source · boot fails loudly on missing config · `.env.example` complete · history purge scheduled (rotation is the fix; purge is cleanup).

**Estimate:** 2–4 hours including verification.

---

# 41. Next 10 Tasks

| # | Task | Why | Phase | Est. |
|---|---|---|---|---|
| 1 | **Rotate credentials, remove hardcoded fallbacks** (§40) | Live public exposure | 0 | 2–4 h |
| 2 | **Server-derived amount; delete the `amount` branch; delete `app.js:45-46`; `protect` on all payment routes** | Closes direct revenue loss (C-2, H-4) | 1 | 4–6 h |
| 3 | **Cart ownership at checkout** — `Cart.findOne({user:req.user.id})`, drop `cartId` from the contract | Closes cross-tenant IDOR (H-1) | 1 | 2–3 h |
| 4 | **Harden verification** — `payments.fetch()`, assert amount/currency/`captured`/owner, already-PAID early return | Closes H-3; makes settlement idempotent | 1 | 4–6 h |
| 5 | **Razorpay webhook** — raw body, signature verify, `WebhookEvent` unique index, shared `settlePayment()` | Closes H-2 — the structural fix | 1 | 1–2 d |
| 6 | **`Payment` collection + paise migration** | Enables retries, refunds, exact money | 1 | 1 d |
| 7 | **Atomic inventory reserve/commit in a transaction** | Closes H-5 (overselling) | 2 | 1–2 d |
| 8 | **Three-status model + transition guard; refund-on-cancel** | Closes H-9; makes fulfilment expressible | 2 | 1–2 d |
| 9 | **`requireRole` + admin order/product API** | Store cannot operate without it | 3 | 2–3 d |
| 10 | **Zod validation + rate limiting + error-handler ordering** | Closes H-6, H-7, M-3, M-4 | 4 | 2 d |

Tasks 2–6 are one coherent payments rewrite and are best done as a single reviewed PR with the §30 Priority-1 tests attached.

---

# 42. Production Readiness Checklist

**Security** — [ ] secrets rotated & env-only [ ] boot-time env validation [ ] `helmet` [ ] env-driven CORS [ ] rate limiting (global/auth/OTP) [ ] Zod on every input [ ] `requireRole` on admin routes [ ] ownership assertions on user-scoped reads [ ] CSRF closed (`sameSite:'strict'`, no body token) [ ] no stacks/PII/OTPs to clients or logs [ ] password policy [ ] upload magic-byte validation

**Payments** — [ ] amount server-derived only [ ] Razorpay order created after DB commit [ ] signature verified [ ] `payments.fetch()` cross-check (amount/currency/status) [ ] `captured` required before `PAID` [ ] ownership bound on verify [ ] webhook live, signed, idempotent [ ] `WebhookEvent.eventId` unique [ ] handler & webhook share one idempotent settlement [ ] retry after failure works [ ] refunds implemented [ ] live/test key separation enforced

**Orders** — [ ] payment/fulfillment/order statuses separated [ ] transition matrix enforced server-side [ ] clients cannot set status [ ] cancellation checks payment state and refunds [ ] abandoned orders expire [ ] audit trail on every transition [ ] human-readable order numbers

**Inventory** — [ ] atomic conditional decrement [ ] reservation + release [ ] concurrent last-unit test passes [ ] restock on cancel/refund

**Database** — [ ] all `{userId,createdAt}`/unique indexes created [ ] transactions on the 4 critical paths [ ] soft delete on products [ ] paise integers [ ] Atlas backups + PITR [ ] IP allowlist (not `0.0.0.0/0`) [ ] restore tested

**Operations** — [ ] structured JSON logs shipped off-host [ ] `requestId` propagated [ ] Sentry [ ] `/health` checks Mongo [ ] uptime monitoring [ ] **stuck-payment alert** [ ] reconciliation job [ ] runbook

**Testing** — [ ] Priority-1 payment/inventory suite green [ ] integration on auth/cart/orders/admin [ ] E2E happy + failure + refund [ ] CI blocking merge

**Deployment** — [ ] dev/staging/prod separated (DB, keys, URLs) [ ] HTTPS + HSTS [ ] webhook URL registered [ ] secrets in platform store [ ] build output out of git [ ] zero-downtime deploys [ ] rollback tested

---

# 43. Client-Ready Template Checklist

- [ ] `.env.example` documents every variable with a description
- [ ] README: architecture, setup, deployment, troubleshooting
- [ ] `commerce.config.js` centralizes currency, tax, shipping, checkout, payment, order-numbering rules
- [ ] `PaymentProvider` / `ShippingProvider` / `NotificationProvider` / `StorageProvider` interfaces with one adapter each
- [ ] Core vs client-specific boundary documented (§33)
- [ ] Seed script separated from application boot
- [ ] Migration strategy for schema changes
- [ ] Admin bootstrap (create first admin) documented
- [ ] Razorpay/webhook setup guide with screenshots
- [ ] Deployment guide (Render/Railway + Atlas)
- [ ] Test suite runs green on a fresh clone
- [ ] ADRs recording the non-obvious choices (why webhooks are authoritative; why paise; why snapshots)
- [ ] **Validated by standing up a second store in under 2 days**

---

# 44. Final Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  BROWSER — React SPA                                                │
│  Catalogue · Cart · Checkout · Orders · Admin                       │
│  (holds NO pricing authority; sends no amounts)                     │
└───────────────┬─────────────────────────────────┬───────────────────┘
                │ HTTPS, httpOnly SameSite=Strict │ Razorpay Checkout
                ▼                                 ▼
┌─────────────────────────────────────┐    ┌──────────────────────────┐
│  EXPRESS API  (single instance)     │    │  RAZORPAY                │
│                                     │    │                          │
│  requestId→helmet→cors→rateLimit    │    │  Orders · Payments       │
│  →raw(webhooks)→json→cookies→log    │    │  Refunds                 │
│                                     │    └────────┬─────────────────┘
│  ┌─ modules ───────────────────────┐│             │ webhook (signed)
│  │ auth users addresses            ││◀────────────┘ AUTHORITATIVE
│  │ products categories cart        ││
│  │ checkout ──┐                    ││
│  │ orders     ├─▶ settlePayment()  ││  ◀── ONE idempotent entry point
│  │ payments ──┘   (verify + hook)  ││      for BOTH the browser
│  │ webhooks inventory coupons      ││      handler and the webhook
│  │ shipping refunds admin          ││
│  │ notifications                   ││
│  └─────────────────────────────────┘│
│  → /api 404 → static+SPA → errorHandler (LAST)                      │
└──────┬───────────────────────┬──────────────────────┬───────────────┘
       │ transactions          │ outbox               │
       ▼                       ▼                      ▼
┌──────────────────────┐  ┌──────────┐  ┌──────────────────────────┐
│ MONGODB ATLAS        │  │ jobs/    │  │ ImageKit · Email · SMS   │
│ User Product Cart    │  │ expire   │  │ Firebase(phone verify)   │
│ Order Payment Refund │  │ outbox   │  │ Sentry · Log sink        │
│ Shipment Coupon      │  │ reconcile│  └──────────────────────────┘
│ Address WebhookEvent │  └──────────┘
│ AuditLog OutboxEvent │
│ backups + PITR       │
└──────────────────────┘
```

**The three invariants this architecture exists to protect:**
1. **The server is the only source of monetary truth.** No amount, price, discount, or total is ever accepted from a client.
2. **Payment settlement is idempotent and webhook-authoritative.** Correctness never depends on a browser staying open.
3. **Stock and money move together, or not at all.** Transactions, not hope.

---

*End of report. Analysis only — no application code was modified.*
