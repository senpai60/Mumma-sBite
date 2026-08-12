import Product from "../models/Product.model.js";
import { AppError } from "../utils/AppError.js";

export const getProducts = async () => {
  const products = await Product.find().populate("category");
  if (!products) {
    throw new AppError("No products found", 404);
  }
  return products;
};

export const getSingleProduct = async (productId) => {
  const product = await Product.findById(productId).populate("category");
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  return product;
};

export const createProduct = async (productData) => {
  const product = await Product.create(productData);
  // Populate category information before returning
  await product.populate("category");
  return product;
};

export const injectProducts = async (productsArr) => {
  const inserted = await Product.insertMany(productsArr);
  return inserted;
};
