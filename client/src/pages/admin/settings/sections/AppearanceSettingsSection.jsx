import { useState } from "react";
import { LayoutTemplate, Palette, PanelsTopLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const colorStyles = [
  { value: "ocean", label: "Ocean", className: "bg-cyan-600" },
  { value: "slate", label: "Slate", className: "bg-slate-700" },
  { value: "emerald", label: "Emerald", className: "bg-emerald-600" },
];

const densityOptions = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
  { value: "spacious", label: "Spacious" },
];

export const AppearanceSettingsSection = () => {
  const { toast } = useToast();
  const [appearance, setAppearance] = useState({
    themeMode: "system",
    accentStyle: "slate",
    density: "comfortable",
    showSystemStatus: true,
    sidebarCollapsedByDefault: false,
  });

  const setField = (key, value) => {
    setAppearance((previous) => ({ ...previous, [key]: value }));
  };

  const handleSave = () => {
    toast({
      title: "Appearance saved",
      description: "UI preference demo state updated for this session.",
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme & Visual Tone
          </CardTitle>
          <CardDescription>Control style preferences for the admin workspace shell.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Theme Mode</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { label: "Light", value: "light" },
                { label: "System", value: "system" },
                { label: "Dark", value: "dark" },
              ].map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={appearance.themeMode === option.value ? "default" : "outline"}
                  onClick={() => setField("themeMode", option.value)}
                  className="w-full"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Accent Style</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {colorStyles.map((style) => (
                <button
                  key={style.value}
                  type="button"
                  className={`rounded-md border p-3 text-left transition ${
                    appearance.accentStyle === style.value ? "border-primary ring-2 ring-primary/30" : "border-border"
                  }`}
                  onClick={() => setField("accentStyle", style.value)}
                >
                  <span className={`mb-2 block h-3 w-8 rounded-full ${style.className}`} />
                  <span className="text-sm font-medium">{style.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Density</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {densityOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={appearance.density === option.value ? "secondary" : "outline"}
                  onClick={() => setField("density", option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-md border p-3">
            <label className="flex items-center justify-between gap-2 text-sm">
              <span>Show system online badge in header</span>
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={appearance.showSystemStatus}
                onChange={(event) => setField("showSystemStatus", event.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between gap-2 text-sm">
              <span>Sidebar collapsed by default</span>
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={appearance.sidebarCollapsedByDefault}
                onChange={(event) => setField("sidebarCollapsedByDefault", event.target.checked)}
              />
            </label>
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Appearance Preferences
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5" />
            Live Preview
          </CardTitle>
          <CardDescription>Demo representation of selected interface style options.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border bg-background shadow-sm">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="inline-flex items-center gap-2 text-sm font-semibold">
                <PanelsTopLeft className="h-4 w-4" />
                Admin Preview Header
              </p>
              <Badge variant="outline">{appearance.themeMode}</Badge>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Accent</p>
                <p className="mt-1 text-sm font-medium capitalize">{appearance.accentStyle}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Density</p>
                <p className="mt-1 text-sm font-medium capitalize">{appearance.density}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Header Badge</p>
                <p className="mt-1 text-sm font-medium">
                  {appearance.showSystemStatus ? "Visible" : "Hidden"}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Sidebar Initial</p>
                <p className="mt-1 text-sm font-medium">
                  {appearance.sidebarCollapsedByDefault ? "Collapsed" : "Expanded"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
            This preview is frontend-only and does not yet change global theme tokens.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppearanceSettingsSection;
