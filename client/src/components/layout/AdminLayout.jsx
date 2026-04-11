import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Shield,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarClose,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { logout } from "@/features/auth/authSlice";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Asset Manager", to: "/admin/assets", icon: Boxes },
  { label: "Share Management", to: "/admin/shares", icon: ListChecks },
  { label: "Share Payments", to: "/admin/payments", icon: CreditCard },
  { label: "Profit Manager", to: "/admin/profit", icon: BarChart3 },
  { label: "Investor Insights", to: "/admin/investors", icon: Users },
  { label: "Withdrawals", to: "/admin/withdrawals", icon: ClipboardList },
  { label: "Audit Logs", to: "/admin/audit", icon: Shield },
];

const getCurrentTitle = (pathname) => {
  const exact = navItems.find((item) => item.to === pathname);
  if (exact) return exact.label;
  const match = navItems.find((item) => pathname.startsWith(item.to) && item.to !== "/admin");
  return match?.label || "Dashboard";
};

const AdminLayoutShell = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { collapsed, desktopHeaderOffsetClass, toggleDesktop } = useSidebar();

  const currentTitle = getCurrentTitle(location.pathname);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <Sidebar>
        <SidebarHeader>
          <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "justify-between")}>
            <div className={cn("min-w-0", collapsed && "lg:hidden")}>
              <p className="text-xs uppercase tracking-wide text-slate-300">Control Center</p>
              <p className="mt-1 text-base font-semibold">ShareBit Admin</p>
            </div>
            <div className="lg:hidden">
              <SidebarClose>
                <X className="h-4 w-4" />
              </SidebarClose>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/admin"}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors",
                      collapsed ? "lg:justify-center" : "lg:justify-start",
                      isActive
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-200 hover:bg-slate-800"
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className={cn("truncate", collapsed && "lg:hidden")}>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </SidebarContent>
      </Sidebar>

      <header
        className={cn(
          "fixed left-0 right-0 top-0 z-30 border-b border-border bg-background/95 backdrop-blur transition-[left] duration-200",
          desktopHeaderOffsetClass
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="hidden lg:inline-flex"
              onClick={toggleDesktop}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Admin Panel</p>
              <p className="text-lg font-semibold leading-tight">{currentTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {user?.roleName || "Admin"}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <SidebarInset>
        <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-border bg-background px-4 py-3">
            <p className="text-xs text-muted-foreground">Admin Panel</p>
            <h1 className="text-xl font-semibold">{currentTitle}</h1>
          </div>
          <Outlet />
        </main>
      </SidebarInset>
    </div>
  );
};

export const AdminLayout = () => {
  return (
    <SidebarProvider>
      <AdminLayoutShell />
    </SidebarProvider>
  );
};
