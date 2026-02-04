import express from "express";
import { protect, authorize } from "#middlewares/authMiddleware.js";
import { validate } from "#middlewares/validateMiddleware.js";
import {
  getWalletController,
  requestWithdrawalController,
  listWithdrawalsController,
  listAllWithdrawalsController,
} from "#controllers/wallet/walletController.js";
import { requestWithdrawalSchema } from "#validations/wallet/walletValidation.js";

export const walletRouter = express.Router();

walletRouter.get("/wallet", protect, getWalletController);
walletRouter.get("/wallet/withdrawals", protect, listWithdrawalsController);
walletRouter.get(
  "/wallet/withdrawals/admin",
  protect,
  authorize("platform.wallet:manage"),
  listAllWithdrawalsController
);
walletRouter.post(
  "/wallet/withdrawals",
  protect,
  validate(requestWithdrawalSchema),
  requestWithdrawalController
);
