import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    badge: { type: String },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);

export default Category;
