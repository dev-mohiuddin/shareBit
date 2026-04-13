import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  PauseCircle,
  Power,
  ShieldX,
  Upload,
} from "lucide-react";
import {
  ActivateInvestorDialog,
  ApproveInvestorDialog,
  ConfirmationDialog,
  DeactivateInvestorDialog,
  HoldInvestorDialog,
  RejectInvestorDialog,
} from "@/components/dialogs";
import {
  useGetInvestorDetailsQuery,
  useGetInvestorDocumentsQuery,
  useReviewInvestorApprovalByAdminMutation,
  useUpdateInvestorStatusByAdminMutation,
  useUploadInvestorDocumentByAdminMutation,
} from "@/features/api/apiSlice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
};

const statusVariant = (status) => {
  if (status === "active" || status === "approved") return "default";
  if (status === "on-hold" || status === "pending-approval") return "secondary";
  if (status === "rejected" || status === "inactive") return "destructive";
  return "outline";
};

export const InvestorDetailsPage = () => {
  const { investorId } = useParams();
  const { toast } = useToast();

  const [approvalNote, setApprovalNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isHoldDialogOpen, setIsHoldDialogOpen] = useState(false);
  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const [docType, setDocType] = useState("NID");
  const [docCategory, setDocCategory] = useState("identity");
  const [docNumber, setDocNumber] = useState("");
  const [file, setFile] = useState(null);

  const {
    data: investorResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetInvestorDetailsQuery(investorId, { skip: !investorId });

  const {
    data: docsResponse,
    isFetching: isFetchingDocs,
    refetch: refetchDocs,
  } = useGetInvestorDocumentsQuery(investorId, { skip: !investorId });

  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateInvestorStatusByAdminMutation();
  const [reviewApproval, { isLoading: isReviewing }] = useReviewInvestorApprovalByAdminMutation();
  const [uploadDocument, { isLoading: isUploading }] = useUploadInvestorDocumentByAdminMutation();

  const details = investorResponse?.data;
  const analytics = details?.analytics || {};
  const assets = analytics?.assets || [];

  const documents = useMemo(() => {
    const source = docsResponse?.data || details?.documents || {};
    const identity = (source.identityDocuments || []).map((item) => ({
      ...item,
      category: "identity",
    }));
    const other = (source.otherDocuments || []).map((item) => ({
      ...item,
      category: "other",
    }));
    return [...identity, ...other].sort(
      (a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime()
    );
  }, [docsResponse?.data, details?.documents]);

  const handleStatusAction = async (action) => {
    if (!investorId) return false;

    try {
      await updateStatus({
        investorId,
        action,
        reason: approvalNote || undefined,
      }).unwrap();

      toast({
        title: "Status updated",
        description: `Investor status changed to ${action}.`,
      });
      refetch();
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Status update failed",
        description: error?.data?.message || "Could not change investor status.",
      });
      return false;
    }
  };

  const handleApproval = async (decision) => {
    if (!investorId) return false;
    if (decision === "rejected" && !rejectionReason.trim()) {
      toast({
        variant: "destructive",
        title: "Rejection reason required",
        description: "Add a rejection reason before rejecting this investor.",
      });
      return false;
    }

    try {
      await reviewApproval({
        investorId,
        decision,
        approvalNote,
        rejectionReason,
      }).unwrap();

      toast({
        title: decision === "approved" ? "Investor approved" : "Investor rejected",
        description:
          decision === "approved"
            ? "Financial actions are now unlocked for this investor."
            : "Investor profile has been rejected.",
      });

      if (decision === "rejected") {
        setRejectionReason("");
      }
      refetch();
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Approval action failed",
        description: error?.data?.message || "Could not complete approval action.",
      });
      return false;
    }
  };

  const handleUpload = async () => {
    if (!investorId) return false;
    if (!file) {
      toast({
        variant: "destructive",
        title: "File required",
        description: "Select a file before uploading.",
      });
      return false;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("docType", docType);
    formData.append("category", docCategory);
    if (docNumber.trim()) {
      formData.append("docNumber", docNumber.trim());
    }

    try {
      await uploadDocument({ investorId, formData }).unwrap();
      toast({
        title: "Document uploaded",
        description: "Investor document uploaded successfully.",
      });
      setDocNumber("");
      setFile(null);
      refetchDocs();
      refetch();
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error?.data?.message || "Could not upload investor document.",
      });
      return false;
    }
  };

  const openUploadConfirm = (event) => {
    event.preventDefault();
    if (!file) {
      toast({
        variant: "destructive",
        title: "File required",
        description: "Select a file before uploading.",
      });
      return;
    }
    setIsUploadDialogOpen(true);
  };

  const confirmApprove = async () => {
    const ok = await handleApproval("approved");
    if (ok) setIsApproveDialogOpen(false);
  };

  const confirmReject = async () => {
    const ok = await handleApproval("rejected");
    if (ok) setIsRejectDialogOpen(false);
  };

  const confirmHold = async () => {
    const ok = await handleStatusAction("hold");
    if (ok) setIsHoldDialogOpen(false);
  };

  const confirmActivate = async () => {
    const ok = await handleStatusAction("activate");
    if (ok) setIsActivateDialogOpen(false);
  };

  const confirmDeactivate = async () => {
    const ok = await handleStatusAction("deactivate");
    if (ok) setIsDeactivateDialogOpen(false);
  };

  const confirmUpload = async () => {
    const ok = await handleUpload();
    if (ok) setIsUploadDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading investor details...
      </div>
    );
  }

  if (!details) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Investor details could not be loaded.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" asChild className="mb-2 px-0 text-muted-foreground">
            <Link to="/admin/investors">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Investors
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Investor Details</h1>
          <p className="text-sm text-muted-foreground">{details.name} • {details.email}</p>
        </div>
        <Badge variant={statusVariant(details.investorStatus)}>{details.investorStatus}</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Wallet Balance</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(analytics?.wallet?.balance)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Daily Earning</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(analytics?.totals?.dailyEarning)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Monthly Earning</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(analytics?.totals?.monthlyEarning)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Lifetime Earning</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(analytics?.totals?.lifetimeEarning)}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Investor Approval Actions</CardTitle>
            <CardDescription>
              Approve, reject, hold, activate, or deactivate this investor account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="approval-note">Admin Note</Label>
              <Textarea
                id="approval-note"
                value={approvalNote}
                onChange={(event) => setApprovalNote(event.target.value)}
                placeholder="Internal note for this decision"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Required only when rejecting"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                onClick={() => setIsApproveDialogOpen(true)}
                disabled={isReviewing || isFetching}
              >
                {isReviewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => setIsRejectDialogOpen(true)}
                disabled={isReviewing || isFetching}
              >
                {isReviewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldX className="mr-2 h-4 w-4" />}
                Reject
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsHoldDialogOpen(true)}
                disabled={isUpdatingStatus || isFetching}
              >
                {isUpdatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PauseCircle className="mr-2 h-4 w-4" />}
                Hold
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsActivateDialogOpen(true)}
                disabled={isUpdatingStatus || isFetching}
              >
                {isUpdatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Power className="mr-2 h-4 w-4" />}
                Activate
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDeactivateDialogOpen(true)}
                disabled={isUpdatingStatus || isFetching}
                className="sm:col-span-2"
              >
                {isUpdatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldX className="mr-2 h-4 w-4" />}
                Deactivate
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Legal Document</CardTitle>
            <CardDescription>
              Upload identity or supporting legal document for this investor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={openUploadConfirm} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Document Category</Label>
                  <Select value={docCategory} onValueChange={setDocCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="identity">Identity</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-type">Document Type</Label>
                  <Input
                    id="doc-type"
                    value={docType}
                    onChange={(event) => setDocType(event.target.value)}
                    placeholder="NID"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-number">Document Number (optional)</Label>
                <Input
                  id="doc-number"
                  value={docNumber}
                  onChange={(event) => setDocNumber(event.target.value)}
                  placeholder="Document number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-file">File</Label>
                <Input
                  id="doc-file"
                  type="file"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                />
              </div>
              <Button type="submit" disabled={isUploading || !file}>
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Upload Document
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Ownership And Earnings</CardTitle>
          <CardDescription>
            Asset-wise ownership percentage and daily/monthly/lifetime profit for this investor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Shares</TableHead>
                  <TableHead>Paid Capital</TableHead>
                  <TableHead>Ownership</TableHead>
                  <TableHead>Daily</TableHead>
                  <TableHead>Monthly</TableHead>
                  <TableHead>Lifetime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.assetId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{asset.assetName}</p>
                        <p className="text-xs text-muted-foreground">{asset.category}</p>
                      </div>
                    </TableCell>
                    <TableCell>{asset.shareCount}</TableCell>
                    <TableCell>{formatCurrency(asset.totalPaid)}</TableCell>
                    <TableCell>{asset.ownershipPercentage}%</TableCell>
                    <TableCell>{formatCurrency(asset.dailyEarning)}</TableCell>
                    <TableCell>{formatCurrency(asset.monthlyEarning)}</TableCell>
                    <TableCell>{formatCurrency(asset.lifetimeEarning)}</TableCell>
                  </TableRow>
                ))}
                {assets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-20 text-center text-sm text-muted-foreground">
                      No asset ownership data found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
          <CardDescription>
            Identity and supporting legal documents with upload dates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>File</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc, index) => (
                  <TableRow key={`${doc.fileUrl}-${index}`}>
                    <TableCell>{doc.category}</TableCell>
                    <TableCell>{doc.docType || "-"}</TableCell>
                    <TableCell>{doc.docNumber || "-"}</TableCell>
                    <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                    <TableCell>
                      {doc.fileUrl ? (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary underline-offset-2 hover:underline"
                        >
                          View file
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {documents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-16 text-center text-sm text-muted-foreground">
                      {isFetchingDocs ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading documents...
                        </span>
                      ) : (
                        "No documents uploaded yet."
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ApproveInvestorDialog
        open={isApproveDialogOpen}
        onOpenChange={setIsApproveDialogOpen}
        onConfirm={confirmApprove}
        isLoading={isReviewing}
      />

      <RejectInvestorDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        onConfirm={confirmReject}
        isLoading={isReviewing}
      />

      <HoldInvestorDialog
        open={isHoldDialogOpen}
        onOpenChange={setIsHoldDialogOpen}
        onConfirm={confirmHold}
        isLoading={isUpdatingStatus}
      />

      <ActivateInvestorDialog
        open={isActivateDialogOpen}
        onOpenChange={setIsActivateDialogOpen}
        onConfirm={confirmActivate}
        isLoading={isUpdatingStatus}
      />

      <DeactivateInvestorDialog
        open={isDeactivateDialogOpen}
        onOpenChange={setIsDeactivateDialogOpen}
        onConfirm={confirmDeactivate}
        isLoading={isUpdatingStatus}
      />

      <ConfirmationDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        title="Upload this document?"
        description="The selected document will be attached to this investor profile."
        confirmLabel="Upload Document"
        isLoading={isUploading}
        onConfirm={confirmUpload}
      />
    </div>
  );
};
