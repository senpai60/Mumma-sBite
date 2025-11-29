import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";
import User  from "../models/User.model.js";
import {logger} from "../config/logger.config.js";
import { ENV_CONFIG } from "../config/env.config.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    // 1️⃣ Extract token (cookie → header → body fallback)
    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.body?.token) {
      token = req.body.token;
    }

    // If no token → unauthorized
    if (!token) {
      throw new AppError("Not authorized, token missing", 401);
    }

    // 2️⃣ Verify JWT
    const decoded = jwt.verify(token, ENV_CONFIG.JWT_ACCESS_SECRET);

    // 3️⃣ Fetch user from DB
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      throw new AppError("User no longer exists", 401);
    }

    // 4️⃣ Attach user to req (super important)
    req.user = {
      id: user._id,
      role: user.role,
      email: user.email,
      phone: user.phone,
    };

    logger.info(`Access granted to user: ${user._id}`);

    next();
  } catch (err) {
    // Token invalid or expired
    if (err.name === "TokenExpiredError") {
      logger.warn("Access token expired");
      return next(new AppError("Token expired, please login again", 401));
    }

    if (err.name === "JsonWebTokenError") {
      logger.warn("Invalid token");
      return next(new AppError("Invalid token", 401));
    }

    next(err);
  }
};
