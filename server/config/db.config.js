import mongoose from "mongoose";
import { ENV_CONFIG } from "./env.config.js";
import { logger } from "./logger.config.js";
import { seedDatabase } from "../utils/seeder.js";

export const connectDB = async()=>{
    try {
        await mongoose.connect(ENV_CONFIG.MONGODB_URI)
        logger.info("MONGOD CONNECTED SUCCESSFULLY 🥬🥬")
        await seedDatabase();
    } catch (err) {
        logger.error({
        message: "MongoDB connection failed ❌",
        error: err.message,
        stack: err.stack,
    });
    }
}