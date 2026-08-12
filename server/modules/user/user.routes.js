import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { getMe, updateMe } from "./user.controller.js";

const router = Router();

// All user routes are protected
router.use(protect);

router.get("/me", getMe);
router.patch("/me", updateMe);

export default router;
