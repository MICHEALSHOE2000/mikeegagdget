begin;
create table public.shop_deal_settings (
 id text primary key check(id='store'), skus text[] not null default '{}',
 revision integer not null default 0, owner_provisioned boolean not null default false, updated_at timestamptz not null default now(),
 check(cardinality(skus)<=5)
);
insert into public.shop_deal_settings(id) values('store');
alter table public.shop_deal_settings enable row level security;
revoke all on public.shop_deal_settings from public,anon,authenticated;
grant select,update on public.shop_deal_settings to service_role;
create function public.shop_deal_catalogue() returns table(sku text,price_ngn bigint,enabled boolean,product_data jsonb,deal_position integer)
language sql stable security invoker set search_path=public as $$
 select i.sku,i.price_ngn::bigint,i.enabled,i.product_data,array_position(d.skus,i.sku)
 from checkout_inventory i cross join shop_deal_settings d where d.id='store';
$$;
create function public.shop_publish_deals(p_actor uuid,p_skus text[],p_revision integer) returns jsonb
language plpgsql security invoker set search_path=public as $$
declare previous shop_deal_settings%rowtype; saved shop_deal_settings%rowtype; candidate text; inv checkout_inventory%rowtype;
begin
 if not exists(select 1 from auth.users u join shop_admins a on a.user_id=u.id where u.id=p_actor and lower(u.email)='aderintomicheal6@gmail.com' and u.email_confirmed_at is not null) then raise exception 'Administrator access required';end if;
 select * into previous from shop_deal_settings where id='store' for update;
 if p_revision is distinct from previous.revision then raise exception 'Deals changed; reload before publishing';end if;
 if p_skus is null or cardinality(p_skus)>5 or array_position(p_skus,null) is not null or cardinality(p_skus)<>(select count(distinct s) from unnest(p_skus) s) then raise exception 'Select up to five unique variants';end if;
 foreach candidate in array p_skus loop
  select * into inv from checkout_inventory where sku=candidate for share;
  if not found or not inv.enabled or inv.price_ngn is null or inv.price_ngn<=0 or inv.price_ngn>100000000 or coalesce((inv.product_data->>'reviewRequired')::boolean,false) or coalesce(inv.product_data->>'image','')='' or coalesce(inv.product_data->>'slug','')='' then raise exception 'Variant must be available, priced and illustrated';end if;
 end loop;
 update shop_deal_settings set skus=p_skus,revision=revision+1,updated_at=clock_timestamp() where id='store' returning * into saved;
 insert into shop_admin_audit(actor_id,sku,previous_value,new_value) values(p_actor,'@featured-deals',to_jsonb(previous),to_jsonb(saved));
 return jsonb_build_object('skus',saved.skus,'revision',saved.revision);
end $$;
create function public.shop_create_order_deals(p_request_id uuid,p_items jsonb,p_customer jsonb,p_policy text) returns jsonb
language plpgsql security invoker set search_path=public as $$
declare ord shop_orders%rowtype; inv checkout_inventory%rowtype; item jsonb; qty integer; total bigint:=0; chosen text; featured text[]; unit_price bigint;
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
 select skus into featured from shop_deal_settings where id='store' for share;
 insert into shop_orders(request_id,requested_items,customer,policy_version) values(p_request_id,p_items,p_customer,p_policy) returning * into ord;
 for item in select value from jsonb_array_elements(p_items) loop
  select * into inv from checkout_inventory where sku=item->>'sku' for share;
  if not found or not inv.enabled or inv.price_ngn is null or inv.price_ngn<=0 or coalesce((inv.product_data->>'reviewRequired')::boolean,false) then raise exception 'Variant is not ready for payment';end if;
  qty=(item->>'quantity')::integer; if qty not between 1 and 20 then raise exception 'Invalid quantity';end if;
  chosen=coalesce(item->>'color','');
  if jsonb_array_length(coalesce(inv.product_data->'colors','[]'))>0 and not (inv.product_data->'colors' ? chosen) then raise exception 'Select a valid colour';end if;
  if jsonb_array_length(coalesce(inv.product_data->'colors','[]'))=0 and chosen<>'' then raise exception 'Unknown colour';end if;
  unit_price=case when inv.sku=any(featured) then round(inv.price_ngn::numeric*0.90)::bigint else inv.price_ngn end;
  total=total+unit_price*qty;
  insert into shop_order_items(order_id,sku,quantity,unit_price_ngn,selected_color,product_snapshot) values(ord.id,inv.sku,qty,unit_price,chosen,inv.product_data||jsonb_build_object('originalPrice',inv.price_ngn,'price',unit_price,'deal',inv.sku=any(featured),'discountPercent',case when inv.sku=any(featured) then 10 else 0 end));
 end loop;
 if total<=0 or total>9000000000 then raise exception 'Order total out of range';end if;
 update shop_orders set amount_ngn=total where id=ord.id;
 return jsonb_build_object('reference',ord.reference,'amount_ngn',total,'status',ord.status);
end $$;
revoke all on function public.shop_deal_catalogue(),public.shop_publish_deals(uuid,text[],integer),public.shop_create_order_deals(uuid,jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.shop_deal_catalogue(),public.shop_publish_deals(uuid,text[],integer),public.shop_create_order_deals(uuid,jsonb,jsonb,text) to service_role;
create function public.shop_provision_owner(p_user uuid) returns void
language plpgsql security invoker set search_path=public as $$
begin
 perform 1 from shop_deal_settings where id='store' and not owner_provisioned for update;
 if not found or not exists(select 1 from auth.users where id=p_user and lower(email)='aderintomicheal6@gmail.com' and email_confirmed_at is not null and not coalesce(is_anonymous,false)) then raise exception 'Administrator role has not been assigned';end if;
 insert into shop_admins(user_id) values(p_user) on conflict do nothing;
 update shop_deal_settings set owner_provisioned=true where id='store';
end $$;
grant insert on public.shop_admins to service_role;
revoke all on function public.shop_provision_owner(uuid) from public,anon,authenticated;
grant execute on function public.shop_provision_owner(uuid) to service_role;
commit;
