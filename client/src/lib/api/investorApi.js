import { API, handleRequest } from "@/lib/api";

export const getUsers = async () => {
  return handleRequest(() => API.get("/api/v1/users"));
};

export const createInvestorByAdmin = async (payload) => {
  return handleRequest(() => API.post("/api/v1/users/investors", payload));
};

export const getInvestorDetails = async (investorId) => {
  return handleRequest(() => API.get(`/api/v1/users/investors/${investorId}`));
};

export const updateInvestorByAdmin = async ({ investorId, ...payload }) => {
  return handleRequest(() => API.patch(`/api/v1/users/investors/${investorId}`, payload));
};

export const updateInvestorStatusByAdmin = async ({ investorId, ...payload }) => {
  return handleRequest(() => API.patch(`/api/v1/users/investors/${investorId}/status`, payload));
};

export const reviewInvestorApprovalByAdmin = async ({ investorId, ...payload }) => {
  return handleRequest(() => API.patch(`/api/v1/users/investors/${investorId}/approval`, payload));
};

export const getInvestorDocuments = async (investorId) => {
  return handleRequest(() => API.get(`/api/v1/users/investors/${investorId}/documents`));
};

export const uploadInvestorDocumentByAdmin = async ({ investorId, formData }) => {
  return handleRequest(() => API.post(`/api/v1/users/investors/${investorId}/documents`, formData));
};
