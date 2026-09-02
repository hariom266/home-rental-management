
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_tenant_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_apartment_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.compute_late_fee(numeric, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.generate_monthly_rent(date) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_apartment_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_late_fee(numeric, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_monthly_rent(date) TO authenticated;

ALTER FUNCTION public.update_updated_at_column() SECURITY INVOKER;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.guard_tenant_self_update()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF public.is_admin() THEN RETURN NEW; END IF;
  NEW.apartment_id := OLD.apartment_id;
  NEW.auth_user_id := OLD.auth_user_id;
  NEW.status := OLD.status;
  NEW.move_in_date := OLD.move_in_date;
  NEW.move_out_date := OLD.move_out_date;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.guard_tenant_self_update() FROM PUBLIC, anon, authenticated;
