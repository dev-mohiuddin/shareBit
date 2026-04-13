import { Link } from "react-router-dom";
import { Loader2, ArrowUpRight, ArrowDownLeft, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetMeQuery, useGetMyTransactionsQuery, useGetWalletQuery } from "@/features/api/apiSlice";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    }).format(Number(value || 0));

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
            <Card className="bg-primary text-primary-foreground border-none">
                <CardHeader>
                    <CardTitle className="text-white/80 text-sm font-medium">Available Balance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-4xl font-bold tracking-tighter">
                        {isLoading ? "..." : formatCurrency(wallet.balance)}
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" className="w-full" asChild>
                            <Link to="/withdrawals">
                                <ArrowUpRight className="mr-2 h-4 w-4" /> Withdraw
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full bg-primary-foreground/10 border-white/20 text-white hover:bg-primary-foreground/20">
                            <ArrowDownLeft className="mr-2 h-4 w-4" /> Deposit
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
                                        <div className="rounded-lg border p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                            <History className="h-5 w-5 text-slate-500" />
                        </div>
                        <div>
                                                        {hasBank ? (
                                                            <>
                                                                <div className="font-medium">{bank.bankName}</div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {bank.accountHolderName || "Account holder"} • {String(bank.accountNumber).slice(-4).padStart(4, "*")}
                                                                </div>
                                                            </>
                                                        ) : hasBkash ? (
                                                            <>
                                                                <div className="font-medium">bKash</div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {bkash.number} • {bkash.accountType || "personal"}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="font-medium">No payout account added</div>
                                                                <div className="text-sm text-muted-foreground">Go to Profile to add bank or bKash details.</div>
                                                            </>
                                                        )}
                        </div>
                                                <Badge variant="outline" className="ml-auto">
                                                    {hasBank || hasBkash ? "Configured" : "Missing"}
                                                </Badge>
                    </div>
                                        <Button variant="ghost" className="w-full mt-4" asChild>
                                            <Link to="/profile">Manage Accounts</Link>
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
                                        <div className="text-center py-12 text-muted-foreground inline-flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" /> Loading transactions...
                                        </div>
                                ) : null}
                {transactions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No transactions found.
                    </div>
                ) : (
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
                            {transactions.map((tx) => (
                                <TableRow key={tx._id}>
                                    <TableCell className="font-medium capitalize">{tx.type}</TableCell>
                                    <TableCell>{new Date(tx.occurredAt || tx.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-muted-foreground text-xs">
                                      {tx.referenceType || "Transaction"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">completed</Badge>
                                    </TableCell>
                                    <TableCell className={`text-right font-medium ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                                        {tx.amount > 0 ? "+" : ""}{formatCurrency(tx.amount)}
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
