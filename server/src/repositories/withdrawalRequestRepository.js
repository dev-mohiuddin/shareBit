import { WithdrawalRequest } from "#models/withdrawalRequestModel.js";

export const createWithdrawalRequest = async (data) => {
  return WithdrawalRequest.create(data);
};

export const getWithdrawalRequestsByUser = async (userId) => {
  return WithdrawalRequest.find({ userId }).exec();
};

export const getAllWithdrawalRequests = async () => {
  return WithdrawalRequest.find().exec();
};
