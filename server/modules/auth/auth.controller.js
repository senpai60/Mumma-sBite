import * as authService from "./auth.service.js";
import * as otpService from "./otp.service.js";
import { generateTokens } from "../../utils/token.util.js";
import { setAuthCookies } from "../../utils/cookie.util.js";
import { logger } from "../../config/logger.config.js";
import { ENV_CONFIG } from "../../config/env.config.js";

// ─── Email Auth ───────────────────────────────────────────────────────────────

// POST /auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !password || (!email && !phone)) {
      return res.status(400).json({
        success: false,
        message: "name, password, and at least email or phone are required",
      });
    }

    const user = await authService.registerUser({ name, email, password, phone });

    const { accessToken, refreshToken } = generateTokens(user);
    setAuthCookies(res, accessToken, refreshToken);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// POST /auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await authService.loginWithEmail({ email, password });

    const { accessToken, refreshToken } = generateTokens(user);
    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// POST /auth/logout
export const logout = async (req, res, next) => {
  try {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    logger.info(`User logged out: ${req.user?.id || "unknown"}`);

    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

// ─── OTP Auth ─────────────────────────────────────────────────────────────────

// POST /auth/otp/send
export const sendOtp = async (req, res, next) => {
  try {
    await otpService.sendOtp(req.body);
    return res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    next(err);
  }
};

// POST /auth/otp/verify
export const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp, name } = req.body;
    const user = await otpService.verifyOtp({ phone, otp, name });

    const { accessToken, refreshToken } = generateTokens(user);
    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      success: true,
      message: "OTP verified, logged in",
      user: { id: user._id, name: user.name, phone: user.phone, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Firebase OTP Auth ────────────────────────────────────────────────────────
import { firebaseAuth } from "../../config/firebase.config.js";
import User from "../../models/User.model.js";

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const { idToken, name } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: "Firebase ID Token is required" });
    }

    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    const phone = decodedToken.phone_number;

    if (!phone) {
      return res.status(400).json({ success: false, message: "No phone number associated with this token" });
    }

    // Standardize phone format (extract 10 digit number)
    const cleanedPhone = phone.replace(/\D/g, "").slice(-10);

    let user = await User.findOne({ $or: [{ phone: cleanedPhone }, { phone }] });

    if (!user) {
      user = await User.create({
        name: name || "User",
        phone: cleanedPhone,
        role: "basic user",
      });
      logger.info(`New user via Firebase OTP: ${user._id}`);
    } else {
      logger.info(`Existing user verified via Firebase OTP: ${user._id}`);
    }

    const { accessToken, refreshToken } = generateTokens(user);
    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      success: true,
      message: "Firebase OTP verified, logged in",
      user: { id: user._id, name: user.name, phone: user.phone, role: user.role },
    });
  } catch (err) {
    logger.error("Firebase token verification error:", err);
    return res.status(401).json({ success: false, message: "Invalid or expired Firebase token" });
  }
};

// ─── Google OAuth ─────────────────────────────────────────────────────────────

// GET /auth/google/callback  (called after passport.authenticate succeeds)
export const googleCallback = (req, res) => {
  const { accessToken, refreshToken } = generateTokens(req.user);
  setAuthCookies(res, accessToken, refreshToken);
  return res.redirect(`${ENV_CONFIG.FRONTEND_URL}/profile`);
};

