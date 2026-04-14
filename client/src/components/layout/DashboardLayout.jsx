import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  CreditCard,
  EllipsisVertical,
  LayoutDashboard,
  LogOut,
  PieChart,
  User,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { logout } from "@/features/auth/authSlice";
import ROUTES from "@/router/routes";

const desktopNavItems = [
  { path: ROUTES.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  { path: ROUTES.MARKETPLACE, label: "Marketplace", icon: PieChart },
  { path: ROUTES.INVESTMENTS, label: "Investments", icon: CreditCard },
  { path: ROUTES.WALLET, label: "Wallet", icon: Wallet },
  { path: ROUTES.WITHDRAWALS, label: "Withdrawals", icon: ArrowLeftRight },
  { path: ROUTES.DEPOSITS, label: "Deposits", icon: ArrowDownLeft },
  { path: ROUTES.PROFILE, label: "Profile", icon: User },
];

const mobileBottomNavItems = desktopNavItems.filter((item) =>
  [ROUTES.DASHBOARD, ROUTES.MARKETPLACE, ROUTES.INVESTMENTS, ROUTES.WALLET, ROUTES.PROFILE].includes(
    item.path
  )
);

const mobileMoreNavItems = [
  { path: ROUTES.WITHDRAWALS, label: "Withdrawals", icon: ArrowLeftRight },
  { path: ROUTES.DEPOSITS, label: "Deposits", icon: ArrowDownLeft },
  { path: ROUTES.PROFILE, label: "Profile", icon: User },
];

const getCurrentPageTitle = (pathname) => {
  const current = desktopNavItems.find((item) => pathname.startsWith(item.path));
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
    navigate(ROUTES.LOGIN, { replace: true });
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
            <Badge variant="secondary" className="hidden lg:inline-flex">
              {investorName}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open more menu">
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>More</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {mobileMoreNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <NavLink to={item.path} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </NavLink>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={handleLogout} className="hidden lg:inline-flex">
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
            {desktopNavItems.map((item) => {
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
        <div className="grid grid-cols-5 gap-1">
          {mobileBottomNavItems.map((item) => {
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
