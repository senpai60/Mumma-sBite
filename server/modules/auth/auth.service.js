import User from "../../models/User.model.js";
import { AppError } from "../../utils/AppError.js";
import { logger } from "../../config/logger.config.js";

// Register with email + password (+ optional phone)
export const registerUser = async ({ name, email, password, phone }) => {
  const existingUser = await User.findOne({
    $or: [{ email }, ...(phone ? [{ phone }] : [])],
  });

  if (existingUser) {
    throw new AppError("User already exists with this email or phone", 400);
  }

  const user = await User.create({ name, email, password, phone });

  logger.info(`New user registered: ${user._id}`);

  return user;
};

// Login with email + password
export const loginWithEmail = async ({ email, password }) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  logger.info(`User logged in: ${user._id}`);

  return user;
};
