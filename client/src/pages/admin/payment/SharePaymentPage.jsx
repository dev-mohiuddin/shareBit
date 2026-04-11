import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  DollarSign,
  Loader2,
  PlusCircle,
  RefreshCcw,
  Search,
  UserPlus,
} from "lucide-react";
import {
  useAssignShareMutation,
  useGetAssetsQuery,
  useGetShareAccountsByAssetQuery,
  useGetUsersQuery,
  useLazyGetSharePaymentsQuery,
  useRecordSharePaymentMutation,
} from "@/features/api/apiSlice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getSharePaymentMetrics,
  sumPaymentsUntilDate,
} from "@/lib/adminFinance";

const toDateTimeLocal = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const statusOptions = [
  { label: "All status", value: "all" },
  { label: "Unassigned", value: "unassigned" },
  { label: "Unpaid", value: "unpaid" },
  { label: "Partial", value: "partial" },
  { label: "Fully Paid", value: "paid" },
];

const getInvestorName = (assignedUser) => {
  if (!assignedUser) return "Unassigned";
  if (typeof assignedUser === "string") return assignedUser;
  const name = `${assignedUser.firstName || ""} ${assignedUser.lastName || ""}`.trim();
  return name || assignedUser.email || "Investor";
};

const getRowPaymentStatus = ({ assignedUserId, metrics }) => {
  if (!assignedUserId) return "unassigned";
  if (metrics.paidAmount <= 0) return "unpaid";
  if (metrics.isFullyPaid) return "paid";
  return "partial";
};

const getStatusBadgeVariant = (status) => {
  if (status === "paid") return "default";
  if (status === "partial") return "secondary";
  return "outline";
};

