import { Printer } from "lucide-react";

import type { BuildingSettings, Payment } from "@/lib/queries";
import { formatDateTime, formatMoney, formatMonth } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function Receipt({
  payment,
  settings,
  onClose,
}: {
  payment: Payment | null;
  settings?: BuildingSettings;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!payment} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment receipt</DialogTitle>
        </DialogHeader>
        {payment ? (
          <div id="receipt-printable" className="rounded-xl border p-5 text-sm">
            <div className="flex items-start justify-between gap-4 border-b pb-4">
              <div>
                <p className="text-base font-bold">{settings?.building_name ?? "HomeRent"}</p>
                <p className="text-xs text-muted-foreground">{settings?.building_address}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs">{payment.receipt_number ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(payment.paid_at)}</p>
              </div>
            </div>

            <dl className="mt-4 space-y-2">
              <Row label="Apartment" value={payment.apartments?.apartment_id ?? "—"} />
              <Row label="Tenant" value={payment.tenants?.full_name ?? "—"} />
              <Row label="Billing month" value={formatMonth(payment.rent_records?.billing_month)} />
              <Row label="Method" value={payment.payment_method} />
              <Row label="Reference" value={payment.transaction_id ?? "—"} />
              {payment.payment_gateway === "demo" ? (
                <Row label="Mode" value="Demo Payment Mode (no real money moved)" />
              ) : null}
            </dl>

            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <span className="font-semibold">Amount received</span>
              <span className="text-lg font-bold">{formatMoney(payment.amount)}</span>
            </div>
            {payment.notes ? (
              <p className="mt-3 text-xs text-muted-foreground">{payment.notes}</p>
            ) : null}
            <p className="mt-4 text-xs text-muted-foreground">
              Queries: {settings?.owner_name} · {settings?.owner_phone} · {settings?.contact_email}
            </p>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" /> Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
