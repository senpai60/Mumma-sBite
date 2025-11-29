import dotenv from 'dotenv';
dotenv.config()

export const ENV_CONFIG = {
    MONGODB_URI : process.env.MONGODB_URI,
}