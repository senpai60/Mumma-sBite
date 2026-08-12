import Razorpay from "razorpay";
import { ENV_CONFIG } from "./env.config.js";
import { logger } from "./logger.config.js";

const key_id = ENV_CONFIG.RAZORPAY_API_KEY || "rzp_test_dummyKey";
const key_secret = ENV_CONFIG.RAZORPAY_SECRET || "dummySecret";

if (!ENV_CONFIG.RAZORPAY_API_KEY || !ENV_CONFIG.RAZORPAY_SECRET) {
  logger.warn("⚠️ Razorpay API keys missing in environment variables. Payments will fail until configured.");
}

export const razorpay = new Razorpay({
  key_id,
  key_secret,
});

