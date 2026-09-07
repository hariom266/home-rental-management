import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Building2, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset your password — Malti’s Rental Manager" },
      {
        name: "description",
        content:
          "Request a password reset link for your Malti’s Rental Manager owner or tenant account.",
      },
      { property: "og:title", content: "Reset your password — Malti’s Rental Manager" },
      {
        property: "og:description",
        content: "Request a password reset link for your rental portal account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error("Could not send the reset link", { description: error.message });
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <Link
          to="/"
          className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"
        >
          <Building2 className="size-5" />
        </Link>

        {sent ? (
          <div className="mt-8 rounded-xl border bg-card p-6 shadow-card">
            <MailCheck className="size-6 text-primary" />
            <h1 className="mt-3 text-xl font-bold tracking-tight">Check your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              If an account exists for <span className="font-medium">{email}</span>, a link to
              choose a new password is on its way. The link opens this app and expires shortly.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to="/auth">Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <>
            <h1 className="mt-8 text-2xl font-bold tracking-tight">Forgot your password?</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the email address on your account and we will send you a link to set a new
              password.
            </p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : "Send reset link"}
              </Button>
            </form>
            <p className="mt-4 text-xs text-muted-foreground">
              Tenants who sign in with an Apartment ID have no mailbox on file — ask the building
              owner to set a new password for you.
            </p>
            <Link
              to="/auth"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="size-4" /> Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
