import { Product } from "../models/Product.model.js";
import { AppError } from "../utils/AppError.js";

export const getProducts = async () => {
  const products = await Product.find();
  if (!products) {
    throw new AppError("No products found", 404);
  }
  return products;
};

export const getSingleProduct = async (productId) => {
  const { productId } = req.params;
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  return product;
};

export const injectProducts = async (productsArr) => {
  for (const productData of productsArr) {}
};
