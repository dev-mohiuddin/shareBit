import { ConfirmationDialog } from "@/components/dialogs/shared/ConfirmationDialog"

export const ApproveInvestorDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  investorName,
}) => (
  <ConfirmationDialog
    open={open}
    onOpenChange={onOpenChange}
    title="Approve investor profile?"
    description={`${investorName || "This investor"} will be marked approved and financial actions will be enabled.`}
    confirmLabel="Approve"
    onConfirm={onConfirm}
    isLoading={isLoading}
  />
)

export const RejectInvestorDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  investorName,
  children,
}) => (
  <ConfirmationDialog
    open={open}
    onOpenChange={onOpenChange}
    title="Reject investor profile?"
    description={`${investorName || "This investor"} will be rejected and financial actions will remain blocked.`}
    confirmLabel="Reject"
    confirmVariant="destructive"
    onConfirm={onConfirm}
    isLoading={isLoading}
  >
    {children}
  </ConfirmationDialog>
)

export const HoldInvestorDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  investorName,
  children,
}) => (
  <ConfirmationDialog
    open={open}
    onOpenChange={onOpenChange}
    title="Place investor on hold?"
    description={`${investorName || "This investor"} will be moved to on-hold and financial actions will be blocked.`}
    confirmLabel="Place on Hold"
    confirmVariant="destructive"
    onConfirm={onConfirm}
    isLoading={isLoading}
  >
    {children}
  </ConfirmationDialog>
)

export const ActivateInvestorDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  investorName,
}) => (
  <ConfirmationDialog
    open={open}
    onOpenChange={onOpenChange}
    title="Activate investor account?"
    description={`${investorName || "This investor"} account will be activated.`}
    confirmLabel="Activate"
    onConfirm={onConfirm}
    isLoading={isLoading}
  />
)

export const DeactivateInvestorDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  investorName,
  children,
}) => (
  <ConfirmationDialog
    open={open}
    onOpenChange={onOpenChange}
    title="Deactivate investor account?"
    description={`${investorName || "This investor"} account will be deactivated and financial actions will be blocked.`}
    confirmLabel="Deactivate"
    confirmVariant="destructive"
    onConfirm={onConfirm}
    isLoading={isLoading}
  >
    {children}
  </ConfirmationDialog>
)