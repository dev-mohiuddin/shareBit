import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BellRing, Cog, Palette, ShieldCheck, UserCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppearanceSettingsSection } from "@/pages/admin/settings/sections/AppearanceSettingsSection";
import { NotificationsSettingsSection } from "@/pages/admin/settings/sections/NotificationsSettingsSection";
import { PlatformSettingsSection } from "@/pages/admin/settings/sections/PlatformSettingsSection";
import { ProfileAccountSettingsSection } from "@/pages/admin/settings/sections/ProfileAccountSettingsSection";
import { SecuritySettingsSection } from "@/pages/admin/settings/sections/SecuritySettingsSection";

const tabs = [
  {
    value: "profile",
    label: "Profile & Account",
    icon: UserCircle2,
    description: "Identity, role defaults, and account controls",
  },
  {
    value: "security",
    label: "Security",
    icon: ShieldCheck,
    description: "Authentication and policy enforcement",
  },
  {
    value: "notifications",
    label: "Notifications",
    icon: BellRing,
    description: "Alert channels and event triggers",
  },
  {
    value: "appearance",
    label: "Appearance",
    icon: Palette,
    description: "Theme and interface preference",
  },
  {
    value: "platform",
    label: "Platform",
    icon: Cog,
    description: "Organization and finance defaults",
  },
];

const normalizeTab = (tabValue) => {
  if (!tabValue) return "profile";
  return tabs.some((tab) => tab.value === tabValue) ? tabValue : "profile";
};

export const SettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [profileDirty, setProfileDirty] = useState(false);

  const initialTab = useMemo(() => normalizeTab(searchParams.get("tab")), [searchParams]);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const nextTab = normalizeTab(searchParams.get("tab"));
    setActiveTab(nextTab);
  }, [searchParams]);

  const handleTabChange = (nextTab) => {
    if (activeTab === "profile" && nextTab !== "profile" && profileDirty) {
      const shouldContinue = window.confirm(
        "You have unsaved changes in Profile settings. Switch tab and keep the draft for later?"
      );
      if (!shouldContinue) return;
    }

    setActiveTab(nextTab);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", nextTab);
    setSearchParams(nextParams, { replace: true });
  };

  const currentTab = tabs.find((tab) => tab.value === activeTab);

  return (
    <div className="space-y-6 pb-10">
      <div className="rounded-2xl border bg-gradient-to-r from-slate-950 via-slate-900 to-slate-700 p-6 text-slate-50">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Admin Settings Hub</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Control Preferences & Platform Policy</h1>
            <p className="mt-2 text-sm text-slate-300">
              Manage account preferences, security rules, and configuration defaults from one workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="bg-white/10 text-slate-100 hover:bg-white/20">
              Child Settings Active
            </Badge>
            <Badge variant="secondary" className="bg-white/10 text-slate-100 hover:bg-white/20">
              Demo Functionality Ready
            </Badge>
          </div>
        </div>
      </div>

      {profileDirty && (
        <Alert>
          <AlertTitle>Unsaved profile draft detected</AlertTitle>
          <AlertDescription>
            Your profile tab has unsaved updates. You can switch tabs and continue later without losing draft data.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span>{currentTab?.label || "Settings"}</span>
            <Badge variant="outline">{currentTab?.description || "Workspace settings"}</Badge>
          </CardTitle>
          <CardDescription>
            Use tab-based child settings to manage profile, security, notifications, appearance, and platform defaults.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-4 h-auto w-full justify-start gap-1 overflow-x-auto rounded-lg bg-muted/80 p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex min-w-max items-center gap-2 px-3 py-1.5"
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="profile">
              <ProfileAccountSettingsSection onDirtyChange={setProfileDirty} />
            </TabsContent>
            <TabsContent value="security">
              <SecuritySettingsSection />
            </TabsContent>
            <TabsContent value="notifications">
              <NotificationsSettingsSection />
            </TabsContent>
            <TabsContent value="appearance">
              <AppearanceSettingsSection />
            </TabsContent>
            <TabsContent value="platform">
              <PlatformSettingsSection />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
