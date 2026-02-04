import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Boxes, CreditCard, ShieldCheck, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DataTable } from "@/components/ui/dataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useGetProfitSummaryQuery,
  useGetAssetsQuery,
  useGetAuditLogsQuery,
  useGetAllWithdrawalsQuery,
  useGetShareAccountsByAssetQuery,
  useCreateAssetMutation,
  useCreateAssetProfitMutation,
  useGetUsersQuery,
} from "@/features/api/apiSlice";

const assetColumns = [
  { accessorKey: "name", header: "Asset" },
  { accessorKey: "price", header: "Price/Share" },
  { accessorKey: "shares", header: "Share Count" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge variant="secondary">{row.original.status}</Badge>,
  },
];

const shareColumns = [
  { accessorKey: "shareNumber", header: "Share #" },
  { accessorKey: "assignedUserId", header: "Investor" },
  { accessorKey: "assignedAt", header: "Assigned At" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "active" ? "secondary" : "outline"}>
        {row.original.status}
      </Badge>
    ),
  },
];

const withdrawalColumns = [
  { accessorKey: "userId", header: "Investor" },
  { accessorKey: "amount", header: "Amount" },
  { accessorKey: "createdAt", header: "Date" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge>,
  },
];

const auditColumns = [
  { accessorKey: "actorRole", header: "Admin" },
  { accessorKey: "action", header: "Action" },
  { accessorKey: "oldValue", header: "Old" },
  { accessorKey: "newValue", header: "New" },
];

const userColumns = [
  { accessorKey: "name", header: "Investor" },
  { accessorKey: "email", header: "Email" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "verified" ? "secondary" : "outline"}>
        {row.original.status}
      </Badge>
    ),
  },
];

