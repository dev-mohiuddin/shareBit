import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AlertCircle,
  Calculator,
  CalendarDays,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  WandSparkles,
} from "lucide-react";
import {
  useCreateAssetExpenseMutation,
  useCreateAssetProfitMutation,
  useCreateProfitLedgerAdjustmentMutation,
  useGetAssetExpensesQuery,
  useGetAssetMonthPnlQuery,
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
  calculateExpenseLineTotal,
  calculateExpenseTotal,
  formatCurrency,
  formatDate,
  formatDateTime,
  getDaysInMonth,
  getMonthEndDate,
  parseMonthKey,
  sumPaymentsUntilDate,
  toMonthKeyFromDateTime,
} from "@/lib/adminFinance";

const getInvestorLabel = (assignedUser) => {
  if (!assignedUser) return "Company Reserve";
  if (typeof assignedUser === "string") return assignedUser;
  const name = `${assignedUser.firstName || ""} ${assignedUser.lastName || ""}`.trim();
  return name || assignedUser.email || "Investor";
};

const getLocalDateTimeValue = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const createExpenseLine = () => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  itemName: "",
  description: "",
  quantity: 1,
  unitCost: "",
});

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

  const [expenseVendorName, setExpenseVendorName] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseNote, setExpenseNote] = useState("");
  const [expenseDateTime, setExpenseDateTime] = useState(getLocalDateTimeValue());
  const [expenseLineItems, setExpenseLineItems] = useState([createExpenseLine()]);

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

  const {
    data: lifetimeSummaryResponse,
    isFetching: isFetchingLifetimeSummary,
    refetch: refetchLifetimeSummary,
  } = useGetProfitSummaryQuery(
    activeAssetId ? { assetId: activeAssetId } : null,
    {
      skip: !activeAssetId,
    }
  );

  const {
    data: monthlySummaryResponse,
    isFetching: isFetchingMonthlySummary,
    refetch: refetchMonthlySummary,
  } = useGetProfitSummaryQuery(
    activeAssetId && monthIsValid ? { assetId: activeAssetId, monthKey } : null,
    {
      skip: !activeAssetId || !monthIsValid,
    }
  );

  const lifetimeSummary = lifetimeSummaryResponse?.data || {};
  const monthlySummary = monthlySummaryResponse?.data || {};

  const lifetimeInvestorCurrent =
    lifetimeSummary.currentInvestorEntitlement ?? lifetimeSummary.userProfit ?? 0;
  const monthlyInvestorCurrent =
    monthlySummary.currentInvestorEntitlement ?? monthlySummary.userProfit ?? 0;
  const lifetimeCompanyCurrent =
    lifetimeSummary.currentCompanyEntitlement ?? lifetimeSummary.companyProfit ?? 0;
  const monthlyCompanyCurrent =
    monthlySummary.currentCompanyEntitlement ?? monthlySummary.companyProfit ?? 0;

  const formatMonthlyCardValue = (value) => {
    if (!monthIsValid) return "-";
    if (isFetchingMonthlySummary) return "...";
    return formatCurrency(value || 0);
  };

  const {
    data: profitEntriesData,
    isFetching: isFetchingEntries,
    refetch: refetchEntries,
  } = useGetAssetProfitEntriesQuery(
    { assetId: activeAssetId, monthKey },
    { skip: !activeAssetId || !monthIsValid }
  );

  const {
    data: expenseEntriesResponse,
    isFetching: isFetchingExpenses,
    refetch: refetchExpenses,
  } = useGetAssetExpensesQuery(
    { assetId: activeAssetId, monthKey },
    { skip: !activeAssetId || !monthIsValid }
  );

  const {
    data: assetMonthPnlResponse,
    isFetching: isFetchingMonthPnl,
    refetch: refetchMonthPnl,
  } = useGetAssetMonthPnlQuery(
    { assetId: activeAssetId, monthKey },
    { skip: !activeAssetId || !monthIsValid }
  );

  const [fetchSharePayments] = useLazyGetSharePaymentsQuery();
  const [createAssetProfit, { isLoading: isSubmittingProfit }] = useCreateAssetProfitMutation();
  const [createAssetExpense, { isLoading: isSubmittingExpense }] = useCreateAssetExpenseMutation();
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
    syncPayments(shareAccounts);
  }, [shareAccounts, syncPayments]);

  const refreshWorkspace = useCallback(async () => {
    if (activeAssetId) {
      const result = await refetchShares();
      const latestShares = result?.data?.data || [];
      await syncPayments(latestShares);
    }

    if (activeAssetId) {
      await refetchLifetimeSummary();
    }

    if (activeAssetId && monthIsValid) {
      await refetchMonthlySummary();
    }

    if (activeAssetId && monthIsValid) {
      await Promise.all([refetchEntries(), refetchExpenses(), refetchMonthPnl()]);
    }
  }, [
    activeAssetId,
    monthIsValid,
    refetchEntries,
    refetchExpenses,
    refetchLifetimeSummary,
    refetchMonthPnl,
    refetchMonthlySummary,
    refetchShares,
    syncPayments,
  ]);

  const parsedAmount = Number(profitAmount) || 0;
  const profitEntries = profitEntriesData?.data || [];
  const expenseEntries = expenseEntriesResponse?.data || [];
  const monthPnl = assetMonthPnlResponse?.data || null;

  const signedGrossProfit = useMemo(
    () =>
      profitEntries.reduce((sum, entry) => {
        const amount = Number(entry.amount) || 0;
        return sum + (entry.type === "reversal" ? -Math.abs(amount) : amount);
      }, 0),
    [profitEntries]
  );

  const signedExpenseTotal = useMemo(
    () =>
      expenseEntries.reduce((sum, entry) => {
        const amount = Number(entry.totalAmount) || 0;
        return sum + (entry.entryType === "reversal" ? -Math.abs(amount) : amount);
      }, 0),
    [expenseEntries]
  );

  const carryInLoss = Number(monthPnl?.carryInLoss) || 0;
  const persistedDistributableProfit = Number(monthPnl?.distributableProfit) || 0;
  const persistedCarryOutLoss = Number(monthPnl?.carryOutLoss) || 0;

  const grossForPreview = parsedAmount > 0 ? parsedAmount : signedGrossProfit;
  const expenseForPreview = Math.max(signedExpenseTotal, 0);
  const previewDistributableProfit = Math.max(grossForPreview - expenseForPreview - carryInLoss, 0);
  const previewCarryOutLoss = Math.max(carryInLoss + expenseForPreview - grossForPreview, 0);

  const previewRows = useMemo(() => {
    if (!selectedAsset || !daysInMonth || !monthEndDate) return [];

    return shareAccounts
      .map((share) => {
        const payments = paymentMap[share._id] || [];
        const totalPaidUntilMonthEnd = sumPaymentsUntilDate(payments, monthEndDate);
        const result = calculateDailyShareProfitPreview({
          monthlyProfit: previewDistributableProfit,
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
  }, [
    daysInMonth,
    monthEndDate,
    paymentMap,
    previewDistributableProfit,
    selectedAsset,
    shareAccounts,
  ]);

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

  const expenseTotal = useMemo(() => calculateExpenseTotal(expenseLineItems), [expenseLineItems]);
  const expenseMonthKey = toMonthKeyFromDateTime(expenseDateTime);

  const updateExpenseLine = (lineId, key, value) => {
    setExpenseLineItems((prev) =>
      prev.map((line) => (line.id === lineId ? { ...line, [key]: value } : line))
    );
  };

  const addExpenseLine = () => {
    setExpenseLineItems((prev) => [...prev, createExpenseLine()]);
  };

  const removeExpenseLine = (lineId) => {
    setExpenseLineItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((line) => line.id !== lineId);
    });
  };

  const resetExpenseForm = () => {
    setExpenseVendorName("");
    setExpenseDescription("");
    setExpenseNote("");
    setExpenseDateTime(getLocalDateTimeValue());
    setExpenseLineItems([createExpenseLine()]);
  };

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

      setProfitAmount("");
      await refreshWorkspace();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submit failed",
        description: error?.data?.message || "Could not record monthly profit.",
      });
    }
  };

  const handleSubmitExpense = async () => {
    if (!activeAssetId) {
      toast({
        variant: "destructive",
        title: "Asset required",
        description: "Select an asset before recording expense.",
      });
      return;
    }

    if (!expenseVendorName.trim()) {
      toast({
        variant: "destructive",
        title: "Vendor required",
        description: "Please provide vendor name.",
      });
      return;
    }

    const expenseDate = new Date(expenseDateTime);
    if (Number.isNaN(expenseDate.getTime())) {
      toast({
        variant: "destructive",
        title: "Invalid expense date",
        description: "Provide a valid expense date and time.",
      });
      return;
    }

    let normalizedLineItems;
    try {
      normalizedLineItems = expenseLineItems.map((line, index) => {
        const itemName = line.itemName.trim();
        const quantity = Number(line.quantity);
        const unitCost = Number(line.unitCost);

        if (!itemName) {
          throw new Error(`Line #${index + 1}: Item name is required.`);
        }
        if (!Number.isFinite(quantity) || quantity <= 0) {
          throw new Error(`Line #${index + 1}: Quantity must be greater than zero.`);
        }
        if (!Number.isFinite(unitCost) || unitCost < 0) {
          throw new Error(`Line #${index + 1}: Unit cost cannot be negative.`);
        }

        return {
          itemName,
          description: line.description?.trim() || undefined,
          quantity,
          unitCost,
        };
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Invalid line item",
        description: error?.message || "Please review expense line items.",
      });
      return;
    }

    if (expenseTotal <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid expense",
        description: "Expense total must be greater than zero.",
      });
      return;
    }

    try {
      await createAssetExpense({
        assetId: activeAssetId,
        vendorName: expenseVendorName.trim(),
        description: expenseDescription.trim() || undefined,
        expenseDateTime: expenseDate.toISOString(),
        lineItems: normalizedLineItems,
        metadata: expenseNote.trim() ? { note: expenseNote.trim() } : undefined,
      }).unwrap();

      toast({
        title: "Expense recorded",
        description: "Asset expense has been added successfully.",
      });

      resetExpenseForm();
      if (expenseMonthKey && expenseMonthKey !== monthKey) {
        setMonthKey(expenseMonthKey);
      }

      await refreshWorkspace();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Expense submit failed",
        description: error?.data?.message || "Could not record expense.",
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
      await refreshWorkspace();
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
              Maintain gross profit, expense invoices, net carry-forward, and share-wise distribution in one
              workspace.
            </p>
          </div>
          <Badge variant="secondary" className="w-fit">
            <CalendarDays className="mr-2 h-4 w-4" />
            Month: {monthKey}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Select Asset</CardTitle>
            <CardDescription>All stats and tables below follow this selected asset.</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Select Month</CardTitle>
            <CardDescription>Cards show lifetime plus selected month values.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="month"
              value={monthKey}
              onChange={(event) => setMonthKey(event.target.value)}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Gross Profit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold">
              {isFetchingLifetimeSummary ? "..." : formatCurrency(lifetimeSummary.totalInput || 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              In this month: {formatMonthlyCardValue(monthlySummary.totalInput)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Expense</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold">
              {isFetchingLifetimeSummary ? "..." : formatCurrency(lifetimeSummary.totalExpense || 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              In this month: {formatMonthlyCardValue(monthlySummary.totalExpense)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Net Profit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold">
              {isFetchingLifetimeSummary ? "..." : formatCurrency(lifetimeSummary.netProfit || 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              In this month: {formatMonthlyCardValue(monthlySummary.netProfit)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Distributed To Investors (Current)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold">
              {isFetchingLifetimeSummary ? "..." : formatCurrency(lifetimeInvestorCurrent)}
            </p>
            <p className="text-xs text-muted-foreground">
              In this month: {formatMonthlyCardValue(monthlyInvestorCurrent)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Company Profit (Current)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold">
              {isFetchingLifetimeSummary ? "..." : formatCurrency(lifetimeCompanyCurrent)}
            </p>
            <p className="text-xs text-muted-foreground">
              In this month: {formatMonthlyCardValue(monthlyCompanyCurrent)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Submit Monthly Profit</CardTitle>
            <CardDescription>
              Daily per-share base = distributable profit / total shares / days in month.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1 rounded-md border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Selected Asset</p>
                <p className="font-semibold">{selectedAsset?.name || "-"}</p>
              </div>
              <div className="space-y-1 rounded-md border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Selected Month</p>
                <p className="font-semibold">{monthKey || "-"}</p>
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

            <div className="grid gap-2 rounded-lg border bg-muted/20 p-3 text-sm sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span>Gross for selected month</span>
                <span className="font-semibold">{formatCurrency(grossForPreview)}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span>Expense for selected month</span>
                <span className="font-semibold">{formatCurrency(expenseForPreview)}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span>Carry-in loss</span>
                <span className="font-semibold">{formatCurrency(carryInLoss)}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span>Preview carry-out</span>
                <span className="font-semibold">{formatCurrency(previewCarryOutLoss)}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2 sm:col-span-2">
                <span>Distributable (preview)</span>
                <span className="font-semibold">{formatCurrency(previewDistributableProfit)}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2 sm:col-span-2">
                <span>Persisted statement</span>
                <span className="font-semibold">
                  {isFetchingMonthPnl
                    ? "..."
                    : `${formatCurrency(persistedDistributableProfit)} distributable, ${formatCurrency(
                        persistedCarryOutLoss
                      )} carry-out`}
                </span>
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
            <CardTitle>Add Asset Expense</CardTitle>
            <CardDescription>
              Invoice-style dynamic line items. Net profit automatically reflects total expense.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Vendor Name</Label>
                <Input
                  value={expenseVendorName}
                  onChange={(event) => setExpenseVendorName(event.target.value)}
                  placeholder="Vendor / Supplier"
                />
              </div>
              <div className="space-y-2">
                <Label>Expense Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={expenseDateTime}
                  onChange={(event) => setExpenseDateTime(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={expenseDescription}
                onChange={(event) => setExpenseDescription(event.target.value)}
                placeholder="Expense context or purchase description"
              />
            </div>

            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <Label>Invoice Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addExpenseLine}>
                  <Plus className="mr-2 h-4 w-4" /> Add line
                </Button>
              </div>

              <div className="space-y-3">
                {expenseLineItems.map((line) => (
                  <div key={line.id} className="rounded-md border p-3">
                    <div className="grid gap-3 md:grid-cols-[1.1fr,1fr,0.7fr,0.9fr,auto]">
                      <Input
                        value={line.itemName}
                        onChange={(event) => updateExpenseLine(line.id, "itemName", event.target.value)}
                        placeholder="Item name"
                      />
                      <Input
                        value={line.description || ""}
                        onChange={(event) =>
                          updateExpenseLine(line.id, "description", event.target.value)
                        }
                        placeholder="Item details"
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.quantity}
                        onChange={(event) => updateExpenseLine(line.id, "quantity", event.target.value)}
                        placeholder="Qty"
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.unitCost}
                        onChange={(event) => updateExpenseLine(line.id, "unitCost", event.target.value)}
                        placeholder="Unit cost"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeExpenseLine(line.id)}
                        disabled={expenseLineItems.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-2 text-right text-sm font-medium text-muted-foreground">
                      Line total: {formatCurrency(calculateExpenseLineTotal(line))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Note (optional)</Label>
                <Textarea
                  value={expenseNote}
                  onChange={(event) => setExpenseNote(event.target.value)}
                  placeholder="Internal note"
                />
              </div>
              <div className="space-y-2">
                <Label>Auto Total</Label>
                <div className="rounded-md border bg-muted/30 p-3 text-lg font-semibold">
                  {formatCurrency(expenseTotal)}
                </div>
                <p className="text-xs text-muted-foreground">Month key: {expenseMonthKey || "-"}</p>
              </div>
            </div>

            <Button onClick={handleSubmitExpense} disabled={isSubmittingExpense}>
              {isSubmittingExpense ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Save Expense
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
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

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recorded Expense Entries</CardTitle>
            <CardDescription>Entries already submitted for selected asset and month.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseEntries.map((entry) => (
                    <TableRow key={entry._id}>
                      <TableCell>
                        <Badge variant={entry.entryType === "expense" ? "default" : "secondary"}>
                          {entry.entryType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(entry.totalAmount)}</TableCell>
                      <TableCell>{entry.vendorName || "-"}</TableCell>
                      <TableCell>{entry.lineItems?.length || 0}</TableCell>
                      <TableCell>{formatDateTime(entry.expenseDateTime)}</TableCell>
                    </TableRow>
                  ))}

                  {expenseEntries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-16 text-center text-sm text-muted-foreground">
                        {isFetchingExpenses ? "Loading expenses..." : "No expense entries found."}
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
      </div>

      <Alert>
        <Calculator className="h-4 w-4" />
        <AlertTitle>Formula Alignment</AlertTitle>
        <AlertDescription>
          Preview mirrors backend rule: distributable profit = gross profit - expense - carry-in loss.
          Then daily share profit = distributable profit / total shares / days in month, and user ratio =
          min(total paid by cutoff date / share price, 1).
        </AlertDescription>
      </Alert>
    </div>
  );
};
