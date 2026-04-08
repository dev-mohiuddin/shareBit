import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Shield,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { logout } from "@/features/auth/authSlice";

const navItems = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Asset Manager", to: "/admin/assets", icon: Boxes },
  { label: "Share Management", to: "/admin/shares", icon: ListChecks },
  { label: "Profit Manager", to: "/admin/profit", icon: BarChart3 },
  { label: "Withdrawals", to: "/admin/withdrawals", icon: ClipboardList },
  { label: "Audit Logs", to: "/admin/audit", icon: Shield },
];

const getCurrentTitle = (pathname) => {
  const exact = navItems.find((item) => item.to === pathname);
  if (exact) return exact.label;
  const match = navItems.find((item) => pathname.startsWith(item.to) && item.to !== "/admin");
  return match?.label || "Dashboard";
};

export const AdminLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const currentTitle = getCurrentTitle(location.pathname);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div>
              <p className="text-sm text-muted-foreground">Admin Workspace</p>
              <p className="text-lg font-semibold">ShareBit Operations</p>
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

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[250px,1fr]">
        <aside className="hidden rounded-lg bg-slate-900 p-3 text-slate-100 lg:block">
          <div className="mb-3 px-2">
            <p className="text-xs uppercase tracking-wide text-slate-300">Control Center</p>
            <p className="text-base font-semibold">Admin Navigation</p>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                      isActive
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-200 hover:bg-slate-800"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="space-y-4">
          <div className="rounded-lg border border-border bg-background px-4 py-3">
            <p className="text-xs text-muted-foreground">Admin Panel</p>
            <h1 className="text-xl font-semibold">{currentTitle}</h1>
          </div>
          <Outlet />
        </main>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          />
          <aside className="absolute left-0 top-0 h-full w-72 bg-slate-900 p-4 text-slate-100 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-300">Control Center</p>
                <p className="text-base font-semibold">Admin Navigation</p>
              </div>
              <Button variant="ghost" size="icon" className="text-slate-100 hover:bg-slate-800" onClick={() => setMenuOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                        isActive
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-200 hover:bg-slate-800"
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
};
