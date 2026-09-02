import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Payment gateway boundary. Razorpay credentials are read server-side only.
 * Until they are configured the app runs in clearly-labelled Demo Payment Mode.
 */
export const getPaymentMode = createServerFn({ method: "GET" }).handler(async () => {
  const configured = Boolean(process.env["RAZORPAY_KEY_ID"] && process.env["RAZORPAY_KEY_SECRET"]);
  return { mode: configured ? ("razorpay" as const) : ("demo" as const) };
});

async function nextReceiptNumber(admin: {
  from: (t: string) => any;
}): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await admin
    .from("receipts")
    .select("id", { count: "exact", head: true });
  return `HRM-${year}-${String((count ?? 0) + 1).padStart(5, "0")}`;
}

async function settleRentRecord(
  admin: { from: (t: string) => any },
  rentRecordId: string,
  paidAmountDelta: number,
) {
  const { data: record, error } = await admin
    .from("rent_records")
    .select("id, paid_amount, total_amount")
    .eq("id", rentRecordId)
    .single();
  if (error || !record) throw new Error(error?.message ?? "Rent record not found");

  const paid = Number(record.paid_amount) + paidAmountDelta;
  const total = Number(record.total_amount);
  const status = paid >= total ? "paid" : paid > 0 ? "partially_paid" : "pending";

  await admin
    .from("rent_records")
    .update({
      paid_amount: paid,
      payment_status: status,
      paid_at: status === "paid" ? new Date().toISOString() : null,
    })
    .eq("id", rentRecordId);

  return status;
}

/** Tenant-initiated rent payment. In demo mode the server (never the browser) confirms it. */
export const payRent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ rentRecordId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    // RLS-scoped read: a tenant can only resolve their own rent record here.
    const { data: record, error } = await context.supabase
      .from("rent_records")
      .select("id, apartment_id, tenant_id, total_amount, paid_amount, payment_status")
      .eq("id", data.rentRecordId)
      .single();
    if (error || !record) throw new Error("Rent record not available for this account");
    if (record.payment_status === "paid") throw new Error("This rent is already paid");

    const due = Number(record.total_amount) - Number(record.paid_amount);
    if (due <= 0) throw new Error("Nothing left to pay");

    if (process.env["RAZORPAY_KEY_ID"] && process.env["RAZORPAY_KEY_SECRET"]) {
      throw new Error(
        "Razorpay credentials are present but the live checkout + webhook flow is not enabled yet.",
      );
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const receiptNumber = await nextReceiptNumber(supabaseAdmin as never);

    const { data: payment, error: payError } = await supabaseAdmin
      .from("payments")
      .insert({
        rent_record_id: record.id,
        apartment_id: record.apartment_id,
        tenant_id: record.tenant_id,
        amount: due,
        payment_method: "UPI",
        transaction_id: `DEMO-${Date.now()}`,
        payment_gateway: "demo",
        payment_status: "successful",
        paid_at: new Date().toISOString(),
        receipt_number: receiptNumber,
        notes: "Demo Payment Mode - no real money moved",
      })
      .select("id")
      .single();
    if (payError || !payment) throw new Error(payError?.message ?? "Payment could not be recorded");

    await supabaseAdmin.from("receipts").insert({ payment_id: payment.id, receipt_number: receiptNumber });
    await settleRentRecord(supabaseAdmin as never, record.id, due);

    return { mode: "demo" as const, paymentId: payment.id, receiptNumber, amount: due };
  });

/** Admin records a cash / bank transfer payment received outside the app. */
export const recordOfflinePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        rentRecordId: z.string().uuid(),
        amount: z.number().positive(),
        paymentMethod: z.enum(["Cash", "Bank Transfer", "UPI", "Card", "Net Banking", "Other"]),
        transactionId: z.string().max(120).optional(),
        paidAt: z.string().min(4),
        notes: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: record, error } = await supabaseAdmin
      .from("rent_records")
      .select("id, apartment_id, tenant_id")
      .eq("id", data.rentRecordId)
      .single();
    if (error || !record) throw new Error("Rent record not found");

    const receiptNumber = await nextReceiptNumber(supabaseAdmin as never);
    const { data: payment, error: payError } = await supabaseAdmin
      .from("payments")
      .insert({
        rent_record_id: record.id,
        apartment_id: record.apartment_id,
        tenant_id: record.tenant_id,
        amount: data.amount,
        payment_method: data.paymentMethod,
        transaction_id: data.transactionId ?? null,
        payment_gateway: "offline",
        payment_status: "successful",
        paid_at: new Date(data.paidAt).toISOString(),
        receipt_number: receiptNumber,
        notes: data.notes ?? null,
      })
      .select("id")
      .single();
    if (payError || !payment) throw new Error(payError?.message ?? "Payment could not be recorded");

    await supabaseAdmin.from("receipts").insert({ payment_id: payment.id, receipt_number: receiptNumber });
    const status = await settleRentRecord(supabaseAdmin as never, record.id, data.amount);

    return { receiptNumber, status };
  });

/** Admin creates or updates a tenant login account (Apartment ID based). */
export const upsertTenantAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        tenantId: z.string().uuid(),
        email: z.string().email(),
        password: z.string().min(8),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: tenant, error } = await supabaseAdmin
      .from("tenants")
      .select("id, auth_user_id")
      .eq("id", data.tenantId)
      .single();
    if (error || !tenant) throw new Error("Tenant not found");

    if (tenant.auth_user_id) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(tenant.auth_user_id, {
        email: data.email,
        password: data.password,
        email_confirm: true,
      });
      if (updateError) throw new Error(updateError.message);
      return { created: false };
    }

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (createError || !created.user) throw new Error(createError?.message ?? "Account creation failed");

    await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: "tenant" });
    await supabaseAdmin
      .from("tenants")
      .update({ auth_user_id: created.user.id, email: data.email })
      .eq("id", tenant.id);

    return { created: true };
  });
