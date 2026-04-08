import { useMemo } from "react";
import { Activity, Clock3, FileStack, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/dataTable";
import { useGetAuditLogsQuery } from "@/features/api/apiSlice";

const columns = [
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => <Badge variant="outline">{row.original.action}</Badge>,
  },
  { accessorKey: "entity", header: "Entity" },
  { accessorKey: "actorRole", header: "Actor Role" },
  { accessorKey: "time", header: "Timestamp" },
  { accessorKey: "entityId", header: "Entity Id" },
];

export const AuditLogsPage = () => {
  const { data, isLoading } = useGetAuditLogsQuery();
  const logs = data?.data || [];

  const rows = useMemo(
    () =>
      logs.map((log) => ({
        action: log.action,
        entity: log.entity,
        actorRole: log.actorRole || "system",
        time: new Date(log.createdAt).toLocaleString(),
        entityId: String(log.entityId || "-").slice(0, 16),
      })),
    [logs]
  );

  const summary = useMemo(() => {
    const entitySet = new Set(logs.map((log) => log.entity));
    const actionSet = new Set(logs.map((log) => log.action));
    return {
      total: logs.length,
      entities: entitySet.size,
      actions: actionSet.size,
      latest: logs[0]?.createdAt ? new Date(logs[0].createdAt).toLocaleString() : "-",
    };
  }, [logs]);

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h2 className="text-2xl font-semibold">Audit and Activity Monitor</h2>
        <p className="text-sm text-muted-foreground">
          Review operational events for governance, security, and reconciliation checks.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.total}</CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileStack className="h-4 w-4" />
              Entities Touched
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.entities}</CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              Action Types
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.actions}</CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock3 className="h-4 w-4" />
              Latest Event
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-medium">{summary.latest}</CardContent>
        </Card>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-lg">Audit Event Stream</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="rounded-md border border-border/60 p-6 text-center text-sm text-muted-foreground">
              Loading audit logs...
            </div>
          ) : (
            <DataTable columns={columns} data={rows} searchKey="action" />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
