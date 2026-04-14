import { API, handleRequest } from "@/lib/api";

const buildQueryString = (params = {}) => {
  const search = new URLSearchParams();

  if (params.type) search.set("type", params.type);
  if (params.startDate) search.set("startDate", params.startDate);
  if (params.endDate) search.set("endDate", params.endDate);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.skip) search.set("skip", String(params.skip));

  const query = search.toString();
  return query ? `?${query}` : "";
};

export const getMe = async () => {
  return handleRequest(() => API.get("/api/v1/users/me"));
};

export const updateMe = async (payload) => {
  return handleRequest(() => API.patch("/api/v1/users/me", payload));
};

export const getMyInvestorDashboardSnapshot = async () => {
  return handleRequest(() => API.get("/api/v1/users/me/investor-dashboard"));
};

export const getMyTransactions = async (params = {}) => {
  const query = buildQueryString(params);
  return handleRequest(() => API.get(`/api/v1/users/me/transactions${query}`));
};

export const submitMyProfileForApproval = async (payload = {}) => {
  return handleRequest(() => API.post("/api/v1/users/me/profile/submit", payload));
};

export const getMyDocuments = async () => {
  return handleRequest(() => API.get("/api/v1/users/me/documents"));
};

export const uploadMyDocument = async (formData) => {
  return handleRequest(() => API.post("/api/v1/users/me/documents", formData));
};
