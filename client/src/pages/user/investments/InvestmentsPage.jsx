import { Loader2, TrendingUp, Download, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetMyShareAccountsQuery } from "@/features/api/apiSlice";

export const InvestmentsPage = () => {
    const { data: sharesResponse, isLoading } = useGetMyShareAccountsQuery();
    const shares = sharesResponse?.data || [];
    
    // Calculate totals
    const totalInvested = shares.reduce((sum, share) => sum + (share.paidAmount || 0), 0);
    const activeProjects = new Set(shares.map(s => s.assetId?._id)).size;

    return (
      <div className="space-y-6 pb-24 md:pb-6">
        <div>
           <h1 className="text-2xl font-bold tracking-tight">My Investments</h1>
           <p className="text-muted-foreground">Track your asset portfolio and ownership.</p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
             <Card>
                <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Capital Invested</CardTitle>
                    <div className="text-2xl font-bold">${totalInvested.toLocaleString()}</div>
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
                    <div className="text-center py-8 text-muted-foreground">
                        No investments found. Go to Marketplace to start investing.
                    </div>
                ) : (
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
                                        <div className="flex flex-col">
                                            <span>{share.assetId?.name || "Unknown Asset"}</span>
                                            <span className="text-xs text-muted-foreground">{share.assetId?.category}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{share.shareNumber}</TableCell>
                                    <TableCell>{share.assignedAt ? new Date(share.assignedAt).toLocaleDateString() : "-"}</TableCell>
                                    <TableCell>${share.paidAmount || 0}</TableCell>
                                    <TableCell>{share.ownershipPercentage}%</TableCell>
                                    <TableCell>
                                        <Badge variant={share.status === "active" ? "default" : "secondary"}>{share.status}</Badge>
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
                )}
            </CardContent>
        </Card>
      </div>
    );
  };
