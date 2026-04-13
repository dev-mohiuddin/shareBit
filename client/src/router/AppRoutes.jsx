import { useRoutes } from "react-router-dom";
import ROUTES from "@/router/routes";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { LandingPage } from "@/pages/public/LandingPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { VerifyOtpPage } from "@/pages/auth/VerifyOtpPage";
import { UserDashboardPage } from "@/pages/user/dashboard/UserDashboardPage";
import { MarketplacePage } from "@/pages/user/marketplace/MarketplacePage";
import { InvestmentsPage } from "@/pages/user/investments/InvestmentsPage";
import { WalletPage } from "@/pages/user/wallet/WalletPage";
import { WithdrawalsPage } from "@/pages/user/withdrawals/WithdrawalsPage";
import { ProfilePage } from "@/pages/user/profile/ProfilePage";
import { AdminPanelPage } from "@/pages/admin/dashboard/AdminPanelPage";
import { AssetManagerPage } from "@/pages/admin/asset/AssetManagerPage";
import { ShareManagerPage } from "@/pages/admin/share/ShareManagerPage";
import { SharePaymentPage } from "@/pages/admin/payment/SharePaymentPage";
import { ProfitManagerPage } from "@/pages/admin/profit/ProfitManagerPage";
import { InvestorInsightsPage } from "@/pages/admin/investor/InvestorInsightsPage";
import { InvestorDetailsPage } from "@/pages/admin/investor/InvestorDetailsPage";
import { WithdrawalManagerPage } from "@/pages/admin/withdrawal/WithdrawalManagerPage";
import { AuditLogsPage } from "@/pages/admin/audit/AuditLogsPage";
import { PendingApprovalsPage } from "@/pages/admin/user/PendingApprovalsPage";
import { SettingsPage } from "@/pages/admin/settings/SettingsPage";
import { UnauthorizedPage } from "@/pages/common/UnauthorizedPage";
import { NotFoundPage } from "@/pages/common/NotFoundPage";
import { PermissionGuard } from "@/components/guards/PermissionGuard";

export const AppRoutes = () => {
  return useRoutes([
    {
      element: <PublicLayout />,
      children: [
        { path: ROUTES.HOME, element: <LandingPage /> },
        { path: ROUTES.LOGIN, element: <LoginPage /> },
        { path: ROUTES.REGISTER, element: <RegisterPage /> },
        { path: ROUTES.VERIFY_OTP, element: <VerifyOtpPage /> },
        { path: ROUTES.UNAUTHORIZED, element: <UnauthorizedPage /> },
      ],
    },
    {
      element: (
        <PermissionGuard requiredPanel="investor">
          <DashboardLayout />
        </PermissionGuard>
      ),
      children: [
        { path: ROUTES.DASHBOARD, element: <UserDashboardPage /> },
        { path: ROUTES.MARKETPLACE, element: <MarketplacePage /> },
        { path: ROUTES.INVESTMENTS, element: <InvestmentsPage /> },
        { path: ROUTES.WALLET, element: <WalletPage /> },
        { path: ROUTES.WITHDRAWALS, element: <WithdrawalsPage /> },
        { path: ROUTES.PROFILE, element: <ProfilePage /> },
      ],
    },
    {
      element: (
        <PermissionGuard requiredPanel="admin">
          <AdminLayout />
        </PermissionGuard>
      ),
      children: [
        { path: ROUTES.ADMIN, element: <AdminPanelPage /> },
        { path: ROUTES.ADMIN_ASSETS, element: <AssetManagerPage /> },
        { path: ROUTES.ADMIN_SHARES, element: <ShareManagerPage /> },
        { path: ROUTES.ADMIN_PAYMENTS, element: <SharePaymentPage /> },
        { path: ROUTES.ADMIN_PROFIT, element: <ProfitManagerPage /> },
        { path: ROUTES.ADMIN_INVESTORS, element: <InvestorInsightsPage /> },
        { path: ROUTES.ADMIN_INVESTOR_DETAILS, element: <InvestorDetailsPage /> },
        { path: ROUTES.ADMIN_WITHDRAWALS, element: <WithdrawalManagerPage /> },
        { path: ROUTES.ADMIN_AUDIT, element: <AuditLogsPage /> },
        { path: ROUTES.ADMIN_PENDING_APPROVALS, element: <PendingApprovalsPage /> },
        { path: ROUTES.ADMIN_SETTINGS, element: <SettingsPage /> },
      ],
    },
    { path: "*", element: <NotFoundPage /> },
  ]);
};
