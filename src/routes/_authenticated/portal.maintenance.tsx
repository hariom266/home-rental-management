import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { PageHeader, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { maintenanceQuery, myTenantQuery, db } from "@/lib/queries";
import { formatDateTime } from "@/lib/format";
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

export const Route = createFileRoute("/_authenticated/portal/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance — My Home" },
      { name: "description", content: "Report an issue in your apartment and follow its progress." },
    ],
  }),
  component: PortalMaintenance,
});

const CATEGORIES = ["Plumbing", "Electrical", "Appliance", "Carpentry", "Cleaning", "Other"];
const PRIORITIES = ["low", "medium", "high", "emergency"] as const;

function PortalMaintenance() {
  const requests = useQuery(maintenanceQuery());
  const tenant = useQuery(myTenantQuery());
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Plumbing",
    priority: "medium" as (typeof PRIORITIES)[number],
  });

  const create = useMutation({
    mutationFn: async () => {
      const me = tenant.data;
      if (!me?.apartment_id) throw new Error("Your apartment is not assigned yet");
      const { error } = await db.from("maintenance_requests").insert({
        apartment_id: me.apartment_id,
        tenant_id: me.id,
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Request submitted");
      setOpen(false);
      setForm({ title: "", description: "", category: "Plumbing", priority: "medium" });
      void queryClient.invalidateQueries({ queryKey: ["maintenance"] });
    },
    onError: (error: Error) => toast.error("Could not submit", { description: error.message }),
  });

  return (
    <div>
      <PageHeader
        title="Maintenance"
        description="Report an issue and track what the owner has done about it."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> New request
          </Button>
        }
      />

      <div className="space-y-3">
        {(requests.data ?? []).map((r) => (
          <div key={r.id} className="rounded-xl border bg-card p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{r.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.category} · submitted {formatDateTime(r.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={r.priority} />
                <StatusBadge status={r.status} />
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{r.description}</p>
            {r.admin_notes ? (
              <p className="mt-3 rounded-lg bg-muted p-3 text-sm">
                <span className="font-semibold">Owner: </span>
                {r.admin_notes}
              </p>
            ) : null}
          </div>
        ))}
        {!requests.isLoading && !requests.data?.length ? (
          <EmptyState title="No requests yet" description="Anything broken? Let the owner know." />
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New maintenance request</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="t">What is the issue?</Label>
              <Input
                id="t"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d">Details</Label>
              <Textarea
                id="d"
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm({ ...form, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(value) =>
                    setForm({ ...form, priority: value as (typeof PRIORITIES)[number] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={create.isPending}>
                Submit request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
