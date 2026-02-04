import { AssetProfit } from "#models/assetProfitModel.js";

export const createAssetProfit = async (data) => {
  return AssetProfit.create(data);
};

export const listAssetProfitsByMonth = async (monthKey) => {
  return AssetProfit.find({ monthKey }).exec();
};

export const listAssetProfitsByAssetMonth = async (assetId, monthKey) => {
  return AssetProfit.find({ assetId, monthKey }).exec();
};
