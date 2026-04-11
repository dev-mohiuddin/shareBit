import * as React from "react";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const SidebarContext = React.createContext(null);

const useSidebar = () => {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
};

const SidebarProvider = ({ children }) => {
  const [openMobile, setOpenMobile] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  const desktopWidthClass = collapsed ? "lg:w-20" : "lg:w-72";
  const desktopInsetClass = collapsed ? "lg:pl-20" : "lg:pl-72";
  const desktopHeaderOffsetClass = collapsed ? "lg:left-20" : "lg:left-72";

  const value = React.useMemo(
    () => ({
      openMobile,
      setOpenMobile,
      collapsed,
      setCollapsed,
      desktopWidthClass,
      desktopInsetClass,
      desktopHeaderOffsetClass,
      toggleMobile: () => setOpenMobile((prev) => !prev),
      toggleDesktop: () => setCollapsed((prev) => !prev),
    }),
    [collapsed, desktopHeaderOffsetClass, desktopInsetClass, desktopWidthClass, openMobile]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

const Sidebar = ({ className, children }) => {
  const { openMobile, setOpenMobile, desktopWidthClass } = useSidebar();

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden border-r border-slate-800 bg-slate-950 text-slate-100 transition-[width] duration-200 lg:flex",
          desktopWidthClass,
          className
        )}
      >
        {children}
      </aside>

      {openMobile && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpenMobile(false)}
            aria-label="Close sidebar"
          />
          <aside
            className={cn(
              "absolute inset-y-0 left-0 flex w-72 flex-col border-r border-slate-800 bg-slate-950 text-slate-100 shadow-xl",
              className
            )}
            onClick={(event) => {
              if (event.target.closest("a")) {
                setOpenMobile(false);
              }
            }}
          >
            {children}
          </aside>
        </div>
      )}
    </>
  );
};

const SidebarHeader = ({ className, ...props }) => (
  <div className={cn("border-b border-slate-800 px-4 py-4", className)} {...props} />
);

const SidebarContent = ({ className, ...props }) => (
  <div className={cn("flex-1 overflow-y-auto p-3", className)} {...props} />
);

const SidebarFooter = ({ className, ...props }) => (
  <div className={cn("border-t border-slate-800 p-3", className)} {...props} />
);

const SidebarTrigger = ({ className, ...props }) => {
  const { toggleMobile } = useSidebar();

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn("lg:hidden", className)}
      onClick={toggleMobile}
      aria-label="Open sidebar"
      {...props}
    >
      <Menu className="h-4 w-4" />
    </Button>
  );
};

const SidebarDesktopTrigger = ({ className, ...props }) => {
  const { toggleDesktop, collapsed } = useSidebar();

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn("hidden lg:inline-flex", className)}
      onClick={toggleDesktop}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      {...props}
    >
      <Menu className="h-4 w-4" />
    </Button>
  );
};

const SidebarClose = ({ className, ...props }) => {
  const { setOpenMobile } = useSidebar();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("text-slate-100 hover:bg-slate-800 lg:hidden", className)}
      onClick={() => setOpenMobile(false)}
      aria-label="Close sidebar"
      {...props}
    />
  );
};

const SidebarInset = ({ className, ...props }) => {
  const { desktopInsetClass } = useSidebar();
  return <div className={cn("pt-16", desktopInsetClass, className)} {...props} />;
};

export {
  Sidebar,
  SidebarClose,
  SidebarContent,
  SidebarDesktopTrigger,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
};
