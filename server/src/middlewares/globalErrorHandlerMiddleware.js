import { ZodError } from "zod";
import path from "path";
import { logger } from "#utils/logger.js";

export const globalErrorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let data = err.data || null;

  if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation Error";
    data = err.errors.map((e) => ({
      path: e.path.join("."),
      message: e.message,
    }));
  } else if (err.code && err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for '${field}': '${err.keyValue[field]}' already exists.`;
    data = err.keyValue;
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    data = {};
    for (const key in err.errors) {
      data[key] = err.errors[key].message;
    }
    message = "Validation Error";
  }

  let trace;
  if (process.env.NODE_ENV === "development" && err.stack) {
    const stackLines = err.stack.split("\n").slice(1);
    trace = stackLines.map((line) => {
      const match = line.match(/\((.*):(\d+):(\d+)\)/);
      if (match) {
        const [_, filePath, lineNum, colNum] = match;
        return {
          file: path.relative(process.cwd(), filePath),
          line: parseInt(lineNum, 10),
          column: parseInt(colNum, 10),
          description: `${err.name}: ${err.message}`,
        };
      }
      return { raw: line.trim(), description: `${err.name}: ${err.message}` };
    });
  }

  logger.error("%s %s -> %s", req.method, req.originalUrl, err.message, {
    statusCode,
    requestId: req.requestId || null,
    stack: err.stack,
  });

  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    data,
    ...(trace ? { trace } : {}),
    request: {
      method: req.method,
      url: req.originalUrl,
      ...(process.env.NODE_ENV !== "production" ? { ip: req.ip } : {}),
      requestId: req.requestId || null,
    },
  });
};
