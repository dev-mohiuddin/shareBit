import axios from "axios";

export const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const API = axios.create({
  baseURL: baseUrl,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

let isRefreshing = false;
let refreshPromise = null;

const handleRefresh = async () => {
  if (!refreshPromise) {
    refreshPromise = API.post("/api/v1/auth/refresh-token").then(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

API.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || "";

    if (error.response?.status === 401 && !originalRequest?._retry && !url.includes("/auth/refresh-token")) {
      originalRequest._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await handleRefresh();
        } finally {
          isRefreshing = false;
        }
      } else if (refreshPromise) {
        await refreshPromise;
      }
      return API(originalRequest);
    }

    return Promise.reject(error);
  }
);

export const handleRequest = async (requestFn) => {
  try {
    const response = await requestFn();
    return response?.data;
  } catch (error) {
    const status = error?.response?.status;
    const data = error?.response?.data;

    if (status === 401) {
      return {
        success: false,
        statusCode: status,
        message: data?.message || "Unauthorized",
        errors: data?.errors,
      };
    }

    if (data?.message || data?.code) {
      return {
        success: false,
        statusCode: status,
        message: data?.message || "Something went wrong",
        errors: data?.errors,
      };
    }

    return {
      success: false,
      statusCode: status || 500,
      message: "Something went wrong",
    };
  }
};
