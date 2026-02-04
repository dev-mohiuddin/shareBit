import mongoose from "mongoose";
import dotenv from "dotenv";
import { initData } from "#config/initDataSetup/index.js";

dotenv.config();

export const connectDatabase = async () => {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) throw new Error("MONGO_URI not defined in .env");

  const isProd = process.env.NODE_ENV === "production";
  const maxRetries = 5;
  const retryDelay = 1000;

  const connect = async (attempt = 1) => {
    try {
      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        ssl: isProd,
        tlsAllowInvalidCertificates: !isProd,
      });
      await initData();
      console.log("MongoDB connected!");
    } catch (err) {
      console.error(`MongoDB connection failed (attempt ${attempt}):`, err.message);
      if (attempt >= maxRetries) {
        console.error("Max retry attempts reached. Exiting...");
        process.exit(1);
      }
      console.log(`Retrying in ${retryDelay / 1000} sec...`);
      await new Promise((res) => setTimeout(res, retryDelay));
      await connect(attempt + 1);
    }
  };

  await connect();

  mongoose.connection.on("disconnected", () =>
    console.warn("MongoDB disconnected")
  );
  mongoose.connection.on("reconnected", () =>
    console.log("MongoDB reconnected")
  );
  mongoose.connection.on("error", (err) =>
    console.error("MongoDB connection error:", err.message)
  );
};
