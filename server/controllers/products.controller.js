import * as productService from "../services/products.service.js";
import imagekit from "../utils/imagekit.util.js";
import { AppError } from "../utils/AppError.js";
import Category from "../models/Category.model.js";

export const getProducts = async (req, res, next) => {
  try {
    const products = await productService.getProducts();
    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

export const getSingleProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await productService.getSingleProduct(productId);
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const { title, description, price, category, tags, stock } = req.body;

    if (!title || !description || !price || !category) {
      throw new AppError(
        "Title, description, price, and category are required",
        400
      );
    }

    if (!req.file) {
      throw new AppError("Product image file is required", 400);
    }

    if (!imagekit) {
      throw new AppError(
        "ImageKit is not configured in backend env variables",
        500
      );
    }

    // Upload to ImageKit
    let uploadResponse;
    try {
      const fileBase64 = req.file.buffer.toString("base64");
      uploadResponse = await imagekit.files.upload({
        file: fileBase64,
        fileName: `product-${Date.now()}-${req.file.originalname.replace(
          /\s+/g,
          "-"
        )}`,
        folder: "/products",
      });
    } catch (uploadErr) {
      throw new AppError(
        `Failed to upload image to ImageKit: ${uploadErr.message}`,
        500
      );
    }

    const imageUrl = uploadResponse.url;

    // Parse tags if sent as JSON string or comma-separated list
    let parsedTags = [];
    if (tags) {
      if (typeof tags === "string") {
        if (tags.startsWith("[") && tags.endsWith("]")) {
          try {
            parsedTags = JSON.parse(tags);
          } catch {
            parsedTags = tags.split(",").map((t) => t.trim());
          }
        } else {
          parsedTags = tags.split(",").map((t) => t.trim());
        }
      } else if (Array.isArray(tags)) {
        parsedTags = tags;
      }
    }

    const newProduct = await productService.createProduct({
      title,
      description,
      price: Number(price),
      category,
      tags: parsedTags,
      imageUrl,
      stock: stock ? Number(stock) : 50,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: newProduct,
    });
  } catch (err) {
    next(err);
  }
};

const products = [
  {
    title: "Hazelnut Crunch Chocolates",
    description: "Rich cocoa shells with roasted hazelnut center.",
    price: 399,
    category: "chocolates",
    tags: ["Top Recipe"],
    imageUrl: "https://images.pexels.com/photos/4109992/pexels-photo-4109992.jpeg",
    stock: 50,
  },
  {
    title: "Classic Fudge Brownies",
    description: "Gooey center, crispy top – baked fresh daily.",
    price: 349,
    category: "chocolates",
    tags: ["Best Seller"],
    imageUrl: "https://images.pexels.com/photos/4109993/pexels-photo-4109993.jpeg",
    stock: 50,
  },
  {
    title: "Almond Rocher Bites",
    description: "Roasted almonds wrapped in silky chocolate.",
    price: 429,
    category: "chocolates",
    tags: ["New"],
    imageUrl: "https://images.pexels.com/photos/461431/pexels-photo-461431.jpeg",
    stock: 50,
  },
  {
    title: "Strawberry Truffle Box",
    description: "Soft strawberry ganache in dark chocolate shell.",
    price: 459,
    category: "chocolates",
    tags: [],
    imageUrl: "https://images.pexels.com/photos/918328/pexels-photo-918328.jpeg",
    stock: 50,
  },
  {
    title: "Caramel Filled Bites",
    description: "Slow-cooked caramel in milk chocolate.",
    price: 379,
    category: "chocolates",
    tags: [],
    imageUrl: "https://images.pexels.com/photos/6062042/pexels-photo-6062042.jpeg",
    stock: 50,
  },
  {
    title: "Mumma’s Signature Box",
    description: "Assorted favourites curated by mumma.",
    price: 699,
    category: "chocolates",
    tags: ["Limited"],
    imageUrl: "https://images.pexels.com/photos/4110000/pexels-photo-4110000.jpeg",
    stock: 50,
  },
  {
    title: "Roasted Coffee Truffles",
    description: "For coffee lovers – deep and intense.",
    price: 449,
    category: "chocolates",
    tags: [],
    imageUrl: "https://images.pexels.com/photos/461430/pexels-photo-461430.jpeg",
    stock: 50,
  },
  {
    title: "Pistachio Delight Squares",
    description: "Pistachio, white chocolate & love.",
    price: 429,
    category: "chocolates",
    tags: [],
    imageUrl: "https://images.pexels.com/photos/4109994/pexels-photo-4109994.jpeg",
    stock: 50,
  },
  {
    title: "Almond Florentine Crisps",
    description: "Thin crispy almond caramel cookies.",
    price: 389,
    category: "chocolates",
    tags: [],
    imageUrl: "https://images.pexels.com/photos/8275138/pexels-photo-8275138.jpeg",
    stock: 50,
  },
  {
    title: "Midnight Dark Collection",
    description: "70% dark, intense, no compromise on flavour.",
    price: 499,
    category: "chocolates",
    tags: [],
    imageUrl: "https://images.pexels.com/photos/461431/pexels-photo-461431.jpeg",
    stock: 50,
  },
];

export const injectProducts = async (req, res, next) => {
  try {
    const insertedProducts = await productService.injectProducts(products);
    res.status(201).json({
      success: true,
      message: "Products injected successfully",
      count: insertedProducts.length,
      data: insertedProducts,
    });
  } catch (err) {
    next(err);
  }
};