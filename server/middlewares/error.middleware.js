import { logger } from "../config/logger.config.js";

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "something went wrong";

  logger.error({
    message: message,
    path: req.originalUrl,
    method: req.method,
    status: statusCode,
    err: err.message,
    stack: err.stack,
  });

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};
