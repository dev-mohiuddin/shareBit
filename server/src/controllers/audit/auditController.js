import { catchAsync } from "#utils/catchAsync.js";
import { listAuditLogs } from "#services/audit/auditService.js";

export const getAuditLogsController = catchAsync(async (req, res) => {
  const logs = await listAuditLogs();
  res.success({ data: logs, message: "Audit logs retrieved" });
});
