import { useState, useEffect } from "react";
import { Loader2, RefreshCcw, UserPlus } from "lucide-react";
import { DataTable } from "@/components/ui/dataTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  useGetAssetsQuery,
  useGetShareAccountsByAssetQuery,
  useGetUsersQuery,
  useAssignShareMutation,
} from "@/features/api/apiSlice";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const shareColumns = [
  { accessorKey: "shareNumber", header: "Share #" },
  { 
    accessorKey: "assignedUser", 
    header: "Investor",
    cell: ({ row }) => <span className="font-medium">{row.original.assignedUser}</span>
  },
  { accessorKey: "assignedAt", header: "Assigned Date" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "active" ? "default" : "outline"}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <ShareActions row={row} />
  }
];

const ShareActions = ({ row }) => {
    // Placeholder for actions like "Unassign" or "Payment"
    return null; 
};

export const ShareManagerPage = () => {
    const { data: assetsResponse } = useGetAssetsQuery();
    const assets = assetsResponse?.data || [];
    
    // Default to first asset if available
    const [selectedAssetId, setSelectedAssetId] = useState("");
    
    useEffect(() => {
        if (!selectedAssetId && assets.length > 0) {
            setSelectedAssetId(assets[0]._id);
        }
    }, [assets, selectedAssetId]);

    const { 
        data: shareAccountsResponse, 
        isLoading: sharesLoading, 
        refetch: refetchShares 
    } = useGetShareAccountsByAssetQuery(selectedAssetId, { skip: !selectedAssetId });

    const { data: usersResponse } = useGetUsersQuery();
    const users = usersResponse?.data || [];

    const [assignShare, { isLoading: isAssigning }] = useAssignShareMutation();
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [selectedShareId, setSelectedShareId] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState("");

    const shareRows = (shareAccountsResponse?.data || []).map((share) => ({
        id: share._id,
        shareNumber: share.shareNumber,
        assignedUser: share.assignedUserId?.firstName 
            ? `${share.assignedUserId.firstName} ${share.assignedUserId.lastName}` 
            : (share.assignedUserId || "Unassigned"), // Handle if populate is not working or if unassigned
        assignedAt: share.assignedAt ? new Date(share.assignedAt).toLocaleDateString() : "-",
        status: share.status,
        raw: share
    }));

    const handleAssignClick = () => {
        // This is a bit complex as we need to select a share to assign. 
        // For simplicity, let's just show the table and maybe have an action on the row.
        // But the requirement says "Manual share assignment".
        // Let's assume the user clicks a row or a button to assign.
        // Better yet, add an "Assign" button to rows that are "inactive" or "available".
    };
    
    const onAssignSubmit = async () => {
        if (!selectedShareId || !selectedUserId) return;
        try {
            await assignShare({
                shareAccountId: selectedShareId,
                userId: selectedUserId
            }).unwrap();
            setIsAssignDialogOpen(false);
            setSelectedShareId(null);
            setSelectedUserId("");
            refetchShares();
        } catch (error) {
            console.error("Failed to assign share:", error);
        }
    };

    // Update columns to include an Assign button
    const columnsWithAction = [
        ...shareColumns,
        {
            id: "assign_action",
            header: "Action",
            cell: ({ row }) => {
                if (row.original.status !== "active") {
                    return (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                                setSelectedShareId(row.original.id);
                                setIsAssignDialogOpen(true);
                            }}
                        >
                            <UserPlus className="h-4 w-4 mr-1" /> Assign
                        </Button>
                    );
                }
                return null;
            }
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Share Management</h1>
                    <p className="text-muted-foreground">Monitor and assign shares to investors.</p>
                </div>
                <div className="flex items-center gap-2">
                     <Button variant="outline" size="icon" onClick={refetchShares} disabled={sharesLoading || !selectedAssetId}>
                        <RefreshCcw className={`h-4 w-4 ${sharesLoading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="px-6 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                         <CardTitle>Asset Shares</CardTitle>
                         <div className="w-full md:w-64">
                            <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Asset" />
                                </SelectTrigger>
                                <SelectContent>
                                    {assets.map(asset => (
                                        <SelectItem key={asset._id} value={asset._id}>{asset.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                         </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columnsWithAction}
                        data={shareRows}
                        searchKey="shareNumber"
                        emptyMessage={sharesLoading ? "Loading shares..." : (!selectedAssetId ? "Select an asset to view shares." : "No shares found.")}
                    />
                </CardContent>
            </Card>

            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Share to Investor</DialogTitle>
                        <DialogDescription>
                            Select an investor to assign this share to.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                         <div className="space-y-2">
                            <Label>Investor</Label>
                            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Investor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map(user => (
                                        <SelectItem key={user._id} value={user._id}>
                                            {user.firstName} {user.lastName} ({user.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                         </div>
                         <Button onClick={onAssignSubmit} disabled={isAssigning || !selectedUserId} className="w-full">
                            {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Assignment
                         </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
