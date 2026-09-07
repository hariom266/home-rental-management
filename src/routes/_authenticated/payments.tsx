import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { PageHeader, StatCard, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { paymentsQuery, settingsQuery, type Payment } from "@/lib/queries";
import { formatDateTime, formatMoney, formatMonth, currentMonthKey } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Receipt } from "@/components/Receipt";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({
    meta: [
      { title: "Payments — Malti’s Rental Manager" },
      { name: "description", content: "Every rent payment received, with printable receipts." },
    ],
  }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const payments = useQuery(paymentsQuery());
  const settings = useQuery(settingsQuery());
  const [search, setSearch] = useState("");
  const [receipt, setReceipt] = useState<Payment | null>(null);

  const rows = (payments.data ?? []).filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [p.apartments?.apartment_id, p.tenants?.full_name, p.receipt_number, p.transaction_id]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });

  const month = currentMonthKey();
  const thisMonthTotal = (payments.data ?? [])
    .filter((p) => p.payment_status === "successful" && (p.paid_at ?? "").slice(0, 7) === month.slice(0, 7))
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Complete payment history across the building."
        actions={
          <Input
            placeholder="Search apartment, tenant or receipt"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-72"
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Payments recorded" value={payments.data?.length ?? 0} />
        <StatCard label={`Received in ${formatMonth(month)}`} value={formatMoney(thisMonthTotal)} tone="success" />
        <StatCard
          label="Total received"
          value={formatMoney(
            (payments.data ?? [])
              .filter((p) => p.payment_status === "successful")
              .reduce((s, p) => s + Number(p.amount), 0),
          )}
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt</TableHead>
              <TableHead>Apartment</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Month</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Received</TableHead>
              <TableHead className="text-right">Receipt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.receipt_number ?? "—"}</TableCell>
                <TableCell className="font-medium">{p.apartments?.apartment_id}</TableCell>
                <TableCell>{p.tenants?.full_name ?? "—"}</TableCell>
                <TableCell>{formatMonth(p.rent_records?.billing_month)}</TableCell>
                <TableCell>{p.payment_method}</TableCell>
                <TableCell className="text-right">{formatMoney(p.amount)}</TableCell>
                <TableCell>
                  <StatusBadge status={p.payment_status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTime(p.paid_at)}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => setReceipt(p)}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!payments.isLoading && !rows.length ? (
          <div className="p-6">
            <EmptyState title="No payments found" />
          </div>
        ) : null}
      </div>

      <Receipt payment={receipt} settings={settings.data} onClose={() => setReceipt(null)} />
    </div>
  );
}
