import { useState } from "react";
import { BellRing, MailCheck, MessageSquareDot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const ToggleItem = ({ title, description, checked, onChange }) => {
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

export const NotificationsSettingsSection = () => {
  const { toast } = useToast();
  const [notificationSettings, setNotificationSettings] = useState({
    emailChannel: true,
    smsChannel: false,
    inAppChannel: true,
    onWithdrawalRequest: true,
    onProfitDistribution: true,
    onUserVerification: true,
    onSecurityIncident: true,
    digestTime: "08:00",
  });

  const setField = (key, value) => {
    setNotificationSettings((previous) => ({ ...previous, [key]: value }));
  };

  const handleSave = () => {
    toast({
      title: "Notification preferences saved",
      description: "Notification section is active as local UI demo configuration.",
    });
  };

  const handleSendTest = () => {
    toast({
      title: "Test notification sent",
      description: "Demo alert generated for selected active channels.",
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            Channel Preferences
          </CardTitle>
          <CardDescription>Choose where admin alerts should be delivered.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ToggleItem
            title="Email notifications"
            description="Receive operational updates in your registered admin email."
            checked={notificationSettings.emailChannel}
            onChange={(value) => setField("emailChannel", value)}
          />
          <ToggleItem
            title="SMS notifications"
            description="Receive high-priority incidents on your mobile number."
            checked={notificationSettings.smsChannel}
            onChange={(value) => setField("smsChannel", value)}
          />
          <ToggleItem
            title="In-app notifications"
            description="Show notification feed inside the admin workspace."
            checked={notificationSettings.inAppChannel}
            onChange={(value) => setField("inAppChannel", value)}
          />

          <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
            Active channels:
            <div className="mt-2 flex flex-wrap gap-2">
              {notificationSettings.emailChannel && <Badge variant="secondary">Email</Badge>}
              {notificationSettings.smsChannel && <Badge variant="secondary">SMS</Badge>}
              {notificationSettings.inAppChannel && <Badge variant="secondary">In-App</Badge>}
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleSendTest}>
            Send Test Notification
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event Rules</CardTitle>
          <CardDescription>Decide which platform events will trigger alerts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ToggleItem
            title="Withdrawal requests"
            description="Notify when new withdrawal requests are submitted."
            checked={notificationSettings.onWithdrawalRequest}
            onChange={(value) => setField("onWithdrawalRequest", value)}
          />
          <ToggleItem
            title="Profit distribution completion"
            description="Notify when daily distribution job is completed."
            checked={notificationSettings.onProfitDistribution}
            onChange={(value) => setField("onProfitDistribution", value)}
          />
          <ToggleItem
            title="User verification updates"
            description="Notify when KYC review status changes."
            checked={notificationSettings.onUserVerification}
            onChange={(value) => setField("onUserVerification", value)}
          />
          <ToggleItem
            title="Security incidents"
            description="Notify on suspicious logins or policy violations."
            checked={notificationSettings.onSecurityIncident}
            onChange={(value) => setField("onSecurityIncident", value)}
          />

          <div className="space-y-2 pt-1">
            <Label htmlFor="digestTime">Daily Digest Time</Label>
            <input
              id="digestTime"
              type="time"
              value={notificationSettings.digestTime}
              onChange={(event) => setField("digestTime", event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-md border p-3 text-xs">
              <p className="inline-flex items-center gap-1 font-medium">
                <MailCheck className="h-3.5 w-3.5" />
                Email queue status
              </p>
              <p className="mt-1 text-muted-foreground">Healthy (demo)</p>
            </div>
            <div className="rounded-md border p-3 text-xs">
              <p className="inline-flex items-center gap-1 font-medium">
                <MessageSquareDot className="h-3.5 w-3.5" />
                SMS provider status
              </p>
              <p className="mt-1 text-muted-foreground">Standby (demo)</p>
            </div>
          </div>

          <Button className="w-full" onClick={handleSave}>
            Save Notification Rules
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsSettingsSection;
