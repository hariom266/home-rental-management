export type RentStatus = "pending" | "partially_paid" | "paid" | "overdue";

export type RentRecordLike = {
  due_date: string;
  payment_status: RentStatus;
  paid_amount: number | string;
  total_amount: number | string;
};

/**
 * Centralised overdue logic: a record is overdue when today is past the due date
 * and it has not been fully paid. Stored status is respected for paid records.
 */
export function effectiveRentStatus(record: RentRecordLike): RentStatus {
  if (record.payment_status === "paid") return "paid";
  const due = new Date(`${record.due_date}T23:59:59`);
  if (Date.now() > due.getTime()) return "overdue";
  return record.payment_status;
}

export function outstanding(record: RentRecordLike): number {
  return Math.max(0, Number(record.total_amount) - Number(record.paid_amount));
}

export const rentStatusLabel: Record<RentStatus, string> = {
  pending: "Pending",
  partially_paid: "Partially Paid",
  paid: "Paid",
  overdue: "Overdue",
};
