
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','tenant');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- APARTMENTS
CREATE TYPE public.apartment_status AS ENUM ('occupied','vacant','maintenance');

CREATE TABLE public.apartments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id text NOT NULL UNIQUE,
  apartment_number text NOT NULL,
  floor int NOT NULL DEFAULT 1,
  monthly_rent numeric(12,2) NOT NULL DEFAULT 8000,
  security_deposit numeric(12,2) NOT NULL DEFAULT 0,
  status public.apartment_status NOT NULL DEFAULT 'vacant',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.apartments TO authenticated;
GRANT ALL ON public.apartments TO service_role;
ALTER TABLE public.apartments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_apartments_updated BEFORE UPDATE ON public.apartments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TENANTS
CREATE TYPE public.tenant_status AS ENUM ('active','inactive');

CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  apartment_id uuid REFERENCES public.apartments(id) ON DELETE RESTRICT,
  full_name text NOT NULL,
  phone text,
  email text,
  emergency_contact_name text,
  emergency_contact_phone text,
  move_in_date date,
  move_out_date date,
  status public.tenant_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_tenants_updated BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.tenants WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_apartment_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT apartment_id FROM public.tenants WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE POLICY "Admins manage apartments" ON public.apartments FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Tenants read own apartment" ON public.apartments FOR SELECT TO authenticated
  USING (id = public.current_apartment_id());

CREATE POLICY "Admins manage tenants" ON public.tenants FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Tenants read own record" ON public.tenants FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());
CREATE POLICY "Tenants update own profile" ON public.tenants FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid()) WITH CHECK (auth_user_id = auth.uid());

-- prevent tenants changing protected fields
CREATE OR REPLACE FUNCTION public.guard_tenant_self_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.is_admin() THEN RETURN NEW; END IF;
  NEW.apartment_id := OLD.apartment_id;
  NEW.auth_user_id := OLD.auth_user_id;
  NEW.status := OLD.status;
  NEW.move_in_date := OLD.move_in_date;
  NEW.move_out_date := OLD.move_out_date;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_tenants_guard BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.guard_tenant_self_update();

-- RENT RECORDS
CREATE TYPE public.payment_status_enum AS ENUM ('pending','partially_paid','paid','overdue');

CREATE TABLE public.rent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL REFERENCES public.apartments(id) ON DELETE RESTRICT,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  billing_month date NOT NULL,
  rent_amount numeric(12,2) NOT NULL,
  due_date date NOT NULL,
  paid_amount numeric(12,2) NOT NULL DEFAULT 0,
  payment_status public.payment_status_enum NOT NULL DEFAULT 'pending',
  late_fee numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (apartment_id, billing_month)
);
GRANT SELECT, INSERT, UPDATE ON public.rent_records TO authenticated;
GRANT ALL ON public.rent_records TO service_role;
ALTER TABLE public.rent_records ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_rent_updated BEFORE UPDATE ON public.rent_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "Admins manage rent" ON public.rent_records FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Tenants read own rent" ON public.rent_records FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

-- PAYMENTS
CREATE TYPE public.txn_status AS ENUM ('pending','successful','failed','refunded');

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rent_record_id uuid REFERENCES public.rent_records(id) ON DELETE RESTRICT,
  apartment_id uuid NOT NULL REFERENCES public.apartments(id) ON DELETE RESTRICT,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL,
  payment_method text NOT NULL DEFAULT 'UPI',
  transaction_id text,
  payment_gateway text,
  payment_status public.txn_status NOT NULL DEFAULT 'pending',
  notes text,
  paid_at timestamptz,
  receipt_number text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage payments" ON public.payments FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Tenants read own payments" ON public.payments FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

-- RECEIPTS
CREATE TABLE public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  receipt_number text NOT NULL UNIQUE,
  generated_at timestamptz NOT NULL DEFAULT now(),
  receipt_url text
);
GRANT SELECT ON public.receipts TO authenticated;
GRANT ALL ON public.receipts TO service_role;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage receipts" ON public.receipts FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Tenants read own receipts" ON public.receipts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.payments p WHERE p.id = payment_id AND p.tenant_id = public.current_tenant_id()));

-- MAINTENANCE
CREATE TYPE public.maintenance_status AS ENUM ('submitted','in_progress','resolved','rejected');
CREATE TYPE public.maintenance_priority AS ENUM ('low','medium','high','emergency');

CREATE TABLE public.maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL REFERENCES public.apartments(id) ON DELETE RESTRICT,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  priority public.maintenance_priority NOT NULL DEFAULT 'medium',
  status public.maintenance_status NOT NULL DEFAULT 'submitted',
  image_url text,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.maintenance_requests TO authenticated;
GRANT ALL ON public.maintenance_requests TO service_role;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_maint_updated BEFORE UPDATE ON public.maintenance_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "Admins manage maintenance" ON public.maintenance_requests FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Tenants read own maintenance" ON public.maintenance_requests FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());
CREATE POLICY "Tenants create own maintenance" ON public.maintenance_requests FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_tenant_id() AND apartment_id = public.current_apartment_id());

