import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Building2, IndianRupee, Wrench } from "lucide-react";

import { PageHeader, StatCard, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import {
  apartmentsQuery,
  maintenanceQuery,
  rentRecordsQuery,
  tenantsQuery,
} from "@/lib/queries";
import { formatMoney, formatMonthShort, currentMonthKey } from "@/lib/format";
import { effectiveRentStatus, outstanding } from "@/lib/rent-status";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Owner Dashboard — Malti’s Rental Manager" },
      { name: "description", content: "Occupancy, rent collection and maintenance at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const apartments = useQuery(apartmentsQuery());
  const tenants = useQuery(tenantsQuery());
  const rent = useQuery(rentRecordsQuery());
  const maintenance = useQuery(maintenanceQuery());

  const month = currentMonthKey();
  const all = rent.data ?? [];
  const thisMonth = all.filter((r) => r.billing_month === month);
  const collected = thisMonth.reduce((sum, r) => sum + Number(r.paid_amount), 0);
  const expected = thisMonth.reduce((sum, r) => sum + Number(r.total_amount), 0);
  const overdue = all.filter((r) => effectiveRentStatus(r) === "overdue");
  const openRequests = (maintenance.data ?? []).filter(
    (m) => m.status === "submitted" || m.status === "in_progress",
  );
  const occupied = (apartments.data ?? []).filter((a) => a.status === "occupied").length;
  const totalUnits = apartments.data?.length ?? 0;

  const byMonth = Object.values(
    all.reduce<Record<string, { month: string; collected: number; expected: number }>>(
      (acc, r) => {
        const key = r.billing_month;
        acc[key] ??= { month: formatMonthShort(key), collected: 0, expected: 0 };
        acc[key].collected += Number(r.paid_amount);
        acc[key].expected += Number(r.total_amount);
        return acc;
      },
      {},
    ),
  ).slice(0, 6).reverse();

  const occupancyData = [
    { name: "Occupied", value: occupied },
    { name: "Vacant", value: Math.max(0, totalUnits - occupied) },
  ];
  const colors = ["var(--color-chart-1)", "var(--color-muted-foreground)"];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live position of the building this month."
        actions={
          <Button asChild variant="outline">
            <Link to="/rent">Manage rent</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Occupancy"
          value={`${occupied}/${totalUnits}`}
          hint="Apartments currently occupied"
          icon={<Building2 className="size-4" />}
        />
        <StatCard
          label="Collected this month"
          value={formatMoney(collected)}
          hint={`of ${formatMoney(expected)} expected`}
          tone="success"
          icon={<IndianRupee className="size-4" />}
        />
        <StatCard
          label="Overdue records"
          value={overdue.length}
          hint={formatMoney(overdue.reduce((s, r) => s + outstanding(r), 0)) + " outstanding"}
          tone={overdue.length ? "destructive" : "default"}
          icon={<AlertTriangle className="size-4" />}
        />
        <StatCard
          label="Open maintenance"
          value={openRequests.length}
          hint="Submitted or in progress"
          tone={openRequests.length ? "warning" : "default"}
          icon={<Wrench className="size-4" />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-card lg:col-span-2">
          <h2 className="text-sm font-semibold">Rent collection trend</h2>
          <div className="mt-4 h-64">
            {byMonth.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" fontSize={12} stroke="var(--color-muted-foreground)" />
                  <YAxis fontSize={12} stroke="var(--color-muted-foreground)" width={70} />
                  <Tooltip formatter={(v: number) => formatMoney(v)} />
                  <Bar dataKey="expected" fill="var(--color-muted)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collected" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No rent records yet" />
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold">Occupancy split</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={occupancyData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}>
                  {occupancyData.map((entry, i) => (
                    <Cell key={entry.name} fill={colors[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold">Attention needed</h2>
          <div className="mt-4 space-y-3">
            {overdue.length ? (
              overdue.slice(0, 6).map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {r.apartments?.apartment_id} · {r.tenants?.full_name ?? "Unassigned"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatMonthShort(r.billing_month)} · {formatMoney(outstanding(r))} due
                    </p>
                  </div>
                  <StatusBadge status="overdue" />
                </div>
              ))
            ) : (
              <EmptyState title="Nothing overdue" description="All rent is on schedule." />
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold">Latest maintenance requests</h2>
          <div className="mt-4 space-y-3">
            {(maintenance.data ?? []).slice(0, 6).map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">{m.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.apartments?.apartment_id} · {m.category}
                  </p>
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))}
            {!maintenance.data?.length ? <EmptyState title="No requests yet" /> : null}
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        {tenants.data?.length ?? 0} tenant records on file.
      </p>
    </div>
  );
}