export const AdminPanelPage = () => {
  const { data: profitSummary, isLoading: profitLoading } = useGetProfitSummaryQuery();
  const { data: assetsResponse, isLoading: assetsLoading } = useGetAssetsQuery();
  const { data: auditResponse, isLoading: auditLoading } = useGetAuditLogsQuery();
  const { data: withdrawalsResponse, isLoading: withdrawalsLoading } = useGetAllWithdrawalsQuery();
  const { data: usersResponse, isLoading: usersLoading } = useGetUsersQuery();
  const [createAsset, { isLoading: creatingAsset }] = useCreateAssetMutation();
  const [createAssetProfit, { isLoading: creatingProfit }] = useCreateAssetProfitMutation();

  const assets = assetsResponse?.data || [];
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const { data: shareAccountsResponse, isLoading: sharesLoading } = useGetShareAccountsByAssetQuery(
    selectedAssetId,
    { skip: !selectedAssetId }
  );

  useEffect(() => {
    if (!selectedAssetId && assets.length > 0) {
      setSelectedAssetId(assets[0]._id);
    }
  }, [assets, selectedAssetId]);

  const analyticsCards = [
    {
      label: "Total Profit Input",
      value: profitSummary?.data?.totalInput ?? "-",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      label: "Total Distributed",
      value: profitSummary?.data?.totalDistributed ?? "-",
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      label: "Company Profit",
      value: profitSummary?.data?.companyProfit ?? "-",
      icon: <ShieldCheck className="h-4 w-4" />,
    },
    {
      label: "User Profit",
      value: profitSummary?.data?.userProfit ?? "-",
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: "Total Assets",
      value: assets.length,
      icon: <Boxes className="h-4 w-4" />,
    },
    {
      label: "Total Investors",
      value: usersResponse?.data?.length ?? "-",
      icon: <Users className="h-4 w-4" />,
    },
  ];

  const assetRows = assets.map((asset) => ({
    name: asset.name,
    price: `$${asset.sharePrice}`,
    shares: asset.totalShares,
    status: asset.status,
  }));

  const shareRows = (shareAccountsResponse?.data || []).map((share) => ({
    shareNumber: share.shareNumber,
    assignedUserId: share.assignedUserId || "Unassigned",
    assignedAt: share.assignedAt ? new Date(share.assignedAt).toLocaleDateString() : "-",
    status: share.status,
  }));

  const withdrawalRows = (withdrawalsResponse?.data || []).map((item) => ({
    userId: item.userId,
    amount: `$${item.amount}`,
    createdAt: new Date(item.createdAt).toLocaleDateString(),
    status: item.status,
  }));

  const auditRows = (auditResponse?.data || []).map((log) => ({
    actorRole: log.actorRole || "System",
    action: log.action,
    oldValue: log.before ? JSON.stringify(log.before) : "-",
    newValue: log.after ? JSON.stringify(log.after) : "-",
  }));

  const userRows = (usersResponse?.data || []).map((user) => ({
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    status: user.isVerified ? "verified" : "pending",
  }));

  const assetFormSchema = z.object({
    name: z.string().min(2),
    totalShares: z.coerce.number().int().min(1),
    sharePrice: z.coerce.number().min(0),
  });

  const profitFormSchema = z.object({
    assetId: z.string().min(1),
    monthKey: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    amount: z.coerce.number().min(0.01),
  });

  const assetForm = useForm({ resolver: zodResolver(assetFormSchema) });
  const profitForm = useForm({ resolver: zodResolver(profitFormSchema) });

  const selectedAsset = assets.find((item) => item._id === profitForm.watch("assetId"));
  const profitAmount = Number(profitForm.watch("amount")) || 0;
  const monthKey = profitForm.watch("monthKey");
  const daysInMonth = monthKey
    ? new Date(Number(monthKey.slice(0, 4)), Number(monthKey.slice(5, 7)), 0).getDate()
    : 0;
  const dailyProfitPreview =
    selectedAsset && daysInMonth > 0
      ? (profitAmount / selectedAsset.totalShares / daysInMonth).toFixed(2)
      : "0.00";

  const tabs = useMemo(
    () => [
      { value: "analytics", label: "Analytics" },
      { value: "assets", label: "Assets" },
      { value: "shares", label: "Share Assignment" },
      { value: "withdrawals", label: "Withdrawals" },
      { value: "audit", label: "Audit Logs" },
      { value: "users", label: "Users" },
    ],
    []
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Tabs defaultValue="analytics">
        <TabsList className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {analyticsCards.map((card) => (
              <Card key={card.label}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="rounded-md bg-muted p-2 text-muted-foreground">
                      {card.icon}
                    </span>
                    {card.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {profitLoading ? "Loading..." : card.value}
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Monthly Profit Input</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                onSubmit={profitForm.handleSubmit(async (values) => {
                  await createAssetProfit(values).unwrap();
                  profitForm.reset();
                })}
                className="grid gap-4 md:grid-cols-3"
              >
                <div>
                  <Label>Asset</Label>
                  <select
                    className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    {...profitForm.register("assetId")}
                  >
                    <option value="">Select asset</option>
                    {assets.map((asset) => (
                      <option key={asset._id} value={asset._id}>
                        {asset.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Month (YYYY-MM)</Label>
                  <Input {...profitForm.register("monthKey")} placeholder="2026-02" />
                </div>
                <div>
                  <Label>Profit Amount</Label>
                  <Input type="number" step="0.01" {...profitForm.register("amount")} />
                </div>
                <div className="md:col-span-3">
                  <div className="rounded-md bg-muted p-3 text-sm">
                    Daily Profit/Share Preview: <strong>${dailyProfitPreview}</strong>
                  </div>
                </div>
                <Button type="submit" disabled={creatingProfit}>
                  {creatingProfit ? "Submitting..." : "Submit Profit"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Asset</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={assetForm.handleSubmit(async (values) => {
                  await createAsset(values).unwrap();
                  assetForm.reset();
                })}
                className="grid gap-4 md:grid-cols-3"
              >
                <div>
                  <Label>Name</Label>
                  <Input {...assetForm.register("name")} />
                </div>
                <div>
                  <Label>Total Shares</Label>
                  <Input type="number" {...assetForm.register("totalShares")} />
                </div>
                <div>
                  <Label>Share Price</Label>
                  <Input type="number" step="0.01" {...assetForm.register("sharePrice")} />
                </div>
                <Button type="submit" disabled={creatingAsset}>
                  {creatingAsset ? "Saving..." : "Create Asset"}
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Asset Management</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={assetColumns}
                data={assetRows}
                searchKey="name"
                emptyMessage={assetsLoading ? "Loading..." : "No assets found"}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shares" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Share Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label>Select Asset</Label>
                <select
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={selectedAssetId}
                  onChange={(event) => setSelectedAssetId(event.target.value)}
                >
                  <option value="">Select asset</option>
                  {assets.map((asset) => (
                    <option key={asset._id} value={asset._id}>
                      {asset.name}
                    </option>
                  ))}
                </select>
              </div>
              <DataTable
                columns={shareColumns}
                data={shareRows}
                searchKey="assignedUserId"
                emptyMessage={sharesLoading ? "Loading..." : "No share accounts found"}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={withdrawalColumns}
                data={withdrawalRows}
                searchKey="userId"
                emptyMessage={withdrawalsLoading ? "Loading..." : "No withdrawals found"}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={auditColumns}
                data={auditRows}
                searchKey="actorRole"
                emptyMessage={auditLoading ? "Loading..." : "No audit logs found"}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Investors</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={userColumns}
                data={userRows}
                searchKey="name"
                emptyMessage={usersLoading ? "Loading..." : "No users found"}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
