import User from "../../models/User.model.js";
import { AppError } from "../../utils/AppError.js";

// Get user by ID (for /me route, profile, etc.)
export const getUserById = async (id) => {
  const user = await User.findById(id).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

// Update user profile fields
export const updateUserById = async (id, updates) => {
  const allowedFields = ["name", "address", "phone"];
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowedFields.includes(key))
  );

  const user = await User.findByIdAndUpdate(id, filtered, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};
