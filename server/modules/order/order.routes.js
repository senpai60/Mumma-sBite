import { Router } from "express";
import crypto from "crypto";
import Cart from "../../models/Cart.model.js";
import { razorpay } from "../../config/razorpay.js";
import { ENV_CONFIG } from "../../config/env.config.js";
import { protect } from "../../middlewares/auth.middleware.js";
import Order from "../../models/Order.model.js";

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

    const razorpayOrder = await razorpay.orders.create(options);
    console.log("Razorpay Order Created:", razorpayOrder);

    await Order.create({
      userId: userId,
      razorpayOrderId: razorpayOrder.id,
      status: "PENDING",
      paymentStatus: "PENDING",
      products: cart.products,
      amount: cart.total,
      currency: "INR",
      cartId: cartId,
      notes: notes,
    });

    res.status(200).json({
      success: true,
      order: razorpayOrder,
      key_id: ENV_CONFIG.RAZORPAY_API_KEY,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return res.status(500).json({
      success: false,
      message:
        error?.error?.description || error?.message || "Internal Server Error",
      error,
    });
  }
});

orderRouter.post("/verify", protect, async (req, res) => {
  const { razorpayOrderId, paymentId, signature } = req.body;

  const order = await Order.findOne({ razorpayOrderId: razorpayOrderId });
  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }
  const generatedSignature = crypto
    .createHmac("sha256", ENV_CONFIG.RAZORPAY_SECRET)
    .update(`${order.razorpayOrderId}|${paymentId}`)
    .digest("hex");

  const verified = generatedSignature === signature;

  if (verified) {
    await Cart.findByIdAndDelete(order.cartId);
    order.cartId = null;
    order.razorpayPaymentId = paymentId;
    order.paymentStatus = "PAID";
    await order.save();
    res.status(200).json({
      success: true,
      message: "Order verified successfully",
    });
  } else {
    res.status(400).json({
      success: false,
      message: "Invalid signature",
    });
  }
});

export default orderRouter;
