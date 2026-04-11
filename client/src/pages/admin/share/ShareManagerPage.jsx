import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, RefreshCcw, Search, UserPlus } from "lucide-react";
import {
  useAssignShareMutation,
  useGetAssetsQuery,
  useGetShareAccountsByAssetQuery,
  useGetUsersQuery,
} from "@/features/api/apiSlice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/adminFinance";

const getInvestorName = (assignedUser) => {
  if (!assignedUser) return "Unassigned";
  if (typeof assignedUser === "string") return assignedUser;
  const name = `${assignedUser.firstName || ""} ${assignedUser.lastName || ""}`.trim();
  return name || assignedUser.email || "Investor";
};

export const ShareManagerPage = () => {
  const { toast } = useToast();

  const { data: assetsResponse } = useGetAssetsQuery();
  const assets = useMemo(() => assetsResponse?.data || [], [assetsResponse?.data]);

  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedShare, setSelectedShare] = useState(null);
  const [selectedInvestorId, setSelectedInvestorId] = useState("");

  const { data: usersResponse } = useGetUsersQuery();
  const users = useMemo(() => usersResponse?.data || [], [usersResponse?.data]);

  const activeAssetId = selectedAssetId || assets[0]?._id || "";

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset._id === activeAssetId) || null,
    [activeAssetId, assets]
  );

  const {
    data: shareAccountsResponse,
    isFetching: isFetchingShares,
    refetch: refetchShares,
  } = useGetShareAccountsByAssetQuery(activeAssetId, { skip: !activeAssetId });

  const [assignShare, { isLoading: isAssigning }] = useAssignShareMutation();

  const rows = useMemo(
    () =>
      (shareAccountsResponse?.data || []).map((share) => ({
        id: share._id,
        shareNumber: share.shareNumber,
        status: share.status,
        assignedUser: share.assignedUserId,
        assignedAt: share.assignedAt,
      })),
    [shareAccountsResponse?.data]
  );

  const summary = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((row) => row.status === "active").length;
    const inactive = Math.max(total - active, 0);
    return { total, active, inactive };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      const investorName = getInvestorName(row.assignedUser).toLowerCase();
      const searchMatch =
        !term || investorName.includes(term) || String(row.shareNumber).includes(term);
      const statusMatch = statusFilter === "all" || row.status === statusFilter;
      return searchMatch && statusMatch;
    });
  }, [rows, searchQuery, statusFilter]);

  const investorOptions = useMemo(() => {
    return users.filter((user) => {
      const role = String(user?.roleName || "").toLowerCase();
      return !role || role.includes("invest") || role.includes("user");
    });
  }, [users]);

  const openAssignModal = (row) => {
    setSelectedShare(row);
    setSelectedInvestorId("");
    setAssignDialogOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedShare || !selectedInvestorId) return;

    try {
      await assignShare({
        shareAccountId: selectedShare.id,
        userId: selectedInvestorId,
      }).unwrap();

      toast({
        title: "Share assigned",
        description: `Share #${selectedShare.shareNumber} assigned successfully.`,
      });

      setAssignDialogOpen(false);
      setSelectedShare(null);
      setSelectedInvestorId("");
      await refetchShares();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Assignment failed",
        description: error?.data?.message || "Unable to assign share.",
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-slate-50">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-300">Allocation Workspace</p>
            <h1 className="text-2xl font-semibold">Share Assignment Manager</h1>
            <p className="mt-2 text-sm text-slate-300">
              Assign available shares quickly and continue payment capture in the dedicated payment workspace.
            </p>
          </div>
          <Button asChild variant="secondary" className="w-full md:w-auto">
            <Link to="/admin/payments">
              Open Share Payments
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Shares</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Assigned</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.active}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Available</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.inactive}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignment Table</CardTitle>
          <CardDescription>
            Filter and assign shares. Assigned shares can immediately receive payment entries.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr,220px,220px,auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by share # or investor"
              />
            </div>

            <Select value={activeAssetId} onValueChange={setSelectedAssetId}>
              <SelectTrigger>
                <SelectValue placeholder="Select asset" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((asset) => (
                  <SelectItem key={asset._id} value={asset._id}>
                    {asset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Assigned</SelectItem>
                <SelectItem value="inactive">Available</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={refetchShares} disabled={isFetchingShares || !activeAssetId}>
              <RefreshCcw className={`mr-2 h-4 w-4 ${isFetchingShares ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Share</TableHead>
                  <TableHead>Investor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">#{row.shareNumber}</TableCell>
                    <TableCell>{getInvestorName(row.assignedUser)}</TableCell>
                    <TableCell>
                      <Badge variant={row.status === "active" ? "default" : "outline"}>{row.status}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(row.assignedAt)}</TableCell>
                    <TableCell className="text-right">
                      {row.status !== "active" ? (
                        <Button size="sm" variant="outline" onClick={() => openAssignModal(row)}>
                          <UserPlus className="mr-1 h-4 w-4" />
                          Assign
                        </Button>
                      ) : (
                        <Button size="sm" asChild>
                          <Link to="/admin/payments">Manage Payment</Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                {filteredRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-20 text-center text-sm text-muted-foreground">
                      {isFetchingShares ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading shares...
                        </span>
                      ) : (
                        "No shares match current filters."
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {selectedAsset && (
            <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
              Asset share price: <span className="font-medium text-foreground">${selectedAsset.sharePrice}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Share #{selectedShare?.shareNumber}</DialogTitle>
            <DialogDescription>Select an investor to activate this share account.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Investor</Label>
              <Select value={selectedInvestorId} onValueChange={setSelectedInvestorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select investor" />
                </SelectTrigger>
                <SelectContent>
                  {investorOptions.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {getInvestorName(user)} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={handleAssign} disabled={isAssigning || !selectedInvestorId}>
              {isAssigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Confirm Assignment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
