import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  CreditCard,
  LayoutDashboard,
  LogOut,
  PieChart,
  User,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { logout } from "@/features/auth/authSlice";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/marketplace", label: "Marketplace", icon: PieChart },
  { path: "/investments", label: "Investments", icon: CreditCard },
  { path: "/wallet", label: "Wallet", icon: Wallet },
  { path: "/withdrawals", label: "Withdrawals", icon: ArrowLeftRight },
  { path: "/profile", label: "Profile", icon: User },
];

const getCurrentPageTitle = (pathname) => {
  const current = navItems.find((item) => pathname.startsWith(item.path));
  return current?.label || "Workspace";
};

export const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const currentTitle = getCurrentPageTitle(location.pathname);
  const investorName = `${user?.firstName || "Investor"} ${user?.lastName || ""}`.trim();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
          <div>
            <p className="text-sm text-muted-foreground">Investor Workspace</p>
            <p className="text-lg font-semibold">ShareBit</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {investorName}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 pb-24 lg:grid-cols-[230px,1fr] lg:pb-6">
        <aside className="hidden rounded-lg border border-border bg-background p-3 lg:block">
          <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="space-y-4">
          <div className="rounded-lg border border-border bg-background px-4 py-3">
            <p className="text-xs text-muted-foreground">Investor Panel</p>
            <h1 className="text-xl font-semibold">{currentTitle}</h1>
          </div>
          <Outlet />
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 px-2 py-2 backdrop-blur lg:hidden">
        <div className="grid grid-cols-6 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center rounded-md py-2 text-[10px] ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="mb-1 h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
