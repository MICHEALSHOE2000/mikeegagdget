-- REVIEW ONLY. NOT APPLIED. Credit Direct (Pay Small Small) order tracking, per Credit Direct Checkout API v2.0.
-- Additive: existing Paystack orders keep payment_provider='paystack' and are otherwise untouched.
-- Rollback: supabase/review/credit-direct-rollback.sql
--
-- How matching works (the webhook carries no sessionId and no total):
-- 1. Each widget opening gets a new random sessionId (one row in shop_credit_direct_sessions).
-- 2. The widget's onPopup/onSuccess give the browser a checkoutTransactionId; the server links it to that session
--    only with an HMAC token issued for that exact order and session.
-- 3. Webhooks are matched by checkoutTransactionId. If the browser never reported it, the order reference sent as
--    metaData is used, but only to flag the order for manual review, never to mark it paid.
-- 4. Only Checkout_Merchant_Payment_Completed, with product total and product ids matching, marks an order paid.
begin;
alter table public.shop_orders add column payment_provider text not null default 'paystack' check (payment_provider in ('paystack','credit_direct'));
create table public.shop_credit_direct_sessions (
 session_id text primary key check (session_id ~ '^[A-Za-z0-9]{15,64}$'),
 order_reference text not null references public.shop_orders(reference),
 checkout_transaction_id text unique,
 amount_ngn bigint not null check(amount_ngn>0),
 products jsonb not null,
 customer_paid_at timestamptz,
 merchant_paid_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index shop_credit_direct_sessions_order on public.shop_credit_direct_sessions(order_reference);
create table public.shop_credit_direct_events (
 event_id text primary key,
 order_reference text references public.shop_orders(reference),
 checkout_transaction_id text not null,
 event_type text not null,
 outcome text not null,
 received_at timestamptz not null default now()
);
alter table public.shop_credit_direct_sessions enable row level security;
alter table public.shop_credit_direct_events enable row level security;
revoke all on public.shop_credit_direct_sessions,public.shop_credit_direct_events from public,anon,authenticated;
grant select,insert,update on public.shop_credit_direct_sessions to service_role;
grant select,insert on public.shop_credit_direct_events to service_role;

-- Starts one widget opening. Products and total come from the order's own server-priced items.
create function public.shop_credit_direct_begin(p_reference text,p_session_id text) returns jsonb
language plpgsql security invoker set search_path=public as $$
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
end $$;

-- Records the provider's checkoutTransactionId once for that session. A different id, or the same id on another session, fails.
create function public.shop_credit_direct_link(p_reference text,p_session_id text,p_transaction_id text) returns text
language plpgsql security invoker set search_path=public as $$
begin
 if coalesce(length(p_transaction_id),0) not between 3 and 200 then raise exception 'Invalid provider transaction';end if;
 update shop_credit_direct_sessions set checkout_transaction_id=p_transaction_id,updated_at=now()
  where session_id=p_session_id and order_reference=p_reference and (checkout_transaction_id is null or checkout_transaction_id=p_transaction_id);
 if not found then raise exception 'Session is linked to a different provider transaction';end if;
 return 'linked';
end $$;

-- Idempotent webhook processing (svix-id is the event id; Credit Direct resends with the same id).
create function public.shop_credit_direct_event(p_event_id text,p_event_type text,p_transaction_id text,p_reference_hint text,p_total_ngn bigint,p_product_ids text[]) returns text
language plpgsql security invoker set search_path=public as $$
declare sess shop_credit_direct_sessions%rowtype; ord shop_orders%rowtype; outcome text;
begin
 if p_event_type not in ('Checkout_Customer_Payment_Completed','Checkout_Merchant_Payment_Completed') then raise exception 'Unsupported event';end if;
 if coalesce(length(p_event_id),0) not between 5 and 200 or coalesce(length(p_transaction_id),0) not between 3 and 200 then raise exception 'Invalid event';end if;
 if exists(select 1 from shop_credit_direct_events where event_id=p_event_id) then return 'duplicate';end if;
 select * into sess from shop_credit_direct_sessions where checkout_transaction_id=p_transaction_id for update;
 if not found then
  -- Unlinked transaction: never pay on metadata alone. Flag the hinted order for a person to check.
  if p_reference_hint is not null and exists(select 1 from shop_orders where reference=p_reference_hint and payment_provider='credit_direct') then
   update shop_orders set status='manual_review' where reference=p_reference_hint and status='awaiting_payment';
   outcome:='manual_review_unlinked';
  else outcome:='unmatched';end if;
  insert into shop_credit_direct_events(event_id,order_reference,checkout_transaction_id,event_type,outcome) values(p_event_id,case when outcome='unmatched' then null else p_reference_hint end,p_transaction_id,p_event_type,outcome);
  return outcome;
 end if;
 select * into ord from shop_orders where reference=sess.order_reference for update;
 if p_event_type='Checkout_Customer_Payment_Completed' then
  update shop_credit_direct_sessions set customer_paid_at=coalesce(customer_paid_at,now()),updated_at=now() where session_id=sess.session_id;
  outcome:=case when ord.status='paid' then 'paid' else 'awaiting_merchant_payment' end;
 elsif ord.status='paid' then outcome:='paid';
 elsif ord.payment_provider<>'credit_direct' or ord.status<>'awaiting_payment' or p_total_ngn is distinct from sess.amount_ngn or ord.amount_ngn<>sess.amount_ngn
    or p_product_ids is null or (select array_agg(x order by x) from unnest(p_product_ids) x) is distinct from (select array_agg(p->>'productId' order by p->>'productId') from jsonb_array_elements(sess.products) p) then
  update shop_orders set status='manual_review' where id=ord.id;outcome:='manual_review';
 else
  update shop_credit_direct_sessions set merchant_paid_at=now(),updated_at=now() where session_id=sess.session_id;
  update shop_orders set status='paid',paid_at=now(),payment_transaction_id=p_transaction_id where id=ord.id;
  outcome:='paid';
 end if;
 insert into shop_credit_direct_events(event_id,order_reference,checkout_transaction_id,event_type,outcome) values(p_event_id,sess.order_reference,p_transaction_id,p_event_type,outcome);
 return outcome;
end $$;
revoke all on function public.shop_credit_direct_begin(text,text),public.shop_credit_direct_link(text,text,text),public.shop_credit_direct_event(text,text,text,text,bigint,text[]) from public,anon,authenticated;
grant execute on function public.shop_credit_direct_begin(text,text),public.shop_credit_direct_link(text,text,text),public.shop_credit_direct_event(text,text,text,text,bigint,text[]) to service_role;
commit;
