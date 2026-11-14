-- Rollback for supabase/review/credit-direct.sql. Run only if no Credit Direct orders exist that must be kept.
begin;
drop function if exists public.shop_credit_direct_event(text,text,text,text,bigint);
drop function if exists public.shop_credit_direct_link(text,text);
drop function if exists public.shop_credit_direct_begin(text);
drop table if exists public.shop_credit_direct_events;
drop table if exists public.shop_credit_direct_sessions;
alter table public.shop_orders drop column if exists payment_provider;
commit;
