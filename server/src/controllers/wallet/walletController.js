import { catchAsync } from "#utils/catchAsync.js";
import {
  getWallet,
  requestWithdrawal,
  listWithdrawals,
  listAllWithdrawals,
  updateWithdrawalStatus,
} from "#services/wallet/walletService.js";

export const getWalletController = catchAsync(async (req, res) => {
  const wallet = await getWallet(req.user.id || req.user._id);
  res.success({ data: wallet, message: "Wallet retrieved" });
});

export const requestWithdrawalController = catchAsync(async (req, res) => {
  const request = await requestWithdrawal(req.user.id || req.user._id, req.body, req.user);
  res.success({ data: request, message: "Withdrawal requested", statusCode: 201 });
});

export const listWithdrawalsController = catchAsync(async (req, res) => {
  const requests = await listWithdrawals(req.user.id || req.user._id);
  res.success({ data: requests, message: "Withdrawals retrieved" });
});

export const listAllWithdrawalsController = catchAsync(async (req, res) => {
  const requests = await listAllWithdrawals();
  res.success({ data: requests, message: "All withdrawals retrieved" });
});

export const updateWithdrawalStatusController = catchAsync(async (req, res) => {
  const updated = await updateWithdrawalStatus(
    req.params.withdrawalId,
    req.body,
    req.user
  );
  res.success({ data: updated, message: "Withdrawal status updated" });
});
