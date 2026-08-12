import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Category from "../models/Category.model.js";
import Product from "../models/Product.model.js";
import { logger } from "../config/logger.config.js";
import imagekit from "./imagekit.util.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesDir = path.join(__dirname, "../product-image");

const categoriesData = [
  {
    name: "Handmade Chocolates",
    slug: "handmade-chocolates",
    description:
      "Soft-centered, nutty, dark, milk – sab yahan. Perfect for everyday cravings.",
    badge: "Most Loved",
    imageUrl:
      "https://images.pexels.com/photos/4109992/pexels-photo-4109992.jpeg",
  },
  {
    name: "Brownies & Bars",
    slug: "brownies-bars",
    description:
      "Gooey, fudgy, crispy top brownies – weekend binge ke liye ideal.",
    badge: "Bestseller",
    imageUrl:
      "https://images.pexels.com/photos/4109993/pexels-photo-4109993.jpeg",
  },
  {
    name: "Gift Hampers",
    slug: "gift-hampers",
    description:
      "Curated boxes with chocolates, notes and more. Ready-to-gift options.",
    badge: "Perfect for gifting",
    imageUrl:
      "https://images.pexels.com/photos/4110000/pexels-photo-4110000.jpeg",
  },
  {
    name: "Cookies & Bites",
    slug: "cookies-bites",
    description: "Crispy, chewy, nutty – har mood ke liye ek cookie.",
    imageUrl:
      "https://images.pexels.com/photos/8275138/pexels-photo-8275138.jpeg",
  },
  {
    name: "Dark Collection",
    slug: "dark-collection",
    description:
      "High cocoa %, low sugar. Bitter-sweet lovers ke liye special range.",
    imageUrl:
      "https://images.pexels.com/photos/461431/pexels-photo-461431.jpeg",
  },
  {
    name: "Custom Boxes",
    slug: "custom-boxes",
    description:
      "Mix & match your favourites and add a personal note inside.",
    badge: "Build your own",
    imageUrl:
      "https://images.pexels.com/photos/918328/pexels-photo-918328.jpeg",
  },
];

const productsData = [
  {
    title: "Hazelnut Crunch Chocolates",
    description: "Rich cocoa shells with roasted hazelnut center.",
    price: 399,
    categorySlug: "handmade-chocolates",
    tags: ["Top Recipe"],
    imageFile: "hazelnut-crunch.jpg",
    imageUrl:
      "https://images.pexels.com/photos/4109992/pexels-photo-4109992.jpeg",
    stock: 50,
  },
  {
    title: "Classic Fudge Brownies",
    description: "Gooey center, crispy top – baked fresh daily.",
    price: 349,
    categorySlug: "brownies-bars",
    tags: ["Best Seller"],
    imageFile: "classic-fudge-browniejpg",
    imageUrl:
      "https://images.pexels.com/photos/4109993/pexels-photo-4109993.jpeg",
    stock: 50,
  },
  {
    title: "Almond Rocher Bites",
    description: "Roasted almonds wrapped in silky chocolate.",
    price: 429,
    categorySlug: "handmade-chocolates",
    tags: ["New"],
    imageFile: "almond-rocher-bites.jpg",
    imageUrl:
      "https://images.pexels.com/photos/461431/pexels-photo-461431.jpeg",
    stock: 50,
  },
  {
    title: "Strawberry Truffle Box",
    description: "Soft strawberry ganache in dark chocolate shell.",
    price: 459,
    categorySlug: "handmade-chocolates",
    tags: [],
    imageFile: "strawberry-truffle-box.jpg",
    imageUrl:
      "https://images.pexels.com/photos/918328/pexels-photo-918328.jpeg",
    stock: 50,
  },
  {
    title: "Caramel Filled Bites",
    description: "Slow-cooked caramel in milk chocolate.",
    price: 379,
    categorySlug: "handmade-chocolates",
    tags: [],
    imageFile: "caramel-filled-bites.jpg",
    imageUrl:
      "https://images.pexels.com/photos/6062042/pexels-photo-6062042.jpeg",
    stock: 50,
  },
  {
    title: "Mumma’s Signature Box",
    description: "Assorted favourites curated by mumma.",
    price: 699,
    categorySlug: "gift-hampers",
    tags: ["Limited"],
    imageFile: "mummas-signature-box.png",
    imageUrl:
      "https://images.pexels.com/photos/4110000/pexels-photo-4110000.jpeg",
    stock: 50,
  },
  {
    title: "Roasted Coffee Truffles",
    description: "For coffee lovers – deep and intense.",
    price: 449,
    categorySlug: "handmade-chocolates",
    tags: [],
    imageFile: "roasted-coffee-truffles.jpg",
    imageUrl:
      "https://images.pexels.com/photos/461430/pexels-photo-461430.jpeg",
    stock: 50,
  },
  {
    title: "Pistachio Delight Squares",
    description: "Pistachio, white chocolate & love.",
    price: 429,
    categorySlug: "handmade-chocolates",
    tags: [],
    imageFile: "pistachio-delight-squares.jpg",
    imageUrl:
      "https://images.pexels.com/photos/4109994/pexels-photo-4109994.jpeg",
    stock: 50,
  },
  {
    title: "Almond Florentine Crisps",
    description: "Thin crispy almond caramel cookies.",
    price: 389,
    categorySlug: "cookies-bites",
    tags: [],
    imageFile: "almond-florentine-crisps.jpg",
    imageUrl:
      "https://images.pexels.com/photos/8275138/pexels-photo-8275138.jpeg",
    stock: 50,
  },
  {
    title: "Midnight Dark Collection",
    description: "70% dark, intense, no compromise on flavour.",
    price: 499,
    categorySlug: "dark-collection",
    tags: [],
    imageFile: "midnight-dark-collection.png",
    imageUrl:
      "https://images.pexels.com/photos/461431/pexels-photo-461431.jpeg",
    stock: 50,
  },
];

