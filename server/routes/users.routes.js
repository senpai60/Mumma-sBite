import { Router } from "express";
import { ENV_CONFIG } from "../config/env.config.js";
import {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
} from "../controllers/users.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

import passport from "passport";

import { generateTokens } from "../utils/token.util.js";
import { setAuthCookies } from "../utils/cookie.util.js";

const router = Router();

router.get("/", (req, res) => {
  try {
    res.status(200).json({ message: "Users route is working!" });
  } catch (err) {
    console.error(err);
  }
});

router.post("/register", registerUser);
router.post("/login", loginUser);

// Authenticated routes
router.get("/me", protect, getMe);
router.post("/logout", protect, logoutUser);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
  }),
  (req, res) => {
    const { accessToken, refreshToken } = generateTokens(req.user);
    setAuthCookies(res, accessToken, refreshToken);
    const redirectUrl = `${process.env.FRONTEND_URL}/profile`;
    return res.redirect(redirectUrl);
  }
);

export default router;
