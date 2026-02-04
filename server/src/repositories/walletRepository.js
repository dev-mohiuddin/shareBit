import { Wallet } from "#models/walletModel.js";

export const findWalletByUserId = async (userId) => {
  return Wallet.findOne({ userId }).exec();
};

export const createWallet = async (data) => {
  return Wallet.create(data);
};

export const updateWalletBalance = async (id, data) => {
  return Wallet.findByIdAndUpdate(id, data, { new: true }).exec();
};
