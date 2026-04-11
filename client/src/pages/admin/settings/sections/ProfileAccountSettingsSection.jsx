import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Loader2,
  RotateCcw,
  Save,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import { useAppSelector } from "@/app/hooks";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const PROFILE_SAVED_KEY = "sharebit-admin-settings-profile-saved";
const PROFILE_DRAFT_KEY = "sharebit-admin-settings-profile-draft";
const PROFILE_META_KEY = "sharebit-admin-settings-profile-meta";

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^[0-9+\-()\s]{7,20}$/.test(value), "Enter a valid phone number"),
  designation: z.string().trim().min(2, "Designation must be at least 2 characters"),
  timezone: z.string().trim().min(2, "Timezone is required"),
  language: z.string().trim().min(2, "Language is required"),
  bio: z.string().trim().max(300, "Bio can be up to 300 characters").optional(),
});

const readStorage = (key) => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_error) {
    return null;
  }
};

const writeStorage = (key, value) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const removeStorage = (key) => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
};

const buildDefaultsFromUser = (user) => {
  const composedName = user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return {
    fullName: composedName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    designation: user?.roleName ? `${user.roleName} Manager` : "Operations Manager",
    timezone: user?.timezone || "Asia/Dhaka",
    language: user?.language || "English",
    bio:
      user?.bio ||
      "Managing investor operations, compliance, and platform performance for ShareBit control workflows.",
  };
};

export const ProfileAccountSettingsSection = ({ onDirtyChange }) => {
  const user = useAppSelector((state) => state.auth.user);
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const baseDefaults = useMemo(() => buildDefaultsFromUser(user), [user]);

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: baseDefaults,
    mode: "onChange",
  });

  useEffect(() => {
    const saved = readStorage(PROFILE_SAVED_KEY);
    const draft = readStorage(PROFILE_DRAFT_KEY);
    const meta = readStorage(PROFILE_META_KEY);

    const mergedValues = {
      ...baseDefaults,
      ...(saved || {}),
      ...(draft || {}),
    };

    form.reset(mergedValues);
    setLastSavedAt(meta?.lastSavedAt || null);
  }, [baseDefaults, form]);

  useEffect(() => {
    const subscription = form.watch((values, info) => {
      if (info.type !== "change") return;
      writeStorage(PROFILE_DRAFT_KEY, values);
    });

    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    onDirtyChange?.(form.formState.isDirty);
  }, [form.formState.isDirty, onDirtyChange]);

  useEffect(() => {
    return () => {
      onDirtyChange?.(false);
    };
  }, [onDirtyChange]);

  const handleResetToSaved = () => {
    const saved = readStorage(PROFILE_SAVED_KEY);
    const nextValues = {
      ...baseDefaults,
      ...(saved || {}),
    };

    form.reset(nextValues);
    removeStorage(PROFILE_DRAFT_KEY);

    toast({
      title: "Profile restored",
      description: "Form values were reset to your last saved profile.",
    });
  };

  const handleDiscardDraft = () => {
    const saved = readStorage(PROFILE_SAVED_KEY);
    const nextValues = {
      ...baseDefaults,
      ...(saved || {}),
    };

    removeStorage(PROFILE_DRAFT_KEY);
    form.reset(nextValues);

    toast({
      title: "Draft removed",
      description: "Unsaved profile draft has been discarded.",
    });
  };

  const onSubmit = async (values) => {
    try {
      setIsSaving(true);
      const now = new Date().toISOString();

      writeStorage(PROFILE_SAVED_KEY, values);
      writeStorage(PROFILE_META_KEY, { lastSavedAt: now });
      removeStorage(PROFILE_DRAFT_KEY);

      form.reset(values);
      setLastSavedAt(now);

      toast({
        title: "Profile settings saved",
        description: "Your account preferences were saved to local demo storage.",
      });
    } catch (_error) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "Could not save profile settings. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formattedLastSaved = lastSavedAt ? new Date(lastSavedAt).toLocaleString() : "Never";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profile State</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm font-semibold">{form.formState.isDirty ? "Unsaved draft" : "All changes saved"}</p>
            <Badge variant={form.formState.isDirty ? "outline" : "secondary"}>
              {form.formState.isDirty ? "Dirty" : "Synced"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Security Class</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Admin Protected Account
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Saved</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-semibold">{formattedLastSaved}</CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle2 className="h-5 w-5" />
              Profile & Account
            </CardTitle>
            <CardDescription>
              Update account identity and workspace defaults. This demo persists data locally in your browser.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" placeholder="Admin name" {...form.register("fullName")} />
                  {form.formState.errors.fullName && (
                    <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="admin@sharebit.app" {...form.register("email")} />
                  {form.formState.errors.email && (
                    <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="+8801XXXXXXXXX" {...form.register("phone")} />
                  {form.formState.errors.phone && (
                    <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input id="designation" placeholder="Operations Manager" {...form.register("designation")} />
                  {form.formState.errors.designation && (
                    <p className="text-xs text-destructive">{form.formState.errors.designation.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    {...form.register("timezone")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="Asia/Dhaka">Asia/Dhaka</option>
                    <option value="Asia/Kolkata">Asia/Kolkata</option>
                    <option value="Asia/Dubai">Asia/Dubai</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="America/New_York">America/New_York</option>
                  </select>
                  {form.formState.errors.timezone && (
                    <p className="text-xs text-destructive">{form.formState.errors.timezone.message}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    {...form.register("language")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="English">English</option>
                    <option value="Bangla">Bangla</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                  {form.formState.errors.language && (
                    <p className="text-xs text-destructive">{form.formState.errors.language.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Write a short role summary"
                  {...form.register("bio")}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Shown in internal admin activity details.</span>
                  <span>{form.watch("bio")?.length || 0}/300</span>
                </div>
                {form.formState.errors.bio && (
                  <p className="text-xs text-destructive">{form.formState.errors.bio.message}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={handleDiscardDraft} disabled={!form.formState.isDirty}>
                  Discard Draft
                </Button>
                <Button type="button" variant="secondary" onClick={handleResetToSaved}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset to Saved
                </Button>
                <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Metadata</CardTitle>
              <CardDescription>Reference data synced from current auth session.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-muted-foreground">Role</span>
                <Badge>{user?.roleName || "Super Admin"}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-muted-foreground">Panel Access</span>
                <span className="font-medium">{user?.panel || "admin"}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-muted-foreground">Account Created</span>
                <span className="font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-rose-200/80 dark:border-rose-900/70">
            <CardHeader>
              <CardTitle className="text-rose-700 dark:text-rose-400">Danger Zone</CardTitle>
              <CardDescription>High-risk actions for emergency account security controls.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Session lockout demo</AlertTitle>
                <AlertDescription>
                  This action is a UI demo and does not call backend APIs in this phase.
                </AlertDescription>
              </Alert>
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={() =>
                  toast({
                    title: "Emergency lockout queued",
                    description: "Demo action recorded. Backend execution will be connected in next phase.",
                  })
                }
              >
                Force Sign-out From All Devices
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileAccountSettingsSection;
