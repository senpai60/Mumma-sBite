import crypto from "crypto";
import OtpToken from "../../models/OtpToken.model.js";
import User from "../../models/User.model.js";
import { AppError } from "../../utils/AppError.js";
import { logger } from "../../config/logger.config.js";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Send OTP (phone or email based)
export const sendOtp = async ({ phone, email }) => {
  if (!phone && !email) {
    throw new AppError("Either phone or email is required to send OTP", 400);
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await OtpToken.findOneAndUpdate(
    { phone },
    { otpHash, expiresAt },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // TODO: integrate SMS / email provider here
  logger.info(`OTP generated for ${phone || email}`);
  console.log(`[DEV] OTP for ${phone || email} => ${otp}`);

  return true;
};

// Verify OTP and return or create the user
export const verifyOtp = async ({ phone, otp, name }) => {
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

  // Delete OTP after successful verification
  await OtpToken.deleteOne({ _id: otpDoc._id });

  // Find or create user by phone
  let user = await User.findOne({ phone });

  if (!user) {
    user = await User.create({
      name: name || "User",
      phone,
      role: "basic user",
    });
    logger.info(`New user via OTP: ${user._id}`);
  } else {
    logger.info(`Existing user verified via OTP: ${user._id}`);
  }

  return user;
};
