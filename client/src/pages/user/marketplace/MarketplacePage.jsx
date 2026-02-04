import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Loader2, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useGetAssetsQuery } from "@/features/api/apiSlice";

export const MarketplacePage = () => {
  const { data: assetsResponse, isLoading } = useGetAssetsQuery();
  const assets = assetsResponse?.data || [];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
         <div>
           <h1 className="text-2xl font-bold tracking-tight">Marketplace</h1>
           <p className="text-muted-foreground">Browse high-value assets and start investing.</p>
         </div>
         <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search assets..." className="pl-8" />
            </div>
            <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
            </Button>
         </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => {
                const available = asset.availableShares ?? asset.totalShares;
                const total = asset.totalShares;
                const progress = total ? Math.round(((total - available) / total) * 100) : 0;
                
                return (
                    <Card key={asset._id} className="overflow-hidden border-border/60 transition-all hover:shadow-md">
                        <div className="aspect-video w-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                            {/* Placeholder for asset image */}
                            <span className="text-sm">Asset Image</span>
                        </div>
                        <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge variant="outline" className="mb-2">{asset.category || "General"}</Badge>
                                    <CardTitle className="text-lg">{asset.name}</CardTitle>
                                    <CardDescription>{asset.location || "Global"}</CardDescription>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-primary">${asset.sharePrice}</div>
                                    <div className="text-xs text-muted-foreground">per share</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-2 space-y-4">
                           <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Funded</span>
                                    <span>{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                           </div>
                           <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="rounded-md bg-muted p-2 text-center">
                                    <div className="text-xs text-muted-foreground">Target ROI</div>
                                    <div className="font-semibold text-green-600">12-15%</div>
                                </div>
                                <div className="rounded-md bg-muted p-2 text-center">
                                    <div className="text-xs text-muted-foreground">Min Invest</div>
                                    <div className="font-semibold">${asset.sharePrice}</div>
                                </div>
                           </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0">
                           <Button className="w-full" size="lg">Invest Now</Button>
                        </CardFooter>
                    </Card>
                );
            })}
            {assets.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                    No active assets found.
                </div>
            )}
        </div>
      )}
    </div>
  );
};
