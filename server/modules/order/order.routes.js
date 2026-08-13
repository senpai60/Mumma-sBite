import { Router } from "express";
import crypto from "crypto";
import Cart from "../../models/Cart.model.js";
import { razorpay } from "../../config/razorpay.js";
import { ENV_CONFIG } from "../../config/env.config.js";
import { protect } from "../../middlewares/auth.middleware.js";
import Order from "../../models/Order.model.js";

const orderRouter = Router();

orderRouter.post("/", protect, async (req, res) => {
  const { cartId, deliveryDetails } = req.body;
  const userId = req.user.id;

  try {
    if (!cartId) {
      return res.status(400).json({
        success: false,
        message: "Cart Id is required",
      });
    }

    const cart = await Cart.findById(cartId).populate("products.product");
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
      notes: deliveryDetails || {},
    };

    const razorpayOrder = await razorpay.orders.create(options);
    console.log("Razorpay Order Created:", razorpayOrder);

    const orderProducts = cart.products.map((item) => {
      const prod = item.product;
      return {
        productId: prod?._id || prod,
        name: prod?.title || prod?.name || "Product",
        price: prod?.price || 0,
        quantity: item.quantity,
        image: prod?.imageUrl || prod?.image || "",
      };
    });

    const newOrder = await Order.create({
      userId: userId,
      razorpayOrderId: razorpayOrder.id,
      status: "PLACED",
      paymentStatus: "PENDING",
      products: orderProducts,
      amount: cart.total || cart.grandTotal,
      currency: "INR",
      cartId: cartId,
      deliveryDetails: deliveryDetails,
      notes: deliveryDetails,
    });

    res.status(200).json({
      success: true,
      order: razorpayOrder,
      key_id: ENV_CONFIG.RAZORPAY_API_KEY,
      orderId: newOrder._id,
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
    if (order.cartId) {
      const cart = await Cart.findById(order.cartId);
      if (cart) {
        cart.products = [];
        await cart.save();
      }
    }
    order.razorpayPaymentId = paymentId;
    order.paymentStatus = "PAID";
    await order.save();
    res.status(200).json({
      success: true,
      message: "Order verified successfully",
      isVerified: true,
    });
  } else {
    res.status(400).json({
      success: false,
      message: "Invalid signature",
      isVerified: false,
    });
  }
});

// Get all orders for the user
orderRouter.get("/user", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ userId })
      .populate("products.productId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
});

// Get order by ID
orderRouter.get("/:orderId", protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(orderId).populate("products.productId");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order belongs to the user
    if (order.userId.toString() !== userId.toString()) {
      // In dev, include debug info to help trace mismatches between
      // the authenticated user and the order owner.
      const debugInfo =
        process.env.NODE_ENV === "production"
          ? {}
          : {
              requestedBy: userId.toString(),
              orderOwner: order.userId.toString(),
            };
      console.warn(
        `Unauthorized order access attempt. userId=${userId}, order.userId=${order.userId}`
      );
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to this order",
        ...debugInfo,
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
});

// Cancel order
orderRouter.post("/:orderId/cancel", protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order belongs to the user
    if (order.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to this order",
      });
    }

    // Check if order can be cancelled
    if (!["PLACED", "PROCESSING"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status ${order.status}`,
      });
    }

    order.status = "CANCELLED";
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
    });
  }
});

export default orderRouter;
