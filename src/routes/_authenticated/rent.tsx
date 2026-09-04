import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarPlus } from "lucide-react";

import { PageHeader, StatCard, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { rentRecordsQuery, db, type RentRecord } from "@/lib/queries";
import { formatDate, formatMoney, formatMonth, currentMonthKey, monthKey } from "@/lib/format";
import { effectiveRentStatus, outstanding } from "@/lib/rent-status";
import { recordOfflinePayment } from "@/lib/payments.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/rent")({
  head: () => ({
    meta: [
      { title: "Rent Records — HomeRent Manager" },
      { name: "description", content: "Generate monthly rent and track collection per apartment." },
    ],
  }),
  component: RentPage,
});

const METHODS = ["Cash", "Bank Transfer", "UPI", "Card", "Net Banking", "Other"] as const;

function monthOptions() {
  const now = new Date();
  return Array.from({ length: 12 }).map((_, i) =>
    monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)),
  );
}

function RentPage() {
  const [month, setMonth] = useState(currentMonthKey());
  const records = useQuery(rentRecordsQuery({ month }));
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<RentRecord | null>(null);
  const [form, setForm] = useState({
    amount: "",
    paymentMethod: "Cash" as (typeof METHODS)[number],
    transactionId: "",
    paidAt: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const offline = useServerFn(recordOfflinePayment);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["rent-records"] });
    void queryClient.invalidateQueries({ queryKey: ["payments"] });
  };

  const generate = useMutation({
    mutationFn: async () => {
      const { data, error } = await (db as unknown as {
        rpc: (fn: string, args: unknown) => Promise<{ data: number; error: { message: string } | null }>;
      }).rpc("generate_monthly_rent", { _billing_month: month });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (count) => {
      toast.success(`${count} rent record${count === 1 ? "" : "s"} generated`, {
        description: `Existing records for ${formatMonth(month)} were left untouched.`,
      });
      invalidate();
    },
    onError: (error: Error) => toast.error("Generation failed", { description: error.message }),
  });

  const applyLateFees = useMutation({
    mutationFn: async () => {
      const overdue = (records.data ?? []).filter(
        (r) => effectiveRentStatus(r) === "overdue" && Number(r.late_fee) === 0,
      );
      for (const record of overdue) {
        const { data: fee } = await (db as unknown as {
          rpc: (fn: string, args: unknown) => Promise<{ data: number }>;
        }).rpc("compute_late_fee", { _rent: Number(record.rent_amount), _due: record.due_date });
        const late = Number(fee ?? 0);
        if (!late) continue;
        const { error } = await db
          .from("rent_records")
          .update({
            late_fee: late,
            total_amount: Number(record.rent_amount) + late,
            payment_status: "overdue",
          })
          .eq("id", record.id);
        if (error) throw new Error(error.message);
      }
      return overdue.length;
    },
    onSuccess: (count) => {
      toast.success(count ? `Late fees applied to ${count} record(s)` : "No late fees to apply");
      invalidate();
    },
    onError: (error: Error) => toast.error("Could not apply late fees", { description: error.message }),
  });

  const pay = useMutation({
    mutationFn: async () => {
      if (!target) throw new Error("No record selected");
      return offline({
        data: {
          rentRecordId: target.id,
          amount: Number(form.amount),
          paymentMethod: form.paymentMethod,
          transactionId: form.transactionId || undefined,
          paidAt: form.paidAt,
          notes: form.notes || undefined,
        },
      });
    },
    onSuccess: (result) => {
      toast.success("Payment recorded", { description: `Receipt ${result.receiptNumber}` });
      setTarget(null);
      invalidate();
    },
    onError: (error: Error) => toast.error("Could not record payment", { description: error.message }),
  });

  const rows = records.data ?? [];
  const expected = rows.reduce((s, r) => s + Number(r.total_amount), 0);
  const collected = rows.reduce((s, r) => s + Number(r.paid_amount), 0);

  return (
    <div>
      <PageHeader
        title="Rent records"
        description="One record per occupied apartment per month."
        actions={
          <>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[190px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions().map((m) => (
                  <SelectItem key={m} value={m}>
                    {formatMonth(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => applyLateFees.mutate()} disabled={applyLateFees.isPending}>
              Apply late fees
            </Button>
            <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
              <CalendarPlus className="size-4" /> Generate rent
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Expected" value={formatMoney(expected)} hint={formatMonth(month)} />
        <StatCard label="Collected" value={formatMoney(collected)} tone="success" />
        <StatCard
          label="Outstanding"
          value={formatMoney(Math.max(0, expected - collected))}
          tone={expected - collected > 0 ? "destructive" : "default"}
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Apartment</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead className="text-right">Rent</TableHead>
              <TableHead className="text-right">Late fee</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.apartments?.apartment_id}</TableCell>
                <TableCell>{r.tenants?.full_name ?? "—"}</TableCell>
                <TableCell>{formatDate(r.due_date)}</TableCell>
                <TableCell className="text-right">{formatMoney(r.rent_amount)}</TableCell>
                <TableCell className="text-right">{formatMoney(r.late_fee)}</TableCell>
                <TableCell className="text-right">{formatMoney(r.paid_amount)}</TableCell>
                <TableCell>
                  <StatusBadge status={effectiveRentStatus(r)} />
                </TableCell>
                <TableCell className="text-right">
                  {outstanding(r) > 0 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setTarget(r);
                        setForm((f) => ({ ...f, amount: String(outstanding(r)) }));
                      }}
                    >
                      Record payment
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Settled</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!records.isLoading && !rows.length ? (
          <div className="p-6">
            <EmptyState
              title={`No rent records for ${formatMonth(month)}`}
              description="Use “Generate rent” to create them for every occupied apartment."
            />
          </div>
        ) : null}
      </div>

      <Dialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record offline payment</DialogTitle>
            <DialogDescription>
              {target?.apartments?.apartment_id} · {formatMonth(target?.billing_month)} ·{" "}
              {formatMoney(target ? outstanding(target) : 0)} outstanding
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              pay.mutate();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  min={1}
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paidAt">Received on</Label>
                <Input
                  id="paidAt"
                  type="date"
                  value={form.paidAt}
                  onChange={(e) => setForm({ ...form, paidAt: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select
                value={form.paymentMethod}
                onValueChange={(value) =>
                  setForm({ ...form, paymentMethod: value as (typeof METHODS)[number] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="txn">Reference / transaction ID</Label>
              <Input
                id="txn"
                value={form.transactionId}
                onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pay.isPending}>
                Save payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
