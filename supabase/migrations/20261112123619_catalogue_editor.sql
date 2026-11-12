-- Apply only with the approved release. No existing orders or IDs are changed.
begin;
create or replace function public.shop_admin_update_product(p_actor uuid,p_sku text,p_price bigint,p_enabled boolean,p_updated_at timestamptz,p_data jsonb) returns jsonb
language plpgsql security invoker set search_path=public as $$
declare old checkout_inventory%rowtype; saved checkout_inventory%rowtype;
begin
 if not exists(select 1 from auth.users where id=p_actor and exists(select 1 from public.shop_admins a where a.user_id=p_actor) and lower(email)='aderintomicheal6@gmail.com' and email_confirmed_at is not null) then raise exception 'Administrator access required';end if;
 if p_price<=0 or p_price>100000000 or (p_enabled and p_price is null) then raise exception 'Invalid price';end if;
 select * into old from checkout_inventory where sku=p_sku for update;
 if not found or old.updated_at is distinct from p_updated_at then raise exception 'Inventory changed; reload before editing';end if;
 if p_data->>'slug' is distinct from old.product_data->>'slug' or p_data->>'sku' is distinct from old.product_data->>'sku' or p_data->>'storage' is distinct from old.product_data->>'storage' then raise exception 'SKU identity is immutable';end if;
 if p_data->>'slug' like 'iphone-%' and (case when p_data->>'slug' like 'iphone-18-%' then p_data->>'condition' not in ('Brand New','UK Used') else p_data->>'condition' <> 'UK Used' end) then raise exception 'Invalid iPhone condition';end if;
 if p_enabled and coalesce((p_data->>'reviewRequired')::boolean,false) then raise exception 'Resolve catalogue review before enabling';end if;
 update checkout_inventory set price_ngn=p_price,enabled=p_enabled,product_data=p_data,updated_at=clock_timestamp() where sku=p_sku returning * into saved;
 insert into shop_admin_audit(actor_id,sku,previous_value,new_value) values(p_actor,p_sku,to_jsonb(old),to_jsonb(saved));
 return to_jsonb(saved);
end $$;
revoke all on function public.shop_admin_update_product(uuid,text,bigint,boolean,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.shop_admin_update_product(uuid,text,bigint,boolean,timestamptz,jsonb) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('catalogue-images','catalogue-images',true,2000000,array['image/webp']) on conflict(id) do nothing;
-- No client upload policy: uploads require the authenticated server admin endpoint.
commit;
