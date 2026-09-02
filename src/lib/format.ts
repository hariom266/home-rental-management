import { format, parseISO } from "date-fns";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatMoney(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return inr.format(Number.isFinite(n) ? n : 0);
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : parseISO(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** DD MMM YYYY, e.g. 05 Sep 2026 */
export function formatDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? format(d, "dd MMM yyyy") : "—";
}

export function formatDateTime(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? format(d, "dd MMM yyyy, h:mm a") : "—";
}

/** "September 2026" from a billing month date string */
export function formatMonth(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? format(d, "MMMM yyyy") : "—";
}

export function formatMonthShort(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? format(d, "MMM yyyy") : "—";
}

/** First day of a month as an ISO date string (YYYY-MM-01) */
export function monthKey(date: Date): string {
  return format(new Date(date.getFullYear(), date.getMonth(), 1), "yyyy-MM-dd");
}

export function currentMonthKey(): string {
  return monthKey(new Date());
}

export function titleCase(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Tenants sign in with their Apartment ID; it maps to a deterministic login address. */
export function resolveLoginEmail(identifier: string): string {
  const value = identifier.trim();
  if (value.includes("@")) return value.toLowerCase();
  const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const match = normalized.match(/^APT0*(\d{1,3})$/);
  if (match) {
    const num = String(Number(match[1])).padStart(3, "0");
    return `apt-${num}@homerent.local`;
  }
  return value.toLowerCase();
}
