import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { apartmentsQuery, tenantsQuery, db, type Apartment } from "@/lib/queries";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
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

export const Route = createFileRoute("/_authenticated/apartments")({
  head: () => ({
    meta: [
      { title: "Apartments — HomeRent Manager" },
      { name: "description", content: "All 15 apartments, their rent, deposit and occupancy." },
    ],
  }),
  component: ApartmentsPage,
});

function ApartmentsPage() {
  const apartments = useQuery(apartmentsQuery());
  const tenants = useQuery(tenantsQuery());
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Apartment | null>(null);

  const save = useMutation({
    mutationFn: async (values: Partial<Apartment> & { id: string }) => {
      const { id, ...rest } = values;
      const { error } = await db.from("apartments").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Apartment updated");
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ["apartments"] });
    },
    onError: (error: Error) => toast.error("Update failed", { description: error.message }),
  });

  const tenantFor = (apartmentRowId: string) =>
    (tenants.data ?? []).find((t) => t.apartment_id === apartmentRowId && t.status === "active");

  return (
    <div>
      <PageHeader
        title="Apartments"
        description="The building has 15 fixed units. Rent, deposit and status are editable."
      />

      {apartments.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border bg-card" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(apartments.data ?? []).map((a) => {
            const tenant = tenantFor(a.id);
            return (
              <div key={a.id} className="rounded-xl border bg-card p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold">{a.apartment_id}</p>
                    <p className="text-xs text-muted-foreground">
                      Unit {a.apartment_number} · Floor {a.floor}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <dl className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Monthly rent</dt>
                    <dd className="font-semibold">{formatMoney(a.monthly_rent)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Deposit</dt>
                    <dd>{formatMoney(a.security_deposit)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Tenant</dt>
                    <dd>{tenant?.full_name ?? "—"}</dd>
                  </div>
                </dl>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => setEditing(a)}
                >
                  Edit unit
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editing?.apartment_id}</DialogTitle>
          </DialogHeader>
          {editing ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate({
                  id: editing.id,
                  monthly_rent: Number(editing.monthly_rent),
                  security_deposit: Number(editing.security_deposit),
                  status: editing.status,
                  description: editing.description,
                });
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rent">Monthly rent (₹)</Label>
                  <Input
                    id="rent"
                    type="number"
                    min={0}
                    value={editing.monthly_rent}
                    onChange={(e) =>
                      setEditing({ ...editing, monthly_rent: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit">Security deposit (₹)</Label>
                  <Input
                    id="deposit"
                    type="number"
                    min={0}
                    value={editing.security_deposit}
                    onChange={(e) =>
                      setEditing({ ...editing, security_deposit: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editing.status}
                  onValueChange={(value) =>
                    setEditing({ ...editing, status: value as Apartment["status"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="vacant">Vacant</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={save.isPending}>
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
