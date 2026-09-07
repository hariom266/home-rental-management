import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Plus } from "lucide-react";

import { PageHeader, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { apartmentsQuery, tenantsQuery, db, type Tenant } from "@/lib/queries";
import { formatDate, resolveLoginEmail } from "@/lib/format";
import { upsertTenantAccount } from "@/lib/payments.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/tenants")({
  head: () => ({
    meta: [
      { title: "Tenants — Malti’s Rental Manager" },
      { name: "description", content: "Tenant records, apartment assignment and portal logins." },
    ],
  }),
  component: TenantsPage,
});

type Draft = {
  id?: string;
  full_name: string;
  phone: string;
  email: string;
  apartment_id: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  move_in_date: string;
  status: "active" | "inactive";
};

const blank: Draft = {
  full_name: "",
  phone: "",
  email: "",
  apartment_id: null,
  emergency_contact_name: "",
  emergency_contact_phone: "",
  move_in_date: new Date().toISOString().slice(0, 10),
  status: "active",
};

function TenantsPage() {
  const tenants = useQuery(tenantsQuery());
  const apartments = useQuery(apartmentsQuery());
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [accountFor, setAccountFor] = useState<Tenant | null>(null);
  const [password, setPassword] = useState("Tenant@12345");
  const provision = useServerFn(upsertTenantAccount);

  const save = useMutation({
    mutationFn: async (values: Draft) => {
      const payload = {
        full_name: values.full_name,
        phone: values.phone || null,
        email: values.email || null,
        apartment_id: values.apartment_id,
        emergency_contact_name: values.emergency_contact_name || null,
        emergency_contact_phone: values.emergency_contact_phone || null,
        move_in_date: values.move_in_date || null,
        status: values.status,
      };
      const query = values.id
        ? db.from("tenants").update(payload).eq("id", values.id)
        : db.from("tenants").insert(payload);
      const { error } = await query;
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Tenant saved");
      setDraft(null);
      void queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
    onError: (error: Error) => toast.error("Save failed", { description: error.message }),
  });

  const createLogin = useMutation({
    mutationFn: async (tenant: Tenant) => {
      const apartmentCode = tenant.apartments?.apartment_id;
      if (!apartmentCode) throw new Error("Assign an apartment before creating a login");
      return provision({
        data: {
          tenantId: tenant.id,
          email: resolveLoginEmail(apartmentCode),
          password,
        },
      });
    },
    onSuccess: (result) => {
      toast.success(result.created ? "Login created" : "Password updated");
      setAccountFor(null);
      void queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
    onError: (error: Error) => toast.error("Could not set up login", { description: error.message }),
  });

  return (
    <div>
      <PageHeader
        title="Tenants"
        description="Assign tenants to apartments and manage their portal access."
        actions={
          <Button onClick={() => setDraft({ ...blank })}>
            <Plus className="size-4" /> Add tenant
          </Button>
        }
      />

      <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Apartment</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Move-in</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Portal</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(tenants.data ?? []).map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.full_name}</TableCell>
                <TableCell>{t.apartments?.apartment_id ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {t.phone ?? "—"}
                  <br />
                  {t.email ?? ""}
                </TableCell>
                <TableCell>{formatDate(t.move_in_date)}</TableCell>
                <TableCell>
                  <StatusBadge status={t.status} />
                </TableCell>
                <TableCell>
                  {t.auth_user_id ? (
                    <StatusBadge status="active" />
                  ) : (
                    <span className="text-xs text-muted-foreground">No login</span>
                  )}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setDraft({
                        id: t.id,
                        full_name: t.full_name,
                        phone: t.phone ?? "",
                        email: t.email ?? "",
                        apartment_id: t.apartment_id,
                        emergency_contact_name: t.emergency_contact_name ?? "",
                        emergency_contact_phone: t.emergency_contact_phone ?? "",
                        move_in_date: t.move_in_date ?? "",
                        status: t.status,
                      })
                    }
                  >
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setAccountFor(t)}>
                    <KeyRound className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!tenants.isLoading && !tenants.data?.length ? (
          <div className="p-6">
            <EmptyState title="No tenants yet" description="Add your first tenant to get started." />
          </div>
        ) : null}
      </div>

      <Dialog open={!!draft} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit tenant" : "Add tenant"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate(draft);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  required
                  value={draft.full_name}
                  onChange={(e) => setDraft({ ...draft, full_name: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={draft.phone}
                    onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={draft.email}
                    onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Apartment</Label>
                  <Select
                    value={draft.apartment_id ?? "none"}
                    onValueChange={(value) =>
                      setDraft({ ...draft, apartment_id: value === "none" ? null : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {(apartments.data ?? []).map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.apartment_id} · Unit {a.apartment_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="movein">Move-in date</Label>
                  <Input
                    id="movein"
                    type="date"
                    value={draft.move_in_date}
                    onChange={(e) => setDraft({ ...draft, move_in_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ecn">Emergency contact</Label>
                  <Input
                    id="ecn"
                    value={draft.emergency_contact_name}
                    onChange={(e) =>
                      setDraft({ ...draft, emergency_contact_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ecp">Emergency phone</Label>
                  <Input
                    id="ecp"
                    value={draft.emergency_contact_phone}
                    onChange={(e) =>
                      setDraft({ ...draft, emergency_contact_phone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={draft.status}
                  onValueChange={(value) =>
                    setDraft({ ...draft, status: value as Draft["status"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={save.isPending}>
                  Save tenant
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!accountFor} onOpenChange={(open) => !open && setAccountFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Portal login</DialogTitle>
            <DialogDescription>
              {accountFor?.full_name} signs in with their Apartment ID
              {accountFor?.apartments?.apartment_id
                ? ` (${accountFor.apartments.apartment_id})`
                : ""}
              .
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="pw">Password</Label>
            <Input id="pw" value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Minimum 8 characters. Share it with the tenant privately.
            </p>
          </div>
          <DialogFooter>
            <Button
              disabled={createLogin.isPending}
              onClick={() => accountFor && createLogin.mutate(accountFor)}
            >
              {accountFor?.auth_user_id ? "Reset password" : "Create login"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
