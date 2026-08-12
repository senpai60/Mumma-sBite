import Razorpay from "razorpay";
import { ENV_CONFIG } from "./env.config.js";

export const razorpay = new Razorpay({
  key_id: ENV_CONFIG.RAZORPAY_API_KEY,
  key_secret: ENV_CONFIG.RAZORPAY_SECRET,
});
