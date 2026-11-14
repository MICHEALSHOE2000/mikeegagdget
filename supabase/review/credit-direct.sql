-- REVIEW ONLY. NOT APPLIED. Credit Direct (Pay Small Small) order tracking.
-- Apply only after the owner approves and sandbox keys are available. Additive: existing Paystack orders keep
-- payment_provider='paystack' and are otherwise untouched. Rollback: supabase/review/credit-direct-rollback.sql
begin;
alter table public.shop_orders add column payment_provider text not null default 'paystack' check (payment_provider in ('paystack','credit_direct'));
create table public.shop_credit_direct_sessions (
 order_reference text primary key references public.shop_orders(reference),
 session_id text not null unique,
 checkout_transaction_id text unique,
 amount_ngn bigint not null check(amount_ngn>0),
 products jsonb not null,
 customer_paid_at timestamptz,
 merchant_paid_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.shop_credit_direct_events (
 event_id text primary key,
 order_reference text not null references public.shop_orders(reference),
 event_type text not null,
 received_at timestamptz not null default now()
);
alter table public.shop_credit_direct_sessions enable row level security;
alter table public.shop_credit_direct_events enable row level security;
revoke all on public.shop_credit_direct_sessions,public.shop_credit_direct_events from public,anon,authenticated;
grant select,insert,update on public.shop_credit_direct_sessions to service_role;
grant select,insert on public.shop_credit_direct_events to service_role;

-- Builds the provider transaction from the order's own server-priced items.
create function public.shop_credit_direct_begin(p_reference text) returns jsonb
language plpgsql security invoker set search_path=public as $$
declare ord shop_orders%rowtype; items jsonb; total bigint;
begin
 select * into ord from shop_orders where reference=p_reference for update;
 if not found then raise exception 'Unknown order';end if;
 if ord.status<>'awaiting_payment' or ord.amount_ngn<=0 then raise exception 'Order is not awaiting payment';end if;
 if ord.authorization_url is not null then raise exception 'Order already started with another payment method';end if;
 select jsonb_agg(jsonb_build_object('productId',i.sku,'productName',left(concat_ws(' ',i.product_snapshot->>'model',i.product_snapshot->>'storage',case when i.quantity>1 then '× '||i.quantity end),200),'productAmount',i.unit_price_ngn*i.quantity) order by i.sku),sum(i.unit_price_ngn*i.quantity)
  into items,total from shop_order_items i where i.order_id=ord.id;
 if items is null or total is distinct from ord.amount_ngn then raise exception 'Order items do not match the order total';end if;
 insert into shop_credit_direct_sessions(order_reference,session_id,amount_ngn,products) values(ord.reference,ord.reference,ord.amount_ngn,items) on conflict(order_reference) do nothing;
 update shop_orders set payment_provider='credit_direct' where id=ord.id;
 return jsonb_build_object('sessionId',ord.reference,'amount_ngn',ord.amount_ngn,'products',items,'email',ord.customer->>'email','phone',ord.customer->>'phone');
end $$;

-- Records the provider's transaction id once. A different id for the same order, or the same id on another order, fails.
create function public.shop_credit_direct_link(p_reference text,p_transaction_id text) returns text
language plpgsql security invoker set search_path=public as $$
begin
 if coalesce(length(p_transaction_id),0) not between 3 and 200 then raise exception 'Invalid provider transaction';end if;
 update shop_credit_direct_sessions set checkout_transaction_id=p_transaction_id,updated_at=now()
  where order_reference=p_reference and (checkout_transaction_id is null or checkout_transaction_id=p_transaction_id);
 if not found then raise exception 'Order is linked to a different provider transaction';end if;
 return 'linked';
end $$;

-- Idempotent webhook processing. Only Checkout_Merchant_Payment_Completed with a matching total marks an order paid.
create function public.shop_credit_direct_event(p_event_id text,p_event_type text,p_session_id text,p_transaction_id text,p_total_ngn bigint) returns text
language plpgsql security invoker set search_path=public as $$
declare sess shop_credit_direct_sessions%rowtype; ord shop_orders%rowtype; n integer;
begin
 if p_event_type not in ('Checkout_Customer_Payment_Completed','Checkout_Merchant_Payment_Completed') then raise exception 'Unsupported event';end if;
 if coalesce(length(p_event_id),0) not between 5 and 200 then raise exception 'Invalid event';end if;
 if p_transaction_id is not null then select * into sess from shop_credit_direct_sessions where checkout_transaction_id=p_transaction_id for update;end if;
 if sess.order_reference is null and p_session_id is not null then
  select * into sess from shop_credit_direct_sessions where session_id=p_session_id and (checkout_transaction_id is null or p_transaction_id is null or checkout_transaction_id=p_transaction_id) for update;
 end if;
 if sess.order_reference is null then raise exception 'Unmatched provider transaction';end if;
 if p_session_id is not null and p_session_id<>sess.session_id then raise exception 'Session does not match provider transaction';end if;
 insert into shop_credit_direct_events(event_id,order_reference,event_type) values(p_event_id,sess.order_reference,p_event_type) on conflict(event_id) do nothing;
 get diagnostics n=row_count;
 if n=0 then return 'duplicate';end if;
 if sess.checkout_transaction_id is null and p_transaction_id is not null then update shop_credit_direct_sessions set checkout_transaction_id=p_transaction_id where order_reference=sess.order_reference;end if;
 select * into ord from shop_orders where reference=sess.order_reference for update;
 if ord.payment_provider<>'credit_direct' then raise exception 'Order does not use Credit Direct';end if;
 if p_event_type='Checkout_Customer_Payment_Completed' then
  update shop_credit_direct_sessions set customer_paid_at=coalesce(customer_paid_at,now()),updated_at=now() where order_reference=sess.order_reference;
  return case when ord.status='paid' then 'paid' else 'awaiting_merchant_payment' end;
 end if;
 if ord.status='paid' then return 'paid';end if;
 if p_total_ngn is null or p_total_ngn<>sess.amount_ngn or ord.amount_ngn<>sess.amount_ngn or ord.status<>'awaiting_payment' then
  update shop_orders set status='manual_review' where id=ord.id;
  return 'manual_review';
 end if;
 update shop_credit_direct_sessions set merchant_paid_at=now(),updated_at=now() where order_reference=sess.order_reference;
 update shop_orders set status='paid',paid_at=now(),payment_transaction_id=coalesce(p_transaction_id,sess.checkout_transaction_id,'cd-'||sess.session_id) where id=ord.id;
 return 'paid';
end $$;
revoke all on function public.shop_credit_direct_begin(text),public.shop_credit_direct_link(text,text),public.shop_credit_direct_event(text,text,text,text,bigint) from public,anon,authenticated;
grant execute on function public.shop_credit_direct_begin(text),public.shop_credit_direct_link(text,text),public.shop_credit_direct_event(text,text,text,text,bigint) to service_role;
commit;