-- NOTICES
CREATE TABLE public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  priority text NOT NULL DEFAULT 'normal',
  target_type text NOT NULL DEFAULT 'all_tenants',
  target_apartment_id uuid REFERENCES public.apartments(id) ON DELETE CASCADE,
  published_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notices TO authenticated;
GRANT ALL ON public.notices TO service_role;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage notices" ON public.notices FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Tenants read relevant notices" ON public.notices FOR SELECT TO authenticated
  USING (
    public.current_tenant_id() IS NOT NULL
    AND (expires_at IS NULL OR expires_at > now())
    AND published_at <= now()
    AND (target_type = 'all_tenants' OR target_apartment_id = public.current_apartment_id())
  );

-- SETTINGS
CREATE TABLE public.building_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_name text NOT NULL DEFAULT 'HomeRent Manager',
  building_address text NOT NULL DEFAULT '12 Green Park Residency, Pune, Maharashtra',
  owner_name text NOT NULL DEFAULT 'Building Owner',
  owner_phone text NOT NULL DEFAULT '+91 90000 00000',
  contact_email text NOT NULL DEFAULT 'owner@homerent.local',
  currency text NOT NULL DEFAULT 'INR',
  rent_due_day int NOT NULL DEFAULT 5,
  late_fee_type text NOT NULL DEFAULT 'fixed',
  late_fee_value numeric(12,2) NOT NULL DEFAULT 200,
  late_fee_grace_days int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.building_settings TO authenticated;
GRANT ALL ON public.building_settings TO service_role;
ALTER TABLE public.building_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signed in reads settings" ON public.building_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins update settings" ON public.building_settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.building_settings (id) VALUES (gen_random_uuid());

-- 15 APARTMENTS
INSERT INTO public.apartments (apartment_id, apartment_number, floor, monthly_rent, security_deposit, status, description) VALUES
('APT-001','101',1,8000,16000,'vacant','1BHK, front facing'),
('APT-002','102',1,8000,16000,'vacant','1BHK, garden view'),
('APT-003','103',1,9000,18000,'vacant','2BHK, corner unit'),
('APT-004','104',1,8000,16000,'vacant','1BHK, balcony'),
('APT-005','105',1,8500,17000,'vacant','1BHK, extra storage'),
('APT-006','201',2,8000,16000,'vacant','1BHK, road facing'),
('APT-007','202',2,8000,16000,'vacant','1BHK, well ventilated'),
('APT-008','203',2,9500,19000,'vacant','2BHK, large hall'),
('APT-009','204',2,8500,17000,'vacant','1BHK, modular kitchen'),
('APT-010','205',2,8000,16000,'vacant','1BHK, standard'),
('APT-011','301',3,8500,17000,'vacant','1BHK, top floor'),
('APT-012','302',3,9000,18000,'vacant','2BHK, terrace access'),
('APT-013','303',3,8000,16000,'vacant','1BHK, standard'),
('APT-014','304',3,8500,17000,'vacant','1BHK, sunlit'),
('APT-015','305',3,8500,17000,'vacant','1BHK, quiet side');

-- LATE FEE + MONTHLY RENT GENERATION
CREATE OR REPLACE FUNCTION public.compute_late_fee(_rent numeric, _due date)
RETURNS numeric LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.building_settings; fee numeric := 0;
BEGIN
  SELECT * INTO s FROM public.building_settings LIMIT 1;
  IF s IS NULL THEN RETURN 0; END IF;
  IF current_date > (_due + s.late_fee_grace_days) THEN
    IF s.late_fee_type = 'percent' THEN fee := round(_rent * s.late_fee_value / 100, 2);
    ELSE fee := s.late_fee_value; END IF;
  END IF;
  RETURN fee;
END; $$;

CREATE OR REPLACE FUNCTION public.generate_monthly_rent(_billing_month date)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE created_count int := 0; due_day int; m date;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Only admins can generate rent records'; END IF;
  SELECT rent_due_day INTO due_day FROM public.building_settings LIMIT 1;
  due_day := coalesce(due_day, 5);
  m := date_trunc('month', _billing_month)::date;
  INSERT INTO public.rent_records (apartment_id, tenant_id, billing_month, rent_amount, due_date, total_amount)
  SELECT a.id, t.id, m, a.monthly_rent, (m + (due_day - 1)), a.monthly_rent
  FROM public.apartments a
  JOIN public.tenants t ON t.apartment_id = a.id AND t.status = 'active'
  WHERE a.status = 'occupied'
  ON CONFLICT (apartment_id, billing_month) DO NOTHING;
  GET DIAGNOSTICS created_count = ROW_COUNT;
  RETURN created_count;
END; $$;

GRANT EXECUTE ON FUNCTION public.generate_monthly_rent(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_late_fee(numeric, date) TO authenticated;
