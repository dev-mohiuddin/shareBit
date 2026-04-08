import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, ShieldCheck, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const iconByIndex = [
  <Building2 key="asset" className="h-4 w-4" />,
  <TrendingUp key="roi" className="h-4 w-4" />,
  <ShieldCheck key="trust" className="h-4 w-4" />,
];

export const HeroSection = ({ metrics }) => {
  return (
    <section id="overview" className="relative overflow-hidden border-b border-border/60">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.1),_transparent_55%)]" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 md:py-20 lg:grid-cols-[1.25fr,0.75fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-6"
        >
          <Badge variant="secondary" className="w-fit text-xs">
            Institutional Workflow, Retail Accessibility
          </Badge>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Invest in verified assets with confidence and full operational clarity.
            </h1>
            <p className="text-base text-muted-foreground md:text-lg">
              ShareBit combines asset-backed opportunities, transparent profit distribution, and controlled withdrawal operations in one platform.
            </p>
            <p className="text-sm text-muted-foreground">
              ShareBit আপনাকে যাচাইকৃত অ্যাসেটে বিনিয়োগ, স্বচ্ছ মুনাফা হিসাব এবং নিরাপদ উত্তোলন ব্যবস্থাপনা একসাথে দেয়।
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/register">
                Start Investing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/login">View Investor Dashboard</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <Card className="border-border/70 bg-card/80 shadow-lg">
            <CardContent className="space-y-3 p-5">
              {metrics.map((metric, index) => (
                <div key={metric.label} className="rounded-md border border-border/60 p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-md bg-muted p-1.5 text-foreground">
                      {iconByIndex[index % iconByIndex.length]}
                    </span>
                    {metric.label}
                  </div>
                  <div className="text-2xl font-semibold">{metric.value}</div>
                  <p className="text-xs text-muted-foreground">{metric.labelBn}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};
