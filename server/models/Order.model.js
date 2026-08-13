import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    image: {
      type: String,
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    razorpayPaymentId: {
      type: String,
    },

    status: {
      type: String,
      enum: ["PLACED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "PLACED",
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"],
      default: "PENDING",
      index: true,
    },

    products: {
      type: [orderItemSchema],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
    },

    deliveryDetails: {
      fullName: String,
      mobile: String,
      address: String,
      city: String,
      state: String,
      zipCode: String,
    },

    notes: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true },
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
