import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  CreditCard,
  FileText,
  Megaphone,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Malti’s Rental Manager — Private 15-Apartment Rental Console" },
      {
        name: "description",
        content:
          "Private rental management for a single 15-apartment building: rent tracking, receipts, maintenance requests and notices for the owner and every tenant.",
      },
      { property: "og:title", content: "Malti’s Rental Manager — Private Rental Console" },
      {
        property: "og:description",
        content:
          "Rent, receipts, maintenance and notices for a private 15-apartment residential building.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  {
    icon: <CreditCard className="size-5" />,
    title: "Rent & payments",
    body: "Monthly rent per apartment, part payments, late fees and outstanding balances at a glance.",
  },
  {
    icon: <FileText className="size-5" />,
    title: "Instant receipts",
    body: "Every settled payment produces a numbered receipt tenants can view and print themselves.",
  },
  {
    icon: <Wrench className="size-5" />,
    title: "Maintenance requests",
    body: "Tenants raise issues with priority; the owner tracks them from open to resolved.",
  },
  {
    icon: <Megaphone className="size-5" />,
    title: "Building notices",
    body: "Publish announcements to the whole building or to one apartment only.",
  },
];

function LandingPage() {
  const { session, role, loading } = useAuth();
  const signedIn = Boolean(session && role);
  const homeTo = role === "admin" ? "/dashboard" : "/portal";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="size-5" />
            </span>
            <span className="font-bold">Malti’s Rental Manager</span>
          </div>
          {loading ? null : signedIn ? (
            <Button asChild size="sm">
              <Link to={homeTo}>{role === "admin" ? "Owner console" : "My portal"}</Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </header>

      <main>
        <section className="bg-brand-gradient text-primary-foreground">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary-foreground/80">
              <ShieldCheck className="size-4" /> Private building software
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
              One calm console for all 15 apartments.
            </h1>
            <p className="mt-5 max-w-xl text-primary-foreground/85">
              The owner sees the whole building — rent collected, dues, requests and notices.
              Each tenant sees only their own home, payments and receipts.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to={signedIn ? homeTo : "/auth"}>
                  {signedIn ? "Continue" : "Sign in to your account"}
                </Link>
              </Button>
              {!signedIn && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-transparent text-primary-foreground hover:bg-white/10"
                >
                  <Link to="/forgot-password">Forgot password?</Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-2xl font-bold tracking-tight">What it handles</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border bg-card p-5 shadow-card">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {f.icon}
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t bg-muted/40">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-12 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Access is invitation only</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tenant accounts are created by the building owner. Tenants sign in with their
                Apartment ID, owners with their email address.
              </p>
            </div>
            <Button asChild>
              <Link to="/auth">Go to sign in</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-5 py-6 text-xs text-muted-foreground">
          Malti’s Rental Manager — private rental management for a single residential building.
        </div>
      </footer>
    </div>
  );
}
