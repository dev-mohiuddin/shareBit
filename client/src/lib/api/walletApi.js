import { API, handleRequest } from "@/lib/api";

export const getWallet = async () => {
  return handleRequest(() => API.get("/api/v1/wallet"));
};

export const getWithdrawals = async () => {
  return handleRequest(() => API.get("/api/v1/wallet/withdrawals"));
};

export const getAllWithdrawals = async () => {
  return handleRequest(() => API.get("/api/v1/wallet/withdrawals/admin"));
};

export const getDeposits = async () => {
  return handleRequest(() => API.get("/api/v1/wallet/deposits"));
};

export const getAllDeposits = async () => {
  return handleRequest(() => API.get("/api/v1/wallet/deposits/admin"));
};

export const requestWithdrawal = async (payload) => {
  return handleRequest(() => API.post("/api/v1/wallet/withdrawals", payload));
};

export const cancelMyWithdrawal = async ({ withdrawalId, ...payload }) => {
  return handleRequest(() =>
    API.patch(`/api/v1/wallet/withdrawals/${withdrawalId}/cancel`, payload)
  );
};

export const updateWithdrawalStatus = async ({ withdrawalId, ...payload }) => {
  return handleRequest(() => API.patch(`/api/v1/wallet/withdrawals/${withdrawalId}/status`, payload));
};

export const requestDeposit = async (formData) => {
  return handleRequest(() => API.post("/api/v1/wallet/deposits", formData));
};

export const updateDepositStatus = async ({ depositId, ...payload }) => {
  return handleRequest(() => API.patch(`/api/v1/wallet/deposits/${depositId}/status`, payload));
};
