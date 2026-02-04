import { getAuditLogs } from "#repositories/auditLogRepository.js";

export const listAuditLogs = async () => {
  return getAuditLogs();
};
