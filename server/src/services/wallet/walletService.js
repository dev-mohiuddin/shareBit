import { findWalletByUserId, createWallet } from "#repositories/walletRepository.js";
import { findUserById } from "#repositories/userRepository.js";
import {
  createWithdrawalRequest,
  getWithdrawalRequestsByUser,
  getAllWithdrawalRequests,
  getWithdrawalRequestById,
  updateWithdrawalRequestById,
} from "#repositories/withdrawalRequestRepository.js";
import { updateWalletBalance } from "#repositories/walletRepository.js";
import { createTransaction } from "#repositories/transactionRepository.js";
import { throwError } from "#utils/throwErrorUtil.js";
import { logAudit } from "#utils/auditLogger.js";

const ensureInvestorFinancialAccess = async (userId) => {
  const user = await findUserById(userId, { populateRole: true });
  if (!user) throwError("User not found", 404);

  const roleName = String(user.roleId?.name || "").toLowerCase();
  const isInvestorRole = roleName.includes("investor") || roleName.includes("user");

  if (!isInvestorRole) return;

  if (!user.isActive) {
    throwError("Account is inactive. Financial actions are blocked", 403);
  }

  const approvalStatus = user.investorProfile?.approval?.status;
  if (approvalStatus && approvalStatus !== "approved") {
    throwError(
      "Your profile is not approved yet. Financial actions are blocked until approval",
      403
    );
  }
};

export const getWallet = async (userId) => {
  let wallet = await findWalletByUserId(userId);
  if (!wallet) {
    wallet = await createWallet({ userId, balance: 0, currency: "USD" });
  }
  return wallet;
};

export const requestWithdrawal = async (userId, payload, actor) => {
  await ensureInvestorFinancialAccess(userId);

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

export const updateWithdrawalStatus = async (withdrawalId, payload, actor) => {
  const request = await getWithdrawalRequestById(withdrawalId);
  if (!request) throwError("Withdrawal request not found", 404);

  if (request.status === payload.status) {
    return request;
  }

  if (payload.status === "approved") {
    if (request.status !== "requested") {
      throwError("Only requested withdrawals can be approved", 400);
    }
  }

  if (payload.status === "rejected") {
    if (request.status !== "requested") {
      throwError("Only requested withdrawals can be rejected", 400);
    }
  }

  if (payload.status === "paid") {
    if (request.status !== "approved") {
      throwError("Only approved withdrawals can be marked as paid", 400);
    }

    const wallet = await findWalletByUserId(request.userId);
    if (!wallet) throwError("Wallet not found", 404);
    if (wallet.balance < request.amount) {
      throwError("Insufficient wallet balance to mark withdrawal as paid", 400);
    }

    await updateWalletBalance(wallet._id, {
      $inc: { balance: -Math.abs(request.amount) },
      lastTransactionAt: new Date(),
    });

    await createTransaction({
      walletId: wallet._id,
      userId: request.userId,
      amount: -Math.abs(request.amount),
      currency: request.currency,
      type: "withdrawal",
      referenceType: "WithdrawalRequest",
      referenceId: request._id,
      createdBy: actor.id || actor._id,
      metadata: payload.reason ? { reason: payload.reason } : {},
    });
  }

  const metadata = {
    ...(request.metadata || {}),
    reviewedBy: actor.id || actor._id,
    reviewedAt: new Date(),
    ...(payload.reason ? { reason: payload.reason } : {}),
  };

  const updated = await updateWithdrawalRequestById(withdrawalId, {
    status: payload.status,
    metadata,
  });

  await logAudit({
    actorId: actor.id || actor._id,
    actorRole: actor.roleName,
    action: `wallet.withdrawal.${payload.status}`,
    entity: "WithdrawalRequest",
    entityId: updated._id,
    before: request.toObject(),
    after: updated.toObject(),
  });

  return updated;
};
