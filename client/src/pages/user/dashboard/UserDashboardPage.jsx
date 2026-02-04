import { motion } from "framer-motion";
import {
  BarChart3,
  CreditCard,
  PieChart,
  ShieldCheck,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useGetWalletQuery, useGetAssetsQuery, useGetMyShareAccountsQuery } from "@/features/api/apiSlice";
import { Link } from "react-router-dom";

const profitData = [
  { month: "Jan", value: 420 },
  { month: "Feb", value: 580 },
  { month: "Mar", value: 760 },
  { month: "Apr", value: 820 },
  { month: "May", value: 960 },
  { month: "Jun", value: 1120 },
];

export const UserDashboardPage = () => {
  const { data: walletResponse, isLoading: walletLoading } = useGetWalletQuery();
  const { data: assetsResponse } = useGetAssetsQuery();
  const { data: sharesResponse } = useGetMyShareAccountsQuery();
  const walletBalance = walletResponse?.data?.balance ?? 0;
  const assets = assetsResponse?.data || [];
  const shareAccounts = sharesResponse?.data || [];

  const activeShares = shareAccounts.filter((share) => share.status === "active").length;
  const totalShares = shareAccounts.length;
  const progress = totalShares ? Math.round((activeShares / totalShares) * 100) : 0;
  
  const totalInvested = shareAccounts.reduce((sum, share) => sum + (share.paidAmount || 0), 0);

  return (
    <div className="space-y-6 pb-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white">
          <CardHeader>
            <CardTitle className="text-sm text-slate-200">Wallet Balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-semibold">
              {walletLoading ? "Loading..." : `$${walletBalance}`}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" className="w-full" asChild>
                <Link to="/withdrawals">Withdraw</Link>
              </Button>
              <Button variant="outline" className="w-full text-white border-white/30" asChild>
                <Link to="/wallet">Deposit</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total Invested", value: `$${totalInvested}`, icon: <DollarSign className="h-4 w-4" /> },
          { label: "Total Profit", value: "$1,120", icon: <TrendingUp className="h-4 w-4" /> },
          { label: "Active Shares", value: activeShares, icon: <PieChart className="h-4 w-4" /> },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
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
            <span>Next payout in 24 hours</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profitData}>
                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Assets Summary</CardTitle>
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
