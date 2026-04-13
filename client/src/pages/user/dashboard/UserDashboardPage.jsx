import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Building2,
  CalendarDays,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  useGetAssetsQuery,
  useGetMyInvestorDashboardSnapshotQuery,
  useGetMyShareAccountsQuery,
} from "@/features/api/apiSlice";
import { Link } from "react-router-dom";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const toMonthLabel = (monthKey) => {
  if (!monthKey) return "-";
  const [year, month] = String(monthKey).split("-");
  if (!year || !month) return monthKey;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short" });
};

export const UserDashboardPage = () => {
  const { data: snapshotResponse, isLoading: snapshotLoading } = useGetMyInvestorDashboardSnapshotQuery();
  const { data: assetsResponse } = useGetAssetsQuery();
  const { data: sharesResponse } = useGetMyShareAccountsQuery();
  const snapshot = snapshotResponse?.data || {};
  const walletBalance = snapshot?.wallet?.balance ?? 0;
  const assets = assetsResponse?.data || [];
  const shareAccounts = sharesResponse?.data || [];

  const activeShares = shareAccounts.filter((share) => share.status === "active").length;
  const totalShares = shareAccounts.length;
  const progress = totalShares ? Math.round((activeShares / totalShares) * 100) : 0;

  const monthlyTrend = (snapshot?.monthlyTrend || []).map((row) => ({
    month: toMonthLabel(row.monthKey),
    amount: Number(row.amount || 0),
  }));

  const assetBreakdown = snapshot?.assetBreakdown || [];
  const cards = snapshot?.cards || {};

  return (
    <div className="space-y-6 pb-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white">
          <CardHeader>
            <CardTitle className="text-sm text-slate-200">Wallet Balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-semibold">
              {snapshotLoading ? "Loading..." : formatCurrency(walletBalance)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" className="w-full" asChild>
                <Link to="/withdrawals">Withdraw</Link>
              </Button>
              <Button variant="secondary" className="w-full" asChild>
                <Link to="/wallet">Deposit</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Gross (Asset Total)",
            value: formatCurrency(cards.grossAssetTotal),
            icon: <BarChart3 className="h-4 w-4" />,
          },
          {
            label: "Expense (Asset Total)",
            value: formatCurrency(cards.expenseAssetTotal),
            icon: <Activity className="h-4 w-4" />,
          },
          {
            label: "Net (Asset Total)",
            value: formatCurrency(cards.netAssetTotal),
            icon: <Wallet className="h-4 w-4" />,
          },
          {
            label: "Your Monthly Profit",
            value: formatCurrency(cards.investorMonthlyShare),
            icon: <CalendarDays className="h-4 w-4" />,
          },
          {
            label: "Your Lifetime Profit",
            value: formatCurrency(cards.investorLifetimeShare),
            icon: <TrendingUp className="h-4 w-4" />,
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                {item.icon}
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{item.value}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Investment Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Active Investments</span>
            <span className="font-medium">{activeShares}/{totalShares} Shares</span>
          </div>
          <Progress value={progress} />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress}% portfolio active</span>
            <span>{formatCurrency(cards.investorMonthlyShare)} earned this month</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asset-Wise Earnings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {assetBreakdown.slice(0, 6).map((asset) => (
            <div key={asset.assetId} className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <div className="font-medium">{asset.assetName}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> {asset.category || "Asset"} • Ownership {asset.ownershipPercentage}%
                </div>
              </div>
              <div className="text-right text-xs">
                <p>Daily: {formatCurrency(asset.dailyEarning)}</p>
                <p>Monthly: {formatCurrency(asset.monthlyEarning)}</p>
                <p>Lifetime: {formatCurrency(asset.lifetimeEarning)}</p>
              </div>
            </div>
          ))}
          {assetBreakdown.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No asset-wise earnings found yet. Start investing from marketplace.
              <div className="mt-2">
                <Button size="sm" asChild>
                  <Link to="/marketplace">Explore Marketplace</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Assets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {assets.slice(0, 3).map((asset) => (
            <div key={asset._id} className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <div className="font-medium">{asset.name}</div>
                <div className="text-xs text-muted-foreground">
                  {asset.category || "Asset"} • ${asset.sharePrice} per share
                </div>
              </div>
              <Button size="sm" asChild>
                <Link to="/marketplace">Invest</Link>
              </Button>
            </div>
          ))}
          {assets.length === 0 && <div className="text-sm text-muted-foreground">No assets available.</div>}
        </CardContent>
      </Card>
    </div>
  );
};
