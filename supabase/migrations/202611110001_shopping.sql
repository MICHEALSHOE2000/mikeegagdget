-- Review and test on an isolated database first. Additive: preserve legacy orders.
begin;
alter table public.checkout_inventory add column if not exists product_data jsonb not null default '{}';
-- Existing constraints still reject nonpositive prices; NULL means not yet priced.
alter table public.checkout_inventory alter column price_ngn drop not null;
create table public.shop_orders (
 id uuid primary key default gen_random_uuid(), request_id uuid not null unique,
 reference text not null unique default ('MGP2-'||replace(gen_random_uuid()::text,'-','')),
 customer jsonb not null, requested_items jsonb not null, amount_ngn bigint not null default 0 check(amount_ngn>=0),
 delivery_fee_ngn bigint not null default 0 check(delivery_fee_ngn>=0),
 status text not null default 'awaiting_payment' check(status in ('awaiting_payment','paid','manual_review')),
 policy_version text not null, consent_at timestamptz not null default now(),
 authorization_url text, payment_transaction_id text unique,
 created_at timestamptz not null default now(), paid_at timestamptz
);
create table public.shop_order_items (
 id bigint generated always as identity primary key, order_id uuid not null references public.shop_orders(id),
 sku text not null references public.checkout_inventory(sku), quantity integer not null check(quantity between 1 and 20),
 unit_price_ngn bigint not null check(unit_price_ngn>0), selected_color text not null default '', product_snapshot jsonb not null
);
create index shop_order_items_order on public.shop_order_items(order_id);
create index shop_orders_created on public.shop_orders(created_at desc);
create table public.shop_payment_events(reference text primary key references public.shop_orders(reference),transaction_id text not null unique,amount_kobo bigint not null,processed_at timestamptz not null default now());
alter table public.shop_orders enable row level security;
alter table public.shop_order_items enable row level security;
alter table public.shop_payment_events enable row level security;
revoke all on public.shop_orders,public.shop_order_items,public.shop_payment_events from public,anon,authenticated;
grant all on public.shop_orders,public.shop_order_items,public.shop_payment_events to service_role;
grant usage,select on sequence public.shop_order_items_id_seq to service_role;

create function public.shop_create_order(p_request_id uuid,p_items jsonb,p_customer jsonb,p_policy text) returns jsonb
language plpgsql security invoker set search_path=public as $$
declare ord shop_orders%rowtype; inv checkout_inventory%rowtype; item jsonb; qty integer; total bigint:=0; chosen text;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 select * into ord from shop_orders where request_id=p_request_id;
 if found then
  if ord.customer<>p_customer or ord.requested_items<>p_items then raise exception 'Checkout request already used';end if;
  return jsonb_build_object('reference',ord.reference,'amount_ngn',ord.amount_ngn,'authorization_url',ord.authorization_url,'status',ord.status);
 end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 30 then raise exception 'Invalid cart';end if;
 if coalesce(p_customer->>'email','')='' or p_policy<>'2026-11-11' then raise exception 'Invalid checkout';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_customer->>'email',1));
 if (select count(*) from shop_orders where customer->>'email'=p_customer->>'email' and created_at>now()-interval '15 minutes')>=5 then raise exception 'Too many payment attempts';end if;
 insert into shop_orders(request_id,requested_items,customer,policy_version) values(p_request_id,p_items,p_customer,p_policy) returning * into ord;
 for item in select value from jsonb_array_elements(p_items) loop
  select * into inv from checkout_inventory where sku=item->>'sku' for share;
  if not found or not inv.enabled or inv.price_ngn is null or inv.price_ngn<=0 then raise exception 'Variant is not ready for payment';end if;
  qty=(item->>'quantity')::integer; if qty not between 1 and 20 then raise exception 'Invalid quantity';end if;
  chosen=coalesce(item->>'color','');
  if jsonb_array_length(coalesce(inv.product_data->'colors','[]'))>0 and not (inv.product_data->'colors' ? chosen) then raise exception 'Select a valid colour';end if;
  if jsonb_array_length(coalesce(inv.product_data->'colors','[]'))=0 and chosen<>'' then raise exception 'Unknown colour';end if;
  total=total+inv.price_ngn*qty;
  insert into shop_order_items(order_id,sku,quantity,unit_price_ngn,selected_color,product_snapshot) values(ord.id,inv.sku,qty,inv.price_ngn,chosen,inv.product_data);
 end loop;
 if total<=0 or total>9000000000 then raise exception 'Order total out of range';end if;
 update shop_orders set amount_ngn=total where id=ord.id;
 return jsonb_build_object('reference',ord.reference,'amount_ngn',total,'status',ord.status);
end $$;
create function public.shop_confirm_payment(p_reference text,p_kobo bigint,p_transaction_id text) returns text
language plpgsql security invoker set search_path=public as $$
declare ord shop_orders%rowtype;
begin
 select * into ord from shop_orders where reference=p_reference for update;
 if not found then raise exception 'Unknown order';end if;
 if ord.status='paid' then return 'paid';end if;
 if p_kobo<>ord.amount_ngn*100 then update shop_orders set status='manual_review' where id=ord.id;return 'manual_review';end if;
 insert into shop_payment_events(reference,transaction_id,amount_kobo) values(p_reference,p_transaction_id,p_kobo);
 update shop_orders set status='paid',paid_at=now(),payment_transaction_id=p_transaction_id where id=ord.id;
 return 'paid';
end $$;
revoke all on function public.shop_create_order(uuid,jsonb,jsonb,text),public.shop_confirm_payment(text,bigint,text) from public,anon,authenticated;
grant execute on function public.shop_create_order(uuid,jsonb,jsonb,text),public.shop_confirm_payment(text,bigint,text) to service_role;
commit;
