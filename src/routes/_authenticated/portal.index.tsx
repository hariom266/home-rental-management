import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, CalendarClock, IndianRupee } from "lucide-react";

import { PageHeader, StatCard, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import {
  maintenanceQuery,
  myTenantQuery,
  noticesQuery,
  rentRecordsQuery,
} from "@/lib/queries";
import { formatDate, formatMoney, formatMonth } from "@/lib/format";
import { effectiveRentStatus, outstanding } from "@/lib/rent-status";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/portal/")({
  head: () => ({
    meta: [
      { title: "My Home — HomeRent Manager" },
      { name: "description", content: "Your apartment, rent due and building notices." },
    ],
  }),
  component: PortalHome,
});

function PortalHome() {
  const tenant = useQuery(myTenantQuery());
  const rent = useQuery(rentRecordsQuery());
  const notices = useQuery(noticesQuery());
  const maintenance = useQuery(maintenanceQuery());

  const records = rent.data ?? [];
  const unpaid = records.filter((r) => outstanding(r) > 0);
  const next = unpaid[unpaid.length - 1] ?? null;
  const totalDue = unpaid.reduce((s, r) => s + outstanding(r), 0);
  const apartment = tenant.data?.apartments;

  return (
    <div>
      <PageHeader
        title={`Hello, ${tenant.data?.full_name?.split(" ")[0] ?? "there"}`}
        description="Everything about your home in one place."
        actions={
          <Button asChild>
            <Link to="/portal/payments">Rent & payments</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Your apartment"
          value={apartment?.apartment_id ?? "—"}
          hint={apartment ? `Unit ${apartment.apartment_number} · Floor ${apartment.floor}` : ""}
          icon={<Building2 className="size-4" />}
        />
        <StatCard
          label="Monthly rent"
          value={formatMoney(apartment?.monthly_rent)}
          hint={tenant.data?.move_in_date ? `Since ${formatDate(tenant.data.move_in_date)}` : ""}
          icon={<IndianRupee className="size-4" />}
        />
        <StatCard
          label="Amount due"
          value={formatMoney(totalDue)}
          hint={next ? `Next due ${formatDate(next.due_date)}` : "You're all settled"}
          tone={totalDue > 0 ? "destructive" : "success"}
          icon={<CalendarClock className="size-4" />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold">Recent rent</h2>
          <div className="mt-4 space-y-3">
            {records.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">{formatMonth(r.billing_month)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatMoney(r.total_amount)} · due {formatDate(r.due_date)}
                  </p>
                </div>
                <StatusBadge status={effectiveRentStatus(r)} />
              </div>
            ))}
            {!rent.isLoading && !records.length ? <EmptyState title="No rent records yet" /> : null}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold">Latest notices</h2>
          <div className="mt-4 space-y-3">
            {(notices.data ?? []).slice(0, 4).map((n) => (
              <div key={n.id} className="text-sm">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{n.title}</p>
                  <StatusBadge status={n.priority} />
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
              </div>
            ))}
            {!notices.isLoading && !notices.data?.length ? (
              <EmptyState title="No notices right now" />
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">My maintenance requests</h2>
          <Button asChild size="sm" variant="outline">
            <Link to="/portal/maintenance">Raise a request</Link>
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {(maintenance.data ?? []).slice(0, 4).map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-medium">{m.title}</p>
                <p className="text-xs text-muted-foreground">{m.category}</p>
              </div>
              <StatusBadge status={m.status} />
            </div>
          ))}
          {!maintenance.isLoading && !maintenance.data?.length ? (
            <EmptyState title="No requests yet" description="Report an issue and the owner will see it." />
          ) : null}
        </div>
      </div>
    </div>
  );
}
