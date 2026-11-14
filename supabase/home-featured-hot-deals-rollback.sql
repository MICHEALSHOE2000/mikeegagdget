-- Rollback for 20261114120000_home_featured_hot_deals.sql. Removes only the objects that migration added.
begin;
drop function if exists public.shop_publish_hot_deals(uuid,text[],integer);
drop function if exists public.shop_publish_home(uuid,text[],integer);
drop table if exists public.shop_home_settings;
commit;
