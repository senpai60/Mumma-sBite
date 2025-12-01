import dotenv from 'dotenv';
dotenv.config()

export const ENV_CONFIG = {
    MONGODB_URI : process.env.MONGODB_URI,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,

    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    
    PORT: process.env.PORT || 3000,
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || 'localhost',
    COOKIE_SECURE: process.env.COOKIE_SECURE === 'true',

    NODE_ENV: process.env.NODE_ENV || "development",
}