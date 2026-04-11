import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const PendingApprovalsPage = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>
            Review and approve pending user registrations and KYC documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-md">
            <p className="text-slate-500 dark:text-slate-400">
              User approvals table will be implemented here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApprovalsPage;
