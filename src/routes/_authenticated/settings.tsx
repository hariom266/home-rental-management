import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { settingsQuery, db, type BuildingSettings } from "@/lib/queries";
import { getPaymentMode } from "@/lib/payments.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Building Settings — HomeRent Manager" },
      { name: "description", content: "Building details, rent due day and late fee rules." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const settings = useQuery(settingsQuery());
  const queryClient = useQueryClient();
  const [form, setForm] = useState<BuildingSettings | null>(null);
  const [mode, setMode] = useState<string>("checking");
  const readMode = useServerFn(getPaymentMode);

  useEffect(() => {
    if (settings.data && !form) setForm(settings.data);
  }, [settings.data, form]);

  useEffect(() => {
    readMode({})
      .then((r) => setMode(r.mode))
      .catch(() => setMode("demo"));
  }, [readMode]);

  const save = useMutation({
    mutationFn: async (values: BuildingSettings) => {
      const { id, ...rest } = values;
      const { error } = await db.from("building_settings").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Settings saved");
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (error: Error) => toast.error("Save failed", { description: error.message }),
  });

  if (!form) {
    return (
      <div>
        <PageHeader title="Settings" />
        <div className="h-64 animate-pulse rounded-xl border bg-card" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Settings" description="Building profile, billing rules and payment mode." />

      <form
        className="grid gap-6 lg:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(form);
        }}
      >
        <section className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold">Building</h2>
          <div className="mt-4 space-y-4">
            <Field label="Building name">
              <Input
                value={form.building_name}
                onChange={(e) => setForm({ ...form, building_name: e.target.value })}
              />
            </Field>
            <Field label="Address">
              <Input
                value={form.building_address}
                onChange={(e) => setForm({ ...form, building_address: e.target.value })}
              />
            </Field>
            <Field label="Owner name">
              <Input
                value={form.owner_name}
                onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Owner phone">
                <Input
                  value={form.owner_phone}
                  onChange={(e) => setForm({ ...form, owner_phone: e.target.value })}
                />
              </Field>
              <Field label="Contact email">
                <Input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                />
              </Field>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold">Billing rules</h2>
          <div className="mt-4 space-y-4">
            <Field label="Rent due day of month">
              <Input
                type="number"
                min={1}
                max={28}
                value={form.rent_due_day}
                onChange={(e) => setForm({ ...form, rent_due_day: Number(e.target.value) })}
              />
            </Field>
            <Field label="Late fee type">
              <Select
                value={form.late_fee_type}
                onValueChange={(value) => setForm({ ...form, late_fee_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed amount (₹)</SelectItem>
                  <SelectItem value="percent">Percentage of rent</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={form.late_fee_type === "percent" ? "Late fee (%)" : "Late fee (₹)"}>
                <Input
                  type="number"
                  min={0}
                  value={form.late_fee_value}
                  onChange={(e) => setForm({ ...form, late_fee_value: Number(e.target.value) })}
                />
              </Field>
              <Field label="Grace days">
                <Input
                  type="number"
                  min={0}
                  value={form.late_fee_grace_days}
                  onChange={(e) =>
                    setForm({ ...form, late_fee_grace_days: Number(e.target.value) })
                  }
                />
              </Field>
            </div>
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-semibold">
                Payment mode: {mode === "razorpay" ? "Razorpay configured" : "Demo Payment Mode"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                In demo mode tenant payments are confirmed on the server and receipts are issued, but
                no real money moves. Add Razorpay credentials to enable live checkout.
              </p>
            </div>
          </div>
        </section>

        <div className="lg:col-span-2">
          <Button type="submit" disabled={save.isPending}>
            Save settings
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
