import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader, StatCard, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { maintenanceQuery, db, type MaintenanceRequest } from "@/lib/queries";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export const Route = createFileRoute("/_authenticated/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance — HomeRent Manager" },
      { name: "description", content: "Track and resolve tenant maintenance requests." },
    ],
  }),
  component: MaintenancePage,
});

const STATUSES = ["submitted", "in_progress", "resolved", "rejected"] as const;

function MaintenancePage() {
  const requests = useQuery(maintenanceQuery());
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [active, setActive] = useState<MaintenanceRequest | null>(null);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("in_progress");
  const [notes, setNotes] = useState("");

  const update = useMutation({
    mutationFn: async () => {
      if (!active) throw new Error("Nothing selected");
      const { error } = await db
        .from("maintenance_requests")
        .update({
          status,
          admin_notes: notes || null,
          resolved_at: status === "resolved" ? new Date().toISOString() : null,
        })
        .eq("id", active.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Request updated");
      setActive(null);
      void queryClient.invalidateQueries({ queryKey: ["maintenance"] });
    },
    onError: (error: Error) => toast.error("Update failed", { description: error.message }),
  });

  const all = requests.data ?? [];
  const rows = filter === "all" ? all : all.filter((r) => r.status === filter);

  return (
    <div>
      <PageHeader
        title="Maintenance"
        description="Requests raised by tenants, newest first."
        actions={
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All requests</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Submitted" value={all.filter((r) => r.status === "submitted").length} tone="warning" />
        <StatCard label="In progress" value={all.filter((r) => r.status === "in_progress").length} />
        <StatCard label="Resolved" value={all.filter((r) => r.status === "resolved").length} tone="success" />
        <StatCard label="Rejected" value={all.filter((r) => r.status === "rejected").length} />
      </div>

      <div className="mt-6 space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border bg-card p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{r.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.apartments?.apartment_id} · {r.tenants?.full_name ?? "—"} · {r.category} ·{" "}
                  {formatDateTime(r.created_at)}
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
                <span className="font-semibold">Owner note: </span>
                {r.admin_notes}
              </p>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              className="mt-4"
              onClick={() => {
                setActive(r);
                setStatus(r.status === "submitted" ? "in_progress" : r.status);
                setNotes(r.admin_notes ?? "");
              }}
            >
              Update status
            </Button>
          </div>
        ))}
        {!requests.isLoading && !rows.length ? <EmptyState title="No requests here" /> : null}
      </div>

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update request</DialogTitle>
            <DialogDescription>{active?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="an">Note for the tenant</Label>
              <Textarea id="an" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => update.mutate()} disabled={update.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
