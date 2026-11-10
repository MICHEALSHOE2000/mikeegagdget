-- Additive retail upgrade. Existing paid orders and references are preserved.
alter table public.checkout_inventory alter column price_ngn drop not null;
alter table public.checkout_inventory add column if not exists product_data jsonb not null default '{}';
alter table public.checkout_inventory add column if not exists supplier_status text not null default 'unverified' check (supplier_status in ('unverified','confirmed','unavailable'));
alter table public.checkout_inventory add column if not exists last_verified_at timestamptz;
alter table public.supplier_orders alter column listed_price_ngn drop not null;
alter table public.supplier_orders add column if not exists request_id uuid unique;
alter table public.supplier_orders add column if not exists method text not null default 'buy' check(method in ('buy','finance'));
alter table public.supplier_orders add column if not exists fulfillment text not null default 'pickup' check(fulfillment in ('pickup','delivery'));
alter table public.supplier_orders add column if not exists delivery_address text;
alter table public.supplier_orders add column if not exists delivery_fee_ngn bigint check(delivery_fee_ngn>=0);
alter table public.supplier_orders add column if not exists selected_colour text;
alter table public.supplier_orders add column if not exists selected_condition text;
alter table public.supplier_orders add column if not exists supplier_verified_at timestamptz;
alter table public.supplier_orders add column if not exists warranty_terms text;
alter table public.supplier_orders add column if not exists return_terms text;
alter table public.supplier_orders add column if not exists authorization_url text;
alter table public.supplier_orders add column if not exists finance_status text not null default 'not_requested' check(finance_status in ('not_requested','requested','link_ready','declined','approved'));
alter table public.supplier_orders add column if not exists finance_url text;
alter table public.supplier_orders drop constraint if exists supplier_orders_status_check;
alter table public.supplier_orders add constraint supplier_orders_status_check check(status in ('requested','approved','awaiting_payment','paid','expired','declined','manual_review','preparing','ready_for_pickup','dispatched','delivered','cancelled','refunded'));
create table if not exists public.order_status_history(id bigint generated always as identity primary key,order_id uuid not null references public.supplier_orders(id),status text not null,created_at timestamptz not null default now());
create index if not exists order_status_history_order on public.order_status_history(order_id,created_at);
create table if not exists public.order_notifications(id bigint generated always as identity primary key,order_id uuid not null references public.supplier_orders(id),event text not null,status text not null default 'pending' check(status in ('pending','sent','failed')),created_at timestamptz not null default now(),sent_at timestamptz);
alter table public.order_status_history enable row level security;
alter table public.order_notifications enable row level security;
revoke all on public.order_status_history,public.order_notifications from public,anon,authenticated;
grant all on public.order_status_history,public.order_notifications to service_role;
grant usage,select on sequence public.order_status_history_id_seq,public.order_notifications_id_seq to service_role;
create or replace function public.retail_order_event() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if TG_OP='INSERT' or new.status is distinct from old.status or new.finance_status is distinct from old.finance_status then
 insert into public.order_status_history(order_id,status) values(new.id,case when new.method='finance' and new.status='requested' then 'finance_'||new.finance_status else new.status end);
 insert into public.order_notifications(order_id,event) values(new.id,case when new.method='finance' then 'finance_'||new.finance_status else new.status end);
 end if;return new;
end $$;
drop trigger if exists retail_order_event on public.supplier_orders;
create trigger retail_order_event after insert or update on public.supplier_orders for each row execute function public.retail_order_event();
create or replace function public.retail_submit_order(p_request_id uuid,p_sku text,p_name text,p_email text,p_phone text,p_quantity integer,p_method text,p_fulfillment text,p_address text,p_colour text,p_condition text) returns jsonb language plpgsql security invoker set search_path=public as $$
declare inv public.checkout_inventory%rowtype; ord public.supplier_orders%rowtype;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 select * into ord from supplier_orders where request_id=p_request_id;
 if found then
 if ord.customer_email<>p_email or ord.sku<>p_sku or ord.quantity<>p_quantity or ord.method<>p_method then raise exception 'Request already used';end if;
 return jsonb_build_object('token',ord.token,'status',ord.status);end if;
 select * into inv from checkout_inventory where sku=p_sku and enabled;
 if not found then raise exception 'Variant unavailable for order';end if;
 if p_method not in ('buy','finance') or p_fulfillment not in ('pickup','delivery') or p_quantity not between 1 and 20 then raise exception 'Invalid order';end if;
 insert into supplier_orders(request_id,sku,product_name,quantity,listed_price_ngn,customer_name,customer_email,customer_phone,method,fulfillment,delivery_address,delivery_fee_ngn,selected_colour,selected_condition,finance_status)
 values(p_request_id,p_sku,coalesce(inv.product_data->>'label',p_sku),p_quantity,inv.price_ngn,p_name,p_email,p_phone,p_method,p_fulfillment,p_address,case when p_fulfillment='pickup' then 0 else null end,p_colour,p_condition,case when p_method='finance' then 'requested' else 'not_requested' end) returning * into ord;
 return jsonb_build_object('token',ord.token,'status',ord.status);
end $$;
create or replace function public.supplier_begin_payment(p_token uuid,p_reference text)
returns table(order_id uuid,amount_ngn bigint,customer_email text) language plpgsql security invoker set search_path=public as $$
declare ord public.supplier_orders%rowtype;
begin
 select * into ord from supplier_orders where token=p_token for update;
 if not found or ord.method<>'buy' or ord.status not in ('approved','awaiting_payment') or ord.supplier_verified_at is null or ord.quote_expires_at is null or ord.quote_expires_at<=now() or ord.confirmed_price_ngn is null or ord.delivery_fee_ngn is null or coalesce(length(ord.warranty_terms),0)=0 or coalesce(length(ord.return_terms),0)=0 then raise exception 'Quote not confirmed or expired';end if;
 if ord.status='approved' then update supplier_orders set status='awaiting_payment',paystack_reference=p_reference,payment_expires_at=ord.quote_expires_at where id=ord.id;end if;
 return query select ord.id,ord.confirmed_price_ngn*ord.quantity+ord.delivery_fee_ngn,ord.customer_email;
end $$;
create or replace function public.supplier_confirm_payment(p_reference text,p_amount_kobo bigint) returns text language plpgsql security invoker set search_path=public as $$
declare ord public.supplier_orders%rowtype;
begin
 select * into ord from supplier_orders where paystack_reference=p_reference for update;
 if not found then return 'unknown';end if;
 if ord.status in ('paid','preparing','ready_for_pickup','dispatched','delivered','refunded') then return ord.status;end if;
 if ord.status<>'awaiting_payment' or ord.confirmed_price_ngn is null or (ord.confirmed_price_ngn*ord.quantity+coalesce(ord.delivery_fee_ngn,0))*100<>p_amount_kobo then
 update supplier_orders set status='manual_review' where id=ord.id;return 'manual_review';end if;
 -- A genuine delayed payment remains paid; quote expiry must not discard money received.
 update supplier_orders set status='paid',paid_at=now() where id=ord.id;return 'paid';
end $$;
revoke all on function public.retail_order_event() from public,anon,authenticated;
revoke all on function public.retail_submit_order(uuid,text,text,text,text,integer,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.retail_order_event() to service_role;
grant execute on function public.retail_submit_order(uuid,text,text,text,text,integer,text,text,text,text,text) to service_role;
revoke all on function public.supplier_begin_payment(uuid,text),public.supplier_confirm_payment(text,bigint) from public,anon,authenticated;
grant execute on function public.supplier_begin_payment(uuid,text),public.supplier_confirm_payment(text,bigint) to service_role;
