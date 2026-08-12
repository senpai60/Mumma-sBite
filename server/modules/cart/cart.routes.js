import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "./cart.controller.js";

const router = Router();

// All cart routes require authentication
router.use(protect);

router.get("/", getCart); // GET  /cart
router.post("/items", addToCart); // POST /cart/items
router.patch("/items/:productId", updateCartItem); // PATCH /cart/items/:productId
router.delete("/items/:productId", removeFromCart); // DELETE /cart/items/:productId
router.delete("/", clearCart); // DELETE /cart

export default router;
