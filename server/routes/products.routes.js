import { Router } from "express";
import {
  getProducts,
  getSingleProduct,
  injectProducts,
  createProduct,
  getCategories,
} from "../controllers/products.controller.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/:productId", getSingleProduct);
router.post("/", upload.single("image"), createProduct);
router.post("/inject", injectProducts);

export default router;
