import { Router } from "express";
import {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
} from "../controllers/users.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

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

export default router;
