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
import { AdminPanelPage } from "@/pages/admin/dashboard/AdminPanelPage";
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
      children: [{ path: ROUTES.DASHBOARD, element: <UserDashboardPage /> }],
    },
    {
      element: (
        <PermissionGuard requiredPanel="super-admin">
          <AdminLayout />
        </PermissionGuard>
      ),
      children: [{ path: ROUTES.ADMIN, element: <AdminPanelPage /> }],
    },
    { path: "*", element: <NotFoundPage /> },
  ]);
};
