import { FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetMyShareAccountsQuery } from "@/features/api/apiSlice";

const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    }).format(Number(value || 0));

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "-");

const resolveStatusVariant = (status) => {
    if (status === "active") return "default";
    if (status === "closed") return "secondary";
    if (status === "cancelled") return "destructive";
    return "outline";
};

export const InvestmentsPage = () => {
    const { data: sharesResponse, isLoading } = useGetMyShareAccountsQuery();
    const shares = sharesResponse?.data || [];

    const totalInvested = shares.reduce((sum, share) => sum + (share.paidAmount || 0), 0);
    const activeProjects = new Set(shares.map((item) => item.assetId?._id).filter(Boolean)).size;

    return (
        <div className="space-y-6 pb-24 md:pb-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">My Investments</h1>
                <p className="text-muted-foreground">Track your asset portfolio and ownership.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Capital Invested
                        </CardTitle>
                        <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
                        <div className="text-2xl font-bold">{activeProjects}</div>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Average Annual Yield</CardTitle>
                        <div className="text-2xl font-bold text-green-600">14.2%</div>
                    </CardHeader>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Portfolio Holdings</CardTitle>
                    <CardDescription>Detailed view of your share ownership.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : shares.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                            No investments found. Go to Marketplace to start investing.
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3 md:hidden">
                                {shares.map((share) => (
                                    <div key={share._id} className="rounded-lg border border-border/80 p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {share.assetId?.name || "Unknown Asset"}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{share.assetId?.category || "-"}</p>
                                            </div>
                                            <Badge variant={resolveStatusVariant(share.status)}>{share.status || "unknown"}</Badge>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                            <div className="rounded-md bg-muted/40 p-2">
                                                <p className="text-muted-foreground">Share ID</p>
                                                <p className="break-all font-medium">{share.shareNumber || "-"}</p>
                                            </div>
                                            <div className="rounded-md bg-muted/40 p-2">
                                                <p className="text-muted-foreground">Invested Date</p>
                                                <p className="font-medium">{formatDate(share.assignedAt)}</p>
                                            </div>
                                            <div className="rounded-md bg-muted/40 p-2">
                                                <p className="text-muted-foreground">Amount</p>
                                                <p className="font-medium">{formatCurrency(share.paidAmount || 0)}</p>
                                            </div>
                                            <div className="rounded-md bg-muted/40 p-2">
                                                <p className="text-muted-foreground">Ownership</p>
                                                <p className="font-medium">{Number(share.ownershipPercentage || 0)}%</p>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <Button variant="outline" size="sm" className="w-full" title="Download Certificate">
                                                <FileText className="mr-2 h-4 w-4" />
                                                Certificate
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Asset</TableHead>
                                            <TableHead>Share ID</TableHead>
                                            <TableHead>Invested Date</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Ownership</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {shares.map((share) => (
                                            <TableRow key={share._id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex min-w-0 flex-col">
                                                        <span className="truncate">{share.assetId?.name || "Unknown Asset"}</span>
                                                        <span className="text-xs text-muted-foreground">{share.assetId?.category || "-"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{share.shareNumber || "-"}</TableCell>
                                                <TableCell>{formatDate(share.assignedAt)}</TableCell>
                                                <TableCell>{formatCurrency(share.paidAmount || 0)}</TableCell>
                                                <TableCell>{Number(share.ownershipPercentage || 0)}%</TableCell>
                                                <TableCell>
                                                    <Badge variant={resolveStatusVariant(share.status)}>{share.status || "unknown"}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" title="Download Certificate">
                                                        <FileText className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
