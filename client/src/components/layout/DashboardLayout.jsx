import { Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  PieChart, 
  Wallet, 
  CreditCard, 
  User, 
  LayoutDashboard, 
  ArrowLeftRight 
} from "lucide-react";

export const DashboardLayout = () => {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { path: "/marketplace", label: "Marketplace", icon: <PieChart className="h-5 w-5" /> },
    { path: "/investments", label: "Investments", icon: <CreditCard className="h-5 w-5" /> },
    { path: "/wallet", label: "Wallet", icon: <Wallet className="h-5 w-5" /> },
    { path: "/withdrawals", label: "Withdrawals", icon: <ArrowLeftRight className="h-5 w-5" /> },
    { path: "/profile", label: "Profile", icon: <User className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur hidden md:block">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="text-lg font-semibold">AssetNode</div>
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Button 
                key={item.path} 
                variant={isActive(item.path) ? "secondary" : "ghost"} 
                asChild
                className="text-sm"
              >
                <Link to={item.path}>{item.label}</Link>
              </Button>
            ))}
            <Button variant="outline" asChild className="ml-2">
              <Link to="/">Exit</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur md:hidden flex items-center justify-between px-4 h-14">
         <div className="text-lg font-semibold">AssetNode</div>
         <Button variant="ghost" size="sm" asChild>
            <Link to="/">Exit</Link>
         </Button>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 px-2 py-2 backdrop-blur md:hidden">
        <div className="flex items-center justify-around">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex flex-col items-center gap-1 p-2 rounded-md ${isActive(item.path) ? "text-primary" : "text-muted-foreground"}`}
            >
              {item.icon}
              <span className="text-[10px]">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};
