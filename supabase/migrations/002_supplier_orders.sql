-- Supplier-backed order requests. Run after 001_checkout.sql.
create table if not exists public.supplier_orders (
 id uuid primary key default gen_random_uuid(),
 token uuid not null unique default gen_random_uuid(),
 sku text not null references public.checkout_inventory(sku),
 product_name text not null,
 quantity integer not null check(quantity between 1 and 20),
 listed_price_ngn bigint not null check(listed_price_ngn > 0),
 confirmed_price_ngn bigint check(confirmed_price_ngn > 0),
 customer_name text not null,
 customer_email text not null,
 customer_phone text not null,
 status text not null default 'requested'
   check(status in ('requested','approved','awaiting_payment','paid','expired','declined','manual_review')),
 paystack_reference text unique,
 quote_expires_at timestamptz,
 payment_expires_at timestamptz,
 created_at timestamptz not null default now(),
 paid_at timestamptz,
 constraint approved_price_required check(status not in ('approved','awaiting_payment','paid') or confirmed_price_ngn is not null)
);
create index if not exists supplier_orders_status_created on public.supplier_orders(status,created_at);
alter table public.supplier_orders enable row level security;
revoke all on public.supplier_orders from public,anon,authenticated;
-- All writes are performed by server-side service_role only. Approval is a manual
-- operation via Supabase Table Editor until the secured admin dashboard is built.
create or replace function public.supplier_begin_payment(p_token uuid,p_reference text)
returns table(order_id uuid, amount_ngn bigint, customer_email text)
language plpgsql security definer set search_path=public as $$
declare ord public.supplier_orders%rowtype;
begin
 select * into ord from public.supplier_orders where token=p_token for update;
 if not found or ord.status<>'approved' or ord.quote_expires_at<=now() then
   raise exception 'This quotation is not ready for payment';
 end if;
 update public.supplier_orders
  set status='awaiting_payment',paystack_reference=p_reference,
      payment_expires_at=now()+interval '15 minutes'
  where id=ord.id;
 return query select ord.id,ord.confirmed_price_ngn*ord.quantity,ord.customer_email;
end $$;
create or replace function public.supplier_confirm_payment(p_reference text,p_amount_kobo bigint)
returns text language plpgsql security definer set search_path=public as $$
declare ord public.supplier_orders%rowtype;
begin
 select * into ord from public.supplier_orders where paystack_reference=p_reference for update;
 if not found then return 'unknown'; end if;
 if ord.status='paid' then return 'paid'; end if;
 if ord.status<>'awaiting_payment' or ord.payment_expires_at<now() or
   ord.confirmed_price_ngn*ord.quantity*100<>p_amount_kobo then
   update public.supplier_orders set status='manual_review' where id=ord.id;
   return 'manual_review';
 end if;
 update public.supplier_orders set status='paid',paid_at=now() where id=ord.id;
 return 'paid';
end $$;
revoke all on function public.supplier_begin_payment(uuid,text) from public,anon,authenticated;
revoke all on function public.supplier_confirm_payment(text,bigint) from public,anon,authenticated;
grant execute on function public.supplier_begin_payment(uuid,text) to service_role;
grant execute on function public.supplier_confirm_payment(text,bigint) to service_role;
