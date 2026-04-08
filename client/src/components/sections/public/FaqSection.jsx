import { ChevronDown } from "lucide-react";
import { faqItems } from "@/content/landing/copy";

export const FaqSection = () => {
  return (
    <section id="faq" className="mx-auto max-w-6xl px-4 pb-14">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold md:text-3xl">Frequently asked questions</h2>
        <p className="mt-2 text-sm text-muted-foreground">সাধারণ জিজ্ঞাসা</p>
      </div>
      <div className="space-y-3">
        {faqItems.map((item) => (
          <details key={item.question} className="group rounded-md border border-border/70 bg-card">
            <summary className="flex cursor-pointer items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">{item.question}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.questionBn}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="space-y-2 px-4 pb-4">
              <p className="text-sm text-muted-foreground">{item.answer}</p>
              <p className="text-xs text-muted-foreground">{item.answerBn}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
};
