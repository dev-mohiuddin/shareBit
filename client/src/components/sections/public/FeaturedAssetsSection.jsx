import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const FeaturedAssetsSection = ({ assets }) => {
  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>Featured opportunities</CardTitle>
        <CardDescription>Live asset visibility from current inventory</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {assets.slice(0, 4).map((asset) => {
          const totalShares = Number(asset.totalShares) || 0;
          const availableShares = Number(asset.availableShares ?? totalShares);
          const allocated = Math.max(totalShares - availableShares, 0);
          const progress = totalShares > 0 ? Math.round((allocated / totalShares) * 100) : 0;

          return (
            <div key={asset._id} className="rounded-md border border-border/60 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{asset.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {asset.category || "Asset"} | ${asset.sharePrice} per share
                  </p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/login">View</Link>
                </Button>
              </div>
              <Progress value={progress} />
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{availableShares} shares left</span>
                <span>{progress}% allocated</span>
              </div>
            </div>
          );
        })}

        {assets.length === 0 && (
          <div className="rounded-md border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
            Assets are being prepared. Please check back shortly.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
