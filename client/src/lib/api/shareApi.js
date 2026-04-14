import { API, handleRequest } from "@/lib/api";

export const getShareAccountsByAsset = async (assetId) => {
  return handleRequest(() => API.get(`/api/v1/assets/${assetId}/share-accounts`));
};

export const assignShare = async ({ shareAccountId, ...payload }) => {
  return handleRequest(() => API.post(`/api/v1/share-accounts/${shareAccountId}/assign`, payload));
};

export const recordSharePayment = async ({ shareAccountId, ...payload }) => {
  return handleRequest(() => API.post(`/api/v1/share-accounts/${shareAccountId}/payments`, payload));
};

export const getSharePayments = async (shareAccountId) => {
  return handleRequest(() => API.get(`/api/v1/share-accounts/${shareAccountId}/payments`));
};

export const getMyShareAccounts = async () => {
  return handleRequest(() => API.get("/api/v1/share-accounts/me"));
};
