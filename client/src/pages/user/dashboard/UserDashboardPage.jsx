import { motion } from "framer-motion";
import {
  BarChart3,
  CreditCard,
  Home,
  PieChart,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useGetWalletQuery, useGetAssetsQuery, useGetMyShareAccountsQuery } from "@/features/api/apiSlice";

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

  return (
    <div className="space-y-6 pb-24">
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
              <Button variant="secondary" className="w-full">
                Withdraw
              </Button>
              <Button variant="outline" className="w-full text-white border-white/30">
                Deposit
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total Profit", value: "$1,120", icon: <BarChart3 className="h-4 w-4" /> },
          { label: "Active Shares", value: activeShares, icon: <PieChart className="h-4 w-4" /> },
          { label: "Security Status", value: "Verified", icon: <ShieldCheck className="h-4 w-4" /> },
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
            <span className="text-muted-foreground">Paid Shares</span>
            <span className="font-medium">{activeShares}/{totalShares}</span>
          </div>
          <Progress value={progress} />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress}% completed</span>
            <span>Next payout in 24 hours</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profitData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Assets</CardTitle>
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
              <Button size="sm">Invest</Button>
            </div>
          ))}
          {assets.length === 0 && <div className="text-sm text-muted-foreground">No assets available.</div>}
        </CardContent>
      </Card>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 px-6 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <button className="flex flex-col items-center gap-1 text-primary">
            <Home className="h-5 w-5" />
            Home
          </button>
          <button className="flex flex-col items-center gap-1">
            <PieChart className="h-5 w-5" />
            Assets
          </button>
          <button className="flex flex-col items-center gap-1">
            <Wallet className="h-5 w-5" />
            Wallet
          </button>
          <button className="flex flex-col items-center gap-1">
            <CreditCard className="h-5 w-5" />
            Profile
          </button>
        </div>
      </nav>
    </div>
  );
};
