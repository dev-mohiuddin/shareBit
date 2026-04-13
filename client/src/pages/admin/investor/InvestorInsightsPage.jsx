import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Activity,
  BarChart3,
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCcw,
  Users,
  Wallet,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  useCreateInvestorByAdminMutation,
  useGetAssetsQuery,
  useGetUsersQuery,
  useGetShareAccountsByAssetQuery,
  useLazyGetSharePaymentsQuery,
  useUpdateInvestorByAdminMutation,
} from "@/features/api/apiSlice";
import { useAppSelector } from "@/app/hooks";
import { ConfirmationDialog } from "@/components/dialogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getSharePaymentMetrics,
  sumPaymentsUntilDate,
} from "@/lib/adminFinance";

const createInvestorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
});

const editInvestorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
});

const getInvestorIdentity = (assignedUser) => {
  if (!assignedUser) return null;
  if (typeof assignedUser === "string") {
    return {
      id: assignedUser,
      name: assignedUser,
      email: "-",
    };
  }

  const name = `${assignedUser.firstName || ""} ${assignedUser.lastName || ""}`.trim();
  return {
    id: assignedUser._id || assignedUser.email,
    name: name || assignedUser.email || "Investor",
    email: assignedUser.email || "-",
  };
};

const getRoleName = (user) => user?.roleName || user?.roleId?.name || "";

