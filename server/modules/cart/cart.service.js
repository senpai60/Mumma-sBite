import Cart from "../../models/Cart.model.js";
import Product from "../../models/Product.model.js";
import { AppError } from "../../utils/AppError.js";

// Get cart for a user (populated with product details)
export const getCart = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate(
    "products.product",
    "title price imageUrl stock"
  );

  // Return empty cart shape if none exists yet
  if (!cart) {
    return { user: userId, products: [], total: 0 };
  }

  return _withTotal(cart);
};

// Add a product to the cart (or increment qty if already present)
export const addToCart = async (userId, productId, quantity = 1) => {
  const product = await Product.findById(productId);
  if (!product) throw new AppError("Product not found", 404);
  if (product.stock < quantity)
    throw new AppError("Insufficient stock", 400);

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      products: [{ product: productId, quantity }],
    });
  } else {
    const existing = cart.products.find(
      (p) => p.product.toString() === productId
    );

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (product.stock < newQty)
        throw new AppError("Insufficient stock for requested quantity", 400);
      existing.quantity = newQty;
    } else {
      cart.products.push({ product: productId, quantity });
    }

    await cart.save();
  }

  await cart.populate("products.product", "title price imageUrl stock");
  return _withTotal(cart);
};

// Update quantity of a specific item (set to 0 to remove)
export const updateCartItem = async (userId, productId, quantity) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new AppError("Cart not found", 404);

  if (quantity <= 0) {
    // Remove item
    cart.products = cart.products.filter(
      (p) => p.product.toString() !== productId
    );
  } else {
    const item = cart.products.find(
      (p) => p.product.toString() === productId
    );
    if (!item) throw new AppError("Item not in cart", 404);

    const product = await Product.findById(productId);
    if (!product) throw new AppError("Product not found", 404);
    if (product.stock < quantity) throw new AppError("Insufficient stock", 400);

    item.quantity = quantity;
  }

  await cart.save();
  await cart.populate("products.product", "title price imageUrl stock");
  return _withTotal(cart);
};

// Remove a product from the cart entirely
export const removeFromCart = async (userId, productId) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new AppError("Cart not found", 404);

  const before = cart.products.length;
  cart.products = cart.products.filter(
    (p) => p.product.toString() !== productId
  );

  if (cart.products.length === before)
    throw new AppError("Item not found in cart", 404);

  await cart.save();
  await cart.populate("products.product", "title price imageUrl stock");
  return _withTotal(cart);
};

// Clear the entire cart
export const clearCart = async (userId) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new AppError("Cart not found", 404);

  cart.products = [];
  await cart.save();
  return { user: userId, products: [], total: 0 };
};

// ─── Internal helper ─────────────────────────────────────────────────────────
const _withTotal = (cart) => {
  const total = cart.products.reduce((sum, item) => {
    const price = item.product?.price ?? 0;
    return sum + price * item.quantity;
  }, 0);

  return { ...cart.toObject(), total };
};
