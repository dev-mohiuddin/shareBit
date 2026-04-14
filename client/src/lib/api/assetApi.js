import { API, handleRequest } from "@/lib/api";

export const getAssets = async () => {
  return handleRequest(() => API.get("/api/v1/assets"));
};

export const createAsset = async (payload) => {
  return handleRequest(() => API.post("/api/v1/assets", payload));
};

export const updateAsset = async ({ assetId, ...payload }) => {
  return handleRequest(() => API.patch(`/api/v1/assets/${assetId}`, payload));
};

export const deleteAsset = async (assetId) => {
  return handleRequest(() => API.delete(`/api/v1/assets/${assetId}`));
};
