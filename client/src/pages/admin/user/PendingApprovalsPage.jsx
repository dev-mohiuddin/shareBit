import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Loader2, ShieldX } from "lucide-react";
import { ConfirmationDialog } from "@/components/dialogs";
import {
  useGetUsersQuery,
  useReviewInvestorApprovalByAdminMutation,
  useUpdateInvestorStatusByAdminMutation,
} from "@/features/api/apiSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export const PendingApprovalsPage = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [confirmationState, setConfirmationState] = useState({
    open: false,
    action: null,
    row: null,
  });
  const { data: usersResponse, isLoading, isFetching, refetch } = useGetUsersQuery();
  const [reviewApproval, { isLoading: isReviewing }] = useReviewInvestorApprovalByAdminMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateInvestorStatusByAdminMutation();

  const pendingRows = useMemo(() => {
    const users = usersResponse?.data || [];
    const searchText = search.trim().toLowerCase();

    return users
      .filter((user) => {
        const roleName = String(user?.roleName || user?.roleId?.name || "").toLowerCase();
        if (!roleName.includes("investor") && !roleName.includes("user")) return false;

        const approvalStatus = user?.investorProfile?.approval?.status || "draft";
        const isPending = approvalStatus === "submitted" || approvalStatus === "draft";
        if (!isPending) return false;

        if (!searchText) return true;
        const name = `${user.firstName || ""} ${user.lastName || ""}`.trim().toLowerCase();
        const email = String(user.email || "").toLowerCase();
        return name.includes(searchText) || email.includes(searchText);
      })
      .map((user) => ({
        id: user._id || user.id,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Investor",
        email: user.email || "-",
        phone: user.phone || "-",
        country: user.country || "-",
        approvalStatus: user?.investorProfile?.approval?.status || "draft",
        submittedAt: user?.investorProfile?.approval?.submittedAt || user.createdAt,
      }))
      .sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
  }, [search, usersResponse?.data]);

  const handleApprove = async (investorId) => {
    try {
      await reviewApproval({
        investorId,
        decision: "approved",
      }).unwrap();
      toast({
        title: "Investor approved",
        description: "Investor is now eligible for financial actions.",
      });
      refetch();
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Approval failed",
        description: error?.data?.message || "Could not approve investor profile.",
      });
      return false;
    }
  };

  const handleReject = async (investorId) => {
    try {
      await reviewApproval({
        investorId,
        decision: "rejected",
        rejectionReason: "Incomplete profile submission",
      }).unwrap();
      toast({
        title: "Investor rejected",
        description: "Investor profile has been rejected.",
      });
      refetch();
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Rejection failed",
        description: error?.data?.message || "Could not reject investor profile.",
      });
      return false;
    }
  };

  const handleHold = async (investorId) => {
    try {
      await updateStatus({
        investorId,
        action: "hold",
        reason: "Pending manual compliance checks",
      }).unwrap();
      toast({
        title: "Investor placed on hold",
        description: "Financial actions are now blocked for this investor.",
      });
      refetch();
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hold action failed",
        description: error?.data?.message || "Could not place investor on hold.",
      });
      return false;
    }
  };

  const openConfirmation = (action, row) => {
    setConfirmationState({
      open: true,
      action,
      row,
    });
  };

  const closeConfirmation = () => {
    setConfirmationState({
      open: false,
      action: null,
      row: null,
    });
  };

  const confirmConfig = useMemo(() => {
    const investorName = confirmationState.row?.name || "this investor";
    if (confirmationState.action === "approve") {
      return {
        title: `Approve ${investorName}?`,
        description: "This will mark the investor as approved and unlock financial actions.",
        confirmLabel: "Approve",
        confirmVariant: "default",
      };
    }

    if (confirmationState.action === "hold") {
      return {
        title: `Put ${investorName} on hold?`,
        description: "This will block all financial actions until reactivated.",
        confirmLabel: "Place On Hold",
        confirmVariant: "destructive",
      };
    }

    return {
      title: `Reject ${investorName}?`,
      description: "This will reject the investor profile and disable financial actions.",
      confirmLabel: "Reject",
      confirmVariant: "destructive",
    };
  }, [confirmationState.action, confirmationState.row?.name]);

  const runConfirmedAction = async () => {
    const investorId = confirmationState.row?.id;
    if (!investorId || !confirmationState.action) return;

    let success = false;
    if (confirmationState.action === "approve") {
      success = await handleApprove(investorId);
    } else if (confirmationState.action === "hold") {
      success = await handleHold(investorId);
    } else {
      success = await handleReject(investorId);
    }

    if (success) {
      closeConfirmation();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>
            Review and approve pending user registrations and KYC documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search investor by name or email"
            />

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investor</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{row.name}</p>
                          <p className="text-xs text-muted-foreground">{row.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{row.phone}</TableCell>
                      <TableCell>{row.country}</TableCell>
                      <TableCell>{row.approvalStatus}</TableCell>
                      <TableCell>{row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/admin/investors/${row.id}`}>View</Link>
                          </Button>
                          <Button size="sm" onClick={() => openConfirmation("approve", row)} disabled={isReviewing || isUpdatingStatus}>
                            <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openConfirmation("hold", row)}
                            disabled={isReviewing || isUpdatingStatus}
                          >
                            <ShieldX className="mr-1 h-4 w-4" /> Hold
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openConfirmation("reject", row)}
                            disabled={isReviewing || isUpdatingStatus}
                          >
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {pendingRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-20 text-center text-sm text-muted-foreground">
                        {isLoading || isFetching ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading pending approvals...
                          </span>
                        ) : (
                          "No pending investor approval requests."
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={confirmationState.open}
        onOpenChange={(open) => {
          if (!open) closeConfirmation();
        }}
        title={confirmConfig.title}
        description={confirmConfig.description}
        confirmLabel={confirmConfig.confirmLabel}
        confirmVariant={confirmConfig.confirmVariant}
        isLoading={isReviewing || isUpdatingStatus}
        onConfirm={runConfirmedAction}
      />
    </div>
  );
};

export default PendingApprovalsPage;
