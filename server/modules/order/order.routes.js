import { Router } from "express";
import crypto from "crypto";
import Cart from "../../models/Cart.model.js";
import { razorpay } from "../../config/razorpay.js";
import { ENV_CONFIG } from "../../config/env.config.js";
import { protect, optionalProtect } from "../../middlewares/auth.middleware.js";
import Order from "../../models/Order.model.js";

const orderRouter = Router();

export const createOrderHandler = async (req, res) => {
  const { amount, currency = "INR", receipt, cartId, deliveryDetails } = req.body;
  const userId = req.user?.id;

  try {
    let orderAmountInPaise;

    if (amount !== undefined && amount !== null) {
      const numericAmount = Number(amount);
      if (isNaN(numericAmount) || numericAmount < 100) {
        return res.status(400).json({
          success: false,
          message: "Amount must be at least 100 paise (₹1)",
        });
      }
      orderAmountInPaise = Math.round(numericAmount);
    } else if (cartId) {
      const cart = await Cart.findById(cartId).populate("products.product");
      if (!cart || !cart.products || cart.products.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cart is empty",
        });
      }
      const totalAmount = cart.grandTotal || cart.total || 0;
      orderAmountInPaise = Math.round(totalAmount * 100);
      if (orderAmountInPaise < 100) {
        return res.status(400).json({
          success: false,
          message: "Amount must be at least 100 paise (₹1)",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Amount or cartId is required",
      });
    }

    const options = {
      amount: orderAmountInPaise,
      currency,
      receipt: receipt || `order_${Date.now()}`,
      notes: {
        fullName: String(deliveryDetails?.fullName || ""),
        mobile: String(deliveryDetails?.mobile || ""),
        address: String(deliveryDetails?.address || ""),
        city: String(deliveryDetails?.city || ""),
        state: String(deliveryDetails?.state || ""),
        zipCode: String(deliveryDetails?.zipCode || ""),
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);
    console.log("Razorpay Order Created successfully:", razorpayOrder.id);

    let newOrder = null;
    if (userId && cartId) {
      const cart = await Cart.findById(cartId).populate("products.product");
      const orderProducts = cart?.products
        ?.filter((item) => item && item.product)
        ?.map((item) => {
          const prod = item.product;
          return {
            productId: prod._id || prod,
            name: prod.title || prod.name || "Product",
            price: Number(prod.price) || 0,
            quantity: item.quantity || 1,
            image: prod.imageUrl || prod.image || "",
          };
        }) || [];

      if (orderProducts.length > 0) {
        newOrder = await Order.create({
          userId: userId,
          razorpayOrderId: razorpayOrder.id,
          status: "PLACED",
          paymentStatus: "PENDING",
          products: orderProducts,
          amount: orderAmountInPaise / 100,
          currency,
          cartId: cartId,
          deliveryDetails: deliveryDetails,
          notes: deliveryDetails,
        });
      }
    }

    const keyId = ENV_CONFIG.RAZORPAY_KEY_ID || ENV_CONFIG.RAZORPAY_API_KEY;

    return res.status(200).json({
      success: true,
      order_id: razorpayOrder.id,
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      order: razorpayOrder,
      key_id: keyId,
      orderId: newOrder?._id || razorpayOrder.id,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    const razorpayDesc = error?.error?.description || error?.message || "Razorpay payment initialization failed";
    const userFriendlyMsg =
      razorpayDesc === "Authentication failed"
        ? "Razorpay API Authentication failed. Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Render Environment Variables."
        : `Razorpay Order Error: ${razorpayDesc}`;

    return res.status(500).json({
      success: false,
      message: userFriendlyMsg,
      error: error?.error || error?.message,
    });
  }
};

export const verifyPaymentHandler = async (req, res) => {
  try {
    const order_id =
      req.body.order_id || req.body.razorpay_order_id || req.body.razorpayOrderId;
    const payment_id =
      req.body.payment_id || req.body.razorpay_payment_id || req.body.paymentId;
    const signature =
      req.body.signature || req.body.razorpay_signature;

    if (!order_id || !payment_id || !signature) {
      return res.status(400).json({
        success: false,
        message: "Missing required verification fields (order_id, payment_id, signature)",
        isVerified: false,
      });
    }

    const keySecret = ENV_CONFIG.RAZORPAY_KEY_SECRET || ENV_CONFIG.RAZORPAY_SECRET;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${order_id}|${payment_id}`)
      .digest("hex");

    const verified = generatedSignature === signature;

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
        isVerified: false,
      });
    }

    const order = await Order.findOne({ razorpayOrderId: order_id });
    if (order) {
      if (order.cartId) {
        const cart = await Cart.findById(order.cartId);
        if (cart) {
          cart.products = [];
          await cart.save();
        }
      }
      order.razorpayPaymentId = payment_id;
      order.paymentStatus = "PAID";
      await order.save();
    }

    return res.status(200).json({
      success: true,
      message: "Order verified successfully",
      isVerified: true,
    });
  } catch (error) {
    console.error("Razorpay verification error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal Server Error",
      isVerified: false,
    });
  }
};

orderRouter.post("/", optionalProtect, createOrderHandler);
orderRouter.post("/create-order", optionalProtect, createOrderHandler);
orderRouter.post("/verify", optionalProtect, verifyPaymentHandler);
orderRouter.post("/verify-payment", optionalProtect, verifyPaymentHandler);

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
