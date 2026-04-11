import { useState } from "react";
import { KeyRound, LockKeyhole, ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const ToggleRow = ({ title, description, checked, onChange }) => {
  return (
    <label className="flex items-start justify-between gap-4 rounded-md border p-3">
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 accent-primary"
      />
    </label>
  );
};

export const SecuritySettingsSection = () => {
  const { toast } = useToast();
  const [securityState, setSecurityState] = useState({
    require2FA: true,
    enforceStrongPassword: true,
    blockSuspiciousIp: true,
    requirePasswordRotation: false,
    maxLoginAttempts: 5,
    sessionTimeoutMinutes: 60,
  });

  const [draftPassword, setDraftPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const updateField = (key, value) => {
    setSecurityState((previous) => ({ ...previous, [key]: value }));
  };

  const handleSave = () => {
    toast({
      title: "Security policy saved",
      description: "Security section is running in demo mode with local state.",
    });
  };

  const handlePasswordDemo = () => {
    if (!draftPassword.currentPassword || !draftPassword.newPassword || !draftPassword.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password update blocked",
        description: "Please fill all password fields for this demo action.",
      });
      return;
    }

    if (draftPassword.newPassword !== draftPassword.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password mismatch",
        description: "New password and confirmation must match.",
      });
      return;
    }

    setDraftPassword({ currentPassword: "", newPassword: "", confirmPassword: "" });
    toast({
      title: "Password change simulated",
      description: "This is a frontend demo flow. Backend endpoint hookup can be added next.",
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Authentication Policies
          </CardTitle>
          <CardDescription>Configure access controls for admin accounts and sensitive actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ToggleRow
            title="Require two-factor authentication"
            description="All admin users must complete a second verification step at login."
            checked={securityState.require2FA}
            onChange={(value) => updateField("require2FA", value)}
          />
          <ToggleRow
            title="Enforce strong passwords"
            description="Require numbers, symbols, and minimum length for every password."
            checked={securityState.enforceStrongPassword}
            onChange={(value) => updateField("enforceStrongPassword", value)}
          />
          <ToggleRow
            title="Block suspicious IP addresses"
            description="Auto lock sessions when risk score exceeds threshold."
            checked={securityState.blockSuspiciousIp}
            onChange={(value) => updateField("blockSuspiciousIp", value)}
          />
          <ToggleRow
            title="Force password rotation"
            description="Require regular password updates on schedule."
            checked={securityState.requirePasswordRotation}
            onChange={(value) => updateField("requirePasswordRotation", value)}
          />

          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                min={1}
                max={10}
                value={securityState.maxLoginAttempts}
                onChange={(event) => updateField("maxLoginAttempts", Number(event.target.value || 1))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionTimeoutMinutes">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeoutMinutes"
                type="number"
                min={10}
                max={240}
                value={securityState.sessionTimeoutMinutes}
                onChange={(event) => updateField("sessionTimeoutMinutes", Number(event.target.value || 10))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-dashed p-3 text-xs text-muted-foreground">
            <span>Security mode</span>
            <Badge variant="secondary">Demo Active</Badge>
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Security Rules
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Frontend demo flow for password update interaction and validation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={draftPassword.currentPassword}
              onChange={(event) =>
                setDraftPassword((previous) => ({ ...previous, currentPassword: event.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={draftPassword.newPassword}
              onChange={(event) =>
                setDraftPassword((previous) => ({ ...previous, newPassword: event.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={draftPassword.confirmPassword}
              onChange={(event) =>
                setDraftPassword((previous) => ({ ...previous, confirmPassword: event.target.value }))
              }
            />
          </div>

          <div className="rounded-lg border border-amber-300/60 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
            Password changes are simulated on frontend for now. Hook backend API in next phase.
          </div>

          <Button onClick={handlePasswordDemo} className="w-full">
            <LockKeyhole className="mr-2 h-4 w-4" />
            Update Password
          </Button>

          <div className="rounded-md border p-3 text-xs text-muted-foreground">
            <p className="inline-flex items-center gap-2 font-medium text-foreground">
              <ShieldAlert className="h-4 w-4" />
              Recommendation
            </p>
            <p className="mt-1">Enable password rotation only after notifying all admin operators.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettingsSection;
