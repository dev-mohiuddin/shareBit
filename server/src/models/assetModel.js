import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, trim: true },
    location: { type: String, trim: true },
    totalShares: { type: Number, required: true, min: 1 },
    sharePrice: { type: Number, required: true, min: 0 },
    totalSharePrice: { type: Number, required: true, min: 0 },
    availableShares: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["draft", "active", "paused", "closed"],
      default: "draft",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlatformUser",
      required: true,
    },
  },
  { timestamps: true }
);

export const Asset = mongoose.model("Asset", assetSchema);
