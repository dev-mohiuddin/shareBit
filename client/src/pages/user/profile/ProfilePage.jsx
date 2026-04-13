import { useEffect, useMemo, useState } from "react";
import { Building2, CircleCheck, IdCard, Loader2, Send, Upload, UserRound } from "lucide-react";
import { ConfirmationDialog } from "@/components/dialogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppSelector } from "@/app/hooks";
import {
  useGetMeQuery,
  useGetMyDocumentsQuery,
  useSubmitMyProfileForApprovalMutation,
  useUpdateMeMutation,
  useUploadMyDocumentMutation,
} from "@/features/api/apiSlice";
import { useToast } from "@/hooks/use-toast";

const resolveBadge = (status) => {
  const normalized = String(status || "pending").toLowerCase();
  if (["approved", "verified", "complete"].includes(normalized)) return "secondary";
  if (["rejected", "failed"].includes(normalized)) return "destructive";
  return "outline";
};

export const ProfilePage = () => {
  const authUser = useAppSelector((state) => state.auth.user) || {};
  const { toast } = useToast();
  const [confirmAction, setConfirmAction] = useState(null);

  const { data: meResponse, isFetching: isFetchingProfile, refetch: refetchProfile } = useGetMeQuery();
  const { data: docsResponse, isFetching: isFetchingDocs, refetch: refetchDocs } = useGetMyDocumentsQuery();
  const [updateMe, { isLoading: isSavingPayout }] = useUpdateMeMutation();
  const [uploadMyDocument, { isLoading: isUploadingDoc }] = useUploadMyDocumentMutation();
  const [submitProfileForApproval, { isLoading: isSubmittingForApproval }] =
    useSubmitMyProfileForApprovalMutation();

  const user = useMemo(() => meResponse?.data || authUser || {}, [meResponse?.data, authUser]);

  const [bankName, setBankName] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [bankNumber, setBankNumber] = useState("");
  const [bankRouting, setBankRouting] = useState("");
  const [bankBranch, setBankBranch] = useState("");

  const [bkashNumber, setBkashNumber] = useState("");
  const [bkashHolder, setBkashHolder] = useState("");
  const [bkashType, setBkashType] = useState("personal");
  const [preferredMethod, setPreferredMethod] = useState("bank");

  const [docType, setDocType] = useState("NID");
  const [docNumber, setDocNumber] = useState("");
  const [docCategory, setDocCategory] = useState("identity");
  const [docFile, setDocFile] = useState(null);
  const [submissionNote, setSubmissionNote] = useState("");

  useEffect(() => {
    const payout = user?.investorProfile?.payoutDetails || {};
    const bank = payout.bankAccount || {};
    const bkash = payout.bkash || {};

    setBankName(bank.bankName || "");
    setBankHolder(bank.accountHolderName || "");
    setBankNumber(bank.accountNumber || "");
    setBankRouting(bank.routingNumber || "");
    setBankBranch(bank.branchName || "");

    setBkashNumber(bkash.number || "");
    setBkashHolder(bkash.accountHolderName || "");
    setBkashType(bkash.accountType || "personal");
    setPreferredMethod(payout.preferredMethod || "bank");
  }, [user?.investorProfile?.payoutDetails]);

  const fullName = useMemo(
    () => `${user.firstName || "Investor"} ${user.lastName || ""}`.trim(),
    [user.firstName, user.lastName]
  );

  const approval = user?.investorProfile?.approval || {};
  const approvalStatus = approval?.status || user?.approvalStatus || "draft";
  const kycStatus = user?.investorProfile?.kycStatus || "pending";
  const accreditationStatus = user?.investorProfile?.accreditationStatus || "none";

  const documents = useMemo(() => {
    const docs = docsResponse?.data || {};
    const identity = (docs.identityDocuments || []).map((item) => ({ ...item, category: "identity" }));
    const other = (docs.otherDocuments || []).map((item) => ({ ...item, category: "other" }));
    return [...identity, ...other].sort(
      (a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime()
    );
  }, [docsResponse?.data]);

  const handleSavePayout = async () => {
    const payload = {
      investorProfile: {
        payoutDetails: {
          preferredMethod,
          bankAccount: {
            bankName: bankName || undefined,
            accountHolderName: bankHolder || undefined,
            accountNumber: bankNumber || undefined,
            routingNumber: bankRouting || undefined,
            branchName: bankBranch || undefined,
          },
          bkash: {
            number: bkashNumber || undefined,
            accountType: bkashType || undefined,
            accountHolderName: bkashHolder || undefined,
          },
        },
      },
    };

    try {
      await updateMe(payload).unwrap();
      toast({
        title: "Payout details saved",
        description: "Bank and bKash details have been updated.",
      });
      refetchProfile();
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: error?.data?.message || "Could not save payout details.",
      });
      return false;
    }
  };

  const handleUploadDocument = async () => {
    if (!docFile) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please choose a file before uploading.",
      });
      return false;
    }

    const formData = new FormData();
    formData.append("file", docFile);
    formData.append("docType", docType);
    formData.append("category", docCategory);
    if (docNumber.trim()) {
      formData.append("docNumber", docNumber.trim());
    }

    try {
      await uploadMyDocument(formData).unwrap();
      toast({
        title: "Document uploaded",
        description: "Your document is now ready for compliance review.",
      });
      setDocNumber("");
      setDocFile(null);
      refetchDocs();
      refetchProfile();
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error?.data?.message || "Could not upload document.",
      });
      return false;
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      await submitProfileForApproval({ note: submissionNote }).unwrap();
      toast({
        title: "Submitted for approval",
        description: "Your profile has been sent for admin review.",
      });
      refetchProfile();
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description:
          error?.data?.message ||
          "Please complete document and payout details before submitting.",
      });
      return false;
    }
  };

  const openActionConfirmation = (action) => {
    if (action === "upload-document" && !docFile) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please choose a file before uploading.",
      });
      return;
    }

    setConfirmAction(action);
  };

  const closeActionConfirmation = () => {
    setConfirmAction(null);
  };

  const confirmationConfig = useMemo(() => {
    if (confirmAction === "save-payout") {
      return {
        title: "Save payout details?",
        description: "Bank and bKash details will be updated for withdrawal settlement.",
        confirmLabel: "Save Details",
        confirmVariant: "default",
      };
    }

    if (confirmAction === "upload-document") {
      return {
        title: "Upload this document?",
        description: "The selected document will be submitted for compliance review.",
        confirmLabel: "Upload Document",
        confirmVariant: "default",
      };
    }

    return {
      title: "Submit profile for admin approval?",
      description: "After submission, admin review status will control your financial action access.",
      confirmLabel: "Submit For Approval",
      confirmVariant: "default",
    };
  }, [confirmAction]);

  const runConfirmedAction = async () => {
    let success = false;

    if (confirmAction === "save-payout") {
      success = await handleSavePayout();
    } else if (confirmAction === "upload-document") {
      success = await handleUploadDocument();
    } else if (confirmAction === "submit-approval") {
      success = await handleSubmitForApproval();
    }

    if (success) {
      closeActionConfirmation();
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h2 className="text-2xl font-semibold">Profile and Compliance</h2>
        <p className="text-sm text-muted-foreground">
          Manage your identity, KYC readiness, and payout banking information.
        </p>
      </div>

      <Card className="border-border/70 bg-muted/20">
        <CardContent className="flex flex-wrap items-start justify-between gap-4 pt-6">
          <div className="space-y-1">
            <p className="text-sm font-medium">Current Admin Approval Status</p>
            <p className="text-xs text-muted-foreground">
              This status controls whether your financial actions remain unlocked.
            </p>
            {approval?.rejectionReason ? (
              <p className="text-xs text-destructive">Reason: {approval.rejectionReason}</p>
            ) : null}
            {approval?.holdReason ? (
              <p className="text-xs text-amber-600">Hold Note: {approval.holdReason}</p>
            ) : null}
          </div>
          <Badge variant={resolveBadge(approvalStatus)}>{approvalStatus}</Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserRound className="h-5 w-5" />
              Account Identity
            </CardTitle>
            <CardDescription>ব্যক্তিগত তথ্য</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Full Name</label>
              <Input value={fullName} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Email</label>
              <Input value={user.email || "-"} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Role</label>
              <Input value={user.roleName || "Investor"} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Phone</label>
              <Input value={user.phone || "Not added yet"} disabled />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CircleCheck className="h-5 w-5" />
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
              <span className="text-muted-foreground">Email verification</span>
              <Badge variant={user.isVerified ? "secondary" : "outline"}>
                {user.isVerified ? "Verified" : "Pending"}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
              <span className="text-muted-foreground">KYC status</span>
              <Badge variant={resolveBadge(kycStatus)}>{kycStatus}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
              <span className="text-muted-foreground">Accreditation</span>
              <Badge variant={resolveBadge(accreditationStatus)}>{accreditationStatus}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
              <span className="text-muted-foreground">Admin approval</span>
              <Badge variant={resolveBadge(approvalStatus)}>{approvalStatus}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <IdCard className="h-5 w-5" />
              KYC Documents
            </CardTitle>
            <CardDescription>
              National ID, passport, or driving license verification records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                openActionConfirmation("upload-document");
              }}
              className="space-y-3 rounded-md border border-border/60 p-3"
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Category</Label>
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
                  <Label>Document Type</Label>
                  <Input value={docType} onChange={(event) => setDocType(event.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Document Number (optional)</Label>
                <Input
                  value={docNumber}
                  onChange={(event) => setDocNumber(event.target.value)}
                  placeholder="Document number"
                />
              </div>
              <div className="space-y-2">
                <Label>File</Label>
                <Input
                  type="file"
                  onChange={(event) => setDocFile(event.target.files?.[0] || null)}
                />
              </div>
              <Button type="submit" disabled={isUploadingDoc || !docFile}>
                {isUploadingDoc ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Upload Document
              </Button>
            </form>

            <div className="space-y-2 rounded-md border border-border/60 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Uploaded</p>
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {isFetchingDocs ? "Loading documents..." : "No documents uploaded yet."}
                </p>
              ) : (
                <div className="space-y-2">
                  {documents.slice(0, 4).map((doc, idx) => (
                    <div key={`${doc.fileUrl}-${idx}`} className="flex items-center justify-between rounded border p-2">
                      <div>
                        <p className="text-sm font-medium">{doc.docType || "Document"}</p>
                        <p className="text-xs text-muted-foreground">{doc.category} • {doc.docNumber || "No number"}</p>
                      </div>
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                        View
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 rounded-md border border-border/60 p-3">
              <Label htmlFor="submission-note">Submission Note (optional)</Label>
              <Textarea
                id="submission-note"
                value={submissionNote}
                onChange={(event) => setSubmissionNote(event.target.value)}
                placeholder="Any context for compliance team"
              />
              <Button
                type="button"
                onClick={() => openActionConfirmation("submit-approval")}
                disabled={isSubmittingForApproval || isFetchingProfile}
              >
                {isSubmittingForApproval ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit For Approval
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Banking and Payout
            </CardTitle>
            <CardDescription>
              Withdrawal settlement details used by operations approval flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Preferred Method</Label>
                <Select value={preferredMethod} onValueChange={setPreferredMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payout method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="bkash">bKash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border border-border/60 p-3 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bank Account</p>
              <Input placeholder="Bank name" value={bankName} onChange={(event) => setBankName(event.target.value)} />
              <Input
                placeholder="Account holder name"
                value={bankHolder}
                onChange={(event) => setBankHolder(event.target.value)}
              />
              <Input
                placeholder="Account number"
                value={bankNumber}
                onChange={(event) => setBankNumber(event.target.value)}
              />
              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  placeholder="Routing number"
                  value={bankRouting}
                  onChange={(event) => setBankRouting(event.target.value)}
                />
                <Input
                  placeholder="Branch name"
                  value={bankBranch}
                  onChange={(event) => setBankBranch(event.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md border border-border/60 p-3 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">bKash</p>
              <Input
                placeholder="bKash number"
                value={bkashNumber}
                onChange={(event) => setBkashNumber(event.target.value)}
              />
              <Input
                placeholder="Account holder name"
                value={bkashHolder}
                onChange={(event) => setBkashHolder(event.target.value)}
              />
              <Select value={bkashType} onValueChange={setBkashType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bKash type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => openActionConfirmation("save-payout")}
              disabled={isSavingPayout}
            >
              {isSavingPayout && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Banking Details
            </Button>
          </CardContent>
        </Card>
      </div>

      <ConfirmationDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => {
          if (!open) closeActionConfirmation();
        }}
        title={confirmationConfig.title}
        description={confirmationConfig.description}
        confirmLabel={confirmationConfig.confirmLabel}
        confirmVariant={confirmationConfig.confirmVariant}
        isLoading={isSavingPayout || isUploadingDoc || isSubmittingForApproval}
        onConfirm={runConfirmedAction}
      />
    </div>
  );
};
