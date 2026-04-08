import { ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { valuePillars } from "@/content/landing/copy";

const icons = [
  <ShieldCheck key="shield" className="h-5 w-5" />,
  <Workflow key="workflow" className="h-5 w-5" />,
  <Sparkles key="spark" className="h-5 w-5" />,
];

export const ValuePillarsSection = () => {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold md:text-3xl">Why professional investors choose ShareBit</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            কেন পেশাদার বিনিয়োগকারীরা ShareBit বেছে নেন
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {valuePillars.map((pillar, index) => (
          <Card key={pillar.title} className="border-border/70">
            <CardHeader className="space-y-3">
              <div className="w-fit rounded-md bg-muted p-2 text-foreground">{icons[index % icons.length]}</div>
              <CardTitle className="text-lg">{pillar.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{pillar.description}</p>
              <p className="text-xs text-muted-foreground">{pillar.descriptionBn}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