export const SharePaymentPage = () => {
  const { toast } = useToast();

  const { data: assetsResponse } = useGetAssetsQuery();
  const assets = useMemo(() => assetsResponse?.data || [], [assetsResponse?.data]);

  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMap, setPaymentMap] = useState({});
  const [isSyncingPayments, setIsSyncingPayments] = useState(false);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [shareForAssignment, setShareForAssignment] = useState(null);
  const [selectedInvestorId, setSelectedInvestorId] = useState("");

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [shareForPayment, setShareForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(toDateTimeLocal());
  const [paymentNote, setPaymentNote] = useState("");

  const { data: usersResponse } = useGetUsersQuery();
  const users = useMemo(() => usersResponse?.data || [], [usersResponse?.data]);

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

  const [assignShare, { isLoading: isAssigning }] = useAssignShareMutation();
  const [recordSharePayment, { isLoading: isRecordingPayment }] = useRecordSharePaymentMutation();
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

  const investorOptions = useMemo(() => {
    return users.filter((user) => {
      const role = String(user?.roleName || "").toLowerCase();
      return !role || role.includes("invest") || role.includes("user");
    });
  }, [users]);

  const rows = useMemo(() => {
    const sharePrice = selectedAsset?.sharePrice || 0;

    return shareAccounts.map((share) => {
      const payments = paymentMap[share._id] || [];
      const paidAmount = sumPaymentsUntilDate(payments, new Date());
      const metrics = getSharePaymentMetrics({ paidAmount, sharePrice });
      const paymentStatus = getRowPaymentStatus({ assignedUserId: share.assignedUserId, metrics });

      return {
        id: share._id,
        shareNumber: share.shareNumber,
        investorName: getInvestorName(share.assignedUserId),
        assignedAt: share.assignedAt,
        paymentStatus,
        shareStatus: share.status,
        paidAmount: metrics.paidAmount,
        remainingAmount: metrics.remainingAmount,
        ownershipPercentage: metrics.ownershipPercentage,
        progressValue: Math.round(metrics.ratio * 100),
        payments,
        raw: share,
      };
    });
  }, [paymentMap, selectedAsset?.sharePrice, shareAccounts]);

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !term ||
        String(row.shareNumber).includes(term) ||
        row.investorName.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || row.paymentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [query, rows, statusFilter]);

  const summary = useMemo(() => {
    const totalShares = rows.length;
    const assignedShares = rows.filter((row) => row.paymentStatus !== "unassigned").length;
    const paidShares = rows.filter((row) => row.paymentStatus === "paid").length;
    const totalCollected = rows.reduce((sum, row) => sum + row.paidAmount, 0);
    const contractValue = totalShares * (selectedAsset?.sharePrice || 0);
    const outstanding = Math.max(contractValue - totalCollected, 0);

    return {
      totalShares,
      assignedShares,
      paidShares,
      totalCollected,
      contractValue,
      outstanding,
    };
  }, [rows, selectedAsset?.sharePrice]);

  const selectedShareDetails = useMemo(() => {
    if (!shareForPayment) return null;
    return rows.find((row) => row.id === shareForPayment.id) || shareForPayment;
  }, [rows, shareForPayment]);

  const resetPaymentForm = () => {
    setPaymentAmount("");
    setPaymentDate(toDateTimeLocal());
    setPaymentNote("");
  };

  const openAssignmentDialog = (row) => {
    setShareForAssignment(row);
    setSelectedInvestorId("");
    setAssignDialogOpen(true);
  };

  const openPaymentDialog = (row) => {
    setShareForPayment(row);
    resetPaymentForm();
    setPaymentDialogOpen(true);
  };

  const refreshEverything = async () => {
    const result = await refetchShares();
    const latest = result?.data?.data || [];
    await syncPayments(latest);
  };

  const handleAssign = async () => {
    if (!shareForAssignment || !selectedInvestorId) return;

    try {
      await assignShare({
        shareAccountId: shareForAssignment.id,
        userId: selectedInvestorId,
      }).unwrap();

      toast({
        title: "Share assigned",
        description: `Share #${shareForAssignment.shareNumber} assigned successfully.`,
      });

      setAssignDialogOpen(false);
      setShareForAssignment(null);
      setSelectedInvestorId("");
      await refreshEverything();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Assignment failed",
        description: error?.data?.message || "Could not assign share.",
      });
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedShareDetails || !selectedAsset) return;

    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Payment amount must be greater than zero.",
      });
      return;
    }

    if (amount > selectedShareDetails.remainingAmount) {
      toast({
        variant: "destructive",
        title: "Amount too high",
        description: `Remaining amount is ${formatCurrency(selectedShareDetails.remainingAmount)}.`,
      });
      return;
    }

    const paidAt = paymentDate ? new Date(paymentDate) : new Date();
    if (Number.isNaN(paidAt.getTime())) {
      toast({
        variant: "destructive",
        title: "Invalid date",
        description: "Please provide a valid payment date.",
      });
      return;
    }

    try {
      await recordSharePayment({
        shareAccountId: selectedShareDetails.id,
        amount,
        paidAt: paidAt.toISOString(),
        metadata: paymentNote.trim() ? { note: paymentNote.trim() } : undefined,
      }).unwrap();

      toast({
        title: "Payment recorded",
        description: `Share #${selectedShareDetails.shareNumber} updated successfully.`,
      });

      const response = await fetchSharePayments(selectedShareDetails.id, true).unwrap();
      setPaymentMap((prev) => ({
        ...prev,
        [selectedShareDetails.id]: response?.data || [],
      }));

      resetPaymentForm();
      await refetchShares();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: error?.data?.message || "Could not record payment.",
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-slate-50">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-300">Operations Workspace</p>
            <h1 className="text-2xl font-semibold tracking-tight">Share Payment Manager</h1>
            <p className="mt-2 text-sm text-slate-300">
              Assign shares, capture installment payments, and monitor ownership progress from one panel.
            </p>
          </div>
          <Button asChild variant="secondary" className="w-full md:w-auto">
            <Link to="/admin/profit">
              Open Profit Workspace
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Shares</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.totalShares}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Assigned Shares</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.assignedShares}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Collected</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatCurrency(summary.totalCollected)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Outstanding</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatCurrency(summary.outstanding)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Share Payment Operations</CardTitle>
          <CardDescription>
            Payment progress is computed from recorded installments up to now and capped by the share price.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr,220px,220px,auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by share number or investor"
                className="pl-9"
              />
            </div>

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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={refreshEverything}
              disabled={!activeAssetId || isFetchingShares || isSyncingPayments}
            >
              <RefreshCcw className={`mr-2 h-4 w-4 ${isFetchingShares || isSyncingPayments ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Share</TableHead>
                  <TableHead>Investor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">#{row.shareNumber}</TableCell>
                    <TableCell>{row.investorName}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(row.paymentStatus)}>
                        {row.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[220px]">
                      <div className="space-y-1">
                        <Progress value={row.progressValue} className="h-2" />
                        <p className="text-xs text-muted-foreground">{row.ownershipPercentage}% ownership</p>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(row.paidAmount)}</TableCell>
                    <TableCell>{formatCurrency(row.remainingAmount)}</TableCell>
                    <TableCell>{formatDate(row.assignedAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!row.raw.assignedUserId && (
                          <Button size="sm" variant="outline" onClick={() => openAssignmentDialog(row)}>
                            <UserPlus className="mr-1 h-4 w-4" />
                            Assign
                          </Button>
                        )}
                        {!!row.raw.assignedUserId && (
                          <Button size="sm" onClick={() => openPaymentDialog(row)}>
                            <PlusCircle className="mr-1 h-4 w-4" />
                            Payment
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                      {isFetchingShares || isSyncingPayments
                        ? "Loading share accounts..."
                        : "No shares match your current filters."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Share #{shareForAssignment?.shareNumber}</DialogTitle>
            <DialogDescription>
              Select an investor. Once assigned, payment installments can be recorded from this panel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Investor</Label>
              <Select value={selectedInvestorId} onValueChange={setSelectedInvestorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select investor" />
                </SelectTrigger>
                <SelectContent>
                  {investorOptions.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {getInvestorName(user)} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleAssign} className="w-full" disabled={isAssigning || !selectedInvestorId}>
              {isAssigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Confirm Assignment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Share #{selectedShareDetails?.shareNumber} Payment Ledger</DialogTitle>
            <DialogDescription>
              Installments update ownership ratio. Profit split uses paid amount and payment date.
            </DialogDescription>
          </DialogHeader>

          {selectedShareDetails ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xs text-muted-foreground">Share Price</CardTitle>
                  </CardHeader>
                  <CardContent className="text-lg font-semibold">
                    {formatCurrency(selectedAsset?.sharePrice || 0)}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xs text-muted-foreground">Total Paid</CardTitle>
                  </CardHeader>
                  <CardContent className="text-lg font-semibold">
                    {formatCurrency(selectedShareDetails.paidAmount)}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xs text-muted-foreground">Remaining</CardTitle>
                  </CardHeader>
                  <CardContent className="text-lg font-semibold">
                    {formatCurrency(selectedShareDetails.remainingAmount)}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Record New Payment</CardTitle>
                  <CardDescription>
                    Remaining cap applies automatically. Overpayment is blocked by both UI and backend.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={paymentAmount}
                        onChange={(event) => setPaymentAmount(event.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Date</Label>
                      <Input
                        type="datetime-local"
                        value={paymentDate}
                        onChange={(event) => setPaymentDate(event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Note (optional)</Label>
                    <Textarea
                      value={paymentNote}
                      onChange={(event) => setPaymentNote(event.target.value)}
                      placeholder="Bank reference or manual note"
                    />
                  </div>
                  <Button
                    onClick={handlePaymentSubmit}
                    disabled={isRecordingPayment || selectedShareDetails.remainingAmount <= 0}
                  >
                    {isRecordingPayment ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="mr-2 h-4 w-4" />
                    )}
                    Record Payment
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Note</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedShareDetails.payments.map((payment) => (
                          <TableRow key={payment._id}>
                            <TableCell>{formatDate(payment.paidAt)}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                            <TableCell>{formatDateTime(payment.createdAt)}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {payment?.metadata?.note || "-"}
                            </TableCell>
                          </TableRow>
                        ))}

                        {selectedShareDetails.payments.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="h-16 text-center text-sm text-muted-foreground">
                              <div className="inline-flex items-center gap-2">
                                <Clock3 className="h-4 w-4" />
                                No payment recorded yet.
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {selectedShareDetails.remainingAmount <= 0 && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      This share is fully paid and now receives full user-profit ratio.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">Select a share to manage payment history.</div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="flex flex-col gap-2 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Contract value: {formatCurrency(summary.contractValue)}
          </div>
          <div className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Fully paid shares: {summary.paidShares}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
