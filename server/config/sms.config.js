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
        variables_values: otp,
        route: "otp",
        numbers: phone,
      },
      headers: { 
        "authorization": ENV_CONFIG.FAST2SMS_API_KEY,
        "cache-control": "no-cache" 
      },
    });

    if (!response.data?.return) {
      const msg = Array.isArray(response.data?.message) 
        ? response.data.message.join(", ") 
        : response.data?.message || "Fast2SMS delivery failed";
      throw new Error(msg);
    }

    logger.info(`OTP SMS sent to ${phone}`);
  } catch (err) {
    const responseData = err.response?.data;
    const detailMsg = responseData?.message 
      ? (Array.isArray(responseData.message) ? responseData.message.join(", ") : responseData.message)
      : err.message;
    
    logger.warn(`Fast2SMS Notice (${detailMsg}).`);
    console.log(`\n==================================================`);
    console.log(`🔑 [DEMO OTP FOR ${phone}]: ${otp}`);
    console.log(`==================================================\n`);
    
    if (ENV_CONFIG.NODE_ENV === "production") {
      throw new Error(`SMS Provider Error: ${detailMsg}`);
    }
  }
};