const uploadLocalImage = async (imageFile, defaultUrl) => {
  if (!imageFile || !imagekit) return defaultUrl;

  const filePath = path.join(imagesDir, imageFile);
  if (!fs.existsSync(filePath)) {
    logger.warn(
      `Local file ${imageFile} not found in ${imagesDir}. Using fallback URL.`
    );
    return defaultUrl;
  }

  try {
    logger.info(`Uploading ${imageFile} to ImageKit... 🚀`);
    const fileBase64 = fs.readFileSync(filePath).toString("base64");
    const uploadRes = await imagekit.files.upload({
      file: fileBase64,
      fileName: `seed-${Date.now()}-${imageFile}`,
      folder: "/products",
    });
    logger.info(`Upload complete for ${imageFile}: ${uploadRes.url}`);
    return uploadRes.url;
  } catch (err) {
    logger.error(
      `Failed to upload ${imageFile} to ImageKit: ${err.message}. Using fallback.`
    );
    return defaultUrl;
  }
};

export const seedDatabase = async () => {
  try {
    // Detect old pexels seeds and clear them if we have ImageKit credentials
    const pexelsProduct = await Product.findOne({ imageUrl: /pexels/ });
    if (pexelsProduct && imagekit) {
      logger.info(
        "Detected old Pexels product URLs. Re-seeding database to upload local images to ImageKit... 🧹"
      );
      await Product.deleteMany({});
      await Category.deleteMany({});
    }

    // 1. Seed Categories if empty
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      logger.info("Category collection is empty. Seeding categories... 🌱");
      await Category.insertMany(categoriesData);
      logger.info("Successfully seeded categories!");
    } else {
      logger.info("Category collection is already populated.");
    }

    // 2. Seed Products if empty
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      logger.info("Product collection is empty. Seeding products... 🍫");

      // Fetch all categories to resolve IDs
      const categories = await Category.find();
      const categoryMap = {};
      categories.forEach((cat) => {
        categoryMap[cat.slug] = cat._id;
      });

      const finalProductsData = [];

      for (const prod of productsData) {
        const catId = categoryMap[prod.categorySlug];
        if (!catId) {
          throw new Error(
            `Category slug "${prod.categorySlug}" not found when seeding product "${prod.title}"`
          );
        }

        // Upload local image to ImageKit if possible, otherwise use fallback
        const uploadedUrl = await uploadLocalImage(
          prod.imageFile,
          prod.imageUrl
        );

        finalProductsData.push({
          title: prod.title,
          description: prod.description,
          price: prod.price,
          category: catId,
          tags: prod.tags,
          imageUrl: uploadedUrl,
          stock: prod.stock,
        });
      }

      await Product.insertMany(finalProductsData);
      logger.info("Successfully seeded products with ImageKit uploads!");
    } else {
      logger.info("Product collection is already populated.");
    }
  } catch (err) {
    logger.error({
      message: "Database seeding failed ❌",
      error: err.message,
      stack: err.stack,
    });
  }
};
