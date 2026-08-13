import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";
import passport from "passport";
import "./config/passport.config.js";

import { errorHandler } from "./middlewares/error.middleware.js";
import { corsOptions } from "./config/corsOptions.config.js";

import indexRouter from "./routes/index.js";
import authRouter from "./modules/auth/auth.routes.js";
import userRouter from "./modules/user/user.routes.js";
import cartRouter from "./modules/cart/cart.routes.js";
import productsRouter from "./routes/products.routes.js";
import orderRouter, {
  createOrderHandler,
  verifyPaymentHandler,
} from "./modules/order/order.routes.js";

const app = express();

app.use(cors(corsOptions));
app.use(passport.initialize());
app.use(errorHandler);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/products", productsRouter);
app.use("/api/order", orderRouter);
app.post("/api/create-order", createOrderHandler);
app.post("/api/verify-payment", verifyPaymentHandler);


// Health check route for uptime monitors
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// Catch-all route to serve client-side SPA index.html
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

export default app;
