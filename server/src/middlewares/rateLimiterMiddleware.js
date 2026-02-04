import rateLimit from "express-rate-limit";

const createLimiter = (maxRequests = 100, windowMinutes = 15) => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const retryAfterSeconds = Math.ceil(
        (req.rateLimit.resetTime - Date.now()) / 1000
      );
      res.set("Retry-After", String(retryAfterSeconds));

      return res.error({
        statusCode: 429,
        message: "Too many requests. Please try again later.",
        data: null,
      });
    },
  });
};

export const globalRateLimiter = (maxRequests = 100, windowMinutes = 15) => {
  return createLimiter(maxRequests, windowMinutes);
};

export const createRateLimiter = (maxRequests = 100, windowMinutes = 15) => {
  return createLimiter(maxRequests, windowMinutes);
};
