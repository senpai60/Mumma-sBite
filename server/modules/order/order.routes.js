import { Router } from "express";
import Cart from "../../models/Cart.model.js";
import { razorpay } from "../../config/razorpay.js";
import { ENV_CONFIG } from "../../config/env.config.js";
import { protect } from "../../middlewares/auth.middleware.js";

const orderRouter = Router();

orderRouter.post("/", protect, async (req, res) => {
  const { cartId, notes } = req.body;
  const userId = req.user.id;

  try {
    if (!cartId) {
      return res.status(400).json({
        success: false,
        message: "Cart Id is required",
      });
    }

    const cart = await Cart.findById(cartId);
    if (!cart || cart.products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const options = {
      amount: Math.round((cart.grandTotal || cart.total || 0) * 100),
      currency: "INR",
      receipt: `order_${Date.now()}`,
      notes: notes || {},
    };

    const order = await razorpay.orders.create(options);
    console.log("Razorpay Order Created:", order);

    res.status(200).json({
      success: true,
      order,
      key_id: ENV_CONFIG.RAZORPAY_API_KEY,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return res.status(500).json({
      success: false,
      message: error?.error?.description || error?.message || "Internal Server Error",
      error,
    });
  }
});

export default orderRouter;
