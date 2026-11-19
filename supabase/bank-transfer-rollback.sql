-- Rollback for 20261119100000_bank_transfer_checkout.sql. Run only when no order uses bank_transfer / pending_payment.
begin;
do $$ begin if exists(select 1 from public.shop_orders where payment_provider='bank_transfer' or status='pending_payment') then raise exception 'Bank-transfer orders exist; resolve them first'; end if; end $$;
drop function if exists public.shop_bank_transfer_mark_paid(uuid,text);
drop function if exists public.shop_bank_transfer_begin(text);
alter table public.shop_orders drop constraint shop_orders_status_check;
alter table public.shop_orders add constraint shop_orders_status_check check (status = any (array['awaiting_payment','paid','manual_review']));
alter table public.shop_orders drop constraint shop_orders_payment_provider_check;
alter table public.shop_orders add constraint shop_orders_payment_provider_check check (payment_provider = any (array['paystack','credit_direct']));
commit;
