import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader, StatCard, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { apartmentsQuery, paymentsQuery, rentRecordsQuery } from "@/lib/queries";
import { formatMoney, formatMonthShort } from "@/lib/format";
import { effectiveRentStatus, outstanding } from "@/lib/rent-status";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — HomeRent Manager" },
      { name: "description", content: "Collection trends, defaulters and occupancy reporting." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const rent = useQuery(rentRecordsQuery());
  const payments = useQuery(paymentsQuery());
  const apartments = useQuery(apartmentsQuery());

  const all = rent.data ?? [];
  const series = Object.values(
    all.reduce<Record<string, { key: string; month: string; expected: number; collected: number }>>(
      (acc, r) => {
        const bucket = (acc[r.billing_month] ??= {
          key: r.billing_month,
          month: formatMonthShort(r.billing_month),
          expected: 0,
          collected: 0,
        });
        bucket.expected += Number(r.total_amount);
        bucket.collected += Number(r.paid_amount);
        return acc;
      },
      {},
    ),
  ).sort((a, b) => a.key.localeCompare(b.key));

  const defaulters = all
    .filter((r) => effectiveRentStatus(r) !== "paid")
    .sort((a, b) => outstanding(b) - outstanding(a));

  const totalExpected = all.reduce((s, r) => s + Number(r.total_amount), 0);
  const totalCollected = all.reduce((s, r) => s + Number(r.paid_amount), 0);
  const rate = totalExpected ? Math.round((totalCollected / totalExpected) * 100) : 0;

  function exportCsv() {
    const header = ["Apartment", "Tenant", "Billing month", "Total", "Paid", "Outstanding", "Status"];
    const lines = all.map((r) =>
      [
        r.apartments?.apartment_id ?? "",
        r.tenants?.full_name ?? "",
        r.billing_month,
        r.total_amount,
        r.paid_amount,
        outstanding(r),
        effectiveRentStatus(r),
      ].join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "rent-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Collection performance and outstanding dues across all months."
        actions={
          <Button variant="outline" onClick={exportCsv}>
            Export CSV
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total billed" value={formatMoney(totalExpected)} />
        <StatCard label="Total collected" value={formatMoney(totalCollected)} tone="success" />
        <StatCard label="Collection rate" value={`${rate}%`} />
        <StatCard
          label="Outstanding"
          value={formatMoney(Math.max(0, totalExpected - totalCollected))}
          tone={totalExpected - totalCollected > 0 ? "destructive" : "default"}
        />
      </div>

      <div className="mt-6 rounded-xl border bg-card p-5 shadow-card">
        <h2 className="text-sm font-semibold">Expected vs collected</h2>
        <div className="mt-4 h-72">
          {series.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" fontSize={12} stroke="var(--color-muted-foreground)" />
                <YAxis fontSize={12} stroke="var(--color-muted-foreground)" width={70} />
                <Tooltip formatter={(v: number) => formatMoney(v)} />
                <Legend />
                <Line type="monotone" dataKey="expected" stroke="var(--color-chart-3)" strokeWidth={2} />
                <Line type="monotone" dataKey="collected" stroke="var(--color-chart-1)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No data yet" />
          )}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border bg-card shadow-card">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold">Outstanding dues</h2>
          <p className="text-xs text-muted-foreground">
            {defaulters.length} record(s) not fully settled · {payments.data?.length ?? 0} payments
            logged · {apartments.data?.length ?? 0} units
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Apartment</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {defaulters.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.apartments?.apartment_id}</TableCell>
                <TableCell>{r.tenants?.full_name ?? "—"}</TableCell>
                <TableCell>{formatMonthShort(r.billing_month)}</TableCell>
                <TableCell className="text-right">{formatMoney(outstanding(r))}</TableCell>
                <TableCell>
                  <StatusBadge status={effectiveRentStatus(r)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!rent.isLoading && !defaulters.length ? (
          <div className="p-6">
            <EmptyState title="Everything is paid up" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
