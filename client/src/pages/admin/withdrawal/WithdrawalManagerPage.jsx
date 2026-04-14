import { useMemo, useState } from "react";
import { Copy, Eye, Loader2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/dialogs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useGetAllWithdrawalsQuery,
  useUpdateWithdrawalStatusMutation,
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

const statusActionLabelMap = {
  approved: "Approve",
  processing: "Mark Processing",
  paid: "Mark Paid",
  rejected: "Reject",
  cancelled: "Cancel",
};

const statusesRequiringReason = new Set(["rejected", "cancelled"]);

const maskAccountNumber = (value) => {
  const text = String(value || "");
  if (!text) return "-";
  const tail = text.slice(-4);
  return `****${tail}`;
};

const resolveFeedback = (item) => {
  const history = Array.isArray(item?.statusHistory) ? [...item.statusHistory].reverse() : [];
  const latest = history.find((entry) => entry?.reason || entry?.note) || null;

  return {
    reason: item?.metadata?.lastReason || latest?.reason || "",
    note: item?.metadata?.lastNote || latest?.note || "",
  };
};

const resolvePayoutSummary = (item) => {
  const snapshot = item?.payoutSnapshot || {};
  if (snapshot?.method === "bank") {
    const bank = snapshot?.bankAccount || {};
    return `${bank.bankName || "Bank"} • ${bank.accountHolderName || "Holder"} • ${maskAccountNumber(
      bank.accountNumber
    )}`;
  }

  if (snapshot?.method === "bkash") {
    const bkash = snapshot?.bkash || {};
    return `bKash • ${bkash.number || "-"} • ${bkash.accountType || "personal"}`;
  }

  return "-";
};

const toDisplayValue = (value) => {
  if (value === null || typeof value === "undefined") return "-";
  const text = String(value).trim();
  return text || "-";
};

const buildSnapshotRows = (item) => {
  if (!item) return [];

  const snapshot = item?.payoutSnapshot || {};
  const rows = [
    { key: "request-id", label: "Request ID", value: toDisplayValue(item?._id), copyable: true },
    { key: "method", label: "Method", value: toDisplayValue(methodLabelMap[snapshot?.method] || snapshot?.method), copyable: false },
    {
      key: "preferred-method",
      label: "Preferred Method",
      value: toDisplayValue(methodLabelMap[snapshot?.preferredMethod] || snapshot?.preferredMethod),
      copyable: false,
    },
    {
      key: "investor-email",
      label: "Investor Email",
      value: toDisplayValue(item?.userId?.email),
      copyable: true,
    },
  ];

  if (snapshot?.method === "bank") {
    rows.push(
      { key: "bank-name", label: "Bank Name", value: toDisplayValue(snapshot?.bankAccount?.bankName), copyable: true },
      {
        key: "bank-holder",
        label: "Account Holder",
        value: toDisplayValue(snapshot?.bankAccount?.accountHolderName),
        copyable: true,
      },
      {
        key: "bank-number",
        label: "Account Number",
        value: toDisplayValue(snapshot?.bankAccount?.accountNumber),
        copyable: true,
      },
      {
        key: "bank-routing",
        label: "Routing Number",
        value: toDisplayValue(snapshot?.bankAccount?.routingNumber),
        copyable: true,
      },
      {
        key: "bank-branch",
        label: "Branch Name",
        value: toDisplayValue(snapshot?.bankAccount?.branchName),
        copyable: true,
      }
    );
  }

  if (snapshot?.method === "bkash") {
    rows.push(
      {
        key: "bkash-number",
        label: "bKash Number",
        value: toDisplayValue(snapshot?.bkash?.number),
        copyable: true,
      },
      {
        key: "bkash-type",
        label: "bKash Account Type",
        value: toDisplayValue(snapshot?.bkash?.accountType),
        copyable: true,
      },
      {
        key: "bkash-holder",
        label: "bKash Account Holder",
        value: toDisplayValue(snapshot?.bkash?.accountHolderName),
        copyable: true,
      }
    );
  }

  return rows;
};

export const WithdrawalManagerPage = () => {
  const { toast } = useToast();
  const { data, isLoading, isFetching, refetch } = useGetAllWithdrawalsQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateWithdrawalStatusMutation();
  const [actionState, setActionState] = useState({
    open: false,
    row: null,
    status: "approved",
    note: "",
    reason: "",
    error: "",
  });
  const [snapshotDialog, setSnapshotDialog] = useState({
    open: false,
    row: null,
  });
  const rows = data?.data || [];
  const snapshotRows = useMemo(() => buildSnapshotRows(snapshotDialog.row), [snapshotDialog.row]);

  const requiresReason = statusesRequiringReason.has(actionState.status);

  const openActionDialog = (row, status) => {
    setActionState({
      open: true,
      row,
      status,
      note: "",
      reason: "",
      error: "",
    });
  };

  const closeActionDialog = () => {
    setActionState({
      open: false,
      row: null,
      status: "approved",
      note: "",
      reason: "",
      error: "",
    });
  };

  const handleStatus = async () => {
    const withdrawalId = actionState.row?._id;
    if (!withdrawalId) return;

    if (requiresReason && !actionState.reason.trim()) {
      setActionState((prev) => ({
        ...prev,
        error: "Reason is required for reject or cancel actions.",
      }));
      return;
    }

    try {
      await updateStatus({
        withdrawalId,
        status: actionState.status,
        ...(actionState.note.trim() ? { note: actionState.note.trim() } : {}),
        ...(actionState.reason.trim() ? { reason: actionState.reason.trim() } : {}),
      }).unwrap();

      toast({
        title: `Withdrawal ${statusActionLabelMap[actionState.status] || actionState.status}`,
        description: "Status updated successfully.",
      });
      closeActionDialog();
      refetch();
    } catch (error) {
      const message = error?.data?.message || "Failed to update withdrawal status.";
      setActionState((prev) => ({ ...prev, error: message }));
      toast({
        variant: "destructive",
        title: "Update failed",
        description: message,
      });
    }
  };

  const actionDialogTitle = useMemo(() => {
    const investorName = actionState.row?.userId?.firstName
      ? `${actionState.row.userId.firstName} ${actionState.row.userId.lastName || ""}`.trim()
      : "investor";
    return `${statusActionLabelMap[actionState.status] || "Update"} withdrawal for ${investorName}?`;
  }, [actionState.row, actionState.status]);

  const snapshotDialogTitle = useMemo(() => {
    const investorName = snapshotDialog.row?.userId?.firstName
      ? `${snapshotDialog.row.userId.firstName} ${snapshotDialog.row.userId.lastName || ""}`.trim()
      : "investor";
    return `Payout Snapshot for ${investorName}`;
  }, [snapshotDialog.row]);

  const handleCopySnapshotField = async (value, label) => {
    if (!value || value === "-") {
      toast({
        variant: "destructive",
        title: "Nothing to copy",
        description: `${label} is empty for this request.`,
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(String(value));
      toast({
        title: `${label} copied`,
        description: "Field copied to clipboard.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Unable to access clipboard in this browser.",
      });
    }
  };

  const renderActions = (item) => {
    if (item.status === "requested") {
      return (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" disabled={isUpdating} onClick={() => openActionDialog(item, "approved")}>
            Approve
          </Button>
          <Button size="sm" variant="outline" disabled={isUpdating} onClick={() => openActionDialog(item, "processing")}>
            Processing
          </Button>
          <Button size="sm" variant="destructive" disabled={isUpdating} onClick={() => openActionDialog(item, "rejected")}>
            Reject
          </Button>
          <Button size="sm" variant="destructive" disabled={isUpdating} onClick={() => openActionDialog(item, "cancelled")}>
            Cancel
          </Button>
        </div>
      );
    }

    if (item.status === "approved") {
      return (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" disabled={isUpdating} onClick={() => openActionDialog(item, "processing")}>
            Processing
          </Button>
          <Button size="sm" disabled={isUpdating} onClick={() => openActionDialog(item, "paid")}>
            Mark Paid
          </Button>
          <Button size="sm" variant="destructive" disabled={isUpdating} onClick={() => openActionDialog(item, "cancelled")}>
            Cancel
          </Button>
        </div>
      );
    }

    if (item.status === "processing") {
      return (
        <div className="flex justify-end gap-2">
          <Button size="sm" disabled={isUpdating} onClick={() => openActionDialog(item, "paid")}>
            Mark Paid
          </Button>
          <Button size="sm" variant="destructive" disabled={isUpdating} onClick={() => openActionDialog(item, "cancelled")}>
            Cancel
          </Button>
        </div>
      );
    }

    return <span className="text-xs text-muted-foreground">No actions</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Withdrawal Management</h1>
        <p className="text-muted-foreground">Review and process withdrawal requests.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>Use status actions to progress payout lifecycle.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading || isFetching ? (
            <div className="py-10 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No withdrawal requests found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Payout Snapshot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Admin Feedback</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item) => {
                  const investorName = item?.userId?.firstName
                    ? `${item.userId.firstName} ${item.userId.lastName}`
                    : item?.userId || "Unknown";
                  const feedback = resolveFeedback(item);

                  return (
                    <TableRow key={item._id}>
                      <TableCell>
                        <div className="font-medium">{investorName}</div>
                        <div className="text-xs text-muted-foreground">{item?.userId?.email || "-"}</div>
                      </TableCell>
                      <TableCell>${item.amount}</TableCell>
                      <TableCell>{methodLabelMap[item.method] || item.method || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">{resolvePayoutSummary(item)}</span>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => setSnapshotDialog({ open: true, row: item })}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
                      <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">{renderActions(item)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={snapshotDialog.open}
        onOpenChange={(open) =>
          setSnapshotDialog((prev) => ({
            open,
            row: open ? prev.row : null,
          }))
        }
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{snapshotDialogTitle}</DialogTitle>
            <DialogDescription>
              View and copy payout snapshot details captured when the investor requested withdrawal.
            </DialogDescription>
          </DialogHeader>

          {snapshotRows.length ? (
            <div className="max-h-[60vh] space-y-2 overflow-auto pr-1">
              {snapshotRows.map((field) => (
                <div key={field.key} className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">{field.label}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium break-all">{field.value}</p>
                    {field.copyable ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={field.value === "-"}
                        onClick={() => handleCopySnapshotField(field.value, field.label)}
                      >
                        <Copy className="mr-1 h-3.5 w-3.5" />
                        Copy
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No payout snapshot available.</p>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={actionState.open}
        onOpenChange={(open) => {
          if (!open) closeActionDialog();
        }}
        title={actionDialogTitle}
        description="Optional note for approve/process/paid. Reason is mandatory for reject/cancel."
        confirmLabel={statusActionLabelMap[actionState.status] || "Update"}
        confirmVariant={requiresReason ? "destructive" : "default"}
        isLoading={isUpdating}
        onConfirm={handleStatus}
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="withdrawal-admin-note">Admin Note (optional)</Label>
            <Textarea
              id="withdrawal-admin-note"
              value={actionState.note}
              onChange={(event) =>
                setActionState((prev) => ({ ...prev, note: event.target.value, error: "" }))
              }
              placeholder="Optional payout note"
              className="min-h-[70px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="withdrawal-admin-reason">
              Reason {requiresReason ? "(required)" : "(optional)"}
            </Label>
            <Textarea
              id="withdrawal-admin-reason"
              value={actionState.reason}
              onChange={(event) =>
                setActionState((prev) => ({ ...prev, reason: event.target.value, error: "" }))
              }
              placeholder={requiresReason ? "Provide rejection/cancellation reason" : "Optional reason"}
              className="min-h-[70px]"
            />
          </div>

          {actionState.error ? <p className="text-sm text-destructive">{actionState.error}</p> : null}
        </div>
      </ConfirmationDialog>
    </div>
  );
};
