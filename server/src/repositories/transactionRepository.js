import { Transaction } from "#models/transactionModel.js";

export const createTransaction = async (data) => {
  return Transaction.create(data);
};
