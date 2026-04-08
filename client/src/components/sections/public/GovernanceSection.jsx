import { Landmark, ShieldCheck, Workflow, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { governancePoints } from "@/content/landing/copy";

const icons = [
  <Landmark key="landmark" className="h-5 w-5" />,
  <FileText key="file" className="h-5 w-5" />,
  <Workflow key="workflow" className="h-5 w-5" />,
  <ShieldCheck key="shield" className="h-5 w-5" />,
];

export const GovernanceSection = () => {
  return (
    <section id="governance" className="mx-auto max-w-6xl px-4 pb-14">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold md:text-3xl">Governance and operational controls</h2>
        <p className="mt-2 text-sm text-muted-foreground">গভর্ন্যান্স ও অপারেশনাল নিয়ন্ত্রণ কাঠামো</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {governancePoints.map((point, index) => (
          <Card key={point.title} className="border-border/70">
            <CardHeader>
              <div className="mb-2 w-fit rounded-md bg-muted p-2 text-foreground">{icons[index]}</div>
              <CardTitle className="text-lg">{point.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{point.description}</p>
              <p className="text-xs text-muted-foreground">{point.descriptionBn}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
