import express from "express";
import { protect, authorize } from "#middlewares/authMiddleware.js";
import { validate } from "#middlewares/validateMiddleware.js";
import {
  recordAssetProfitController,
  recordAssetProfitAdjustmentController,
  listAssetProfitEntriesController,
} from "#controllers/profit/assetProfitController.js";
import {
  recordAssetProfitSchema,
  recordAssetProfitAdjustmentSchema,
  listAssetProfitEntriesSchema,
} from "#validations/profit/profitValidation.js";

export const assetProfitRouter = express.Router();

assetProfitRouter.post(
  "/asset-profits",
  protect,
  authorize("platform.asset:update"),
  validate(recordAssetProfitSchema),
  recordAssetProfitController
);

assetProfitRouter.post(
  "/asset-profits/adjustments",
  protect,
  authorize("platform.asset:update"),
  validate(recordAssetProfitAdjustmentSchema),
  recordAssetProfitAdjustmentController
);

assetProfitRouter.get(
  "/assets/:assetId/profit/:monthKey",
  protect,
  authorize("platform.asset:read"),
  validate(listAssetProfitEntriesSchema),
  listAssetProfitEntriesController
);
