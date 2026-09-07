import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CreditCard,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Receipt,
  Settings,
  Users,
  Wrench,
  X,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavItem = { to: string; label: string; icon: ReactNode };

const ADMIN_NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
  { to: "/apartments", label: "Apartments", icon: <Building2 className="size-4" /> },
  { to: "/tenants", label: "Tenants", icon: <Users className="size-4" /> },
  { to: "/rent", label: "Rent", icon: <FileText className="size-4" /> },
  { to: "/payments", label: "Payments", icon: <CreditCard className="size-4" /> },
  { to: "/maintenance", label: "Maintenance", icon: <Wrench className="size-4" /> },
  { to: "/notices", label: "Notices", icon: <Megaphone className="size-4" /> },
  { to: "/reports", label: "Reports", icon: <Receipt className="size-4" /> },
  { to: "/settings", label: "Settings", icon: <Settings className="size-4" /> },
];

const TENANT_NAV: NavItem[] = [
  { to: "/portal", label: "Overview", icon: <Home className="size-4" /> },
  { to: "/portal/payments", label: "Rent & Payments", icon: <CreditCard className="size-4" /> },
  { to: "/portal/maintenance", label: "Maintenance", icon: <Wrench className="size-4" /> },
  { to: "/portal/notices", label: "Notices", icon: <Megaphone className="size-4" /> },
  { to: "/portal/profile", label: "My Profile", icon: <Users className="size-4" /> },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav = role === "admin" ? ADMIN_NAV : TENANT_NAV;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Building2 className="size-5" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold">HomeRent</p>
          <p className="text-xs text-sidebar-foreground/60">
            {role === "admin" ? "Owner console" : "Tenant portal"}
          </p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {nav.map((item) => {
          const active =
            item.to === "/portal" || item.to === "/dashboard"
              ? pathname === item.to
              : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border px-4 py-4">
        <p className="truncate text-xs text-sidebar-foreground/60">{user?.email}</p>
        <button
          onClick={signOut}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border lg:block">
        {sidebar}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-72 shadow-xl">
            <button
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
              className="absolute top-4 right-3 z-10 rounded-md p-1 text-sidebar-foreground/70"
            >
              <X className="size-5" />
            </button>
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open navigation">
            <Menu className="size-5" />
          </Button>
          <span className="font-semibold">HomeRent Manager</span>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
