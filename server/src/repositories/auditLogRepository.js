import { AuditLog } from "#models/auditLogModel.js";

export const createAuditLog = async (data) => {
  return AuditLog.create(data);
};

export const getAuditLogs = async () => {
  return AuditLog.find().sort({ createdAt: -1 }).exec();
};
