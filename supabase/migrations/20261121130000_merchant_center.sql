-- Google Merchant Center. Additive: one new table for feed status, a record of the availability change, and the
-- owner-confirmed availability on every currently purchasable variant. No table or column is dropped or renamed.

-- 1. Last successful feed generation, shown in admin. Server-only (no public access).
create table if not exists public.shop_merchant_feed_status(
 id text primary key,
 generated_at timestamptz,
 stats jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now()
);
alter table public.shop_merchant_feed_status enable row level security;
revoke all on public.shop_merchant_feed_status from anon, authenticated;

-- 2. Availability uses the existing field product_data.stockStatus (no second source of truth).
--    Owner rule, 21 Nov 2026: every product currently offered can be fulfilled through the supplier network, so
--    each enabled, priced variant that has no availability recorded becomes "in_stock". Variants that already
--    have a status (none today) are left alone. The change is logged so it can be reviewed or reversed.
create table if not exists public.shop_availability_changes(
 id bigint generated always as identity primary key,
 sku text not null,
 previous_status text,
 new_status text not null,
 reason text not null,
 changed_at timestamptz not null default now()
);
alter table public.shop_availability_changes enable row level security;
revoke all on public.shop_availability_changes from anon, authenticated;

with target as (
 select sku from public.checkout_inventory
 where enabled and price_ngn>0 and coalesce(product_data->>'stockStatus','')=''
   and coalesce((product_data->>'reviewRequired')::boolean,false)=false
), logged as (
 insert into public.shop_availability_changes(sku,previous_status,new_status,reason)
 select sku,null,'in_stock','Owner confirmed supplier fulfilment for all currently offered products (21 Nov 2026)' from target
 returning sku
)
update public.checkout_inventory i
   set product_data=i.product_data||jsonb_build_object('stockStatus','in_stock','availabilityConfirmedAt','2026-11-21','availabilitySource','owner-confirmed'),
       updated_at=now()
  from logged where i.sku=logged.sku;
