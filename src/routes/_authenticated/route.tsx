import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { loading, session, role } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isTenantArea = pathname.startsWith("/portal");

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/", replace: true });
      return;
    }
    if (role === "tenant" && !isTenantArea) {
      navigate({ to: "/portal", replace: true });
    }
    if (role === "admin" && isTenantArea) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, session, role, isTenantArea, navigate]);

  if (loading || !session || !role) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
