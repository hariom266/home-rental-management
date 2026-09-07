import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Building2, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { resolveLoginEmail } from "@/lib/format";
import { bootstrapDemoData } from "@/lib/demo.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Malti’s Rental Manager" },
      {
        name: "description",
        content:
          "Secure sign-in for the building owner and tenants of a private 15-apartment residential building.",
      },
      { property: "og:title", content: "Sign in — Malti’s Rental Manager" },
      {
        property: "og:description",
        content: "Private rental management portal for owners and tenants.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const { loading, session, role } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const seed = useServerFn(bootstrapDemoData);

  useEffect(() => {
    if (loading || !session || !role) return;
    navigate({ to: role === "admin" ? "/dashboard" : "/portal", replace: true });
  }, [loading, session, role, navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: resolveLoginEmail(identifier),
      password,
    });
    setBusy(false);
    if (error) {
      toast.error("Sign in failed", { description: error.message });
      return;
    }
    toast.success("Welcome back");
  }

  async function handleSeed() {
    setBusy(true);
    try {
      const result = await seed({});
      toast.success(result.created ? "Demo data created" : "Demo data already present", {
        description: "Sign in as admin@homerent.local / Admin@12345",
      });
    } catch (error) {
      toast.error("Could not create demo data", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-brand-gradient p-12 text-primary-foreground lg:flex">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/15">
            <Building2 className="size-5" />
          </span>
          <span className="text-lg font-bold">Malti’s Rental Manager</span>
        </Link>
        <div className="max-w-md">
          <h2 className="text-3xl font-bold leading-tight">
            One private console for all 15 apartments.
          </h2>
          <p className="mt-4 text-sm text-primary-foreground/80">
            Track rent, record payments, issue receipts, resolve maintenance requests and publish
            notices — with tenants seeing only their own home.
          </p>
        </div>
        <p className="flex items-center gap-2 text-xs text-primary-foreground/70">
          <ShieldCheck className="size-4" /> Private building software. Access is invitation only.
        </p>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link
              to="/"
              className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"
            >
              <Building2 className="size-5" />
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tenants use their Apartment ID (e.g. APT-007). Owners use their email address.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Apartment ID or email</Label>
              <Input
                id="identifier"
                autoComplete="username"
                placeholder="APT-007"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Sign in"}
            </Button>
          </form>

          <div className="mt-8 rounded-xl border bg-card p-4 text-sm shadow-card">
            <p className="font-semibold">First run?</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create the demo building: one owner account, 15 tenants and four months of rent
              history.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={handleSeed}
              disabled={busy}
            >
              Create demo data
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Owner: <code>admin@homerent.local</code> / <code>Admin@12345</code>
              <br />
              Tenant: <code>APT-001</code> / <code>Tenant@12345</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
