import jwt from "jsonwebtoken";
import { ENV_CONFIG } from "../config/env.config.js";

export const generateTokens = (user) => {
  const payload = {
    id: user._id,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, ENV_CONFIG.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign(payload, ENV_CONFIG.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};
