import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assetCategories } from "@/content/landing/copy";

export const AssetCategoriesSection = () => {
  return (
    <section id="assets" className="mx-auto max-w-6xl px-4 pb-14">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold md:text-3xl">Asset categories built for steady participation</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          স্থিতিশীল বিনিয়োগ অংশগ্রহণের জন্য পরিকল্পিত অ্যাসেট ক্যাটাগরি
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {assetCategories.map((category) => (
          <Card key={category.name} className="border-border/70">
            <CardHeader>
              <CardTitle className="text-lg">{category.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{category.description}</p>
              <p className="text-xs text-muted-foreground">{category.descriptionBn}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
