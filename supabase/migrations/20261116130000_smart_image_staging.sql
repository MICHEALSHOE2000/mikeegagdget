-- ADDITIVE ONLY. Not applied automatically: review, then apply with the owner's approval.
-- Smart Image Upload: a PRIVATE staging bucket and a review table. Nothing here is visible to customers;
-- a photo becomes public only when an administrator approves it (copied to the existing public bucket).
begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('product-staging','product-staging',false,3000000,array['image/webp'])
on conflict (id) do nothing;
create table if not exists public.shop_image_uploads(
 id uuid primary key default gen_random_uuid(),
 sha256 text not null unique check(sha256 ~ '^[a-f0-9]{64}$'),      -- original file fingerprint: blocks exact duplicates
 image_sha256 text not null check(image_sha256 ~ '^[a-f0-9]{64}$'),
 phash text not null check(phash ~ '^[a-f0-9]{16}$'),                -- perceptual hash: near-duplicate warnings
 filename text not null default '',
 staging_path text not null,
 thumb_path text not null,
 width integer, height integer, bytes integer,
 status text not null default 'staged' check(status in ('staged','approved','rejected','deleted')),
 suggested_slug text, suggested_color text, suggested_storage text,
 confidence smallint not null default 0 check(confidence between 0 and 100),
 reasons jsonb not null default '[]',
 assigned_slug text, assigned_color text, assigned_skus text[] not null default '{}',
 public_url text, source text, licence text,
 created_by uuid, created_at timestamptz not null default now(),
 reviewed_by uuid, reviewed_at timestamptz
);
create index if not exists shop_image_uploads_status_idx on public.shop_image_uploads(status,created_at desc);
create index if not exists shop_image_uploads_slug_idx on public.shop_image_uploads(suggested_slug);
-- No policies: only the server (service role) can read or write, like the other shop tables.
alter table public.shop_image_uploads enable row level security;
revoke all on public.shop_image_uploads from anon, authenticated;
commit;
