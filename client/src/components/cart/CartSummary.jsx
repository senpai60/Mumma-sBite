import { ShoppingBag } from "lucide-react";

function CartSummary({ subtotal, deliveryFee, discount = 0, onCheckout }) {
  const total = subtotal + deliveryFee - discount;

  return (
    <aside className="bg-surface border border-border rounded-[var(--radius-card)] p-4 sm:p-5 shadow-[var(--shadow-soft)]">
      <h3 className="font-display text-lg text-text mb-3">
        Order Summary
      </h3>

      <div className="space-y-2 text-sm font-sans text-text-light">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="text-text">₹{subtotal}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery</span>
          <span className="text-text">
            {deliveryFee === 0 ? "Free" : `₹${deliveryFee}`}
          </span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-accent">
            <span>Discount</span>
            <span>-₹{discount}</span>
          </div>
        )}
      </div>

      <hr className="my-3 border-border" />

      <div className="flex justify-between items-center mb-4">
        <span className="font-medium text-text">Total</span>
        <span className="font-semibold text-lg text-text">
          ₹{total}
        </span>
      </div>

      <button
        onClick={onCheckout}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white text-sm font-medium px-4 py-2.5 hover:opacity-90 transition-opacity"
      >
        <ShoppingBag className="h-4 w-4" strokeWidth={1.8} />
        Proceed to Checkout
      </button>

      <p className="mt-2 text-[0.7rem] text-text-light">
        You&apos;ll be able to add address & delivery details on the next step.
      </p>
    </aside>
  );
}

export default CartSummary;
