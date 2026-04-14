import { useMemo, useState } from "react";
import { Loader2, Upload, WifiOff } from "lucide-react";
import { ConfirmationDialog } from "@/components/dialogs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetDepositsQuery, useRequestDepositMutation } from "@/features/api/apiSlice";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useToast } from "@/hooks/use-toast";

const statusVariantMap = {
  requested: "outline",
  approved: "secondary",
  completed: "default",
  rejected: "destructive",
  cancelled: "destructive",
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

export const DepositsPage = () => {
  const { toast } = useToast();
  const isOnline = useNetworkStatus();
  const { data, isLoading, isFetching, refetch } = useGetDepositsQuery();
  const [requestDeposit, { isLoading: isSubmitting }] = useRequestDepositMutation();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank");
  const [transactionId, setTransactionId] = useState("");
  const [note, setNote] = useState("");
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [errorText, setErrorText] = useState("");
  const [pendingRequest, setPendingRequest] = useState(null);

  const deposits = useMemo(() => data?.data || [], [data]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setErrorText("");

    if (!isOnline) {
      setErrorText("You are offline. Reconnect to submit a deposit request.");
      toast({
        variant: "destructive",
        title: "Offline mode",
        description: "Deposit submission is unavailable until your connection returns.",
      });
      return;
    }

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorText("Please enter a valid deposit amount.");
      return;
    }

    if (!transactionId.trim()) {
      setErrorText("Transaction ID is required.");
      return;
    }

    if (!screenshotFile) {
      setErrorText("Proof screenshot is required.");
      return;
    }

    setPendingRequest({
      amount: parsedAmount,
      method,
      transactionId: transactionId.trim(),
      note: note.trim(),
      screenshotFile,
    });
  };

  const handleConfirmSubmit = async () => {
    if (!pendingRequest) return;

    if (!isOnline) {
      setErrorText("You are offline. Reconnect to submit a deposit request.");
      toast({
        variant: "destructive",
        title: "Offline mode",
        description: "Deposit submission is unavailable until your connection returns.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("amount", String(pendingRequest.amount));
    formData.append("method", pendingRequest.method);
    formData.append("transactionId", pendingRequest.transactionId);
    if (pendingRequest.note) {
      formData.append("note", pendingRequest.note);
    }
    formData.append("screenshot", pendingRequest.screenshotFile);

    try {
      await requestDeposit(formData).unwrap();
      setAmount("");
      setMethod("bank");
      setTransactionId("");
      setNote("");
      setScreenshotFile(null);
      setPendingRequest(null);
      toast({
        title: "Deposit request submitted",
        description: "Admin will review your proof and complete the deposit.",
      });
      refetch();
    } catch (error) {
      const message = error?.data?.message || "Failed to submit deposit request.";
      setErrorText(message);
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: message,
      });
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl font-semibold">Deposits</h1>
        <p className="text-muted-foreground">Submit a manual deposit request with proof for admin approval.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Deposit Request</CardTitle>
          <CardDescription>Provide transaction ID and screenshot proof to submit a request.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isOnline ? (
            <Alert className="mb-4 border-amber-300 bg-amber-50 text-amber-900 [&>svg]:text-amber-700">
              <WifiOff className="h-4 w-4" />
              <AlertTitle>You are offline</AlertTitle>
              <AlertDescription>
                Deposit request submission is disabled until internet connection is restored.
              </AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Amount</Label>
              <Input
                id="deposit-amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="100"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={!isOnline || isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit-method">Method</Label>
              <Select value={method} onValueChange={setMethod} disabled={!isOnline || isSubmitting}>
                <SelectTrigger id="deposit-method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="bkash">bKash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit-transaction-id">Transaction ID</Label>
              <Input
                id="deposit-transaction-id"
                placeholder="TRX-123456"
                value={transactionId}
                onChange={(event) => setTransactionId(event.target.value)}
                disabled={!isOnline || isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit-screenshot">Screenshot Proof</Label>
              <Input
                id="deposit-screenshot"
                type="file"
                accept="image/*"
                onChange={(event) => setScreenshotFile(event.target.files?.[0] || null)}
                disabled={!isOnline || isSubmitting}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="deposit-note">Note (Optional)</Label>
              <Textarea
                id="deposit-note"
                placeholder="Any context for admin"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="min-h-[70px]"
                disabled={!isOnline || isSubmitting}
              />
            </div>

            {errorText ? <p className="text-sm text-destructive md:col-span-2">{errorText}</p> : null}

            <Button type="submit" className="md:col-span-2" disabled={isSubmitting || !isOnline}>
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </span>
              ) : !isOnline ? (
                <span className="inline-flex items-center gap-2">
                  <WifiOff className="h-4 w-4" /> Offline
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Upload className="h-4 w-4" /> Submit Deposit Request
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Deposit History</CardTitle>
          <CardDescription>Track admin decision and completion status.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading || isFetching ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : deposits.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No deposit requests found.</div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {deposits.map((item) => {
                  const feedback = resolveFeedback(item);

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

                      <div className="mt-3 space-y-1 text-xs">
                        <p className="text-muted-foreground">Transaction: {item?.proof?.transactionId || "-"}</p>
                        {item?.proof?.screenshotUrl ? (
                          <a
                            href={item.proof.screenshotUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            View proof
                          </a>
                        ) : null}
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <Badge variant={statusVariantMap[item.status] || "outline"}>{item.status}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {feedback.reason
                            ? `Reason: ${feedback.reason}`
                            : feedback.note
                            ? `Note: ${feedback.note}`
                            : "Feedback: -"}
                        </span>
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
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Feedback</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deposits.map((item) => {
                      const feedback = resolveFeedback(item);

                      return (
                        <TableRow key={item._id}>
                          <TableCell>{formatDate(item.createdAt)}</TableCell>
                          <TableCell>{methodLabelMap[item.method] || item.method || "-"}</TableCell>
                          <TableCell>${item.amount}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-xs">{item?.proof?.transactionId || "-"}</p>
                              {item?.proof?.screenshotUrl ? (
                                <a
                                  href={item.proof.screenshotUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-primary hover:underline"
                                >
                                  View proof
                                </a>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariantMap[item.status] || "outline"}>{item.status}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {feedback.reason ? (
                              <span className="text-destructive">Reason: {feedback.reason}</span>
                            ) : feedback.note ? (
                              <span>Note: {feedback.note}</span>
                            ) : (
                              "-"
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
        title="Submit deposit request?"
        description="This request will wait for admin approval and completion."
        confirmLabel="Submit Request"
        isLoading={isSubmitting}
        onConfirm={handleConfirmSubmit}
      />
    </div>
  );
};
