import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { myTenantQuery, settingsQuery, db } from "@/lib/queries";
import { formatDate, formatMoney } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/portal/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — HomeRent Manager" },
      { name: "description", content: "Update your contact details and change your password." },
    ],
  }),
  component: PortalProfile,
});

function PortalProfile() {
  const tenant = useQuery(myTenantQuery());
  const settings = useQuery(settingsQuery());
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    phone: "",
    email: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });
  const [password, setPassword] = useState("");

  useEffect(() => {
    const t = tenant.data;
    if (!t) return;
    setForm({
      phone: t.phone ?? "",
      email: t.email ?? "",
      emergency_contact_name: t.emergency_contact_name ?? "",
      emergency_contact_phone: t.emergency_contact_phone ?? "",
    });
  }, [tenant.data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!tenant.data) throw new Error("Profile not loaded");
      const { error } = await db
        .from("tenants")
        .update({
          phone: form.phone || null,
          email: form.email || null,
          emergency_contact_name: form.emergency_contact_name || null,
          emergency_contact_phone: form.emergency_contact_phone || null,
        })
        .eq("id", tenant.data.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Profile updated");
      void queryClient.invalidateQueries({ queryKey: ["my-tenant"] });
    },
    onError: (error: Error) => toast.error("Update failed", { description: error.message }),
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Password changed");
      setPassword("");
    },
    onError: (error: Error) => toast.error("Could not change password", { description: error.message }),
  });

  const apartment = tenant.data?.apartments;

  return (
    <div>
      <PageHeader title="My profile" description="Your tenancy details and account security." />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold">Tenancy</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Name" value={tenant.data?.full_name ?? "—"} />
            <Row label="Apartment" value={apartment?.apartment_id ?? "—"} />
            <Row
              label="Unit"
              value={apartment ? `Unit ${apartment.apartment_number} · Floor ${apartment.floor}` : "—"}
            />
            <Row label="Monthly rent" value={formatMoney(apartment?.monthly_rent)} />
            <Row label="Security deposit" value={formatMoney(apartment?.security_deposit)} />
            <Row label="Move-in date" value={formatDate(tenant.data?.move_in_date)} />
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <StatusBadge status={tenant.data?.status ?? "active"} />
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Owner: {settings.data?.owner_name} · {settings.data?.owner_phone}
          </p>
        </section>

        <section className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold">Contact details</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ecn">Emergency contact name</Label>
              <Input
                id="ecn"
                value={form.emergency_contact_name}
                onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ecp">Emergency contact phone</Label>
              <Input
                id="ecp"
                value={form.emergency_contact_phone}
                onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })}
              />
            </div>
            <Button type="submit" disabled={save.isPending}>
              Save details
            </Button>
          </form>

          <div className="mt-8 border-t pt-6">
            <h2 className="text-sm font-semibold">Change password</h2>
            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                changePassword.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="pw">New password</Label>
                <Input
                  id="pw"
                  type="password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" variant="outline" disabled={changePassword.isPending}>
                Update password
              </Button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
