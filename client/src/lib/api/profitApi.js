import { API, handleRequest } from "@/lib/api";

export const getProfitSummary = async (params) => {
  const searchParams = new URLSearchParams();

  if (typeof params === "string") {
    if (params) searchParams.set("monthKey", params);
  } else if (params && typeof params === "object") {
    if (params.monthKey) searchParams.set("monthKey", params.monthKey);
    if (params.assetId) searchParams.set("assetId", params.assetId);
  }

  const query = searchParams.toString();
  return handleRequest(() => API.get(`/api/v1/reports/profit-summary${query ? `?${query}` : ""}`));
};

export const createAssetProfit = async (payload) => {
  return handleRequest(() => API.post("/api/v1/asset-profits", payload));
};

export const createAssetProfitAdjustment = async (payload) => {
  return handleRequest(() => API.post("/api/v1/asset-profits/adjustments", payload));
};

export const getAssetProfitEntries = async ({ assetId, monthKey }) => {
  return handleRequest(() => API.get(`/api/v1/assets/${assetId}/profit/${monthKey}`));
};

export const getAssetMonthPnl = async ({ assetId, monthKey }) => {
  return handleRequest(() => API.get(`/api/v1/assets/${assetId}/pnl/${monthKey}`));
};

export const getAssetExpenses = async ({ assetId, monthKey, entryType } = {}) => {
  const search = new URLSearchParams();
  if (assetId) search.set("assetId", assetId);
  if (monthKey) search.set("monthKey", monthKey);
  if (entryType) search.set("entryType", entryType);

  const query = search.toString();
  return handleRequest(() => API.get(`/api/v1/asset-expenses${query ? `?${query}` : ""}`));
};

export const createAssetExpense = async (payload) => {
  return handleRequest(() => API.post("/api/v1/asset-expenses", payload));
};

export const createAssetExpenseCorrection = async (payload) => {
  return handleRequest(() => API.post("/api/v1/asset-expenses/corrections", payload));
};

export const createProfitLedgerAdjustment = async (payload) => {
  return handleRequest(() => API.post("/api/v1/profit-ledger/adjustments", payload));
};
