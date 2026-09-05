import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageHeader, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { noticesQuery } from "@/lib/queries";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/portal/notices")({
  head: () => ({
    meta: [
      { title: "Notices — My Home" },
      { name: "description", content: "Announcements from the building owner." },
    ],
  }),
  component: PortalNotices,
});

function PortalNotices() {
  const notices = useQuery(noticesQuery());

  return (
    <div>
      <PageHeader title="Notices" description="Announcements from the building owner." />
      <div className="space-y-3">
        {(notices.data ?? []).map((n) => (
          <div key={n.id} className="rounded-xl border bg-card p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold">{n.title}</p>
              <StatusBadge status={n.priority} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.published_at)}</p>
            <p className="mt-3 text-sm whitespace-pre-line text-muted-foreground">{n.message}</p>
          </div>
        ))}
        {!notices.isLoading && !notices.data?.length ? (
          <EmptyState title="No notices right now" />
        ) : null}
      </div>
    </div>
  );
}
