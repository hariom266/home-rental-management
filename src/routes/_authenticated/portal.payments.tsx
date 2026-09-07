import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader, StatCard, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Receipt } from "@/components/Receipt";
import { paymentsQuery, rentRecordsQuery, settingsQuery, type Payment } from "@/lib/queries";
import { formatDate, formatDateTime, formatMoney, formatMonth } from "@/lib/format";
import { effectiveRentStatus, outstanding } from "@/lib/rent-status";
import { payRent } from "@/lib/payments.functions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/portal/payments")({
  head: () => ({
    meta: [
      { title: "Rent & Payments — Malti’s Rental Manager" },
      { name: "description", content: "Pay your rent and download past receipts." },
    ],
  }),
  component: PortalPayments,
});

function PortalPayments() {
  const rent = useQuery(rentRecordsQuery());
  const payments = useQuery(paymentsQuery());
  const settings = useQuery(settingsQuery());
  const queryClient = useQueryClient();
  const [receipt, setReceipt] = useState<Payment | null>(null);
  const pay = useServerFn(payRent);

  const payNow = useMutation({
    mutationFn: (rentRecordId: string) => pay({ data: { rentRecordId } }),
    onSuccess: (result) => {
      toast.success("Payment successful", {
        description: `${formatMoney(result.amount)} · receipt ${result.receiptNumber}`,
      });
      void queryClient.invalidateQueries({ queryKey: ["rent-records"] });
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (error: Error) => toast.error("Payment failed", { description: error.message }),
  });

  const records = rent.data ?? [];
  const due = records.reduce((s, r) => s + outstanding(r), 0);
  const paidTotal = records.reduce((s, r) => s + Number(r.paid_amount), 0);

  return (
    <div>
      <PageHeader title="Rent & payments" description="Your rent history and receipts." />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Outstanding" value={formatMoney(due)} tone={due ? "destructive" : "success"} />
        <StatCard label="Paid to date" value={formatMoney(paidTotal)} tone="success" />
      </div>

      <div className="mt-4 rounded-xl border border-dashed bg-card/60 p-4 text-xs text-muted-foreground">
        Demo Payment Mode: paying here records the payment and issues a receipt, but no real money
        is transferred.
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border bg-card shadow-card">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold">Rent records</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{formatMonth(r.billing_month)}</TableCell>
                <TableCell>{formatDate(r.due_date)}</TableCell>
                <TableCell className="text-right">{formatMoney(r.total_amount)}</TableCell>
                <TableCell className="text-right">{formatMoney(r.paid_amount)}</TableCell>
                <TableCell>
                  <StatusBadge status={effectiveRentStatus(r)} />
                </TableCell>
                <TableCell className="text-right">
                  {outstanding(r) > 0 ? (
                    <Button
                      size="sm"
                      disabled={payNow.isPending}
                      onClick={() => payNow.mutate(r.id)}
                    >
                      Pay {formatMoney(outstanding(r))}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Paid</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!rent.isLoading && !records.length ? (
          <div className="p-6">
            <EmptyState title="No rent records yet" />
          </div>
        ) : null}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border bg-card shadow-card">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold">Payment history</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt</TableHead>
              <TableHead>Paid on</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Receipt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(payments.data ?? []).map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.receipt_number ?? "—"}</TableCell>
                <TableCell>{formatDateTime(p.paid_at)}</TableCell>
                <TableCell>{p.payment_method}</TableCell>
                <TableCell className="text-right">{formatMoney(p.amount)}</TableCell>
                <TableCell>
                  <StatusBadge status={p.payment_status} />
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
        {!payments.isLoading && !payments.data?.length ? (
          <div className="p-6">
            <EmptyState title="No payments yet" />
          </div>
        ) : null}
      </div>

      <Receipt payment={receipt} settings={settings.data} onClose={() => setReceipt(null)} />
    </div>
  );
}
