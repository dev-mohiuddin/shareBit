import { API, handleRequest } from "@/lib/api";

export const register = async (payload) => {
  return handleRequest(() => API.post("/api/v1/auth/register", payload));
};

export const login = async (payload) => {
  return handleRequest(() => API.post("/api/v1/auth/login", payload));
};

export const verifyOtp = async (payload) => {
  return handleRequest(() => API.post("/api/v1/auth/verify-otp", payload));
};

export const resendOtp = async (payload) => {
  return handleRequest(() => API.post("/api/v1/auth/resend-otp", payload));
};

export const refreshToken = async () => {
  return handleRequest(() => API.post("/api/v1/auth/refresh-token"));
};
