import * as cartService from "./cart.service.js";

// GET /cart
export const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req.user.id);
    return res.status(200).json({ success: true, cart });
  } catch (err) {
    next(err);
  }
};

// POST /cart/items  { productId, quantity }
export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "productId is required" });
    }

    const cart = await cartService.addToCart(req.user.id, productId, Number(quantity));
    return res.status(200).json({ success: true, cart });
  } catch (err) {
    next(err);
  }
};

// PATCH /cart/items/:productId  { quantity }
export const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({ success: false, message: "quantity is required" });
    }

    const cart = await cartService.updateCartItem(req.user.id, productId, Number(quantity));
    return res.status(200).json({ success: true, cart });
  } catch (err) {
    next(err);
  }
};

// DELETE /cart/items/:productId
export const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const cart = await cartService.removeFromCart(req.user.id, productId);
    return res.status(200).json({ success: true, cart });
  } catch (err) {
    next(err);
  }
};

// DELETE /cart
export const clearCart = async (req, res, next) => {
  try {
    const cart = await cartService.clearCart(req.user.id);
    return res.status(200).json({ success: true, cart });
  } catch (err) {
    next(err);
  }
};
