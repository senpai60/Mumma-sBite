import { Router } from "express";
import {
  getProducts,
  getSingleProduct,
  injectProducts,
} from "../controllers/products.controller.js";

const router = Router();

router.get("/", getProducts);
router.get("/:productId", getSingleProduct);
router.post("/inject", injectProducts);

export default router;
