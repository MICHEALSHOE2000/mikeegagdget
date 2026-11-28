-- Undo 20261128170000_admin_functions_definer.sql (puts the functions back to the failing behaviour).
begin;
alter function public.shop_admin_update_price(uuid,text,bigint,boolean,timestamptz) security invoker set search_path=public;
alter function public.shop_admin_update_product(uuid,text,bigint,boolean,timestamptz,jsonb) security invoker set search_path=public;
alter function public.shop_publish_deals(uuid,text[],integer) security invoker set search_path=public;
alter function public.shop_publish_home(uuid,text[],integer) security invoker set search_path=public;
alter function public.shop_bank_transfer_mark_paid(uuid,text) security invoker set search_path=public;
alter function public.shop_reservation_action(uuid,text,text,integer) security invoker set search_path=public;
commit;
