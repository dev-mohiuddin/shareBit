import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const CalculatorSection = ({
  shares,
  pricePerShare,
  roiRate,
  onSharesChange,
  onPricePerShareChange,
  onRoiRateChange,
  projectedReturn,
}) => {
  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>Profit Estimator</CardTitle>
        <CardDescription>Model expected monthly return before allocation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Shares</label>
          <Input
            type="number"
            min={1}
            value={shares}
            onChange={(event) => onSharesChange(Number(event.target.value) || 1)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Price per share</label>
          <Input
            type="number"
            min={100}
            value={pricePerShare}
            onChange={(event) => onPricePerShareChange(Number(event.target.value) || 100)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Expected annual ROI (%)</label>
          <Input
            type="number"
            min={1}
            value={roiRate}
            onChange={(event) => onRoiRateChange(Number(event.target.value) || 1)}
          />
        </div>

        <div className="rounded-md border border-border/70 bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">Estimated monthly profit</p>
          <p className="text-3xl font-semibold">${projectedReturn}</p>
          <p className="text-xs text-muted-foreground">প্রাক্কলিত মাসিক মুনাফা</p>
        </div>
      </CardContent>
    </Card>
  );
};
