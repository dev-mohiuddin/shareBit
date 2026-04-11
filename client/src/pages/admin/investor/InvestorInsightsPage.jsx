import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, Loader2, RefreshCcw, Users, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  useGetAssetsQuery,
  useGetShareAccountsByAssetQuery,
  useLazyGetSharePaymentsQuery,
} from "@/features/api/apiSlice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getSharePaymentMetrics,
  sumPaymentsUntilDate,
} from "@/lib/adminFinance";

const getInvestorIdentity = (assignedUser) => {
  if (!assignedUser) return null;
  if (typeof assignedUser === "string") {
    return {
      id: assignedUser,
      name: assignedUser,
      email: "-",
    };
  }

  const name = `${assignedUser.firstName || ""} ${assignedUser.lastName || ""}`.trim();
  return {
    id: assignedUser._id || assignedUser.email,
    name: name || assignedUser.email || "Investor",
    email: assignedUser.email || "-",
  };
};

export const InvestorInsightsPage = () => {
  const { data: assetsResponse } = useGetAssetsQuery();
  const assets = useMemo(() => assetsResponse?.data || [], [assetsResponse?.data]);

  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [paymentMap, setPaymentMap] = useState({});
  const [isSyncingPayments, setIsSyncingPayments] = useState(false);
  const [selectedInvestorId, setSelectedInvestorId] = useState("");

  const activeAssetId = selectedAssetId || assets[0]?._id || "";

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset._id === activeAssetId) || null,
    [activeAssetId, assets]
  );

  const {
    data: shareAccountsResponse,
    isFetching: isFetchingShares,
    refetch: refetchShares,
  } = useGetShareAccountsByAssetQuery(activeAssetId, { skip: !activeAssetId });

  const shareAccounts = useMemo(() => shareAccountsResponse?.data || [], [shareAccountsResponse?.data]);
  const [fetchSharePayments] = useLazyGetSharePaymentsQuery();

  const syncPayments = useCallback(
    async (shares) => {
      if (!Array.isArray(shares) || shares.length === 0) {
        setPaymentMap({});
        return;
      }

      setIsSyncingPayments(true);
      const entries = await Promise.all(
        shares.map(async (share) => {
          if (!share.assignedUserId) return [share._id, []];
          try {
            const response = await fetchSharePayments(share._id, true).unwrap();
            return [share._id, response?.data || []];
          } catch {
            return [share._id, []];
          }
        })
      );

      const nextMap = {};
      entries.forEach(([shareId, payments]) => {
        nextMap[shareId] = payments;
      });
      setPaymentMap(nextMap);
      setIsSyncingPayments(false);
    },
    [fetchSharePayments]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    syncPayments(shareAccounts);
  }, [shareAccounts, syncPayments]);

  const investorRows = useMemo(() => {
    const sharePrice = selectedAsset?.sharePrice || 0;
    const map = new Map();

    shareAccounts.forEach((share) => {
      if (!share.assignedUserId) return;

      const identity = getInvestorIdentity(share.assignedUserId);
      if (!identity) return;

      const payments = paymentMap[share._id] || [];
      const paidAmount = sumPaymentsUntilDate(payments, new Date());
      const metrics = getSharePaymentMetrics({ paidAmount, sharePrice });

      if (!map.has(identity.id)) {
        map.set(identity.id, {
          id: identity.id,
          name: identity.name,
          email: identity.email,
          shareCount: 0,
          fullyPaidShares: 0,
          totalPaid: 0,
          totalContract: 0,
          averageOwnership: 0,
          ownershipAccumulator: 0,
          latestPaymentAt: null,
        });
      }

      const row = map.get(identity.id);
      row.shareCount += 1;
      row.totalPaid += metrics.paidAmount;
      row.totalContract += sharePrice;
      row.ownershipAccumulator += metrics.ownershipPercentage;
      if (metrics.isFullyPaid) row.fullyPaidShares += 1;

      const latestSharePayment = payments[payments.length - 1];
      if (latestSharePayment?.paidAt) {
        const paidAt = new Date(latestSharePayment.paidAt).toISOString();
        if (!row.latestPaymentAt || paidAt > row.latestPaymentAt) {
          row.latestPaymentAt = paidAt;
        }
      }
    });

    const rows = Array.from(map.values()).map((row) => ({
      ...row,
      averageOwnership: row.shareCount > 0 ? Number((row.ownershipAccumulator / row.shareCount).toFixed(2)) : 0,
      paymentRatio: row.totalContract > 0 ? Number(((row.totalPaid / row.totalContract) * 100).toFixed(2)) : 0,
    }));

    return rows.sort((a, b) => b.totalPaid - a.totalPaid);
  }, [paymentMap, selectedAsset?.sharePrice, shareAccounts]);

  const activeInvestorId = selectedInvestorId || investorRows[0]?.id || "";

  const selectedInvestor = useMemo(
    () => investorRows.find((row) => row.id === activeInvestorId) || null,
    [activeInvestorId, investorRows]
  );

  const chartData = useMemo(
    () =>
      investorRows.slice(0, 8).map((row) => ({
        name: row.name,
        paid: Number(row.totalPaid.toFixed(2)),
        ownership: row.averageOwnership,
      })),
    [investorRows]
  );

  const summary = useMemo(() => {
    const totalPaid = investorRows.reduce((sum, row) => sum + row.totalPaid, 0);
    const totalContract = investorRows.reduce((sum, row) => sum + row.totalContract, 0);
    const avgOwnership = investorRows.length
      ? Number(
          (
            investorRows.reduce((sum, row) => sum + row.averageOwnership, 0) /
            investorRows.length
          ).toFixed(2)
        )
      : 0;

    return {
      investorCount: investorRows.length,
      totalPaid,
      totalContract,
      avgOwnership,
    };
  }, [investorRows]);

  const recentPayments = useMemo(() => {
    const rows = [];

    shareAccounts.forEach((share) => {
      const payments = paymentMap[share._id] || [];
      const identity = getInvestorIdentity(share.assignedUserId);
      if (!identity) return;

      payments.forEach((payment) => {
        rows.push({
          id: payment._id,
          investorName: identity.name,
          shareNumber: share.shareNumber,
          amount: payment.amount,
          paidAt: payment.paidAt,
          createdAt: payment.createdAt,
        });
      });
    });

    return rows
      .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
      .slice(0, 10);
  }, [paymentMap, shareAccounts]);

  const refreshAll = async () => {
    const result = await refetchShares();
    const latest = result?.data?.data || [];
    await syncPayments(latest);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-slate-50">
        <p className="text-sm text-slate-300">Portfolio Intelligence</p>
        <h1 className="mt-1 text-2xl font-semibold">Investor Insights</h1>
        <p className="mt-2 text-sm text-slate-300">
          Analyze investor contribution, payment coverage, and ownership maturity per asset.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Investors</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-2xl font-semibold">
            {summary.investorCount}
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-2xl font-semibold">
            {formatCurrency(summary.totalPaid)}
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Contract Value</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-2xl font-semibold">
            {formatCurrency(summary.totalContract)}
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Avg Ownership</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-2xl font-semibold">
            {summary.avgOwnership}%
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Investor Contribution Breakdown</CardTitle>
          <CardDescription>
            Data reflects recorded share payments up to now for the selected asset.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[260px,auto]">
            <Select value={activeAssetId} onValueChange={setSelectedAssetId}>
              <SelectTrigger>
                <SelectValue placeholder="Select asset" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((asset) => (
                  <SelectItem key={asset._id} value={asset._id}>
                    {asset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={refreshAll}
                disabled={!activeAssetId || isFetchingShares || isSyncingPayments}
              >
                <RefreshCcw className={`mr-2 h-4 w-4 ${isFetchingShares || isSyncingPayments ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="h-72 rounded-lg border bg-muted/20 p-3">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {isFetchingShares || isSyncingPayments ? "Loading chart..." : "No investor payment data available."}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: 8, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="paid" fill="#0f172a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Investor Table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investor</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Coverage</TableHead>
                    <TableHead>Ownership</TableHead>
                    <TableHead>Latest Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investorRows.map((row) => (
                    <TableRow
                      key={row.id}
                      onClick={() => setSelectedInvestorId(row.id)}
                      className={`cursor-pointer ${row.id === activeInvestorId ? "bg-muted/60" : ""}`}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{row.name}</p>
                          <p className="text-xs text-muted-foreground">{row.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{row.shareCount}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(row.totalPaid)}</TableCell>
                      <TableCell>{row.paymentRatio}%</TableCell>
                      <TableCell>{row.averageOwnership}%</TableCell>
                      <TableCell>{formatDate(row.latestPaymentAt)}</TableCell>
                    </TableRow>
                  ))}

                  {investorRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                        {isFetchingShares || isSyncingPayments ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading investors...
                          </span>
                        ) : (
                          "No investor assignments found for this asset."
                        )}
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
            <CardTitle className="text-lg">Selected Investor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedInvestor ? (
              <>
                <div>
                  <p className="text-lg font-semibold">{selectedInvestor.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedInvestor.email}</p>
                </div>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between rounded-md border p-2">
                    <span>Shares Assigned</span>
                    <span className="font-medium">{selectedInvestor.shareCount}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-2">
                    <span>Fully Paid Shares</span>
                    <span className="font-medium">{selectedInvestor.fullyPaidShares}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-2">
                    <span>Total Paid</span>
                    <span className="font-medium">{formatCurrency(selectedInvestor.totalPaid)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-2">
                    <span>Coverage</span>
                    <span className="font-medium">{selectedInvestor.paymentRatio}%</span>
                  </div>
                </div>
                <Badge variant="secondary">
                  Last payment: {formatDate(selectedInvestor.latestPaymentAt, "No payment yet")}
                </Badge>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Select an investor row to see details.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor</TableHead>
                  <TableHead>Share</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead>Recorded At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.investorName}</TableCell>
                    <TableCell>#{row.shareNumber}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(row.amount)}</TableCell>
                    <TableCell>{formatDate(row.paidAt)}</TableCell>
                    <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                  </TableRow>
                ))}
                {recentPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-16 text-center text-sm text-muted-foreground">
                      No payment activity yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
