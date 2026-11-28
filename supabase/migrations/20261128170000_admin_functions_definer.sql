-- Admin actions failed with "permission denied for table users": the server calls these functions as service_role,
-- which can no longer read auth.users, so the built-in administrator check inside each one raised an error.
-- Running them with the owner's rights (as shop_provision_owner already does) fixes this. Only service_role may
-- execute them (anon and authenticated have no EXECUTE), and each still checks the administrator itself.
begin;
alter function public.shop_admin_update_price(uuid,text,bigint,boolean,timestamptz) security definer set search_path=public,pg_temp;
alter function public.shop_admin_update_product(uuid,text,bigint,boolean,timestamptz,jsonb) security definer set search_path=public,pg_temp;
alter function public.shop_publish_deals(uuid,text[],integer) security definer set search_path=public,pg_temp;
alter function public.shop_publish_home(uuid,text[],integer) security definer set search_path=public,pg_temp;
alter function public.shop_bank_transfer_mark_paid(uuid,text) security definer set search_path=public,pg_temp;
alter function public.shop_reservation_action(uuid,text,text,integer) security definer set search_path=public,pg_temp;
revoke all on function public.shop_admin_update_price(uuid,text,bigint,boolean,timestamptz),public.shop_admin_update_product(uuid,text,bigint,boolean,timestamptz,jsonb),public.shop_publish_deals(uuid,text[],integer),public.shop_publish_home(uuid,text[],integer),public.shop_bank_transfer_mark_paid(uuid,text),public.shop_reservation_action(uuid,text,text,integer) from public,anon,authenticated;
grant execute on function public.shop_admin_update_price(uuid,text,bigint,boolean,timestamptz),public.shop_admin_update_product(uuid,text,bigint,boolean,timestamptz,jsonb),public.shop_publish_deals(uuid,text[],integer),public.shop_publish_home(uuid,text[],integer),public.shop_bank_transfer_mark_paid(uuid,text),public.shop_reservation_action(uuid,text,text,integer) to service_role;
commit;
