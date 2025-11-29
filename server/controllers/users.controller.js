import * as userService from "../services/users.service.js";
import { generateTokens } from "../utils/token.util.js";
import { setAuthCookies } from "../utils/cookie.util.js";
import { logger } from "../config/logger.config.js";

// POST /api/users/register
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !password || (!email && !phone)) {
      return res.status(400).json({
        success: false,
        message: "name, password and at least email or phone is required",
      });
    }

    const user = await userService.registerUser({
      name,
      email,
      password,
      phone,
    });

    const { accessToken, refreshToken } = generateTokens(user);

    setAuthCookies(res, accessToken, refreshToken);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/users/login
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await userService.loginWithEmail({ email, password });

    const { accessToken, refreshToken } = generateTokens(user);

    setAuthCookies(res, accessToken, refreshToken);
    console.log("SET-COOKIE ===>", res.getHeaders()["set-cookie"]);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/me
export const getMe = async (req, res, next) => {
  try {
    // assume auth middleware ne req.user.id set kiya hai
    const userId = req.user?.id;

    const user = await userService.getUserById(userId);

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/users/logout
export const logoutUser = async (req, res, next) => {
  try {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    logger.info(`User logged out: ${req.user?.id || "unknown"}`);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    next(err);
  }
};
