import { API, handleRequest } from "@/lib/api";

export const getAssets = async () => {
  return handleRequest(() => API.get("/api/v1/assets"));
};
