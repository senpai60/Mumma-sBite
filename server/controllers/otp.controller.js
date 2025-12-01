import crypto from "crypto";
import OtpToken from "../models/OtpToken.model.js";
import User from "../models/User.model.js";

import { AppError } from "../utils/AppError.js";
import { generateTokens } from "../utils/token.util.js";
import { setAuthCookies } from "../utils/cookie.util.js";
import { logger } from "../config/logger.config.js";
import { connect } from "http2";

export const sendOtp = async (req, res, next) => {
  try {
    const { phone, email } = req.body;

    if (!phone && !email) {
      return next(
        new AppError("Either phone or email is required to send OTP", 400)
      );
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    const phoneOtp = await OtpToken.findOneAndUpdate(
      { phone },
      { otpHash, expiresAt },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`OTP for ${phone} => ${otp}`);
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp, name } = req.body;
    if (!phone || !otp) {
      throw new AppError("Phone and OTP are required", 400);
    }

    const otpDoc = await OtpToken.findOne({ phone });
    if (!otpDoc) {
      throw new AppError("OTP not found or expired", 400);
    }

    if (otpDoc.expiresAt < new Date()) {
      await OtpToken.deleteOne({ _id: otpDoc._id });
      throw new AppError("OTP expired, please request a new one", 400);
    }

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    if (otpHash !== otpDoc.otpHash) {
      throw new AppError("Invalid OTP", 400);
    }

    let user = await User.findOne({ phone });

    
  } catch (err) {
    next(err);
  }
};
