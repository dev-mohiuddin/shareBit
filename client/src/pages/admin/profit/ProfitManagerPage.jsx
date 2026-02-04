import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { 
    useGetAssetsQuery, 
    useCreateAssetProfitMutation,
    useGetProfitSummaryQuery 
} from "@/features/api/apiSlice";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";

const profitSchema = z.object({
  assetId: z.string().min(1, "Please select an asset"),
  monthKey: z.string().regex(/^\d{4}-\d{2}$/, "Format must be YYYY-MM"),
  totalProfitAmount: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive("Profit amount must be positive")
  ),
});

export const ProfitManagerPage = () => {
    const { toast } = useToast();
    const [createAssetProfit, { isLoading: isCreating }] = useCreateAssetProfitMutation();
    const { data: assetsData } = useGetAssetsQuery({ page: 1, limit: 100 });
    const assets = assetsData?.data?.results || [];

    // Default to current month
    const defaultMonth = format(new Date(), "yyyy-MM");

    // Fetch summary for the default month to show context
    const { data: summaryData, isLoading: isLoadingSummary } = useGetProfitSummaryQuery(defaultMonth);

    const form = useForm({
        resolver: zodResolver(profitSchema),
        defaultValues: {
            assetId: "",
            monthKey: defaultMonth,
            totalProfitAmount: "",
        },
    });

    const onSubmit = async (values) => {
        try {
            await createAssetProfit(values).unwrap();
            toast({
                title: "Profit Distributed",
                description: `Successfully distributed profit for ${values.monthKey}.`,
            });
            form.reset({
                assetId: "",
                monthKey: defaultMonth, 
                totalProfitAmount: ""
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Distribution Failed",
                description: error?.data?.message || "Something went wrong.",
            });
        }
    };

    return (
      <div className="space-y-6 pb-12">
        <div>
           <h1 className="text-2xl font-bold tracking-tight">Profit Management</h1>
           <p className="text-muted-foreground">Distribute monthly returns to shareholders.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Distribute Profit</CardTitle>
                    <CardDescription>Record profit for a specific asset and month. System will auto-calculate user shares.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="assetId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Asset Project</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select an asset" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {assets.map((asset) => (
                                                    <SelectItem key={asset.id} value={asset.id}>
                                                        {asset.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="monthKey"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Month (YYYY-MM)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="2023-10" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="totalProfitAmount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Total Profit ($)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Alert className="bg-muted border-none">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Notice</AlertTitle>
                                <AlertDescription className="text-xs text-muted-foreground">
                                    Distribution is irreversible automatically. Ensure amounts are verified against bank statements.
                                </AlertDescription>
                            </Alert>

                            <Button type="submit" className="w-full" disabled={isCreating}>
                                {isCreating ? (
                                    <>
                                        <TrendingUp className="mr-2 h-4 w-4 animate-spin" /> Distributing...
                                    </>
                                ) : (
                                    <>
                                        <DollarSign className="mr-2 h-4 w-4" /> Distribute Profit
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Distributions</CardTitle>
                    <CardDescription>Profit summary for {defaultMonth}</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingSummary ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">Loading summary...</div>
                    ) : summaryData?.data?.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">No profit records found for this month.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Asset</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Yield</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* This assumes summaryData returns an array of profit entries. 
                                    Adjust based on actual API response structure. */}
                                {summaryData && summaryData.data && Array.isArray(summaryData.data) ? 
                                    summaryData.data.map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium">{item.assetName || "Unknown Asset"}</TableCell>
                                        <TableCell className="text-right font-medium text-green-600">
                                            +${item.amount?.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-xs">
                                            {item.auditYield || "0"}%
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                         <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                                            No data available
                                         </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
                <CardFooter className="bg-muted/50 p-4">
                     <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">
                        View Full Audit Logs
                     </Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    );
  };
