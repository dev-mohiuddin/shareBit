import { useMemo } from "react";
import { Building2, CircleCheck, IdCard, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/app/hooks";

const resolveBadge = (status) => {
  const normalized = String(status || "pending").toLowerCase();
  if (["approved", "verified", "complete"].includes(normalized)) return "secondary";
  if (["rejected", "failed"].includes(normalized)) return "destructive";
  return "outline";
};

export const ProfilePage = () => {
  const user = useAppSelector((state) => state.auth.user) || {};

  const fullName = useMemo(
    () => `${user.firstName || "Investor"} ${user.lastName || ""}`.trim(),
    [user.firstName, user.lastName]
  );

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h2 className="text-2xl font-semibold">Profile and Compliance</h2>
        <p className="text-sm text-muted-foreground">
          Manage your identity, KYC readiness, and payout banking information.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserRound className="h-5 w-5" />
              Account Identity
            </CardTitle>
            <CardDescription>ব্যক্তিগত তথ্য</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Full Name</label>
              <Input value={fullName} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Email</label>
              <Input value={user.email || "-"} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Role</label>
              <Input value={user.roleName || "Investor"} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Phone</label>
              <Input value={user.phone || "Not added yet"} disabled />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CircleCheck className="h-5 w-5" />
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
              <span className="text-muted-foreground">Email verification</span>
              <Badge variant={user.isVerified ? "secondary" : "outline"}>
                {user.isVerified ? "Verified" : "Pending"}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
              <span className="text-muted-foreground">KYC status</span>
              <Badge variant={resolveBadge(user.kycStatus)}>{user.kycStatus || "Pending"}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
              <span className="text-muted-foreground">Accreditation</span>
              <Badge variant={resolveBadge(user.accreditationStatus)}>
                {user.accreditationStatus || "Pending"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <IdCard className="h-5 w-5" />
              KYC Documents
            </CardTitle>
            <CardDescription>
              National ID, passport, or driving license verification records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-md border border-dashed border-border/70 p-4 text-muted-foreground">
              KYC document upload UI will be connected in the next backend integration phase.
            </div>
            <Button variant="outline">Request KYC Review</Button>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Banking and Payout
            </CardTitle>
            <CardDescription>
              Withdrawal settlement details used by operations approval flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Bank name" disabled />
            <Input placeholder="Account holder name" disabled />
            <Input placeholder="Account number" disabled />
            <Button variant="outline" disabled>
              Save Banking Details
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
