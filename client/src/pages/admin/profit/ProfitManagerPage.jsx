import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AlertCircle,
  Calculator,
  CalendarDays,
  Loader2,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import {
  useCreateAssetProfitMutation,
  useCreateProfitLedgerAdjustmentMutation,
  useGetAssetProfitEntriesQuery,
  useGetAssetsQuery,
  useGetProfitSummaryQuery,
  useGetShareAccountsByAssetQuery,
  useLazyGetSharePaymentsQuery,
} from "@/features/api/apiSlice";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  calculateDailyShareProfitPreview,
  formatCurrency,
  formatDate,
  getDaysInMonth,
  getMonthEndDate,
  parseMonthKey,
  sumPaymentsUntilDate,
} from "@/lib/adminFinance";

const getInvestorLabel = (assignedUser) => {
  if (!assignedUser) return "Company Reserve";
  if (typeof assignedUser === "string") return assignedUser;
  const name = `${assignedUser.firstName || ""} ${assignedUser.lastName || ""}`.trim();
  return name || assignedUser.email || "Investor";
};

export const ProfitManagerPage = () => {
  const { toast } = useToast();
  const defaultMonth = format(new Date(), "yyyy-MM");

  const [monthKey, setMonthKey] = useState(defaultMonth);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [profitAmount, setProfitAmount] = useState("");

  const [paymentMap, setPaymentMap] = useState({});
  const [isSyncingPayments, setIsSyncingPayments] = useState(false);

  const [adjustmentShareId, setAdjustmentShareId] = useState("");
  const [adjustmentType, setAdjustmentType] = useState("adjustment");
  const [adjustmentDate, setAdjustmentDate] = useState(new Date().toISOString().slice(0, 10));
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  const { data: assetsResponse } = useGetAssetsQuery();
  const assets = useMemo(() => assetsResponse?.data || [], [assetsResponse?.data]);

  const activeAssetId = selectedAssetId || assets[0]?._id || "";

  const monthIsValid = !!parseMonthKey(monthKey);
  const daysInMonth = getDaysInMonth(monthKey);
  const monthEndDate = getMonthEndDate(monthKey);

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

  const { data: summaryData, isFetching: isFetchingSummary } = useGetProfitSummaryQuery(monthKey, {
    skip: !monthIsValid,
  });

  const { data: profitEntriesData, isFetching: isFetchingEntries } = useGetAssetProfitEntriesQuery(
    { assetId: activeAssetId, monthKey },
    { skip: !activeAssetId || !monthIsValid }
  );

  const [fetchSharePayments] = useLazyGetSharePaymentsQuery();
  const [createAssetProfit, { isLoading: isSubmittingProfit }] = useCreateAssetProfitMutation();
  const [createProfitLedgerAdjustment, { isLoading: isSubmittingAdjustment }] =
    useCreateProfitLedgerAdjustmentMutation();

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

  const parsedAmount = Number(profitAmount) || 0;

  const previewRows = useMemo(() => {
    if (!selectedAsset || !daysInMonth || !monthEndDate) return [];

    return shareAccounts
      .map((share) => {
        const payments = paymentMap[share._id] || [];
        const totalPaidUntilMonthEnd = sumPaymentsUntilDate(payments, monthEndDate);
        const result = calculateDailyShareProfitPreview({
          monthlyProfit: parsedAmount,
          totalShares: selectedAsset.totalShares,
          daysInMonth,
          totalPaid: totalPaidUntilMonthEnd,
          sharePrice: selectedAsset.sharePrice,
        });

        const userId =
          typeof share.assignedUserId === "string"
            ? share.assignedUserId
            : share.assignedUserId?._id || null;

        return {
          id: share._id,
          shareNumber: share.shareNumber,
          investorName: getInvestorLabel(share.assignedUserId),
          userId,
          totalPaidUntilMonthEnd,
          userRatio: result.userRatio,
          companyRatio: result.companyRatio,
          dailyUserProfit: result.userProfit,
          dailyCompanyProfit: result.companyProfit,
          dailyPerShare: result.dailyProfitPerShare,
          isUnassigned: !share.assignedUserId,
        };
      })
      .sort((a, b) => a.shareNumber - b.shareNumber);
  }, [daysInMonth, monthEndDate, parsedAmount, paymentMap, selectedAsset, shareAccounts]);

  const previewSummary = useMemo(() => {
    const dailyUserTotal = previewRows.reduce((sum, row) => sum + row.dailyUserProfit, 0);
    const dailyCompanyTotal = previewRows.reduce((sum, row) => sum + row.dailyCompanyProfit, 0);
    const unassignedShares = previewRows.filter((row) => row.isUnassigned).length;
    const fullyPaidShares = previewRows.filter((row) => row.userRatio === 1).length;

    return {
      dailyUserTotal,
      dailyCompanyTotal,
      estimatedMonthlyUser: dailyUserTotal * (daysInMonth || 0),
      estimatedMonthlyCompany: dailyCompanyTotal * (daysInMonth || 0),
      unassignedShares,
      fullyPaidShares,
      dailyPerShare: previewRows[0]?.dailyPerShare || 0,
    };
  }, [daysInMonth, previewRows]);

  const splitChartData = useMemo(
    () => [
      { name: "Users", value: Number(previewSummary.estimatedMonthlyUser.toFixed(2)) },
      { name: "Company", value: Number(previewSummary.estimatedMonthlyCompany.toFixed(2)) },
    ],
    [previewSummary.estimatedMonthlyCompany, previewSummary.estimatedMonthlyUser]
  );

  const adjustmentShareOptions = useMemo(
    () => previewRows.filter((row) => !row.isUnassigned && row.userId),
    [previewRows]
  );

  const profitEntries = profitEntriesData?.data || [];

  const handleSubmitProfit = async () => {
    if (!activeAssetId) {
      toast({
        variant: "destructive",
        title: "Asset required",
        description: "Select an asset before submitting monthly profit.",
      });
      return;
    }

    if (!monthIsValid) {
      toast({
        variant: "destructive",
        title: "Invalid month",
        description: "Use YYYY-MM format for month key.",
      });
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Profit amount must be greater than zero.",
      });
      return;
    }

    try {
      await createAssetProfit({
        assetId: activeAssetId,
        monthKey,
        amount: parsedAmount,
      }).unwrap();

      toast({
        title: "Monthly profit recorded",
        description: "Distribution base has been saved successfully.",
      });
      await refetchShares();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submit failed",
        description: error?.data?.message || "Could not record monthly profit.",
      });
    }
  };

  const handleSubmitAdjustment = async () => {
    const amount = Number(adjustmentAmount);
    const selectedShare = adjustmentShareOptions.find((row) => row.id === adjustmentShareId);

    if (!selectedShare || !selectedShare.userId || !activeAssetId) {
      toast({
        variant: "destructive",
        title: "Share required",
        description: "Select an assigned share for adjustment.",
      });
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(adjustmentDate)) {
      toast({
        variant: "destructive",
        title: "Invalid date",
        description: "Use YYYY-MM-DD format for ledger date.",
      });
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Adjustment amount must be greater than zero.",
      });
      return;
    }

    try {
      await createProfitLedgerAdjustment({
        userId: selectedShare.userId,
        assetId: activeAssetId,
        shareAccountId: selectedShare.id,
        ledgerDate: adjustmentDate,
        amount,
        type: adjustmentType,
        metadata: adjustmentReason.trim()
          ? { reason: adjustmentReason.trim(), monthKey }
          : { monthKey },
      }).unwrap();

      toast({
        title: "Adjustment recorded",
        description: "Profit ledger adjustment has been applied.",
      });

      setAdjustmentAmount("");
      setAdjustmentReason("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Adjustment failed",
        description: error?.data?.message || "Could not create adjustment.",
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-700 p-6 text-slate-50">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-slate-300">Monthly Distribution Control</p>
            <h1 className="text-2xl font-semibold">Profit Management Workspace</h1>
            <p className="mt-2 text-sm text-slate-300">
              Profit split preview follows recorded payment amount and payment date rules before submission.
            </p>
          </div>
          <Badge variant="secondary" className="w-fit">
            <CalendarDays className="mr-2 h-4 w-4" />
            Month: {monthKey}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Input</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {isFetchingSummary ? "..." : formatCurrency(summaryData?.data?.totalInput || 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Distributed</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {isFetchingSummary ? "..." : formatCurrency(summaryData?.data?.totalDistributed || 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Estimated User Share</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(previewSummary.estimatedMonthlyUser)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Estimated Company Share</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(previewSummary.estimatedMonthlyCompany)}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Submit Monthly Profit</CardTitle>
            <CardDescription>
              Daily per-share base = monthly profit / total shares / days in month.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Asset</Label>
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
              </div>

              <div className="space-y-2">
                <Label>Month (YYYY-MM)</Label>
                <Input value={monthKey} onChange={(event) => setMonthKey(event.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Profit Amount</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={profitAmount}
                  onChange={(event) => setProfitAmount(event.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground">Days in month</p>
                <p className="font-semibold">{daysInMonth || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Daily profit / share</p>
                <p className="font-semibold">{formatCurrency(previewSummary.dailyPerShare)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Unassigned shares</p>
                <p className="font-semibold">{previewSummary.unassignedShares}</p>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Schedule Notice</AlertTitle>
              <AlertDescription>
                Wallet distribution is executed by backend daily job. This preview is analytical and mirrors the
                payment amount/date rule.
              </AlertDescription>
            </Alert>

            <Button onClick={handleSubmitProfit} disabled={isSubmittingProfit}>
              {isSubmittingProfit ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Save Monthly Profit
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Split Preview</CardTitle>
            <CardDescription>
              Estimated monthly split from current payment timeline up to month-end.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-56 rounded-lg border bg-muted/20 p-2">
              {splitChartData.every((item) => item.value === 0) ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Enter amount and valid month to view split preview.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={splitChartData} margin={{ top: 8, right: 12, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="#0f172a" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span>Daily user allocation</span>
                <span className="font-medium">{formatCurrency(previewSummary.dailyUserTotal)}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span>Daily company allocation</span>
                <span className="font-medium">{formatCurrency(previewSummary.dailyCompanyTotal)}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span>Fully paid shares</span>
                <span className="font-medium">{previewSummary.fullyPaidShares}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Share-Level Distribution Preview</CardTitle>
            <CardDescription>
              Paid amount is calculated using installments where paid date is on or before month-end.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Share</TableHead>
                    <TableHead>Holder</TableHead>
                    <TableHead>Paid by Month End</TableHead>
                    <TableHead>User Ratio</TableHead>
                    <TableHead>Daily User</TableHead>
                    <TableHead>Daily Company</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">#{row.shareNumber}</TableCell>
                      <TableCell>{row.investorName}</TableCell>
                      <TableCell>{formatCurrency(row.totalPaidUntilMonthEnd)}</TableCell>
                      <TableCell>{Math.round(row.userRatio * 100)}%</TableCell>
                      <TableCell>{formatCurrency(row.dailyUserProfit)}</TableCell>
                      <TableCell>{formatCurrency(row.dailyCompanyProfit)}</TableCell>
                    </TableRow>
                  ))}

                  {previewRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-20 text-center text-sm text-muted-foreground">
                        {isFetchingShares || isSyncingPayments
                          ? "Loading shares..."
                          : "No share accounts found for selected asset."}
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
            <CardTitle>Profit Adjustment Tool</CardTitle>
            <CardDescription>
              Create immutable adjustment/reversal entries for a specific user share.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Share / Investor</Label>
              <Select value={adjustmentShareId} onValueChange={setAdjustmentShareId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assigned share" />
                </SelectTrigger>
                <SelectContent>
                  {adjustmentShareOptions.map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      #{row.shareNumber} - {row.investorName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={adjustmentType} onValueChange={setAdjustmentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                    <SelectItem value="reversal">Reversal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ledger Date</Label>
                <Input type="date" value={adjustmentDate} onChange={(event) => setAdjustmentDate(event.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={adjustmentAmount}
                onChange={(event) => setAdjustmentAmount(event.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={adjustmentReason}
                onChange={(event) => setAdjustmentReason(event.target.value)}
                placeholder="Reason for manual adjustment"
              />
            </div>

            <Button onClick={handleSubmitAdjustment} disabled={isSubmittingAdjustment}>
              {isSubmittingAdjustment ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <WandSparkles className="mr-2 h-4 w-4" />
              )}
              Create Adjustment
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recorded Profit Entries</CardTitle>
          <CardDescription>Entries already submitted for selected asset and month.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profitEntries.map((entry) => (
                  <TableRow key={entry._id}>
                    <TableCell>
                      <Badge variant={entry.type === "base" ? "default" : "secondary"}>{entry.type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(entry.amount)}</TableCell>
                    <TableCell>{entry.monthKey}</TableCell>
                    <TableCell>{formatDate(entry.createdAt)}</TableCell>
                  </TableRow>
                ))}

                {profitEntries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-16 text-center text-sm text-muted-foreground">
                      {isFetchingEntries ? "Loading entries..." : "No profit entries found for this filter."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Calculator className="h-4 w-4" />
        <AlertTitle>Formula Alignment</AlertTitle>
        <AlertDescription>
          Preview mirrors backend rule: daily share profit = monthly profit / total shares / days in month,
          user ratio = min(total paid by cutoff date / share price, 1).
        </AlertDescription>
      </Alert>
    </div>
  );
};
