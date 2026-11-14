-- REVIEW-ONLY MIGRATION: do not apply directly to the live database without approval.
-- Extend administrator-curated featured variants from five to nine.
-- Price eligibility, image verification, admin authorization, audit trail and
-- server-side 10 percent discount remain unchanged.
CREATE OR REPLACE FUNCTION public.shop_publish_deals(p_actor uuid, p_skus text[], p_revision integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare previous shop_deal_settings%rowtype; saved shop_deal_settings%rowtype; candidate text; inv checkout_inventory%rowtype;
begin
 if not exists(select 1 from auth.users u join shop_admins a on a.user_id=u.id where u.id=p_actor and lower(u.email)='aderintomicheal6@gmail.com' and u.email_confirmed_at is not null) then raise exception 'Administrator access required';end if;
 select * into previous from shop_deal_settings where id='store' for update;
 if p_revision is distinct from previous.revision then raise exception 'Deals changed; reload before publishing';end if;
 if p_skus is null or cardinality(p_skus)>9 or array_position(p_skus,null) is not null or cardinality(p_skus)<>(select count(distinct s) from unnest(p_skus) s) then raise exception 'Select up to nine unique variants';end if;
 foreach candidate in array p_skus loop
  select * into inv from checkout_inventory where sku=candidate for share;
  if not found or not inv.enabled or inv.price_ngn is null or inv.price_ngn<=0 or inv.price_ngn>100000000 or coalesce((inv.product_data->>'reviewRequired')::boolean,false) or coalesce(inv.product_data->>'image','')='' or coalesce(inv.product_data->>'slug','')='' then raise exception 'Variant must be available, priced and illustrated';end if;
 end loop;
 update shop_deal_settings set skus=p_skus,revision=revision+1,updated_at=clock_timestamp() where id='store' returning * into saved;
 insert into shop_admin_audit(actor_id,sku,previous_value,new_value) values(p_actor,'@featured-deals',to_jsonb(previous),to_jsonb(saved));
 return jsonb_build_object('skus',saved.skus,'revision',saved.revision);
end $function$
;
