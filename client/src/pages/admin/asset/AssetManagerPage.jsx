import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, RefreshCcw } from "lucide-react";
import { DataTable } from "@/components/ui/dataTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useGetAssetsQuery,
  useCreateAssetMutation,
} from "@/features/api/apiSlice";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const assetColumns = [
  { accessorKey: "name", header: "Asset Name" },
  { 
    accessorKey: "price", 
    header: "Price/Share",
    cell: ({ row }) => <span className="font-medium">{row.original.price}</span>
  },
  { accessorKey: "shares", header: "Total Shares" },
  { accessorKey: "available", header: "Available" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "active" ? "default" : "secondary"}>
        {row.original.status}
      </Badge>
    ),
  },
];

const assetFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  totalShares: z.coerce.number().int().min(1, "Must have at least 1 share"),
  sharePrice: z.coerce.number().min(0.01, "Price must be positive"),
  category: z.string().optional(),
  location: z.string().optional(),
});

export const AssetManagerPage = () => {
  const { data: assetsResponse, isLoading: assetsLoading, refetch } = useGetAssetsQuery();
  const [createAsset, { isLoading: creatingAsset }] = useCreateAssetMutation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      name: "",
      totalShares: 100,
      sharePrice: 50,
      category: "",
      location: "",
    }
  });

  const assets = assetsResponse?.data || [];
  
  const assetRows = assets.map((asset) => ({
    id: asset._id,
    name: asset.name,
    price: `$${asset.sharePrice}`,
    shares: asset.totalShares,
    available: asset.availableShares ?? asset.totalShares,
    status: asset.status,
  }));

  const onSubmit = async (values) => {
    try {
      await createAsset(values).unwrap();
      form.reset();
      setIsDialogOpen(false);
      refetch();
    } catch (error) {
      console.error("Failed to create asset:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Asset Manager</h1>
          <p className="text-muted-foreground">Create and manage physical assets.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="icon" onClick={refetch} disabled={assetsLoading}>
             <RefreshCcw className={`h-4 w-4 ${assetsLoading ? "animate-spin" : ""}`} />
           </Button>
           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create Asset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Asset</DialogTitle>
                <DialogDescription>
                  Define the asset details. Shares will be auto-generated.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Asset Name</Label>
                    <Input id="name" {...form.register("name")} placeholder="e.g. Scania K410 Bus" />
                    {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="totalShares">Total Shares</Label>
                      <Input id="totalShares" type="number" {...form.register("totalShares")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="sharePrice">Price per Share</Label>
                      <Input id="sharePrice" type="number" step="0.01" {...form.register("sharePrice")} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Input id="category" {...form.register("category")} placeholder="Transport" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" {...form.register("location")} placeholder="Dhaka" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={creatingAsset}>
                    {creatingAsset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Asset
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="px-6 py-4">
          <CardTitle>All Assets</CardTitle>
          <CardDescription>
            List of all registered assets in the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={assetColumns}
            data={assetRows}
            searchKey="name"
            emptyMessage={assetsLoading ? "Loading assets..." : "No assets found."}
          />
        </CardContent>
      </Card>
    </div>
  );
};
