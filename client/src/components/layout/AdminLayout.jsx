import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Boxes,
  LayoutDashboard,
  LogOut,
  Shield,
  Users,
  Settings,
  ChevronRight,
  UserCircle,
  PiggyBank,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { logout } from "@/features/auth/authSlice";

const navItems = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { 
    label: "User Management", 
    icon: Users,
    children: [
      { label: "Investors", to: "/admin/investors" },
      { label: "Pending Approvals", to: "/admin/users/pending" },
    ]
  },
  { 
    label: "Asset Management", 
    icon: Boxes,
    children: [
      { label: "All Assets", to: "/admin/assets" },
      { label: "Share Allocations", to: "/admin/shares" },
    ]
  },
  {
    label: "Finance Ledger",
    icon: PiggyBank,
    children: [
      { label: "Share Payments", to: "/admin/payments" },
      { label: "Withdrawals", to: "/admin/withdrawals" },
      { label: "Deposits", to: "/admin/deposits" },
      { label: "Profit & Loss", to: "/admin/profit" },
    ]
  },
  { label: "Audit Logs", to: "/admin/audit", icon: Shield },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

const getCurrentTitle = (pathname) => {
  const exact = navItems.find((item) => item.to === pathname);
  if (exact) return exact.label;

  for (const item of navItems) {
    if (item.children) {
      const childExact = item.children.find((child) => child.to === pathname);
      if (childExact) return childExact.label;
    }
  }

  const flatMatch = navItems.find((item) => item.to && pathname.startsWith(item.to) && item.to !== "/admin");
  return flatMatch?.label || "Dashboard";
};

const AdminAppSidebar = () => {
  const location = useLocation();

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="border-b border-border/50 py-3 mb-2 shrink-0 h-16">
        <div className="flex h-full items-center gap-2 px-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5 leading-tight select-none">
            <span className="font-semibold text-sm">ShareBit Admin</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Control Center</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs tracking-wider uppercase text-muted-foreground mb-2">Platform Engine</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item, index) => {
                const Icon = item.icon;
                
                if (item.children) {
                  const isGroupActive = item.children.some(child => location.pathname.startsWith(child.to));
                  
                  return (
                    <Collapsible
                      key={`group-${index}`}
                      asChild
                      defaultOpen={isGroupActive}
                      className="group/collapsible pb-1"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.label} isActive={isGroupActive} className="py-5 font-medium">
                            <Icon className="!w-[1.2rem] !h-[1.2rem] mr-2" />
                            <span>{item.label}</span>
                            <ChevronRight className="ml-auto w-4 h-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub className="ml-4 mt-1 border-slate-200 dark:border-slate-800">
                            {item.children.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.to}>
                                <SidebarMenuSubButton asChild isActive={location.pathname === subItem.to} className="py-4 my-0.5">
                                  <NavLink to={subItem.to}>
                                    <span>{subItem.label}</span>
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.label} className="pb-1">
                    <SidebarMenuButton asChild tooltip={item.label} isActive={location.pathname === item.to || (item.to !== '/admin' && location.pathname.startsWith(item.to))} className="py-5 font-medium">
                      <NavLink to={item.to} end={item.to === "/admin"}>
                        <Icon className="!w-[1.2rem] !h-[1.2rem] mr-2" />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border/50 p-4 shrink-0 h-16">
          <div className="flex h-full items-center justify-center -ml-2">
            <Badge variant="outline" className="opacity-70 shadow-sm text-[10px]">v2.5.0-core</Badge>
          </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export const AdminLayout = () => {
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
    <SidebarProvider>
      <AdminAppSidebar />
      <SidebarInset className="bg-muted/10">
        <header className="sticky top-0 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/40 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm z-30">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1 w-9 h-9" />
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest hidden sm:inline-block">Admin Workspace</span>
              <span className="text-base font-bold text-foreground leading-tight tracking-tight">{currentTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center space-x-2 text-sm font-medium mr-4 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
               <span className="text-slate-600 dark:text-slate-300">System Online</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 outline-none rounded-full ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <Avatar className="h-9 w-9 hover:opacity-90 transition-all hover:scale-105 duration-200 shadow-md">
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                      {user?.name ? user.name.charAt(0).toUpperCase() : <UserCircle className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50 w-64 font-medium dark:bg-slate-950/95 backdrop-blur-xl shadow-2xl p-2 rounded-xl border-slate-200 dark:border-slate-800">
                <DropdownMenuLabel className="font-normal border-b pb-3 mb-2 border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border shadow-sm">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {user?.name ? user.name.charAt(0).toUpperCase() : <UserCircle className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm leading-none font-bold text-slate-900 dark:text-slate-100">{user?.name || "Admin Executive"}</p>
                      <p className="text-xs leading-none text-muted-foreground font-medium">
                        {user?.email || "admin@sharebit.app"}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                
                <div className="px-1">
                  <Badge variant="secondary" className="w-full justify-center mb-2 font-mono tracking-widest text-[10px] uppercase">
                    {user?.roleName || "Super Admin"}
                  </Badge>
                </div>

                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 h-px mx-0 mb-1" />
                
                <div className="space-y-1">
                  <DropdownMenuItem className="cursor-pointer font-medium p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors" asChild>
                    <NavLink to="/admin/settings?tab=profile">
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer font-medium p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors" asChild>
                    <NavLink to="/admin/settings?tab=platform">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Platform Settings</span>
                    </NavLink>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 h-px mx-0 my-1" />
                
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="cursor-pointer font-bold p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-500 dark:hover:text-rose-400 dark:hover:bg-rose-900/40 rounded-md transition-colors focus:text-rose-700 focus:bg-rose-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Secure Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <main className="flex-1 p-4 lg:p-8 w-full max-w-[1400px] mx-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};
