import { API, handleRequest } from "@/lib/api";

export const getAuditLogs = async () => {
  return handleRequest(() => API.get("/api/v1/audit-logs"));
};
