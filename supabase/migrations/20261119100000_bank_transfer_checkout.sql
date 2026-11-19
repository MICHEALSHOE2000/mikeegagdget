-- Direct bank transfer at checkout. Additive only: no column is added, dropped or renamed.
-- State and LGA are saved inside the existing shop_orders.customer JSON (state, lga, city = lga).
begin;
-- Allow the new payment method and its status (existing values unchanged).
alter table public.shop_orders drop constraint if exists shop_orders_payment_provider_check;
alter table public.shop_orders add constraint shop_orders_payment_provider_check check (payment_provider = any (array['paystack','credit_direct','bank_transfer']));
alter table public.shop_orders drop constraint if exists shop_orders_status_check;
alter table public.shop_orders add constraint shop_orders_status_check check (status = any (array['awaiting_payment','paid','manual_review','pending_payment']));

-- Called right after shop_create_order_deals for a bank-transfer order: marks it as awaiting the customer's transfer.
create or replace function public.shop_bank_transfer_begin(p_reference text) returns jsonb language plpgsql set search_path to 'public' as $f$
declare ord shop_orders%rowtype;
begin
 select * into ord from shop_orders where reference=p_reference for update;
 if not found then raise exception 'Unknown order';end if;
 if ord.status='pending_payment' and ord.payment_provider='bank_transfer' then return jsonb_build_object('reference',ord.reference,'amount_ngn',ord.amount_ngn,'status',ord.status);end if;
 if ord.status<>'awaiting_payment' or ord.amount_ngn<=0 then raise exception 'Order is not awaiting payment';end if;
 if ord.authorization_url is not null or ord.payment_provider<>'paystack' or exists(select 1 from shop_credit_direct_sessions where order_reference=ord.reference) then raise exception 'Order already started with another payment method';end if;
 update shop_orders set payment_provider='bank_transfer',status='pending_payment' where id=ord.id;
 return jsonb_build_object('reference',ord.reference,'amount_ngn',ord.amount_ngn,'status','pending_payment');
end $f$;

-- The administrator confirms the transfer has reached the account; recorded in the admin audit log.
create or replace function public.shop_bank_transfer_mark_paid(p_actor uuid, p_reference text) returns text language plpgsql set search_path to 'public' as $f$
declare ord shop_orders%rowtype;
begin
 if not exists(select 1 from auth.users where id=p_actor and exists(select 1 from public.shop_admins a where a.user_id=p_actor) and lower(email)='aderintomicheal6@gmail.com' and email_confirmed_at is not null) then raise exception 'Administrator access required';end if;
 select * into ord from shop_orders where reference=p_reference for update;
 if not found then raise exception 'Unknown order';end if;
 if ord.payment_provider<>'bank_transfer' then raise exception 'Not a bank-transfer order';end if;
 if ord.status='paid' then return 'paid';end if;
 if ord.status<>'pending_payment' then raise exception 'Order is not awaiting a transfer';end if;
 update shop_orders set status='paid',paid_at=now() where id=ord.id;
 insert into shop_admin_audit(actor_id,sku,previous_value,new_value) values(p_actor,'order:'||ord.reference,jsonb_build_object('status',ord.status),jsonb_build_object('status','paid','method','bank_transfer'));
 return 'paid';
end $f$;
revoke all on function public.shop_bank_transfer_begin(text) from public, anon, authenticated;
revoke all on function public.shop_bank_transfer_mark_paid(uuid,text) from public, anon, authenticated;
commit;
