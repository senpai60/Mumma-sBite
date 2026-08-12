import axios from "axios";
import { ENV_CONFIG } from "./env.config.js";
import { logger } from "./logger.config.js";

const FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2";

/**
 * Send an OTP SMS via Fast2SMS
 * @param {string} phone - 10-digit Indian mobile number (without +91)
 * @param {string} otp   - 6-digit OTP string
 */
export const sendSms = async (phone, otp) => {
  if (ENV_CONFIG.NODE_ENV !== "production" && !ENV_CONFIG.FAST2SMS_API_KEY) {
    // Dev fallback — log to console if key not configured
    logger.warn(`[DEV] SMS not sent — FAST2SMS_API_KEY missing. OTP for ${phone}: ${otp}`);
    return;
  }

  try {
    const response = await axios.get(FAST2SMS_URL, {
      params: {
        authorization: ENV_CONFIG.FAST2SMS_API_KEY,
        variables_values: otp,
        route: "otp",
        numbers: phone,
      },
      headers: { "cache-control": "no-cache" },
    });

    if (!response.data?.return) {
      throw new Error(response.data?.message || "Fast2SMS delivery failed");
    }

    logger.info(`OTP SMS sent to ${phone}`);
  } catch (err) {
    logger.error(`Failed to send OTP SMS to ${phone}: ${err.message}`);
    throw err;
  }
};
