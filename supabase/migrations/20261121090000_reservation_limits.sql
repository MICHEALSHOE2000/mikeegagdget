-- Abuse limits for "Reserve Now, Pay at Pickup" and tighter grants on old backup tables. Additive: replaces one
-- function with the same behaviour plus two limits; revokes read access that anonymous users never needed.
create or replace function public.shop_create_order_v3(p_request_id uuid, p_items jsonb, p_customer jsonb, p_policy text) returns jsonb language plpgsql set search_path to 'public' as $f$
declare existing shop_orders%rowtype; ord shop_orders%rowtype; created jsonb; q jsonb; method text:=p_customer->>'deliveryMethod'; reserve boolean:=coalesce(p_customer->>'paymentChoice','')='pay_at_pickup'; pick date; ref text; tries int:=0; today date:=(now() at time zone 'Africa/Lagos')::date;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 select * into existing from shop_orders where request_id=p_request_id;
 if found then
  if existing.customer<>p_customer or existing.requested_items<>p_items then raise exception 'Checkout request already used';end if;
  return jsonb_build_object('reference',existing.reference,'amount_ngn',existing.amount_ngn,'delivery_fee_ngn',existing.delivery_fee_ngn,'authorization_url',existing.authorization_url,'status',existing.status,'reservation_ref',existing.reservation_ref);
 end if;
 if method is null or method not in ('lagos_delivery','interstate_park','store_pickup') then raise exception 'Choose a delivery option';end if;
 if reserve and method<>'store_pickup' then raise exception 'Reserve Now, Pay at Pickup is only for store pickup';end if;
 if reserve then
  -- Reservations need no payment, so limit them: at most 3 open reservations per phone number or email,
  -- and at most 60 new reservation requests an hour across the store.
  if (select count(*) from shop_orders o where o.reservation_status in ('pending_confirmation','confirmed_awaiting_pickup','ready_for_pickup')
      and (o.customer->>'phone'=p_customer->>'phone' or lower(o.customer->>'email')=lower(p_customer->>'email')))>=3 then
   raise exception 'You already have 3 open reservations. Please collect or cancel one first, or contact us on WhatsApp';end if;
  if (select count(*) from shop_orders o where o.reservation_status is not null and o.created_at>now()-interval '1 hour')>=60 then
   raise exception 'We are receiving a lot of reservations right now. Please try again shortly or contact us on WhatsApp';end if;
  begin pick:=(p_customer->>'pickupDate')::date;exception when others then raise exception 'Choose a pickup date';end;
  if pick is null or pick<today or pick>today+14 then raise exception 'Choose a pickup date within the next 14 days';end if;
 end if;
 q:=shop_delivery_quote(method,p_customer->>'state',p_customer->>'lga');
 created:=shop_create_order_deals(p_request_id,p_items,p_customer,p_policy);
 select * into ord from shop_orders where reference=created->>'reference' for update;
 update shop_orders set delivery_method=method,delivery_fee_ngn=(q->>'fee')::bigint,amount_ngn=amount_ngn+(q->>'fee')::bigint,payment_collection=case when reserve then 'at_store' else 'online' end where id=ord.id;
 if reserve then
  loop
   ref:='RSV-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));tries:=tries+1;
   exit when not exists(select 1 from shop_orders where reservation_ref=ref) or tries>5;
  end loop;
  update shop_orders set payment_provider='pay_at_store',status='unpaid',reservation_status='pending_confirmation',reservation_ref=ref,pickup_date=pick where id=ord.id;
 end if;
 select * into ord from shop_orders where id=ord.id;
 return jsonb_build_object('reference',ord.reference,'amount_ngn',ord.amount_ngn,'delivery_fee_ngn',ord.delivery_fee_ngn,'status',ord.status,'reservation_ref',ord.reservation_ref);
end $f$;
revoke all on function public.shop_create_order_v3(uuid,jsonb,jsonb,text) from public, anon, authenticated;
create index if not exists shop_orders_open_reservation_idx on public.shop_orders(reservation_status,created_at) where reservation_status is not null;
-- Backup tables hold catalogue prices only. RLS already hides their rows; remove the unneeded grants too.
do $$ declare t text; begin
 foreach t in array array['checkout_inventory_backup_followup_20261116','checkout_inventory_backup_prices_20261116','shop_deal_settings_backup_20261116'] loop
  if to_regclass('public.'||t) is not null then execute format('revoke all on public.%I from anon, authenticated',t);end if;
 end loop;
end $$;
