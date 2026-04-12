import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import { app, server } from "#socket/server.js";
import { connectDatabase } from "#config/dbConnect.js";
import { attachRequestId, globalResponse } from "#utils/responseUtil.js";
import { globalErrorHandler } from "#middlewares/globalErrorHandlerMiddleware.js";
import { securityMiddleware } from "#middlewares/securityMiddleware.js";
import { notFoundHandler } from "#middlewares/notFoundHandlerMiddleware.js";
import { globalRateLimiter } from "#middlewares/rateLimiterMiddleware.js";
import { requestLogger } from "#middlewares/loggingMiddleware.js";
import { apiRouterV1 } from "#routes/v1/index.js";
import healthRouter from "#routes/v1/health/healthRoute.js";
import { setupSwagger } from "#config/swagger.js";
import { startDailyProfitJob } from "#jobs/dailyProfitJob.js";

dotenv.config();
const PORT = process.env.PORT || 8000;

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(attachRequestId);
app.use(requestLogger);
app.use(securityMiddleware);
app.use(globalResponse);
app.use(globalRateLimiter(1000, 15));

setupSwagger(app);

app.use("/api", apiRouterV1);
app.get("/", (req, res) => {
  res.send("ShareBit server is running...");
});
app.use("/api/health", healthRouter);

app.use(notFoundHandler);
app.use(globalErrorHandler);

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

const startServer = async () => {
  await connectDatabase();

  startDailyProfitJob();

  const response = server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err);
    response.close(() => process.exit(1));
  });
};

startServer();
