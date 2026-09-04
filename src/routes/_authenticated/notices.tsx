import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { PageHeader, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { apartmentsQuery, noticesQuery, db } from "@/lib/queries";
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

export const Route = createFileRoute("/_authenticated/notices")({
  head: () => ({
    meta: [
      { title: "Notices — HomeRent Manager" },
      { name: "description", content: "Publish building-wide or per-apartment notices." },
    ],
  }),
  component: NoticesPage,
});

const blank = {
  title: "",
  message: "",
  priority: "normal",
  target_type: "all_tenants",
  target_apartment_id: null as string | null,
  expires_at: "",
};

function NoticesPage() {
  const notices = useQuery(noticesQuery());
  const apartments = useQuery(apartmentsQuery());
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<typeof blank | null>(null);

  const create = useMutation({
    mutationFn: async (values: typeof blank) => {
      const { error } = await db.from("notices").insert({
        title: values.title,
        message: values.message,
        priority: values.priority,
        target_type: values.target_type,
        target_apartment_id: values.target_type === "apartment" ? values.target_apartment_id : null,
        expires_at: values.expires_at ? new Date(values.expires_at).toISOString() : null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Notice published");
      setDraft(null);
      void queryClient.invalidateQueries({ queryKey: ["notices"] });
    },
    onError: (error: Error) => toast.error("Could not publish", { description: error.message }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("notices").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Notice deleted");
      void queryClient.invalidateQueries({ queryKey: ["notices"] });
    },
    onError: (error: Error) => toast.error("Delete failed", { description: error.message }),
  });

  return (
    <div>
      <PageHeader
        title="Notices"
        description="Announcements visible in the tenant portal."
        actions={
          <Button onClick={() => setDraft({ ...blank })}>
            <Plus className="size-4" /> New notice
          </Button>
        }
      />

      <div className="space-y-3">
        {(notices.data ?? []).map((n) => (
          <div key={n.id} className="rounded-xl border bg-card p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{n.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(n.published_at)} ·{" "}
                  {n.target_type === "apartment"
                    ? `Apartment ${n.apartments?.apartment_id ?? ""}`
                    : "All tenants"}
                  {n.expires_at ? ` · expires ${formatDateTime(n.expires_at)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={n.priority} />
                <Button size="icon" variant="ghost" onClick={() => remove.mutate(n.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            <p className="mt-3 text-sm whitespace-pre-line text-muted-foreground">{n.message}</p>
          </div>
        ))}
        {!notices.isLoading && !notices.data?.length ? (
          <EmptyState title="No notices published yet" />
        ) : null}
      </div>

      <Dialog open={!!draft} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New notice</DialogTitle>
          </DialogHeader>
          {draft ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                create.mutate(draft);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  required
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="msg">Message</Label>
                <Textarea
                  id="msg"
                  required
                  rows={5}
                  value={draft.message}
                  onChange={(e) => setDraft({ ...draft, message: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={draft.priority}
                    onValueChange={(value) => setDraft({ ...draft, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Audience</Label>
                  <Select
                    value={draft.target_type}
                    onValueChange={(value) => setDraft({ ...draft, target_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_tenants">All tenants</SelectItem>
                      <SelectItem value="apartment">Single apartment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {draft.target_type === "apartment" ? (
                <div className="space-y-2">
                  <Label>Apartment</Label>
                  <Select
                    value={draft.target_apartment_id ?? ""}
                    onValueChange={(value) => setDraft({ ...draft, target_apartment_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select apartment" />
                    </SelectTrigger>
                    <SelectContent>
                      {(apartments.data ?? []).map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.apartment_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="exp">Expires on (optional)</Label>
                <Input
                  id="exp"
                  type="date"
                  value={draft.expires_at}
                  onChange={(e) => setDraft({ ...draft, expires_at: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={create.isPending}>
                  Publish
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
