import mongoose from "mongoose";

const withdrawalRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlatformUser",
      required: true,
    },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "USD" },
    status: {
      type: String,
      enum: ["requested", "approved", "rejected", "paid"],
      default: "requested",
    },
    method: { type: String, trim: true },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

export const WithdrawalRequest = mongoose.model(
  "WithdrawalRequest",
  withdrawalRequestSchema
);
