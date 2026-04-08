import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetWithdrawalsQuery, useRequestWithdrawalMutation } from "@/features/api/apiSlice";

const statusVariantMap = {
  requested: "outline",
  approved: "secondary",
  rejected: "destructive",
  paid: "default",
};

export const WithdrawalsPage = () => {
  const { data, isLoading, isFetching } = useGetWithdrawalsQuery();
  const [requestWithdrawal, { isLoading: isSubmitting }] = useRequestWithdrawalMutation();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [reason, setReason] = useState("");
  const [errorText, setErrorText] = useState("");

  const withdrawals = useMemo(() => data?.data || [], [data]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorText("");

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorText("Please enter a valid withdrawal amount.");
      return;
    }

    try {
      await requestWithdrawal({
        amount: parsedAmount,
        method,
        metadata: reason ? { reason } : {},
      }).unwrap();
      setAmount("");
      setReason("");
    } catch (error) {
      setErrorText(error?.data?.message || "Failed to submit withdrawal request.");
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
          <CardDescription>Requests are reviewed by admin before payout.</CardDescription>
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
              <Input
                id="withdraw-method"
                placeholder="bank_transfer"
                value={method}
                onChange={(event) => setMethod(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdraw-reason">Reason (Optional)</Label>
              <Input
                id="withdraw-reason"
                placeholder="Personal expense"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </div>
            {errorText ? (
              <p className="md:col-span-3 text-sm text-red-600">{errorText}</p>
            ) : null}
            <Button type="submit" className="md:col-span-3" disabled={isSubmitting}>
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
            <div className="py-10 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="py-8 text-sm text-muted-foreground text-center">No withdrawal requests found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{item.method || "-"}</TableCell>
                    <TableCell>${item.amount}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariantMap[item.status] || "outline"}>
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
