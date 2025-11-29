import User  from "../models/User.model.js";
import { AppError } from "../utils/AppError.js";
import {logger} from "../config/logger.config.js"; // ya jo bhi tera path hai

// Create/Register user (email + password / phone mix)
export const registerUser = async ({ name, email, password, phone }) => {
  const existingUser = await User.findOne({
    $or: [{ email }, { phone }],
  });

  if (existingUser) {
    throw new AppError("User already exists with this email or phone", 400);
  }

  const user = await User.create({
    name,
    email,
    password, // password hashing model middleware me ho raha hai
    phone,
  });

  logger.info(`New user registered: ${user._id}`);

  return user;
};

// Login with email + password (basic login)
export const loginWithEmail = async ({ email, password }) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  // comparePassword method jo tu model me set kar chuka hai
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  logger.info(`User logged in: ${user._id}`);

  return user;
};

// Get user by id (for /me route)
export const getUserById = async (id) => {
  const user = await User.findById(id).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};
