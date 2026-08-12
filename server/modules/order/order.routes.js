import { Router } from "express";
import Cart from "../../models/Cart.model.js";
import { razorpay } from "../../config/razorpay.js";
import {ENV_CONFIG} from "../../config/env.config.js"

const orderRouter = Router();

orderRouter.post("/create-order", async (req, res) => {
  const { cartId } = req.body;

  try {
    if (!cartId) {
      return res.status(400).json({
        success: false,
        message: "Cart Id is required",
      });
    }

    const cart = await Cart.findById(cartId);
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const options = {
      amount: cart.grandTotal * 100,
      currency: "INR",
      receipt: `order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order,
      key_id: ENV_CONFIG.RAZORPAY_API_KEY,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

export default orderRouter;
