import { Router } from "express";
import passport from "passport";
import { protect } from "../../middlewares/auth.middleware.js";
import {
  register,
  login,
  logout,
  sendOtp,
  verifyOtp,
  googleCallback,
} from "./auth.controller.js";

const router = Router();

// ─── Email Auth ───────────────────────────────────────────────────────────────
router.post("/register", register);
router.post("/login", login);
router.post("/logout", protect, logout);

// ─── OTP Auth ─────────────────────────────────────────────────────────────────
router.post("/otp/send", sendOtp);
router.post("/otp/verify", verifyOtp);

// ─── Google OAuth ─────────────────────────────────────────────────────────────
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
  }),
  googleCallback
);

export default router;
