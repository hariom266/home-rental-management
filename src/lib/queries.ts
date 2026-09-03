import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Apartment = {
  id: string;
  apartment_id: string;
  apartment_number: string;
  floor: number;
  monthly_rent: number;
  security_deposit: number;
  status: "occupied" | "vacant" | "maintenance";
  description: string | null;
};

export type Tenant = {
  id: string;
  auth_user_id: string | null;
  apartment_id: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  move_in_date: string | null;
  move_out_date: string | null;
  status: "active" | "inactive";
  apartments?: Apartment | null;
};

export type RentRecord = {
  id: string;
  apartment_id: string;
  tenant_id: string | null;
  billing_month: string;
  rent_amount: number;
  due_date: string;
  paid_amount: number;
  payment_status: "pending" | "partially_paid" | "paid" | "overdue";
  late_fee: number;
  total_amount: number;
  paid_at: string | null;
  apartments?: Apartment | null;
  tenants?: { id: string; full_name: string } | null;
};

export type Payment = {
  id: string;
  rent_record_id: string | null;
  apartment_id: string;
  tenant_id: string | null;
  amount: number;
  payment_method: string;
  transaction_id: string | null;
  payment_gateway: string | null;
  payment_status: "pending" | "successful" | "failed" | "refunded";
  notes: string | null;
  paid_at: string | null;
  receipt_number: string | null;
  created_at: string;
  apartments?: Apartment | null;
  tenants?: { id: string; full_name: string } | null;
  rent_records?: { billing_month: string } | null;
};

export type MaintenanceRequest = {
  id: string;
  apartment_id: string;
  tenant_id: string | null;
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "emergency";
  status: "submitted" | "in_progress" | "resolved" | "rejected";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  apartments?: Apartment | null;
  tenants?: { id: string; full_name: string } | null;
};

export type Notice = {
  id: string;
  title: string;
  message: string;
  priority: string;
  target_type: string;
  target_apartment_id: string | null;
  published_at: string;
  expires_at: string | null;
  created_at: string;
  apartments?: { apartment_id: string } | null;
};

export type BuildingSettings = {
  id: string;
  building_name: string;
  building_address: string;
  owner_name: string;
  owner_phone: string;
  contact_email: string;
  currency: string;
  rent_due_day: number;
  late_fee_type: string;
  late_fee_value: number;
  late_fee_grace_days: number;
};

export const db = supabase as unknown as {
  from: (table: string) => any;
};

async function unwrap<T>(builder: PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  const { data, error } = await builder;
  if (error) throw new Error(error.message);
  return data as T;
}

export const settingsQuery = () =>
  queryOptions({
    queryKey: ["settings"],
    queryFn: () =>
      unwrap<BuildingSettings>(db.from("building_settings").select("*").limit(1).single()),
  });

export const apartmentsQuery = () =>
  queryOptions({
    queryKey: ["apartments"],
    queryFn: () =>
      unwrap<Apartment[]>(db.from("apartments").select("*").order("apartment_id")),
  });

export const tenantsQuery = () =>
  queryOptions({
    queryKey: ["tenants"],
    queryFn: () =>
      unwrap<Tenant[]>(
        db.from("tenants").select("*, apartments(*)").order("full_name"),
      ),
  });

export const myTenantQuery = () =>
  queryOptions({
    queryKey: ["my-tenant"],
    queryFn: async () => {
      const { data, error } = await db
        .from("tenants")
        .select("*, apartments(*)")
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data ?? null) as Tenant | null;
    },
  });

export const rentRecordsQuery = (filters?: { month?: string; tenantId?: string }) =>
  queryOptions({
    queryKey: ["rent-records", filters ?? {}],
    queryFn: () => {
      let q = db
        .from("rent_records")
        .select("*, apartments(*), tenants(id, full_name)")
        .order("billing_month", { ascending: false });
      if (filters?.month) q = q.eq("billing_month", filters.month);
      if (filters?.tenantId) q = q.eq("tenant_id", filters.tenantId);
      return unwrap<RentRecord[]>(q);
    },
  });

export const paymentsQuery = () =>
  queryOptions({
    queryKey: ["payments"],
    queryFn: () =>
      unwrap<Payment[]>(
        db
          .from("payments")
          .select("*, apartments(*), tenants(id, full_name), rent_records(billing_month)")
          .order("created_at", { ascending: false }),
      ),
  });

export const maintenanceQuery = () =>
  queryOptions({
    queryKey: ["maintenance"],
    queryFn: () =>
      unwrap<MaintenanceRequest[]>(
        db
          .from("maintenance_requests")
          .select("*, apartments(*), tenants(id, full_name)")
          .order("created_at", { ascending: false }),
      ),
  });

export const noticesQuery = () =>
  queryOptions({
    queryKey: ["notices"],
    queryFn: () =>
      unwrap<Notice[]>(
        db
          .from("notices")
          .select("*, apartments:target_apartment_id(apartment_id)")
          .order("published_at", { ascending: false }),
      ),
  });
