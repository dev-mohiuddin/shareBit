import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { testimonials } from "@/content/landing/copy";

export const TestimonialsSection = () => {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-14">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold md:text-3xl">Investor voices</h2>
        <p className="mt-2 text-sm text-muted-foreground">বিনিয়োগকারীদের অভিজ্ঞতা</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {testimonials.map((item) => (
          <Card key={item.author} className="border-border/70">
            <CardContent className="space-y-4 p-5">
              <Quote className="h-5 w-5 text-primary" />
              <p className="text-sm leading-relaxed">{item.quote}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{item.quoteBn}</p>
              <div>
                <p className="text-sm font-semibold">{item.author}</p>
                <p className="text-xs text-muted-foreground">{item.role}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
