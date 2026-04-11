import { useState } from "react";
import { Building2, Coins, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export const PlatformSettingsSection = () => {
  const { toast } = useToast();
  const [platform, setPlatform] = useState({
    companyName: "ShareBit Holdings",
    supportEmail: "support@sharebit.app",
    supportPhone: "+880 1700 000000",
    timezone: "Asia/Dhaka",
    baseCurrency: "BDT",
    defaultWithdrawalFee: "2.5",
    minimumWithdrawal: "500",
    monthlyProfitCutoffDay: "25",
    legalDisclaimer:
      "All investment returns are subject to asset performance and platform distribution schedules.",
  });

  const setField = (key, value) => {
    setPlatform((previous) => ({ ...previous, [key]: value }));
  };

  const handleSave = () => {
    toast({
      title: "Platform config saved",
      description: "Platform settings are running as frontend demo state in this phase.",
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Configuration
          </CardTitle>
          <CardDescription>Core business details used across documents and admin workflows.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={platform.companyName}
                onChange={(event) => setField("companyName", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={platform.supportEmail}
                onChange={(event) => setField("supportEmail", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportPhone">Support Phone</Label>
              <Input
                id="supportPhone"
                value={platform.supportPhone}
                onChange={(event) => setField("supportPhone", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={platform.timezone}
                onChange={(event) => setField("timezone", event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="Asia/Dhaka">Asia/Dhaka</option>
                <option value="Asia/Kolkata">Asia/Kolkata</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="baseCurrency">Base Currency</Label>
              <select
                id="baseCurrency"
                value={platform.baseCurrency}
                onChange={(event) => setField("baseCurrency", event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="BDT">BDT</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="legalDisclaimer">Legal Disclaimer</Label>
            <Textarea
              id="legalDisclaimer"
              value={platform.legalDisclaimer}
              onChange={(event) => setField("legalDisclaimer", event.target.value)}
            />
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Organization Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Finance Defaults
          </CardTitle>
          <CardDescription>Default rules used by payout and accounting modules.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultWithdrawalFee">Withdrawal Fee (%)</Label>
            <Input
              id="defaultWithdrawalFee"
              type="number"
              step="0.1"
              value={platform.defaultWithdrawalFee}
              onChange={(event) => setField("defaultWithdrawalFee", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="minimumWithdrawal">Minimum Withdrawal</Label>
            <Input
              id="minimumWithdrawal"
              type="number"
              value={platform.minimumWithdrawal}
              onChange={(event) => setField("minimumWithdrawal", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyProfitCutoffDay">Monthly Profit Cutoff Day</Label>
            <Input
              id="monthlyProfitCutoffDay"
              type="number"
              min={1}
              max={31}
              value={platform.monthlyProfitCutoffDay}
              onChange={(event) => setField("monthlyProfitCutoffDay", event.target.value)}
            />
          </div>

          <div className="rounded-md border p-3 text-xs text-muted-foreground">
            <p className="inline-flex items-center gap-1 font-medium text-foreground">
              <Coins className="h-3.5 w-3.5" />
              Preview calculation
            </p>
            <p className="mt-1">
              A {platform.defaultWithdrawalFee}% fee will be applied when withdrawal amount is at least {platform.minimumWithdrawal} {platform.baseCurrency}.
            </p>
          </div>

          <Button variant="outline" className="w-full" onClick={handleSave}>
            Save Finance Defaults
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformSettingsSection;
