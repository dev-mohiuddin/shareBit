import { useMemo } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BellRing,
  ClipboardList,
  CreditCard,
  RefreshCcw,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import {
  useGetAllWithdrawalsQuery,
  useGetAssetsQuery,
  useGetAuditLogsQuery,
  useGetProfitSummaryQuery,
  useGetUsersQuery,
} from "@/features/api/apiSlice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/adminFinance";

const getWithdrawalBadgeVariant = (status) => {
  if (status === "requested") return "outline";
  if (status === "approved") return "secondary";
  if (status === "rejected") return "destructive";
  return "default";
};

export const AdminPanelPage = () => {
  const monthKey = format(new Date(), "yyyy-MM");

  const { data: profitSummary, isFetching: loadingSummary } = useGetProfitSummaryQuery(monthKey);
  const { data: assetsResponse, isFetching: loadingAssets, refetch: refetchAssets } = useGetAssetsQuery();
  const { data: usersResponse, isFetching: loadingUsers } = useGetUsersQuery();
  const {
    data: withdrawalsResponse,
    isFetching: loadingWithdrawals,
    refetch: refetchWithdrawals,
  } = useGetAllWithdrawalsQuery();
  const { data: auditResponse, isFetching: loadingAudit, refetch: refetchAudit } = useGetAuditLogsQuery();

  const assets = useMemo(() => assetsResponse?.data || [], [assetsResponse?.data]);
  const users = useMemo(() => usersResponse?.data || [], [usersResponse?.data]);
  const withdrawals = useMemo(() => withdrawalsResponse?.data || [], [withdrawalsResponse?.data]);
  const auditLogs = useMemo(() => auditResponse?.data || [], [auditResponse?.data]);

  const overview = useMemo(() => {
    const totalShares = assets.reduce((sum, asset) => sum + (asset.totalShares || 0), 0);
    const availableShares = assets.reduce((sum, asset) => {
      const fallback = Math.max((asset.totalShares || 0) - (asset.allocatedShares || 0), 0);
      return sum + (asset.availableShares ?? fallback);
    }, 0);

    const allocatedShares = Math.max(totalShares - availableShares, 0);
    const pendingWithdrawals = withdrawals.filter((item) => item.status === "requested");
    const pendingWithdrawalAmount = pendingWithdrawals.reduce((sum, item) => sum + (item.amount || 0), 0);

    return {
      totalShares,
      allocatedShares,
      availableShares,
      pendingCount: pendingWithdrawals.length,
      pendingWithdrawalAmount,
    };
  }, [assets, withdrawals]);

  const allocationChartData = useMemo(
    () =>
      assets.slice(0, 8).map((asset) => {
        const available = asset.availableShares ?? Math.max(asset.totalShares - (asset.allocatedShares || 0), 0);
        const allocated = Math.max((asset.totalShares || 0) - available, 0);

        return {
          name: asset.name,
          allocated,
          available,
        };
      }),
    [assets]
  );

  const recentWithdrawals = useMemo(
    () => [...withdrawals].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6),
    [withdrawals]
  );

  const recentAudit = useMemo(
    () => [...auditLogs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 7),
    [auditLogs]
  );

  const quickStats = [
    {
      label: `Profit Input (${monthKey})`,
      value: formatCurrency(profitSummary?.data?.totalInput || 0),
      icon: <BarChart3 className="h-4 w-4" />,
      loading: loadingSummary,
    },
    {
      label: `Distributed (${monthKey})`,
      value: formatCurrency(profitSummary?.data?.totalDistributed || 0),
      icon: <CreditCard className="h-4 w-4" />,
      loading: loadingSummary,
    },
    {
      label: "User Profit",
      value: formatCurrency(profitSummary?.data?.userProfit || 0),
      icon: <Users className="h-4 w-4" />,
      loading: loadingSummary,
    },
    {
      label: "Company Profit",
      value: formatCurrency(profitSummary?.data?.companyProfit || 0),
      icon: <ShieldCheck className="h-4 w-4" />,
      loading: loadingSummary,
    },
    {
      label: "Investors",
      value: loadingUsers ? "..." : users.length,
      icon: <Users className="h-4 w-4" />,
      loading: loadingUsers,
    },
    {
      label: "Pending Withdrawals",
      value: loadingWithdrawals ? "..." : overview.pendingCount,
      icon: <Wallet className="h-4 w-4" />,
      loading: loadingWithdrawals,
    },
  ];

  const refreshAll = async () => {
    await Promise.all([refetchAssets(), refetchWithdrawals(), refetchAudit()]);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-700 p-6 text-slate-50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-slate-300">Control Center</p>
            <h1 className="text-2xl font-semibold tracking-tight">Admin Operations Dashboard</h1>
            <p className="mt-2 text-sm text-slate-300">
              Monitor payout risk, share allocation, and investor activity from a single command surface.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="secondary">
              <Link to="/admin/payments">
                Share Payments
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild>
              <Link to="/admin/profit">
                Profit Workspace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="border-slate-400 text-slate-50 hover:bg-slate-800" onClick={refreshAll}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quickStats.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                {item.icon}
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{item.loading ? "Loading..." : item.value}</CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation Snapshot</CardTitle>
            <CardDescription>Allocated vs available shares across active assets.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-72 rounded-lg border bg-muted/20 p-3">
              {loadingAssets ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading chart...</div>
              ) : allocationChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No assets found.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={allocationChartData} margin={{ top: 8, right: 12, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="allocated" fill="#0f172a" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="available" fill="#64748b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid gap-2 text-sm sm:grid-cols-3">
              <div className="rounded-md border px-3 py-2">
                <p className="text-muted-foreground">Total Shares</p>
                <p className="font-semibold">{overview.totalShares}</p>
              </div>
              <div className="rounded-md border px-3 py-2">
                <p className="text-muted-foreground">Allocated</p>
                <p className="font-semibold">{overview.allocatedShares}</p>
              </div>
              <div className="rounded-md border px-3 py-2">
                <p className="text-muted-foreground">Available</p>
                <p className="font-semibold">{overview.availableShares}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Action Queue</CardTitle>
            <CardDescription>Time-sensitive operations that need admin attention.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="inline-flex items-center gap-2">
                <BellRing className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Pending withdrawals</p>
                  <p className="text-xs text-muted-foreground">Needs status updates</p>
                </div>
              </div>
              <Badge>{overview.pendingCount}</Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="inline-flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Pending payout amount</p>
                  <p className="text-xs text-muted-foreground">Requested but not paid</p>
                </div>
              </div>
              <p className="font-semibold">{formatCurrency(overview.pendingWithdrawalAmount)}</p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="inline-flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Audit events</p>
                  <p className="text-xs text-muted-foreground">Latest platform changes</p>
                </div>
              </div>
              <Badge variant="secondary">{recentAudit.length}</Badge>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button asChild variant="outline">
                <Link to="/admin/withdrawals">Go to Withdrawals</Link>
              </Button>
              <Button asChild>
                <Link to="/admin/audit">Open Audit Logs</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent Withdrawal Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentWithdrawals.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        {item.userId?.firstName
                          ? `${item.userId.firstName} ${item.userId.lastName}`
                          : item.userId?.email || "Investor"}
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(item.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={getWithdrawalBadgeVariant(item.status)}>{item.status}</Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                    </TableRow>
                  ))}

                  {recentWithdrawals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-16 text-center text-sm text-muted-foreground">
                        {loadingWithdrawals ? "Loading withdrawals..." : "No recent withdrawals."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Audit Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAudit.map((log) => (
              <div key={log._id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.actorRole || "system"} on {log.entity || "entity"}
                    </p>
                  </div>
                  <Badge variant="outline">{log.entity || "audit"}</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</p>
              </div>
            ))}

            {recentAudit.length === 0 && (
              <div className="rounded-md border p-3 text-sm text-muted-foreground">
                {loadingAudit ? "Loading audit activity..." : "No audit records found."}
              </div>
            )}

            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/audit">
                View Full Audit Log
                <ClipboardList className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
