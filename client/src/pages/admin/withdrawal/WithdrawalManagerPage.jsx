import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useGetAllWithdrawalsQuery,
  useUpdateWithdrawalStatusMutation,
} from "@/features/api/apiSlice";

const statusVariantMap = {
  requested: "outline",
  approved: "secondary",
  rejected: "destructive",
  paid: "default",
};

export const WithdrawalManagerPage = () => {
  const { data, isLoading, isFetching } = useGetAllWithdrawalsQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateWithdrawalStatusMutation();
  const rows = data?.data || [];

  const handleStatus = async (withdrawalId, status) => {
    try {
      await updateStatus({ withdrawalId, status }).unwrap();
    } catch (_) {
      // keep UI simple here; errors are visible from network response
    }
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
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item) => {
                  const investorName = item?.userId?.firstName
                    ? `${item.userId.firstName} ${item.userId.lastName}`
                    : item?.userId || "Unknown";

                  return (
                    <TableRow key={item._id}>
                      <TableCell>
                        <div className="font-medium">{investorName}</div>
                        <div className="text-xs text-muted-foreground">{item?.userId?.email || "-"}</div>
                      </TableCell>
                      <TableCell>${item.amount}</TableCell>
                      <TableCell>{item.method || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariantMap[item.status] || "outline"}>{item.status}</Badge>
                      </TableCell>
                      <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {item.status === "requested" ? (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={isUpdating}
                                onClick={() => handleStatus(item._id, "approved")}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={isUpdating}
                                onClick={() => handleStatus(item._id, "rejected")}
                              >
                                Reject
                              </Button>
                            </>
                          ) : null}

                          {item.status === "approved" ? (
                            <Button
                              size="sm"
                              disabled={isUpdating}
                              onClick={() => handleStatus(item._id, "paid")}
                            >
                              Mark Paid
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
