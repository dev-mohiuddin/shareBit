import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/dialogs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetAllDepositsQuery,
  useUpdateDepositStatusMutation,
} from "@/features/api/apiSlice";
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

const statusActionLabelMap = {
  approved: "Approve",
  completed: "Complete",
  rejected: "Reject",
  cancelled: "Cancel",
};

const statusesRequiringReason = new Set(["rejected", "cancelled"]);

const resolveFeedback = (item) => {
  const history = Array.isArray(item?.statusHistory) ? [...item.statusHistory].reverse() : [];
  const latest = history.find((entry) => entry?.reason || entry?.note) || null;

  return {
    reason: item?.metadata?.lastReason || latest?.reason || "",
    note: item?.metadata?.lastNote || latest?.note || "",
  };
};

export const DepositManagerPage = () => {
  const { toast } = useToast();
  const { data, isLoading, isFetching, refetch } = useGetAllDepositsQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateDepositStatusMutation();
  const [actionState, setActionState] = useState({
    open: false,
    row: null,
    status: "approved",
    note: "",
    reason: "",
    error: "",
  });

  const rows = data?.data || [];
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
    const depositId = actionState.row?._id;
    if (!depositId) return;

    if (requiresReason && !actionState.reason.trim()) {
      setActionState((prev) => ({
        ...prev,
        error: "Reason is required for reject or cancel actions.",
      }));
      return;
    }

    try {
      await updateStatus({
        depositId,
        status: actionState.status,
        ...(actionState.note.trim() ? { note: actionState.note.trim() } : {}),
        ...(actionState.reason.trim() ? { reason: actionState.reason.trim() } : {}),
      }).unwrap();

      toast({
        title: `Deposit ${statusActionLabelMap[actionState.status] || actionState.status}`,
        description: "Status updated successfully.",
      });
      closeActionDialog();
      refetch();
    } catch (error) {
      const message = error?.data?.message || "Failed to update deposit status.";
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
    return `${statusActionLabelMap[actionState.status] || "Update"} deposit for ${investorName}?`;
  }, [actionState.row, actionState.status]);

  const renderActions = (item) => {
    if (item.status === "requested") {
      return (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" disabled={isUpdating} onClick={() => openActionDialog(item, "approved")}>
            Approve
          </Button>
          <Button size="sm" disabled={isUpdating} onClick={() => openActionDialog(item, "completed")}>
            Complete
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
          <Button size="sm" disabled={isUpdating} onClick={() => openActionDialog(item, "completed")}>
            Complete
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

    return <span className="text-xs text-muted-foreground">No actions</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Deposit Management</h1>
        <p className="text-muted-foreground">Review proof and complete manual deposit requests.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Deposit Requests</CardTitle>
          <CardDescription>Complete requests to credit investor wallet balance.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading || isFetching ? (
            <div className="py-10 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No deposit requests found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Admin Feedback</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item) => {
                  const investorName = item?.userId?.firstName
                    ? `${item.userId.firstName} ${item.userId.lastName || ""}`.trim()
                    : "Unknown";
                  const feedback = resolveFeedback(item);

                  return (
                    <TableRow key={item._id}>
                      <TableCell>
                        <div className="font-medium">{investorName}</div>
                        <div className="text-xs text-muted-foreground">{item?.userId?.email || "-"}</div>
                      </TableCell>
                      <TableCell>${item.amount}</TableCell>
                      <TableCell>{methodLabelMap[item.method] || item.method || "-"}</TableCell>
                      <TableCell className="text-xs">
                        <div>{item?.proof?.transactionId || "-"}</div>
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

      <ConfirmationDialog
        open={actionState.open}
        onOpenChange={(open) => {
          if (!open) closeActionDialog();
        }}
        title={actionDialogTitle}
        description="Optional note for approve/complete. Reason is mandatory for reject/cancel."
        confirmLabel={statusActionLabelMap[actionState.status] || "Update"}
        confirmVariant={requiresReason ? "destructive" : "default"}
        isLoading={isUpdating}
        onConfirm={handleStatus}
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="deposit-admin-note">Admin Note (optional)</Label>
            <Textarea
              id="deposit-admin-note"
              value={actionState.note}
              onChange={(event) =>
                setActionState((prev) => ({ ...prev, note: event.target.value, error: "" }))
              }
              placeholder="Optional processing note"
              className="min-h-[70px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deposit-admin-reason">
              Reason {requiresReason ? "(required)" : "(optional)"}
            </Label>
            <Textarea
              id="deposit-admin-reason"
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
