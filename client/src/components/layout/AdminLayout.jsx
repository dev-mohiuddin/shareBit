import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { label: "Analytics", to: "/admin" },
  { label: "Assets", to: "/admin?tab=assets" },
  { label: "Share Assignment", to: "/admin?tab=shares" },
  { label: "Withdrawals", to: "/admin?tab=withdrawals" },
  { label: "Audit Logs", to: "/admin?tab=audit" },
  { label: "Users", to: "/admin?tab=users" },
];

export const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside className="hidden w-64 border-r border-border bg-card p-6 lg:block">
          <div className="text-xl font-semibold">ShareBit Admin</div>
          <nav className="mt-6 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm font-medium ${
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
