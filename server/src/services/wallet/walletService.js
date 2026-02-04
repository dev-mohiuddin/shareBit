import { findWalletByUserId, createWallet } from "#repositories/walletRepository.js";
import { createWithdrawalRequest, getWithdrawalRequestsByUser, getAllWithdrawalRequests } from "#repositories/withdrawalRequestRepository.js";
import { throwError } from "#utils/throwErrorUtil.js";
import { logAudit } from "#utils/auditLogger.js";

export const getWallet = async (userId) => {
  let wallet = await findWalletByUserId(userId);
  if (!wallet) {
    wallet = await createWallet({ userId, balance: 0, currency: "USD" });
  }
  return wallet;
};

export const requestWithdrawal = async (userId, payload, actor) => {
  const wallet = await getWallet(userId);
  if (payload.amount > wallet.balance) throwError("Insufficient balance", 400);

  const request = await createWithdrawalRequest({
    userId,
    walletId: wallet._id,
    amount: payload.amount,
    currency: wallet.currency,
    method: payload.method,
    metadata: payload.metadata || {},
  });

  await logAudit({
    actorId: actor.id || actor._id,
    actorRole: actor.roleName,
    action: "wallet.withdrawal.request",
    entity: "WithdrawalRequest",
    entityId: request._id,
    after: request.toObject(),
  });

  return request;
};

export const listWithdrawals = async (userId) => {
  return getWithdrawalRequestsByUser(userId);
};

export const listAllWithdrawals = async () => {
  return getAllWithdrawalRequests();
};
