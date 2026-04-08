import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { onboardingSteps } from "@/content/landing/copy";

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 pb-14">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold md:text-3xl">How ShareBit works</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          ShareBit কীভাবে কাজ করে
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {onboardingSteps.map((step, index) => (
          <Card key={step.title} className="border-border/70">
            <CardHeader>
              <div className="mb-2 text-xs font-medium text-muted-foreground">Step {index + 1}</div>
              <CardTitle className="text-lg leading-snug">{step.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{step.description}</p>
              <p className="text-xs text-muted-foreground">{step.descriptionBn}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
