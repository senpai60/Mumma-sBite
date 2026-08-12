import { logger } from "./logger.config.js";
import { ENV_CONFIG } from "./env.config.js";

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://localhost:3000/users/google/callback",
  "http://localhost:3000/users/google",
  "https://www.yourdomain.com",
];

if (ENV_CONFIG.FRONTEND_URL) {
  allowedOrigins.push(ENV_CONFIG.FRONTEND_URL);
}

// Sanitize allowed origins (remove trailing slashes)
const sanitizedAllowedOrigins = allowedOrigins.map((url) =>
  url.replace(/\/$/, "")
);

// Optional: allow wildcard subdomains
// Example: *.yourdomain.com
const isWildcardAllowed = (origin) => {
  if (!origin) return false;
  const wildcardDomain = /\.yourdomain\.com$/;
  return wildcardDomain.test(origin);
};

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser tools like Postman
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, "");

    // Strict checks
    if (
      sanitizedAllowedOrigins.includes(normalizedOrigin) ||
      isWildcardAllowed(origin)
    ) {
      callback(null, true);
    } else {
      logger.warn(`CORS BLOCKED: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],

  exposedHeaders: ["Authorization"],

  credentials: true, // allow cookies (important for JWT cookies)

  maxAge: 600, // cache preflight for 10 min (performance boost)
};
