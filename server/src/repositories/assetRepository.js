import { Asset } from "#models/assetModel.js";

export const createAsset = async (data) => {
  return Asset.create(data);
};

export const getAssets = async () => {
  return Asset.find().exec();
};

export const getAssetById = async (id) => {
  return Asset.findById(id).exec();
};

export const updateAssetById = async (id, data) => {
  return Asset.findByIdAndUpdate(id, data, { new: true }).exec();
};

export const deleteAssetById = async (id) => {
  return Asset.findByIdAndDelete(id).exec();
};
