-- REVIEW ONLY: Credit Direct sandbox integration. DO NOT apply to live without approval.
-- Requires Credit Direct keys, verified webhook signing configuration and sandbox E2E tests.
begin;
alter table public.shop_orders add column if not exists payment_provider text not null default 'paystack';
alter table public.shop_orders drop constraint if exists shop_orders_payment_provider_check;
alter table public.shop_orders add constraint shop_orders_payment_provider_check check (payment_provider in ('paystack','credit_direct'));
create table if not exists public.shop_credit_direct_sessions (
  order_reference text primary key references public.shop_orders(reference) on delete cascade,
  session_id text not null unique,
  checkout_transaction_id text unique,
  client_token_hash text not null,
  customer_email text not null,
  amount_ngn bigint not null check(amount_ngn > 0),
  transaction_json jsonb not null,
  customer_payment_completed_at timestamptz,
  merchant_payment_completed_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.shop_credit_direct_events (
  event_id text primary key,
  checkout_transaction_id text not null,
  event_type text not null,
  received_at timestamptz not null default now()
);
alter table public.shop_credit_direct_sessions enable row level security;
alter table public.shop_credit_direct_events enable row level security;
revoke all on public.shop_credit_direct_sessions, public.shop_credit_direct_events from public, anon, authenticated;
grant select,insert,update on public.shop_credit_direct_sessions to service_role;
grant select,insert on public.shop_credit_direct_events to service_role;

create or replace function public.shop_credit_direct_record_event(
 p_event_id text, p_checkout_transaction_id text, p_event_type text, p_products jsonb
) returns jsonb language plpgsql set search_path to 'public' as $function$
declare sess public.shop_credit_direct_sessions%rowtype;
 expected jsonb; observed jsonb; n integer;
begin
 if p_event_type not in ('Checkout_Customer_Payment_Completed','Checkout_Merchant_Payment_Completed') then
   raise exception 'Unsupported Credit Direct webhook event';
 end if;
 if coalesce(length(p_event_id),0)<5 or coalesce(length(p_checkout_transaction_id),0)<3
    or jsonb_typeof(p_products) <> 'array' then raise exception 'Invalid provider transaction'; end if;
 select * into sess from public.shop_credit_direct_sessions
   where checkout_transaction_id=p_checkout_transaction_id for update;
 if not found then raise exception 'Unmatched provider transaction; manual reconciliation required'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('sku',p->>'productId','amount',(p->>'productAmount')::bigint)
       order by p->>'productId',(p->>'productAmount')::bigint),'[]'::jsonb) into expected
   from jsonb_array_elements(sess.transaction_json->'products') p;
 select coalesce(jsonb_agg(jsonb_build_object('sku',p->>'productId','amount',(p->>'productAmount')::bigint)
       order by p->>'productId',(p->>'productAmount')::bigint),'[]'::jsonb) into observed
   from jsonb_array_elements(p_products) p;
 if observed <> expected then raise exception 'Provider products or amounts do not match the order'; end if;
 if (select coalesce(sum((p->>'productAmount')::bigint),0) from jsonb_array_elements(p_products) p)<>sess.amount_ngn
   then raise exception 'Provider amount does not match the order';end if;
 insert into public.shop_credit_direct_events(event_id,checkout_transaction_id,event_type)
 values(p_event_id,p_checkout_transaction_id,p_event_type)
 on conflict(event_id) do nothing;
 get diagnostics n = row_count;
 if n=0 then return jsonb_build_object('status','duplicate'); end if;
 if p_event_type='Checkout_Customer_Payment_Completed' then
  update public.shop_credit_direct_sessions set customer_payment_completed_at=coalesce(customer_payment_completed_at,now())
   where order_reference=sess.order_reference;
  return jsonb_build_object('status','awaiting_merchant_payment');
 end if;
 update public.shop_credit_direct_sessions set merchant_payment_completed_at=coalesce(merchant_payment_completed_at,now())
   where order_reference=sess.order_reference;
 update public.shop_orders set status='paid',paid_at=coalesce(paid_at,now()),
   payment_transaction_id=coalesce(payment_transaction_id,p_checkout_transaction_id)
 where reference=sess.order_reference and payment_provider='credit_direct'
   and status in ('awaiting_payment','paid');
 if not found then raise exception 'Order cannot be confirmed without manual review';end if;
 return jsonb_build_object('status','merchant_paid');
end
$function$;
revoke all on function public.shop_credit_direct_record_event(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.shop_credit_direct_record_event(text,text,text,jsonb) to service_role;
commit;
