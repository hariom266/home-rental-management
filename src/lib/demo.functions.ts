import { createServerFn } from "@tanstack/react-start";

const DEMO_NAMES = [
  "Amit Verma",
  "Rahul Sharma",
  "Priya Nair",
  "Sana Qureshi",
  "Vikram Rao",
  "Meera Iyer",
  "Rohit Kulkarni",
  "Ananya Bose",
  "Faisal Khan",
  "Deepa Menon",
  "Karan Gill",
  "Sneha Patil",
  "Arjun Desai",
  "Ritika Jain",
  "Neha Kapoor",
];

export const ADMIN_DEMO_EMAIL = "admin@homerent.local";
export const ADMIN_DEMO_PASSWORD = "Admin@12345";
export const TENANT_DEMO_PASSWORD = "Tenant@12345";

function monthStart(offset: number) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
}

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Creates the development/demo dataset: one admin account, 15 tenant accounts
 * (one per apartment), four months of rent records and paid payment history.
 * It is a no-op once an admin account already exists, so it can never be used
 * to escalate privileges on a live building.
 */
export const bootstrapDemoData = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  if ((count ?? 0) > 0) {
    return { created: false, message: "Demo accounts already exist." };
  }

  // --- Admin account ---
  const { data: adminUser, error: adminError } = await supabaseAdmin.auth.admin.createUser({
    email: ADMIN_DEMO_EMAIL,
    password: ADMIN_DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Building Owner" },
  });
  if (adminError || !adminUser.user) throw new Error(adminError?.message ?? "Admin creation failed");
  await supabaseAdmin.from("user_roles").insert({ user_id: adminUser.user.id, role: "admin" });

  const { data: apartments, error: aptError } = await supabaseAdmin
    .from("apartments")
    .select("id, apartment_id, monthly_rent")
    .order("apartment_id");
  if (aptError || !apartments) throw new Error(aptError?.message ?? "Apartments missing");

  const settings = await supabaseAdmin.from("building_settings").select("rent_due_day").limit(1).single();
  const dueDay = settings.data?.rent_due_day ?? 5;

  let receiptSeq = 0;
  const year = new Date().getUTCFullYear();

  for (let i = 0; i < apartments.length; i++) {
    const apt = apartments[i]!;
    const num = apt.apartment_id.replace("APT-", "");
    const email = `apt-${num}@homerent.local`;

    const { data: created, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: TENANT_DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: DEMO_NAMES[i] },
    });
    if (userError || !created.user) throw new Error(userError?.message ?? "Tenant creation failed");

    await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: "tenant" });

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({
        auth_user_id: created.user.id,
        apartment_id: apt.id,
        full_name: DEMO_NAMES[i]!,
        phone: `+91 98${String(100000 + i * 137).slice(0, 6)}`,
        email,
        emergency_contact_name: "Family Contact",
        emergency_contact_phone: `+91 97${String(200000 + i * 91).slice(0, 6)}`,
        move_in_date: iso(monthStart(10 + i)),
        status: "active",
      })
      .select("id")
      .single();
    if (tenantError || !tenant) throw new Error(tenantError?.message ?? "Tenant row failed");

    await supabaseAdmin.from("apartments").update({ status: "occupied" }).eq("id", apt.id);

    const rent = Number(apt.monthly_rent);

    for (let back = 3; back >= 0; back--) {
      const month = monthStart(back);
      const due = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), dueDay));
      const isCurrent = back === 0;
      // Leave a couple of current-month records unpaid so dashboards show real states.
      const unpaid = isCurrent && i % 4 === 0;
      const paid = !unpaid;

      const { data: record, error: recordError } = await supabaseAdmin
        .from("rent_records")
        .insert({
          apartment_id: apt.id,
          tenant_id: tenant.id,
          billing_month: iso(month),
          rent_amount: rent,
          due_date: iso(due),
          total_amount: rent,
          paid_amount: paid ? rent : 0,
          payment_status: paid ? "paid" : "pending",
          paid_at: paid ? new Date(due.getTime() - 86400000).toISOString() : null,
        })
        .select("id")
        .single();
      if (recordError || !record) throw new Error(recordError?.message ?? "Rent record failed");

      if (paid) {
        receiptSeq += 1;
        const receiptNumber = `HRM-${year}-${String(receiptSeq).padStart(5, "0")}`;
        const methods = ["UPI", "Bank Transfer", "Card", "Cash"];
        const { data: payment } = await supabaseAdmin
          .from("payments")
          .insert({
            rent_record_id: record.id,
            apartment_id: apt.id,
            tenant_id: tenant.id,
            amount: rent,
            payment_method: methods[(i + back) % methods.length]!,
            transaction_id: `DEMO${year}${String(receiptSeq).padStart(6, "0")}`,
            payment_gateway: "demo",
            payment_status: "successful",
            paid_at: new Date(due.getTime() - 86400000).toISOString(),
            receipt_number: receiptNumber,
          })
          .select("id")
          .single();
        if (payment) {
          await supabaseAdmin
            .from("receipts")
            .insert({ payment_id: payment.id, receipt_number: receiptNumber });
        }
      }
    }
  }

  await supabaseAdmin.from("notices").insert([
    {
      title: "Water Supply Maintenance",
      message:
        "Water supply will be unavailable between 10 AM and 1 PM tomorrow due to overhead tank cleaning. Please store water in advance.",
      priority: "high",
      target_type: "all_tenants",
      created_by: adminUser.user.id,
    },
    {
      title: "Rent Due Reminder",
      message: `A friendly reminder that monthly rent is due by the ${dueDay}th of every month. Late fees apply after the due date.`,
      priority: "normal",
      target_type: "all_tenants",
      created_by: adminUser.user.id,
    },
  ]);

  return {
    created: true,
    message: "Demo building, tenants and rent history created.",
    adminEmail: ADMIN_DEMO_EMAIL,
  };
});
