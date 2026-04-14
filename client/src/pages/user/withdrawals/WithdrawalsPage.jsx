import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/dialogs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useCancelMyWithdrawalMutation,
  useGetMeQuery,
  useGetWithdrawalsQuery,
  useRequestWithdrawalMutation,
} from "@/features/api/apiSlice";
import { useToast } from "@/hooks/use-toast";

const statusVariantMap = {
  requested: "outline",
  approved: "secondary",
  processing: "secondary",
  rejected: "destructive",
  cancelled: "destructive",
  paid: "default",
};

const methodLabelMap = {
  bank: "Bank",
  bkash: "bKash",
};

const formatDate = (value) => new Date(value).toLocaleDateString();

const resolveFeedback = (item) => {
  const history = Array.isArray(item?.statusHistory) ? [...item.statusHistory].reverse() : [];
  const latest = history.find((entry) => entry?.reason || entry?.note) || null;

  return {
    reason: item?.metadata?.lastReason || latest?.reason || "",
    note: item?.metadata?.lastNote || latest?.note || "",
  };
};

export const WithdrawalsPage = () => {
  const { toast } = useToast();
  const { data, isLoading, isFetching, refetch } = useGetWithdrawalsQuery();
  const { data: meResponse } = useGetMeQuery();
  const [requestWithdrawal, { isLoading: isSubmitting }] = useRequestWithdrawalMutation();
  const [cancelMyWithdrawal, { isLoading: isCancelling }] = useCancelMyWithdrawalMutation();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank");
  const [note, setNote] = useState("");
  const [errorText, setErrorText] = useState("");
  const [pendingRequest, setPendingRequest] = useState(null);
  const [pendingCancelRequest, setPendingCancelRequest] = useState(null);

  const withdrawals = useMemo(() => data?.data || [], [data]);

  const payoutDetails = meResponse?.data?.investorProfile?.payoutDetails || {};
  const hasBankPayout = Boolean(
    payoutDetails?.bankAccount?.bankName &&
      payoutDetails?.bankAccount?.accountHolderName &&
      payoutDetails?.bankAccount?.accountNumber
  );
  const hasBkashPayout = Boolean(payoutDetails?.bkash?.number);

  const enabledMethods = useMemo(() => {
    const methods = [];
    if (hasBankPayout) methods.push("bank");
    if (hasBkashPayout) methods.push("bkash");
    return methods;
  }, [hasBankPayout, hasBkashPayout]);

  useEffect(() => {
    if (enabledMethods.length === 0) return;
    if (!enabledMethods.includes(method)) {
      setMethod(enabledMethods[0]);
    }
  }, [enabledMethods, method]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setErrorText("");

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorText("Please enter a valid withdrawal amount.");
      return;
    }

    if (!enabledMethods.length) {
      setErrorText("Please add bank or bKash payout details from your profile first.");
      return;
    }

    setPendingRequest({
      amount: parsedAmount,
      method,
      note,
    });
  };

  const handleConfirmSubmit = async () => {
    if (!pendingRequest) return;

    try {
      await requestWithdrawal({
        amount: pendingRequest.amount,
        method: pendingRequest.method,
        ...(pendingRequest.note ? { note: pendingRequest.note } : {}),
      }).unwrap();

      setAmount("");
      setNote("");
      setPendingRequest(null);
      toast({
        title: "Withdrawal request submitted",
        description: "Your request is now waiting for admin review.",
      });
      refetch();
    } catch (error) {
      const message = error?.data?.message || "Failed to submit withdrawal request.";
      setErrorText(message);
      toast({
        variant: "destructive",
        title: "Request failed",
        description: message,
      });
    }
  };

  const handleConfirmCancel = async () => {
    if (!pendingCancelRequest?._id) return;

    try {
      await cancelMyWithdrawal({ withdrawalId: pendingCancelRequest._id }).unwrap();
      setPendingCancelRequest(null);
      toast({
        title: "Withdrawal cancelled",
        description: "Reserved amount has been returned to your wallet.",
      });
      refetch();
    } catch (error) {
      const message = error?.data?.message || "Failed to cancel withdrawal request.";
      toast({
        variant: "destructive",
        title: "Cancellation failed",
        description: message,
      });
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl font-semibold">Withdrawals</h1>
        <p className="text-muted-foreground">Request withdrawal and track approval status.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Withdrawal Request</CardTitle>
          <CardDescription>
            Requested amount is reserved from your wallet immediately and refunded if rejected or cancelled.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Amount</Label>
              <Input
                id="withdraw-amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="100"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdraw-method">Method</Label>
              <Select value={method} onValueChange={setMethod} disabled={!enabledMethods.length}>
                <SelectTrigger id="withdraw-method">
                  <SelectValue placeholder="Select payout method" />
                </SelectTrigger>
                <SelectContent>
                  {enabledMethods.map((option) => (
                    <SelectItem key={option} value={option}>
                      {methodLabelMap[option] || option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdraw-note">Note (Optional)</Label>
              <Textarea
                id="withdraw-note"
                placeholder="Add any note for admin"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="min-h-[40px]"
              />
            </div>

            {!enabledMethods.length ? (
              <p className="text-sm text-amber-600 md:col-span-3">
                No payout method found. Add bank or bKash details from profile to request withdrawal.
              </p>
            ) : null}

            {errorText ? <p className="text-sm text-red-600 md:col-span-3">{errorText}</p> : null}

            <Button type="submit" className="md:col-span-3" disabled={isSubmitting || !enabledMethods.length}>
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </span>
              ) : (
                "Submit Request"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Withdrawal History</CardTitle>
          <CardDescription>Latest requests appear first.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading || isFetching ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No withdrawal requests found.</div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {withdrawals.map((item) => {
                  const feedback = resolveFeedback(item);
                  const canCancel = item.status === "requested";

                  return (
                    <div key={item._id} className="rounded-lg border border-border/80 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{formatDate(item.createdAt)}</p>
                          <p className="text-xs text-muted-foreground">
                            {methodLabelMap[item.method] || item.method || "-"}
                          </p>
                        </div>
                        <p className="text-sm font-semibold">${item.amount}</p>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <Badge variant={statusVariantMap[item.status] || "outline"}>{item.status}</Badge>
                        {canCancel ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isCancelling}
                            onClick={() => setPendingCancelRequest(item)}
                          >
                            Cancel
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Locked</span>
                        )}
                      </div>

                      <div className="mt-2 text-xs text-muted-foreground">
                        {feedback.reason ? (
                          <span className="text-destructive">Reason: {feedback.reason}</span>
                        ) : feedback.note ? (
                          <span>Note: {feedback.note}</span>
                        ) : (
                          <span>Feedback: -</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Admin Feedback</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((item) => {
                      const feedback = resolveFeedback(item);
                      const canCancel = item.status === "requested";

                      return (
                        <TableRow key={item._id}>
                          <TableCell>{formatDate(item.createdAt)}</TableCell>
                          <TableCell>{methodLabelMap[item.method] || item.method || "-"}</TableCell>
                          <TableCell>${item.amount}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariantMap[item.status] || "outline"}>{item.status}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {feedback.reason ? (
                              <span className="text-destructive">Reason: {feedback.reason}</span>
                            ) : feedback.note ? (
                              <span>Note: {feedback.note}</span>
                            ) : (
                              <span>-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {canCancel ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isCancelling}
                                onClick={() => setPendingCancelRequest(item)}
                              >
                                Cancel Request
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">Locked</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={Boolean(pendingRequest)}
        onOpenChange={(open) => {
          if (!open) setPendingRequest(null);
        }}
        title="Submit withdrawal request?"
        description="This request will be sent to admin for review. The requested amount will be reserved from your wallet immediately."
        confirmLabel="Submit Request"
        isLoading={isSubmitting}
        onConfirm={handleConfirmSubmit}
      />

      <ConfirmationDialog
        open={Boolean(pendingCancelRequest)}
        onOpenChange={(open) => {
          if (!open) setPendingCancelRequest(null);
        }}
        title="Cancel this withdrawal request?"
        description="You can cancel only before admin approval. Reserved amount will be returned to your wallet."
        confirmLabel="Cancel Withdrawal"
        confirmVariant="destructive"
        isLoading={isCancelling}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
};

