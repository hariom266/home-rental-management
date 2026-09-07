import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  CircleCheck,
  CreditCard,
  FileText,
  Megaphone,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

import buildingHero from "@/assets/maltis-building.jpg";
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

const HERO_STATS = [
  { label: "Apartments", value: "15" },
  { label: "Owner view", value: "1" },
  { label: "Tenant privacy", value: "100%" },
];

const LOGIN_OPTIONS = [
  {
    title: "Owner/Admin",
    description: "Manage rent, dues, receipts, notices and requests for the whole building.",
    value: "Email sign-in",
  },
  {
    title: "Tenant",
    description: "Open your own payments, receipts, maintenance updates and building notices.",
    value: "Apartment ID",
  },
];

function LandingPage() {
  const { session, role, loading } = useAuth();
  const signedIn = Boolean(session && role);
  const homeTo = role === "admin" ? "/dashboard" : "/portal";

  return (
    <div className="min-h-screen bg-background">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-hero-foreground/15 text-hero-foreground ring-1 ring-hero-foreground/25 backdrop-blur">
              <Building2 className="size-5" />
            </span>
            <span className="font-bold text-hero-foreground">Malti’s Rental Manager</span>
          </div>
          {loading ? null : signedIn ? (
            <Button asChild size="sm" variant="secondary">
              <Link to={homeTo}>{role === "admin" ? "Owner console" : "My portal"}</Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="secondary">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </header>

      <main>
        <section className="relative min-h-[92vh] overflow-hidden bg-hero text-hero-foreground">
          <img
            src={buildingHero}
            alt="Modern apartment building managed in Malti’s Rental Manager"
            width={1600}
            height={1000}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-hero-overlay" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />

          <div className="relative mx-auto grid min-h-[92vh] max-w-7xl items-center gap-10 px-5 pt-24 pb-16 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-hero-foreground/12 px-4 py-2 text-xs font-semibold uppercase text-hero-muted ring-1 ring-hero-foreground/20 backdrop-blur">
                <Sparkles className="size-4 text-sun" /> Private building software
              </p>
              <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight sm:text-6xl lg:text-7xl">
                Malti’s Rental Manager
              </h1>
              <p className="mt-5 max-w-2xl text-lg font-medium text-hero-muted sm:text-xl">
                A bright, simple way for the owner and every tenant to handle rent, receipts,
                maintenance and notices for one 15-apartment building.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" variant="secondary">
                  <Link to={signedIn ? homeTo : "/auth"}>
                    {signedIn ? "Continue" : "Login to continue"}
                  </Link>
                </Button>
                {!signedIn && (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-hero-foreground/35 bg-hero-foreground/10 text-hero-foreground backdrop-blur hover:bg-hero-foreground/20"
                  >
                    <Link to="/forgot-password">Forgot password?</Link>
                  </Button>
                )}
              </div>
              <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
                {HERO_STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl bg-hero-foreground/12 p-4 ring-1 ring-hero-foreground/20 backdrop-blur"
                  >
                    <p className="text-2xl font-extrabold">{stat.value}</p>
                    <p className="mt-1 text-xs font-medium text-hero-muted">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-panel-gradient p-5 text-card-foreground shadow-lifted ring-1 ring-hero-foreground/25 backdrop-blur sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-primary">Start here</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight">Choose your login</h2>
                </div>
                <span className="flex size-11 items-center justify-center rounded-xl bg-celebration-gradient text-primary-foreground">
                  <ShieldCheck className="size-5" />
                </span>
              </div>
              <div className="mt-6 space-y-3">
                {LOGIN_OPTIONS.map((option) => (
                  <div key={option.title} className="rounded-xl border bg-card/85 p-4 shadow-card">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold">{option.title}</h3>
                      <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                        {option.value}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{option.description}</p>
                  </div>
                ))}
              </div>
              <Button asChild size="lg" className="mt-6 w-full">
                <Link to={signedIn ? homeTo : "/auth"}>
                  {signedIn ? "Open dashboard" : "Go to login page"}
                </Link>
              </Button>
              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <CircleCheck className="size-4 text-success" /> Access is only for invited users.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">Everything in one place</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">What it handles</h2>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-sun px-4 py-2 text-sm font-semibold text-sun-foreground">
              <ReceiptText className="size-4" /> Rent, receipts and notices
            </div>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border bg-card p-5 shadow-card">
                <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  {f.icon}
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y bg-muted/40">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-12 sm:flex-row sm:items-center sm:justify-between">
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
        <div className="mx-auto max-w-7xl px-5 py-6 text-xs text-muted-foreground">
          Malti’s Rental Manager — private rental management for a single residential building.
        </div>
      </footer>
    </div>
  );
}
