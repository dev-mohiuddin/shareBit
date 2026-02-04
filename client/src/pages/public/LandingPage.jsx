import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Globe,
  Mail,
  MapPin,
  Moon,
  Phone,
  ShieldCheck,
  Sun,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useGetAssetsQuery, useGetProfitSummaryQuery } from "@/features/api/apiSlice";

export const LandingPage = () => {
  const { data: assetsResponse } = useGetAssetsQuery();
  const { data: profitSummary } = useGetProfitSummaryQuery();
  const assets = assetsResponse?.data || [];
  const [isDark, setIsDark] = useState(() =>
    typeof window !== "undefined" ? document.documentElement.classList.contains("dark") : false
  );
  const [shares, setShares] = useState(5);
  const [pricePerShare, setPricePerShare] = useState(250);
  const [roiRate, setRoiRate] = useState(14);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") setIsDark(true);
    if (stored === "light") setIsDark(false);
  }, []);

  const projectedReturn = useMemo(() => {
    const investment = shares * pricePerShare;
    return Math.round(investment * (roiRate / 100));
  }, [shares, pricePerShare, roiRate]);

  const stats = [
    {
      label: "Total Assets",
      value: assets.length,
      icon: <Globe className="h-5 w-5" />,
    },
    {
      label: "Annual ROI",
      value: "14.8%",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      label: "Total Investors",
      value: "2.4k+",
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: "Profit Distributed",
      value: `$${profitSummary?.data?.totalDistributed ?? "-"}`,
      icon: <Wallet className="h-5 w-5" />,
    },
  ];

  const sectionVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <span className="h-2 w-2 rounded-full bg-primary" /> ShareBit
          </div>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#about" className="text-muted-foreground hover:text-foreground">
              About
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground">
              How it works
            </a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground">
              Contact
            </a>
            <a href="#support" className="text-muted-foreground hover:text-foreground">
              Support
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsDark((prev) => !prev)}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button size="sm">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800" />
        <div className="relative mx-auto max-w-6xl px-4 py-20">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div initial="hidden" animate="visible" variants={sectionVariant} className="space-y-6">
              <Badge className="w-fit" variant="secondary">
                Asset Sharing & Investment Platform
              </Badge>
              <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
                Build wealth with verified assets, transparent yields, and daily profit tracking.
              </h1>
              <p className="text-lg text-muted-foreground">
                Own fractional shares in income-generating assets and monitor every payout in real time.
                Designed for modern investors who demand clarity and control.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg">Start Investing</Button>
                <Button size="lg" variant="outline">
                  Explore Assets
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <div className="text-xl font-semibold text-foreground">
                    ${profitSummary?.data?.totalDistributed ?? "-"}
                  </div>
                  Capital deployed
                </div>
                <div>
                  <div className="text-xl font-semibold text-foreground">24/7</div>
                  Portfolio monitoring
                </div>
              </div>
            </motion.div>
            <motion.div initial="hidden" animate="visible" variants={sectionVariant}>
              <Card className="shadow-2xl">
                <CardHeader>
                  <CardTitle>Performance Snapshot</CardTitle>
                  <CardDescription>Live platform highlights</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats.map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between rounded-md border border-border/60 p-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-md bg-muted p-2 text-muted-foreground">{stat.icon}</div>
                        <div>
                          <div className="text-sm text-muted-foreground">{stat.label}</div>
                          <div className="text-lg font-semibold text-foreground">{stat.value}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="rounded-md bg-muted p-4 text-sm">
                    <div className="font-medium">Institutional-grade security</div>
                    <div className="text-muted-foreground">
                      Multi-signature custody, audited financials, and verified assets.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl px-4 py-16">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariant}>
          <div className="mb-10 grid gap-6 lg:grid-cols-[1.2fr,1fr]">
            <div>
              <h2 className="text-3xl font-semibold">About ShareBit</h2>
              <p className="mt-3 text-muted-foreground">
                ShareBit connects investors with revenue-generating assets in transport, real estate,
                and logistics. Our platform combines real-time performance analytics with secure ownership,
                so you can invest with total confidence.
              </p>
            </div>
            <Card className="border border-border/60">
              <CardHeader>
                <CardTitle>Investor Confidence</CardTitle>
                <CardDescription>Designed for consistent returns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Verified assets with transparent yield history</span>
                </div>
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Daily profit tracking and ROI forecasts</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">A growing community of modern investors</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-4 pb-16">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariant}>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">How it works</h2>
              <p className="text-muted-foreground">Three steps to start earning on real assets.</p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { title: "Create your account", text: "Register in minutes and verify your profile." },
              { title: "Choose an asset", text: "Pick from curated assets with transparent ROI." },
              { title: "Earn daily profit", text: "Track earnings and withdraw with ease." },
            ].map((item) => (
              <Card key={item.title} className="border border-border/60">
                <CardHeader>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription>{item.text}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariant}>
          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="border border-border/60">
              <CardHeader>
                <CardTitle>Profit Calculator</CardTitle>
                <CardDescription>Estimate monthly ROI based on share count.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Shares</label>
                  <input
                    type="number"
                    min={1}
                    value={shares}
                    onChange={(e) => setShares(Number(e.target.value))}
                    className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Price per Share</label>
                  <input
                    type="number"
                    min={100}
                    value={pricePerShare}
                    onChange={(e) => setPricePerShare(Number(e.target.value))}
                    className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Expected ROI (%)</label>
                  <input
                    type="number"
                    min={1}
                    value={roiRate}
                    onChange={(e) => setRoiRate(Number(e.target.value))}
                    className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="rounded-md bg-muted p-4">
                  <div className="text-sm text-muted-foreground">Estimated Monthly Profit</div>
                  <div className="text-2xl font-semibold">${projectedReturn}</div>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-6">
              <Card className="border border-border/60">
                <CardHeader>
                  <CardTitle>Featured Opportunities</CardTitle>
                  <CardDescription>Diversify with verified assets across sectors.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {assets.slice(0, 3).map((asset) => {
                    const available = asset.availableShares ?? asset.totalShares;
                    const total = asset.totalShares;
                    const progress = total ? Math.round(((total - available) / total) * 100) : 0;
                    return (
                      <div key={asset._id} className="rounded-md border border-border/60 p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{asset.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {asset.category || "Asset"} • ${asset.sharePrice} per share
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            Invest
                          </Button>
                        </div>
                        <div className="mt-3">
                          <Progress value={progress} />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{available} shares left</span>
                          <span>{progress}% filled</span>
                        </div>
                      </div>
                    );
                  })}
                  {assets.length === 0 && (
                    <div className="text-sm text-muted-foreground">No assets available yet.</div>
                  )}
                </CardContent>
              </Card>
              <Card className="border border-border/60">
                <CardHeader>
                  <CardTitle>Trust & Security</CardTitle>
                  <CardDescription>Institutional-grade protection for every investor.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  {[
                    "End-to-end encryption",
                    "KYC verified onboarding",
                    "Regulatory compliant",
                    "24/7 investor support",
                  ].map((text) => (
                    <div key={text} className="rounded-md border border-border/60 p-4 text-sm">
                      {text}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="contact" className="mx-auto max-w-6xl px-4 pb-16">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariant}>
          <Card className="border border-border/60">
            <CardHeader>
              <CardTitle>Contact</CardTitle>
              <CardDescription>Reach our investment concierge team.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" /> +880 1234 567 890
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" /> support@sharebit.com
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" /> Dhaka, Bangladesh
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      <section id="support" className="mx-auto max-w-6xl px-4 pb-16">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariant}>
          <Card className="border border-border/60">
            <CardHeader>
              <CardTitle>Support</CardTitle>
              <CardDescription>We are always here for you.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-md border border-border/60 p-4">
                <div className="font-medium">Investor Helpdesk</div>
                <div className="text-sm text-muted-foreground">Get personalized guidance for your portfolio.</div>
              </div>
              <div className="rounded-md border border-border/60 p-4">
                <div className="font-medium">Security Center</div>
                <div className="text-sm text-muted-foreground">Learn how we keep your investments safe.</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      <footer className="border-t border-border/60 bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row">
          <span>© 2026 ShareBit. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
