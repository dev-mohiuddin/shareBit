import { Link } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight, History, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetMeQuery, useGetMyTransactionsQuery, useGetWalletQuery } from "@/features/api/apiSlice";
import ROUTES from "@/router/routes";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (value) => new Date(value).toLocaleDateString();

const normalizeType = (value) => String(value || "transaction").replace(/_/g, " ");

export const WalletPage = () => {
  const { data: walletResponse, isLoading } = useGetWalletQuery();
  const { data: meResponse } = useGetMeQuery();
  const { data: txResponse, isFetching: isFetchingTransactions } = useGetMyTransactionsQuery({
    limit: 100,
  });

  const wallet = walletResponse?.data || { balance: 0 };
  const transactions = txResponse?.data?.transactions || [];

  const payout = meResponse?.data?.investorProfile?.payoutDetails || {};
  const bank = payout?.bankAccount || {};
  const bkash = payout?.bkash || {};

  const hasBank = bank.bankName && bank.accountNumber;
  const hasBkash = bkash.number;

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Digital Wallet</h1>
        <p className="text-muted-foreground">Manage your funds and payouts.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-white/80">Available Balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-4xl font-bold tracking-tighter">
              {isLoading ? "..." : formatCurrency(wallet.balance)}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="secondary" className="w-full" asChild>
                <Link to={ROUTES.WITHDRAWALS}>
                  <ArrowUpRight className="mr-2 h-4 w-4" /> Withdraw
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full border-white/20 bg-primary-foreground/10 text-white hover:bg-primary-foreground/20"
                asChild
              >
                <Link to={ROUTES.DEPOSITS}>
                  <ArrowDownLeft className="mr-2 h-4 w-4" /> Deposit
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bank Account</CardTitle>
            <CardDescription>Linked account for processing withdrawals.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 rounded-lg border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                <History className="h-5 w-5 text-slate-500" />
              </div>
              <div className="min-w-0">
                {hasBank ? (
                  <>
                    <div className="font-medium">{bank.bankName}</div>
                    <div className="break-all text-sm text-muted-foreground">
                      {bank.accountHolderName || "Account holder"} •
                      {` ${String(bank.accountNumber).slice(-4).padStart(4, "*")}`}
                    </div>
                  </>
                ) : hasBkash ? (
                  <>
                    <div className="font-medium">bKash</div>
                    <div className="break-all text-sm text-muted-foreground">
                      {bkash.number} • {bkash.accountType || "personal"}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-medium">No payout account added</div>
                    <div className="text-sm text-muted-foreground">
                      Go to Profile to add bank or bKash details.
                    </div>
                  </>
                )}
              </div>
              <Badge variant="outline" className="ml-auto">
                {hasBank || hasBkash ? "Configured" : "Missing"}
              </Badge>
            </div>
            <Button variant="ghost" className="mt-4 w-full" asChild>
              <Link to={ROUTES.PROFILE}>Manage Accounts</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {isFetchingTransactions ? (
            <div className="inline-flex items-center gap-2 py-12 text-center text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading transactions...
            </div>
          ) : null}

          {!isFetchingTransactions && transactions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No transactions found.</div>
          ) : null}

          {!isFetchingTransactions && transactions.length > 0 ? (
            <>
              <div className="space-y-3 md:hidden">
                {transactions.map((tx) => {
                  const amount = Number(tx.amount || 0);
                  const status = tx.status || "completed";

                  return (
                    <div key={tx._id} className="rounded-lg border border-border/80 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium capitalize">{normalizeType(tx.type)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(tx.occurredAt || tx.createdAt)}
                          </p>
                        </div>
                        <p
                          className={`text-sm font-semibold ${
                            amount > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {amount > 0 ? "+" : ""}
                          {formatCurrency(amount)}
                        </p>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{tx.referenceType || "Transaction"}</span>
                        <Badge variant="outline" className="capitalize">
                          {status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => {
                      const amount = Number(tx.amount || 0);
                      const status = tx.status || "completed";

                      return (
                        <TableRow key={tx._id}>
                          <TableCell className="font-medium capitalize">{normalizeType(tx.type)}</TableCell>
                          <TableCell>{formatDate(tx.occurredAt || tx.createdAt)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {tx.referenceType || "Transaction"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {status}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              amount > 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {amount > 0 ? "+" : ""}
                            {formatCurrency(amount)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

