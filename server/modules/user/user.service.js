import crypto from "crypto";
import User from "../../models/User.model.js";
import OtpToken from "../../models/OtpToken.model.js";
import { AppError } from "../../utils/AppError.js";

// Get user by ID (for /me route, profile, etc.)
export const getUserById = async (id) => {
  const user = await User.findById(id).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

// Update user profile fields (requires OTP if phone number is changed)
export const updateUserById = async (id, updates) => {
  const user = await User.findById(id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // If user is attempting to change phone number, verify OTP
  if (updates.phone && updates.phone !== user.phone) {
    if (!updates.otp) {
      throw new AppError("OTP verification required to update mobile number", 400);
    }

    const otpDoc = await OtpToken.findOne({ phone: updates.phone });
    if (!otpDoc) {
      throw new AppError("OTP not found or expired for new mobile number", 400);
    }

    if (otpDoc.expiresAt < new Date()) {
      await OtpToken.deleteOne({ _id: otpDoc._id });
      throw new AppError("OTP expired. Please request a new OTP", 400);
    }

    const otpHash = crypto.createHash("sha256").update(updates.otp).digest("hex");
    if (otpHash !== otpDoc.otpHash) {
      throw new AppError("Invalid OTP for new mobile number", 400);
    }

    // Clear token after successful verification
    await OtpToken.deleteOne({ _id: otpDoc._id });
  }

  const allowedFields = ["name", "address", "phone", "email"];
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowedFields.includes(key))
  );

  Object.assign(user, filtered);
  await user.save();

  const updatedUser = user.toObject();
  delete updatedUser.password;

  return updatedUser;
};