export const InvestorInsightsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const authUser = useAppSelector((state) => state.auth.user);
  const canCreateInvestor = useMemo(() => {
    const permissions = authUser?.permissions || [];
    return (
      permissions.includes("*") ||
      permissions.includes("platform.user:create") ||
      permissions.includes("user:create")
    );
  }, [authUser?.permissions]);

  const { data: assetsResponse } = useGetAssetsQuery();
  const {
    data: usersResponse,
    isFetching: isFetchingUsers,
    refetch: refetchUsers,
  } = useGetUsersQuery();
  const [createInvestorByAdmin, { isLoading: isCreatingInvestor }] =
    useCreateInvestorByAdminMutation();
  const [updateInvestorByAdmin, { isLoading: isUpdatingInvestor }] =
    useUpdateInvestorByAdminMutation();

  const assets = useMemo(() => assetsResponse?.data || [], [assetsResponse?.data]);
  const users = useMemo(() => usersResponse?.data || [], [usersResponse?.data]);

  const [isCreateInvestorDialogOpen, setIsCreateInvestorDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState(null);
  const [isCreateConfirmOpen, setIsCreateConfirmOpen] = useState(false);
  const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
  const [pendingCreateValues, setPendingCreateValues] = useState(null);
  const [pendingEditValues, setPendingEditValues] = useState(null);

  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [paymentMap, setPaymentMap] = useState({});
  const [isSyncingPayments, setIsSyncingPayments] = useState(false);
  const [selectedInvestorId, setSelectedInvestorId] = useState("");

  const createInvestorForm = useForm({
    resolver: zodResolver(createInvestorSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      country: "",
    },
  });

  const editInvestorForm = useForm({
    resolver: zodResolver(editInvestorSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      country: "",
    },
  });

  const investorAccounts = useMemo(
    () =>
      users
        .filter((user) => {
          const roleName = String(getRoleName(user)).toLowerCase();
          return roleName.includes("investor") || roleName.includes("user");
        })
        .map((user) => ({
          approvalStatus: user.investorProfile?.approval?.status || null,
          id: user._id || user.id,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          name:
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.name ||
            "Investor",
          email: user.email || "-",
          phone: user.phone || "-",
          country: user.country || "-",
          roleName: getRoleName(user) || "Investor",
          status:
            user.investorStatus ||
            (user.investorProfile?.approval?.status === "on-hold"
              ? "on-hold"
              : user.investorProfile?.approval?.status === "rejected"
                ? "rejected"
                : user.investorProfile?.approval?.status === "submitted"
                  ? "pending-approval"
                  : user.isActive
                    ? user.isVerified
                      ? "active"
                      : "pending"
                    : "inactive"),
          joinedAt: user.createdAt,
        })),
    [users]
  );

  const openEditDialog = (investor) => {
    setEditingInvestor(investor);
    editInvestorForm.reset({
      firstName: investor.firstName || "",
      lastName: investor.lastName || "",
      phone: investor.phone === "-" ? "" : investor.phone || "",
      country: investor.country === "-" ? "" : investor.country || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleCreateInvestor = async (values) => {
    try {
      await createInvestorByAdmin({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        password: values.password,
        phone: values.phone?.trim() || undefined,
        country: values.country?.trim() || undefined,
      }).unwrap();

      toast({
        title: "Investor created",
        description: "New investor account is ready to login.",
      });

      createInvestorForm.reset();
      setIsCreateInvestorDialogOpen(false);
      setIsCreateConfirmOpen(false);
      setPendingCreateValues(null);
      refetchUsers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Creation failed",
        description: error?.data?.message || "Could not create investor account.",
      });
    }
  };

  const handleEditInvestor = async (values) => {
    if (!editingInvestor?.id) return;

    try {
      await updateInvestorByAdmin({
        investorId: editingInvestor.id,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone?.trim() || "",
        country: values.country?.trim() || "",
      }).unwrap();

      toast({
        title: "Investor updated",
        description: "Investor profile information has been updated.",
      });
      setIsEditDialogOpen(false);
      setIsEditConfirmOpen(false);
      setPendingEditValues(null);
      setEditingInvestor(null);
      refetchUsers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error?.data?.message || "Could not update investor profile.",
      });
    }
  };

  const openCreateConfirm = (values) => {
    setPendingCreateValues(values);
    setIsCreateConfirmOpen(true);
  };

  const openEditConfirm = (values) => {
    setPendingEditValues(values);
    setIsEditConfirmOpen(true);
  };

  const confirmCreateInvestor = async () => {
    if (!pendingCreateValues) return;
    await handleCreateInvestor(pendingCreateValues);
  };

  const confirmEditInvestor = async () => {
    if (!pendingEditValues) return;
    await handleEditInvestor(pendingEditValues);
  };

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

  const shareAccounts = useMemo(() => shareAccountsResponse?.data || [], [shareAccountsResponse?.data]);
  const [fetchSharePayments] = useLazyGetSharePaymentsQuery();

  const syncPayments = useCallback(
    async (shares) => {
      if (!Array.isArray(shares) || shares.length === 0) {
        setPaymentMap({});
        return;
      }

      setIsSyncingPayments(true);
      const entries = await Promise.all(
        shares.map(async (share) => {
          if (!share.assignedUserId) return [share._id, []];
          try {
            const response = await fetchSharePayments(share._id, true).unwrap();
            return [share._id, response?.data || []];
          } catch {
            return [share._id, []];
          }
        })
      );

      const nextMap = {};
      entries.forEach(([shareId, payments]) => {
        nextMap[shareId] = payments;
      });
      setPaymentMap(nextMap);
      setIsSyncingPayments(false);
    },
    [fetchSharePayments]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    syncPayments(shareAccounts);
  }, [shareAccounts, syncPayments]);

  const investorRows = useMemo(() => {
    const sharePrice = selectedAsset?.sharePrice || 0;
    const map = new Map();

    shareAccounts.forEach((share) => {
      if (!share.assignedUserId) return;

      const identity = getInvestorIdentity(share.assignedUserId);
      if (!identity) return;

      const payments = paymentMap[share._id] || [];
      const paidAmount = sumPaymentsUntilDate(payments, new Date());
      const metrics = getSharePaymentMetrics({ paidAmount, sharePrice });

      if (!map.has(identity.id)) {
        map.set(identity.id, {
          id: identity.id,
          name: identity.name,
          email: identity.email,
          shareCount: 0,
          fullyPaidShares: 0,
          totalPaid: 0,
          totalContract: 0,
          averageOwnership: 0,
          ownershipAccumulator: 0,
          latestPaymentAt: null,
        });
      }

      const row = map.get(identity.id);
      row.shareCount += 1;
      row.totalPaid += metrics.paidAmount;
      row.totalContract += sharePrice;
      row.ownershipAccumulator += metrics.ownershipPercentage;
      if (metrics.isFullyPaid) row.fullyPaidShares += 1;

      const latestSharePayment = payments[payments.length - 1];
      if (latestSharePayment?.paidAt) {
        const paidAt = new Date(latestSharePayment.paidAt).toISOString();
        if (!row.latestPaymentAt || paidAt > row.latestPaymentAt) {
          row.latestPaymentAt = paidAt;
        }
      }
    });

    const rows = Array.from(map.values()).map((row) => ({
      ...row,
      averageOwnership: row.shareCount > 0 ? Number((row.ownershipAccumulator / row.shareCount).toFixed(2)) : 0,
      paymentRatio: row.totalContract > 0 ? Number(((row.totalPaid / row.totalContract) * 100).toFixed(2)) : 0,
    }));

    return rows.sort((a, b) => b.totalPaid - a.totalPaid);
  }, [paymentMap, selectedAsset?.sharePrice, shareAccounts]);

  const activeInvestorId = selectedInvestorId || investorRows[0]?.id || "";

  const selectedInvestor = useMemo(
    () => investorRows.find((row) => row.id === activeInvestorId) || null,
    [activeInvestorId, investorRows]
  );

  const chartData = useMemo(
    () =>
      investorRows.slice(0, 8).map((row) => ({
        name: row.name,
        paid: Number(row.totalPaid.toFixed(2)),
        ownership: row.averageOwnership,
      })),
    [investorRows]
  );

  const summary = useMemo(() => {
    const totalPaid = investorRows.reduce((sum, row) => sum + row.totalPaid, 0);
    const totalContract = investorRows.reduce((sum, row) => sum + row.totalContract, 0);
    const avgOwnership = investorRows.length
      ? Number(
          (
            investorRows.reduce((sum, row) => sum + row.averageOwnership, 0) /
            investorRows.length
          ).toFixed(2)
        )
      : 0;

    return {
      investorCount: investorRows.length,
      totalPaid,
      totalContract,
      avgOwnership,
    };
  }, [investorRows]);

  const recentPayments = useMemo(() => {
    const rows = [];

    shareAccounts.forEach((share) => {
      const payments = paymentMap[share._id] || [];
      const identity = getInvestorIdentity(share.assignedUserId);
      if (!identity) return;

      payments.forEach((payment) => {
        rows.push({
          id: payment._id,
          investorName: identity.name,
          shareNumber: share.shareNumber,
          amount: payment.amount,
          paidAt: payment.paidAt,
          createdAt: payment.createdAt,
        });
      });
    });

    return rows
      .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
      .slice(0, 10);
  }, [paymentMap, shareAccounts]);

  const refreshAll = async () => {
    const result = await refetchShares();
    const latest = result?.data?.data || [];
    await syncPayments(latest);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-slate-50">
        <p className="text-sm text-slate-300">Portfolio Intelligence</p>
        <h1 className="mt-1 text-2xl font-semibold">Investor Insights</h1>
        <p className="mt-2 text-sm text-slate-300">
          Analyze investor contribution, payment coverage, and ownership maturity per asset.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Investors</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-2xl font-semibold">
            {summary.investorCount}
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Paid</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-2xl font-semibold">
            {formatCurrency(summary.totalPaid)}
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Contract Value</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-2xl font-semibold">
            {formatCurrency(summary.totalContract)}
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Ownership</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-2xl font-semibold">
            {summary.avgOwnership}%
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Investor Management</CardTitle>
            <CardDescription>
              Create investor accounts from admin panel and review all investor profiles.
            </CardDescription>
          </div>

          <Dialog open={isCreateInvestorDialogOpen} onOpenChange={setIsCreateInvestorDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!canCreateInvestor}>
                <Plus className="mr-2 h-4 w-4" />
                Add Investor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Investor Account</DialogTitle>
                <DialogDescription>
                  Admin-created investors are verified instantly and can login immediately.
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={createInvestorForm.handleSubmit(openCreateConfirm)}
                className="space-y-4 py-2"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" {...createInvestorForm.register("firstName")} />
                    {createInvestorForm.formState.errors.firstName && (
                      <p className="text-xs text-red-500">
                        {createInvestorForm.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" {...createInvestorForm.register("lastName")} />
                    {createInvestorForm.formState.errors.lastName && (
                      <p className="text-xs text-red-500">
                        {createInvestorForm.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...createInvestorForm.register("email")} />
                  {createInvestorForm.formState.errors.email && (
                    <p className="text-xs text-red-500">{createInvestorForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    {...createInvestorForm.register("password")}
                  />
                  {createInvestorForm.formState.errors.password && (
                    <p className="text-xs text-red-500">
                      {createInvestorForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input id="phone" {...createInvestorForm.register("phone")} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="country">Country (optional)</Label>
                    <Input id="country" {...createInvestorForm.register("country")} />
                  </div>
                </div>

                {!canCreateInvestor && (
                  <p className="text-xs text-amber-600">
                    You do not have permission to create investor accounts.
                  </p>
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={isCreatingInvestor || !canCreateInvestor}>
                    {isCreatingInvestor && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Investor
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Investor Profile</DialogTitle>
                <DialogDescription>
                  Update basic investor information from the action menu.
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={editInvestorForm.handleSubmit(openEditConfirm)}
                className="space-y-4 py-2"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-firstName">First Name</Label>
                    <Input id="edit-firstName" {...editInvestorForm.register("firstName")} />
                    {editInvestorForm.formState.errors.firstName && (
                      <p className="text-xs text-red-500">
                        {editInvestorForm.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-lastName">Last Name</Label>
                    <Input id="edit-lastName" {...editInvestorForm.register("lastName")} />
                    {editInvestorForm.formState.errors.lastName && (
                      <p className="text-xs text-red-500">
                        {editInvestorForm.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input id="edit-phone" {...editInvestorForm.register("phone")} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-country">Country</Label>
                    <Input id="edit-country" {...editInvestorForm.register("country")} />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isUpdatingInvestor}>
                    {isUpdatingInvestor && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investorAccounts.map((investor) => (
                  <TableRow key={investor.id}>
                    <TableCell className="font-medium">{investor.name}</TableCell>
                    <TableCell>{investor.email}</TableCell>
                    <TableCell>{investor.phone}</TableCell>
                    <TableCell>{investor.country}</TableCell>
                    <TableCell>{investor.roleName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          investor.status === "active"
                            ? "default"
                            : investor.status === "inactive" || investor.status === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {investor.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(investor.joinedAt, "-")}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => navigate(`/admin/investors/${investor.id}`)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(investor)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Profile
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}

                {investorAccounts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-20 text-center text-sm text-muted-foreground">
                      {isFetchingUsers ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading investors...
                        </span>
                      ) : (
                        "No investor accounts found yet."
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Investor Contribution Breakdown</CardTitle>
          <CardDescription>
            Data reflects recorded share payments up to now for the selected asset.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[260px,auto]">
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

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={refreshAll}
                disabled={!activeAssetId || isFetchingShares || isSyncingPayments}
              >
                <RefreshCcw className={`mr-2 h-4 w-4 ${isFetchingShares || isSyncingPayments ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="h-72 rounded-lg border bg-muted/20 p-3">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {isFetchingShares || isSyncingPayments ? "Loading chart..." : "No investor payment data available."}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: 8, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="paid" fill="#0f172a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Investor Table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investor</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Coverage</TableHead>
                    <TableHead>Ownership</TableHead>
                    <TableHead>Latest Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investorRows.map((row) => (
                    <TableRow
                      key={row.id}
                      onClick={() => setSelectedInvestorId(row.id)}
                      className={`cursor-pointer ${row.id === activeInvestorId ? "bg-muted/60" : ""}`}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{row.name}</p>
                          <p className="text-xs text-muted-foreground">{row.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{row.shareCount}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(row.totalPaid)}</TableCell>
                      <TableCell>{row.paymentRatio}%</TableCell>
                      <TableCell>{row.averageOwnership}%</TableCell>
                      <TableCell>{formatDate(row.latestPaymentAt)}</TableCell>
                    </TableRow>
                  ))}

                  {investorRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                        {isFetchingShares || isSyncingPayments ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading investors...
                          </span>
                        ) : (
                          "No investor assignments found for this asset."
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selected Investor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedInvestor ? (
              <>
                <div>
                  <p className="text-lg font-semibold">{selectedInvestor.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedInvestor.email}</p>
                </div>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between rounded-md border p-2">
                    <span>Shares Assigned</span>
                    <span className="font-medium">{selectedInvestor.shareCount}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-2">
                    <span>Fully Paid Shares</span>
                    <span className="font-medium">{selectedInvestor.fullyPaidShares}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-2">
                    <span>Total Paid</span>
                    <span className="font-medium">{formatCurrency(selectedInvestor.totalPaid)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-2">
                    <span>Coverage</span>
                    <span className="font-medium">{selectedInvestor.paymentRatio}%</span>
                  </div>
                </div>
                <Badge variant="secondary">
                  Last payment: {formatDate(selectedInvestor.latestPaymentAt, "No payment yet")}
                </Badge>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Select an investor row to see details.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor</TableHead>
                  <TableHead>Share</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead>Recorded At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.investorName}</TableCell>
                    <TableCell>#{row.shareNumber}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(row.amount)}</TableCell>
                    <TableCell>{formatDate(row.paidAt)}</TableCell>
                    <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                  </TableRow>
                ))}
                {recentPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-16 text-center text-sm text-muted-foreground">
                      No payment activity yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={isCreateConfirmOpen}
        onOpenChange={setIsCreateConfirmOpen}
        title="Create investor account?"
        description="The new investor will be verified instantly and can login right away."
        confirmLabel="Create Investor"
        isLoading={isCreatingInvestor}
        onConfirm={confirmCreateInvestor}
      />

      <ConfirmationDialog
        open={isEditConfirmOpen}
        onOpenChange={setIsEditConfirmOpen}
        title="Save investor profile changes?"
        description="This will update basic investor information."
        confirmLabel="Save Changes"
        isLoading={isUpdatingInvestor}
        onConfirm={confirmEditInvestor}
      />
    </div>
  );
};
