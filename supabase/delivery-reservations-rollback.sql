-- Rollback for 20261120100000_delivery_reservations.sql.
-- Keeps every order. Run only after reservations and pay-at-store orders are resolved (the checks stop otherwise).
begin;
do $$ begin if exists(select 1 from public.shop_orders where status='unpaid' or payment_provider='pay_at_store') then raise exception 'Reservation orders exist; resolve them first'; end if; end $$;
do $$ begin if exists(select 1 from pg_available_extensions where name='pg_cron' and installed_version is not null) then perform cron.unschedule(jobid) from cron.job where jobname='mikee-expire-reservations'; end if; end $$;
drop function if exists public.shop_expire_reservations();
drop function if exists public.shop_reservation_action(uuid,text,text,integer);
drop function if exists public.shop_create_order_v3(uuid,jsonb,jsonb,text);
drop function if exists public.shop_delivery_quote(text,text,text);
-- Credit Direct: restore the version without a delivery line (identical for orders without a delivery fee).
create or replace function public.shop_credit_direct_begin(p_reference text, p_session_id text) returns jsonb language plpgsql set search_path to 'public' as $f$
declare ord shop_orders%rowtype; items jsonb; total bigint;
begin
 select * into ord from shop_orders where reference=p_reference for update;
 if not found then raise exception 'Unknown order';end if;
 if ord.status<>'awaiting_payment' or ord.amount_ngn<=0 then raise exception 'Order is not awaiting payment';end if;
 if ord.authorization_url is not null then raise exception 'Order already started with another payment method';end if;
 if (select count(*) from shop_credit_direct_sessions where order_reference=ord.reference)>=10 then raise exception 'Too many checkout attempts';end if;
 select jsonb_agg(jsonb_build_object('productId',i.sku,'productName',left(concat_ws(' ',i.product_snapshot->>'model',i.product_snapshot->>'storage',case when i.quantity>1 then '× '||i.quantity end),200),'productAmount',i.unit_price_ngn*i.quantity) order by i.sku),sum(i.unit_price_ngn*i.quantity)
  into items,total from shop_order_items i where i.order_id=ord.id;
 if items is null or total is distinct from ord.amount_ngn then raise exception 'Order items do not match the order total';end if;
 insert into shop_credit_direct_sessions(session_id,order_reference,amount_ngn,products) values(p_session_id,ord.reference,ord.amount_ngn,items);
 update shop_orders set payment_provider='credit_direct' where id=ord.id;
 return jsonb_build_object('sessionId',p_session_id,'amount_ngn',ord.amount_ngn,'products',items,'email',ord.customer->>'email','phone',ord.customer->>'phone');
end $f$;
alter table public.shop_orders drop constraint shop_orders_status_check;
alter table public.shop_orders add constraint shop_orders_status_check check (status = any (array['awaiting_payment','paid','manual_review','pending_payment']));
alter table public.shop_orders drop constraint shop_orders_payment_provider_check;
alter table public.shop_orders add constraint shop_orders_payment_provider_check check (payment_provider = any (array['paystack','credit_direct','bank_transfer']));
-- New columns and tables are left in place (harmless when unused) so no data is lost.
commit;
