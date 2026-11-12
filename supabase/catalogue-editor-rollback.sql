-- Reverts editor capabilities only. Keep uploaded images to avoid breaking URLs.
begin;
drop function if exists public.shop_admin_update_product(uuid,text,bigint,boolean,timestamptz,jsonb);
commit;
