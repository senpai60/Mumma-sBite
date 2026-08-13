import dotenv from "dotenv";
dotenv.config();

export const ENV_CONFIG = {
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,

  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",

  PORT: process.env.PORT || 3000,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || "localhost",
  COOKIE_SECURE: process.env.COOKIE_SECURE === "true",

  NODE_ENV: process.env.NODE_ENV || "development",

  FAST2SMS_API_KEY: process.env.FAST2SMS_API_KEY,

  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT,

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_API_KEY,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET,
  RAZORPAY_API_KEY: process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_API_KEY,
  RAZORPAY_SECRET: process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET,
};
