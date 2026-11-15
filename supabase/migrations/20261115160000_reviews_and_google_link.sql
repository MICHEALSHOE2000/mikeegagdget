-- ADDITIVE ONLY. Not applied automatically: review, then apply with owner approval.
-- Real customer testimonials entered by an administrator, plus a link to the business's Google reviews.
begin;
create table if not exists public.shop_reviews(
 id uuid primary key default gen_random_uuid(),
 display_name text not null check(char_length(display_name) between 1 and 80),
 body text not null check(char_length(body) between 1 and 1200),
 rating smallint check(rating between 1 and 5),          -- only a rating the customer actually gave; may be null
 review_date date,
 product_slug text check(product_slug is null or product_slug ~ '^[a-z0-9-]{1,120}$'),
 photo_url text check(photo_url is null or char_length(photo_url)<=2000),
 photo_consent boolean not null default false,            -- a photo is shown only with the customer's permission
 evidence text not null default '' check(char_length(evidence)<=500),  -- internal verification note; never public
 order_reference text check(order_reference is null or order_reference ~ '^MGP2-[a-f0-9]{32}$'),
 published boolean not null default false,
 created_by uuid,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists shop_reviews_published_idx on public.shop_reviews(published,created_at desc);
-- No policies: like the other shop tables, only the server (service role) can read or write.
alter table public.shop_reviews enable row level security;
revoke all on public.shop_reviews from anon, authenticated;
alter table public.shop_settings add column if not exists google_reviews_url text not null default '';
commit;
