import mongoose from "mongoose";
import { ENV_CONFIG } from "./config/env.config.js";
import Category from "./models/Category.model.js";
import Product from "./models/Product.model.js";

const run = async () => {
  try {
    const mongoUri = ENV_CONFIG.MONGODB_URI;
    if (!mongoUri) {
      console.error("MONGODB_URI is missing in environment variables!");
      process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully!");

    // Find or create Category
    let category = await Category.findOne({ slug: "mini-treats" });
    if (!category) {
      category = await Category.findOne({});
    }
    if (!category) {
      category = await Category.create({
        name: "Mini Treats",
        slug: "mini-treats",
        description: "Bite-sized chocolates and mini treats",
        badge: "MINI",
        imageUrl: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500",
      });
      console.log("Created category: Mini Treats");
    }

    const miniItems = [
      {
        title: "Mini Dark Truffle Bite",
        description: "Single-bite artisanal dark chocolate truffle with gooey cocoa center.",
        price: 10,
        category: category._id,
        tags: ["Mini", "Dark Chocolate", "₹10 Item"],
        imageUrl: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500",
        stock: 100,
      },
      {
        title: "Mini Milk Chocolate Square",
        description: "Creamy Swiss-style milk chocolate mini square.",
        price: 15,
        category: category._id,
        tags: ["Mini", "Milk Chocolate", "₹15 Item"],
        imageUrl: "https://images.unsplash.com/photo-1511381939415-e44015466834?w=500",
        stock: 100,
      },
      {
        title: "Mini Hazelnut Crunch",
        description: "Roasted hazelnut coated in smooth milk chocolate.",
        price: 20,
        category: category._id,
        tags: ["Mini", "Hazelnut", "₹20 Item"],
        imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=500",
        stock: 100,
      },
      {
        title: "Mini Almond Rock",
        description: "Crispy roasted almond dipped in premium 70% dark chocolate.",
        price: 25,
        category: category._id,
        tags: ["Mini", "Almond", "₹25 Item"],
        imageUrl: "https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=500",
        stock: 100,
      },
    ];

    for (const item of miniItems) {
      const existing = await Product.findOne({ title: item.title });
      if (existing) {
        existing.price = item.price;
        existing.description = item.description;
        existing.imageUrl = item.imageUrl;
        existing.tags = item.tags;
        await existing.save();
        console.log(`Updated existing mini item: ${item.title} (₹${item.price})`);
      } else {
        await Product.create(item);
        console.log(`Created new mini item: ${item.title} (₹${item.price})`);
      }
    }

    console.log("All mini items added successfully!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding mini items:", error);
    process.exit(1);
  }
};

run();
