import winston from "winston";
import "winston-daily-rotate-file";

const { combine, timestamp, printf, colorize, align } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} | ${level}-${stack || message}`;
});

const errorTransport = new winston.transports.DailyRotateFile({
  filename: "src/logs/error/%DATE%-error.log",
  datePattern: "YYYY-MM-DD",
  level: "error",
  maxFiles: "30d",
});

const combinedTransport = new winston.transports.DailyRotateFile({
  filename: "src/logs/combined/%DATE%-combined.log",
  datePattern: "YYYY-MM-DD",
  maxFiles: "30d",
});

export const logger = winston.createLogger({
  level: "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    align(),
    logFormat
  ),
  transports: [errorTransport, combinedTransport],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: "HH:mm:ss" }),
        logFormat
      ),
    })
  );
}
