-- Run in Supabase SQL editor. Keep this schema private from anon clients.
create extension if not exists pgcrypto;
create table if not exists public.checkout_inventory (
  sku text primary key,
  price_ngn bigint not null check(price_ngn > 0),
  stock integer not null default 0 check(stock >= 0),
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
create table if not exists public.checkout_orders (
  id uuid primary key default gen_random_uuid(),
  sku text not null references public.checkout_inventory(sku),
  product_name text not null,
  quantity integer not null check(quantity between 1 and 20),
  unit_price_ngn bigint not null,
  amount_ngn bigint not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  fulfillment text not null default 'pickup' check(fulfillment = 'pickup'),
  status text not null default 'awaiting_payment' check(status in ('awaiting_payment','paid','expired','manual_review')),
  payment_reference text not null unique,
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists checkout_orders_sku_pending_idx on public.checkout_orders(sku, status, expires_at);
alter table public.checkout_inventory enable row level security;
alter table public.checkout_orders enable row level security;
revoke all on public.checkout_inventory, public.checkout_orders from anon, authenticated;
-- Execute these RPCs using ONLY the server-side service role key.
create or replace function public.checkout_reserve(
  p_sku text, p_name text, p_quantity integer,
  p_customer_name text, p_customer_email text, p_customer_phone text,
  p_reference text
) returns table(order_id uuid, amount_ngn bigint)
language plpgsql security definer set search_path = public
as $$
declare item public.checkout_inventory%rowtype; reserved integer; new_id uuid;
begin
  if p_quantity not between 1 and 20 then raise exception 'Invalid quantity'; end if;
  select * into item from public.checkout_inventory where sku=p_sku for update;
  if not found or not item.enabled then raise exception 'Item unavailable'; end if;
  select coalesce(sum(quantity),0)::integer into reserved
  from public.checkout_orders where sku=p_sku and status='awaiting_payment' and expires_at>now();
  if item.stock - reserved < p_quantity then raise exception 'Insufficient stock'; end if;
  insert into public.checkout_orders
    (sku,product_name,quantity,unit_price_ngn,amount_ngn,customer_name,customer_email,customer_phone,payment_reference)
  values (p_sku,p_name,p_quantity,item.price_ngn,item.price_ngn*p_quantity,p_customer_name,p_customer_email,p_customer_phone,p_reference)
  returning id into new_id;
  return query select new_id, item.price_ngn*p_quantity;
end $$;
create or replace function public.checkout_confirm(p_reference text, p_paid_kobo bigint)
returns text language plpgsql security definer set search_path = public as $$
declare ord public.checkout_orders%rowtype; item public.checkout_inventory%rowtype;
begin
  select * into ord from public.checkout_orders where payment_reference=p_reference for update;
  if not found then return 'unknown_reference'; end if;
  if ord.status='paid' then return 'paid'; end if;
  if ord.status<>'awaiting_payment' or ord.expires_at<now() or ord.amount_ngn*100<>p_paid_kobo then
    update public.checkout_orders set status='manual_review' where id=ord.id;
    return 'manual_review';
  end if;
  select * into item from public.checkout_inventory where sku=ord.sku for update;
  if item.stock<ord.quantity then
    update public.checkout_orders set status='manual_review' where id=ord.id;
    return 'manual_review';
  end if;
  update public.checkout_inventory set stock=stock-ord.quantity, updated_at=now() where sku=ord.sku;
  update public.checkout_orders set status='paid',paid_at=now() where id=ord.id;
  return 'paid';
end $$;
revoke all on function public.checkout_reserve(text,text,integer,text,text,text,text) from public,anon,authenticated;
revoke all on function public.checkout_confirm(text,bigint) from public,anon,authenticated;
grant execute on function public.checkout_reserve(text,text,integer,text,text,text,text) to service_role;
grant execute on function public.checkout_confirm(text,bigint) to service_role;
-- Populate checkout_inventory manually with EXACT SKU IDs and verified prices/stock.
-- Example (do not assume this item is actually in stock):
-- insert into public.checkout_inventory(sku,price_ngn,stock,enabled)
-- values ('iphone-13|128GB', 400000, 1, true);
