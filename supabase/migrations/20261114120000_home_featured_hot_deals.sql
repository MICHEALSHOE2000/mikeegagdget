-- Additive only: homepage featured products setting and a four-item Hot Deals publish guard.
-- Does not change products, prices, orders or the existing shop_publish_deals function.
-- Rollback: supabase/home-featured-hot-deals-rollback.sql
begin;
create table public.shop_home_settings (
 id text primary key check(id='store'), featured_slugs text[] not null default '{}',
 revision integer not null default 0, updated_at timestamptz not null default now(),
 check(cardinality(featured_slugs)<=8)
);
insert into public.shop_home_settings(id) values('store');
alter table public.shop_home_settings enable row level security;
revoke all on public.shop_home_settings from public,anon,authenticated;
grant select,update on public.shop_home_settings to service_role;
create function public.shop_publish_home(p_actor uuid,p_slugs text[],p_revision integer) returns jsonb
language plpgsql security invoker set search_path=public as $$
declare previous shop_home_settings%rowtype; saved shop_home_settings%rowtype; candidate text;
begin
 if not exists(select 1 from auth.users u join shop_admins a on a.user_id=u.id where u.id=p_actor and lower(u.email)='aderintomicheal6@gmail.com' and u.email_confirmed_at is not null) then raise exception 'Administrator access required';end if;
 select * into previous from shop_home_settings where id='store' for update;
 if p_revision is distinct from previous.revision then raise exception 'Featured products changed; reload before publishing';end if;
 if p_slugs is null or cardinality(p_slugs)>8 or array_position(p_slugs,null) is not null or cardinality(p_slugs)<>(select count(distinct s) from unnest(p_slugs) s) then raise exception 'Select up to eight unique products';end if;
 foreach candidate in array p_slugs loop
  if not exists(select 1 from checkout_inventory where product_data->>'slug'=candidate) then raise exception 'Product must exist in the catalogue';end if;
 end loop;
 update shop_home_settings set featured_slugs=p_slugs,revision=revision+1,updated_at=clock_timestamp() where id='store' returning * into saved;
 insert into shop_admin_audit(actor_id,sku,previous_value,new_value) values(p_actor,'@home-featured',to_jsonb(previous),to_jsonb(saved));
 return jsonb_build_object('slugs',saved.featured_slugs,'revision',saved.revision);
end $$;
create function public.shop_publish_hot_deals(p_actor uuid,p_skus text[],p_revision integer) returns jsonb
language plpgsql security invoker set search_path=public as $$
begin
 if p_skus is not null and cardinality(p_skus)>4 then raise exception 'Select up to four unique variants';end if;
 return shop_publish_deals(p_actor,p_skus,p_revision);
end $$;
revoke all on function public.shop_publish_home(uuid,text[],integer),public.shop_publish_hot_deals(uuid,text[],integer) from public,anon,authenticated;
grant execute on function public.shop_publish_home(uuid,text[],integer),public.shop_publish_hot_deals(uuid,text[],integer) to service_role;
commit;
