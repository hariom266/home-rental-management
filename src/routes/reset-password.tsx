import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Choose a new password — Malti’s Rental Manager" },
      {
        name: "description",
        content: "Set a new password for your Malti’s Rental Manager account.",
      },
      { property: "og:title", content: "Choose a new password — Malti’s Rental Manager" },
      {
        property: "og:description",
        content: "Set a new password for your rental portal account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session) setHasSession(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setHasSession(Boolean(data.session));
      setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Password too short", { description: "Use at least 8 characters." });
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error("Could not update your password", { description: error.message });
      return;
    }
    toast.success("Password updated", { description: "Please sign in with your new password." });
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
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
        <h1 className="mt-8 text-2xl font-bold tracking-tight">Choose a new password</h1>

        {!ready ? (
          <div className="mt-8 flex justify-center">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        ) : hasSession ? (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Update password"}
            </Button>
          </form>
        ) : (
          <div className="mt-4 rounded-xl border bg-card p-4 text-sm shadow-card">
            <p className="text-muted-foreground">
              This reset link is invalid or has expired. Request a new one and open the most recent
              email.
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link to="/forgot-password">Request a new link</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
