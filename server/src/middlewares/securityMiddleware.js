import helmet from "helmet";
import cors from "cors";
import hpp from "hpp";
import xss from "xss";
import { getCorsOrigin } from "#config/corsConfig.js";
const sanitizeNoSql = (obj) => {
  if (!obj || typeof obj !== "object") return;

  Object.keys(obj).forEach((key) => {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
      return;
    }

    const value = obj[key];
    if (typeof value === "object" && value !== null) {
      sanitizeNoSql(value);
    }
  });
};

const xssMiddleware = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== "object") return;
    for (const key in obj) {
      if (typeof obj[key] === "string") {
        obj[key] = xss(obj[key]);
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  if (req.query) sanitize(req.query);
  next();
};

const noSqlInjectionMiddleware = (req, res, next) => {
  if (req.body) sanitizeNoSql(req.body);
  if (req.params) sanitizeNoSql(req.params);
  if (req.query) sanitizeNoSql(req.query);
  next();
};

const corsOrigin = getCorsOrigin();

export const securityMiddleware = [
  helmet(),
  cors({ origin: corsOrigin, credentials: true }),
  hpp(),
  noSqlInjectionMiddleware,
  xssMiddleware,
];
