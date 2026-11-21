create table public.shop_sales_leads (
 id uuid primary key, created_at timestamptz not null default now(),
 consent_version text not null check (consent_version='sales-v1'),
 enquiry jsonb not null, score integer not null check(score between 0 and 100),
 tier text not null check(tier in ('hot','warm','browsing')),
 status text not null default 'new' check(status in ('new','contacted','won','closed'))
);
create table public.shop_sales_limits (bucket text primary key, used integer not null, expires timestamptz);
alter table public.shop_sales_leads enable row level security;
alter table public.shop_sales_limits enable row level security;
revoke all on public.shop_sales_leads,public.shop_sales_limits from public,anon,authenticated;
grant select,insert,update on public.shop_sales_leads to service_role;
create function public.shop_sales_take(p_bucket text,p_max integer,p_expires timestamptz)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 insert into public.shop_sales_limits as lim values(p_bucket,1,p_expires)
 on conflict(bucket) do update set used=lim.used+1 where lim.used<p_max;
 return found;
end $$;
revoke all on function public.shop_sales_take(text,integer,timestamptz) from public,anon,authenticated;
grant execute on function public.shop_sales_take(text,integer,timestamptz) to service_role;
create extension if not exists pg_cron;
select cron.schedule('mikee-sales-retention','12 * * * *',$job$
 delete from public.shop_sales_leads where created_at <= now()-interval '30 days';
 delete from public.shop_sales_limits where expires <= now();
$job$);
