import Razorpay from "razorpay";
import { ENV_CONFIG } from "./env.config.js";
import { logger } from "./logger.config.js";

const key_id = ENV_CONFIG.RAZORPAY_KEY_ID || ENV_CONFIG.RAZORPAY_API_KEY || "rzp_test_TP3XVMwuVQCgUo";
const key_secret = ENV_CONFIG.RAZORPAY_KEY_SECRET || ENV_CONFIG.RAZORPAY_SECRET || "YBLHj1BAIhBcwOawOYl1LFY6";

if (!key_id || !key_secret) {
  logger.warn(
    "⚠️ Razorpay API keys missing in environment variables. Payments will fail until configured.",
  );
}

export const razorpay = new Razorpay({
  key_id,
  key_secret,
});

