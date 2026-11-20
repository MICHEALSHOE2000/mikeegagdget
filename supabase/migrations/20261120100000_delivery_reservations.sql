-- Delivery prices, store pickup and "Reserve Now, Pay at Pickup". Additive: new tables, new columns, widened checks,
-- new functions. Existing orders, columns and data are untouched (new columns are nullable).
begin;
-- 1) Delivery prices, editable in Admin.
create table if not exists public.shop_delivery_rates(
 id text primary key,
 scope text not null check(scope in ('lagos_lga','state')),
 area text not null,
 label text not null default '',
 fee_ngn bigint check(fee_ngn is null or fee_ngn between 0 and 1000000),
 enabled boolean not null default true,
 updated_at timestamptz not null default now(),
 updated_by uuid,
 unique(scope,area),
 check(not enabled or fee_ngn is not null)
);
alter table public.shop_delivery_rates enable row level security;
revoke all on public.shop_delivery_rates from anon, authenticated;
insert into public.shop_delivery_rates(id,scope,area,label,fee_ngn,enabled) values
 ('lagos_lga:Agege','lagos_lga','Agege','Agege',5000,true),
 ('lagos_lga:Ajeromi-Ifelodun (Ajegunle)','lagos_lga','Ajeromi-Ifelodun (Ajegunle)','Ajeromi-Ifelodun (Ajegunle)',5000,true),
 ('lagos_lga:Alimosho','lagos_lga','Alimosho','Alimosho',5000,true),
 ('lagos_lga:Amuwo-Odofin','lagos_lga','Amuwo-Odofin','Amuwo-Odofin',5000,true),
 ('lagos_lga:Apapa','lagos_lga','Apapa','Apapa',10000,true),
 ('lagos_lga:Badagry','lagos_lga','Badagry','Badagry',10000,true),
 ('lagos_lga:Epe','lagos_lga','Epe','Epe',10000,true),
 ('lagos_lga:Eti-Osa','lagos_lga','Eti-Osa','Eti-Osa',10000,true),
 ('lagos_lga:Ibeju-Lekki','lagos_lga','Ibeju-Lekki','Ibeju-Lekki',10000,true),
 ('lagos_lga:Ifako-Ijaiye','lagos_lga','Ifako-Ijaiye','Ifako-Ijaiye',5000,true),
 ('lagos_lga:Ikeja','lagos_lga','Ikeja','Ikeja',10000,true),
 ('lagos_lga:Ikorodu','lagos_lga','Ikorodu','Ikorodu',8000,true),
 ('lagos_lga:Kosofe','lagos_lga','Kosofe','Kosofe',8000,true),
 ('lagos_lga:Lagos Island','lagos_lga','Lagos Island','Lagos Island',10000,true),
 ('lagos_lga:Lagos Mainland','lagos_lga','Lagos Mainland','Lagos Mainland',5000,true),
 ('lagos_lga:Mushin','lagos_lga','Mushin','Mushin',5000,true),
 ('lagos_lga:Ojo','lagos_lga','Ojo','Ojo',10000,true),
 ('lagos_lga:Oshodi-Isolo','lagos_lga','Oshodi-Isolo','Oshodi-Isolo',5000,true),
 ('lagos_lga:Shomolu','lagos_lga','Shomolu','Shomolu',5000,true),
 ('lagos_lga:Surulere','lagos_lga','Surulere','Surulere',5000,true),
 ('state:Abia','state','Abia','Umuahia',10000,true),
 ('state:Adamawa','state','Adamawa','Yola',15000,true),
 ('state:Akwa Ibom','state','Akwa Ibom','Uyo',10000,true),
 ('state:Anambra','state','Anambra','Awka',10000,true),
 ('state:Bauchi','state','Bauchi','Bauchi',12000,true),
 ('state:Bayelsa','state','Bayelsa','Yenagoa',12000,true),
 ('state:Benue','state','Benue','Makurdi',12000,true),
 ('state:Borno','state','Borno','Maiduguri',15000,true),
 ('state:Cross River','state','Cross River','Calabar',15000,true),
 ('state:Delta','state','Delta','Asaba',10000,true),
 ('state:Ebonyi','state','Ebonyi','Abakaliki',12000,true),
 ('state:Edo','state','Edo','Benin City',10000,true),
 ('state:Ekiti','state','Ekiti','Ado-Ekiti',8000,true),
 ('state:Enugu','state','Enugu','Enugu',10000,true),
 ('state:Federal Capital Territory','state','Federal Capital Territory','Abuja',null,false),
 ('state:Gombe','state','Gombe','Gombe',15000,true),
 ('state:Imo','state','Imo','Owerri',10000,true),
 ('state:Jigawa','state','Jigawa','Dutse',15000,true),
 ('state:Kaduna','state','Kaduna','Kaduna',12000,true),
 ('state:Kano','state','Kano','Kano',12000,true),
 ('state:Katsina','state','Katsina','Katsina',15000,true),
 ('state:Kebbi','state','Kebbi','Birnin Kebbi',15000,true),
 ('state:Kogi','state','Kogi','Lokoja',12000,true),
 ('state:Kwara','state','Kwara','Ilorin',10000,true),
 ('state:Nasarawa','state','Nasarawa','Lafia',12000,true),
 ('state:Niger','state','Niger','Minna',12000,true),
 ('state:Ogun','state','Ogun','Abeokuta',10000,true),
 ('state:Ondo','state','Ondo','Akure',10000,true),
 ('state:Osun','state','Osun','Osogbo',8000,true),
 ('state:Oyo','state','Oyo','Ibadan',8000,true),
 ('state:Plateau','state','Plateau','Jos',12000,true),
 ('state:Rivers','state','Rivers','Port Harcourt',10000,true),
 ('state:Sokoto','state','Sokoto','Sokoto',15000,true),
 ('state:Taraba','state','Taraba','Jalingo',15000,true),
 ('state:Yobe','state','Yobe','Damaturu',15000,true),
 ('state:Zamfara','state','Zamfara','Gusau',15000,true)
on conflict (id) do nothing;

-- 2) Reservation holding period (hours after the administrator confirms availability).
alter table public.shop_settings add column if not exists reservation_hold_hours integer not null default 24 check(reservation_hold_hours between 1 and 168);

-- 3) Order fields for delivery and reservations (all nullable; old orders keep null).
alter table public.shop_orders add column if not exists delivery_method text check(delivery_method in ('lagos_delivery','interstate_park','store_pickup'));
alter table public.shop_orders add column if not exists payment_collection text check(payment_collection in ('online','at_store'));
alter table public.shop_orders add column if not exists reservation_ref text unique;
alter table public.shop_orders add column if not exists reservation_status text check(reservation_status in ('pending_confirmation','confirmed_awaiting_pickup','ready_for_pickup','completed_paid','cancelled','expired','no_show'));
alter table public.shop_orders add column if not exists pickup_date date;
alter table public.shop_orders add column if not exists hold_until timestamptz;
alter table public.shop_orders add column if not exists reservation_confirmed_at timestamptz;
alter table public.shop_orders add column if not exists reservation_ready_at timestamptz;
alter table public.shop_orders add column if not exists reservation_closed_at timestamptz;
create index if not exists shop_orders_reservation_idx on public.shop_orders(reservation_status,pickup_date) where reservation_status is not null;
alter table public.shop_orders drop constraint if exists shop_orders_status_check;
alter table public.shop_orders add constraint shop_orders_status_check check (status = any (array['awaiting_payment','paid','manual_review','pending_payment','unpaid']));
alter table public.shop_orders drop constraint if exists shop_orders_payment_provider_check;
alter table public.shop_orders add constraint shop_orders_payment_provider_check check (payment_provider = any (array['paystack','credit_direct','bank_transfer','pay_at_store']));

-- 4) Email notifications log: one row per order/event/recipient, so the same email is never sent twice.
create table if not exists public.shop_notifications(
 id bigint generated always as identity primary key,
 order_id uuid not null references public.shop_orders(id),
 kind text not null,
 recipient text not null,
 status text not null default 'pending' check(status in ('pending','accepted','failed','skipped')),
 provider_id text, error text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(order_id,kind,recipient)
);
alter table public.shop_notifications enable row level security;
revoke all on public.shop_notifications from anon, authenticated;

-- 5) Delivery fee for a checkout choice (server side; the browser's figure is never trusted).
create or replace function public.shop_delivery_quote(p_method text, p_state text, p_lga text) returns jsonb language plpgsql stable set search_path to 'public' as $f$
declare r shop_delivery_rates%rowtype;
begin
 if p_method='store_pickup' then return jsonb_build_object('fee',0,'label','Pickup at Mikee Gadget Store');end if;
 if p_method='lagos_delivery' then
  if p_state<>'Lagos' then raise exception 'Home delivery is available in Lagos only';end if;
  select * into r from shop_delivery_rates where scope='lagos_lga' and area=p_lga and enabled and fee_ngn is not null;
  if not found then raise exception 'Delivery to this area is not available yet';end if;
  return jsonb_build_object('fee',r.fee_ngn,'label','Delivery: '||r.area);
 end if;
 if p_method='interstate_park' then
  if p_state='Lagos' or coalesce(p_state,'')='' then raise exception 'Choose a state outside Lagos for transport park pickup';end if;
  select * into r from shop_delivery_rates where scope='state' and area=p_state and enabled and fee_ngn is not null;
  if not found then raise exception 'Delivery to this state is not available yet';end if;
  return jsonb_build_object('fee',r.fee_ngn,'label','Transport park pickup: '||r.label||', '||r.area);
 end if;
 raise exception 'Choose a delivery option';
end $f$;

-- 6) Create an order with its delivery fee, or a store reservation (no payment). Wraps shop_create_order_deals,
-- which keeps prices, Hot Deal discounts and duplicate-submission protection in one place.
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

-- 7) Reservation actions, administrator only. Payment is never marked automatically.
create or replace function public.shop_reservation_action(p_actor uuid, p_reference text, p_action text, p_hours integer default null) returns jsonb language plpgsql set search_path to 'public' as $f$
declare ord shop_orders%rowtype; hold int; next text; open_states text[]:=array['pending_confirmation','confirmed_awaiting_pickup','ready_for_pickup'];
begin
 if not exists(select 1 from auth.users where id=p_actor and exists(select 1 from public.shop_admins a where a.user_id=p_actor) and lower(email)='aderintomicheal6@gmail.com' and email_confirmed_at is not null) then raise exception 'Administrator access required';end if;
 select * into ord from shop_orders where reference=p_reference for update;
 if not found or ord.reservation_status is null then raise exception 'Unknown reservation';end if;
 select coalesce(reservation_hold_hours,24) into hold from shop_settings where id='store';hold:=coalesce(hold,24);
 if p_action='confirm' then
  if ord.reservation_status<>'pending_confirmation' then raise exception 'Only a pending reservation can be confirmed';end if;
  update shop_orders set reservation_status='confirmed_awaiting_pickup',reservation_confirmed_at=now(),hold_until=now()+make_interval(hours=>hold) where id=ord.id;next:='confirmed_awaiting_pickup';
 elsif p_action='reject' then
  if ord.reservation_status<>'pending_confirmation' then raise exception 'Only a pending reservation can be rejected';end if;
  update shop_orders set reservation_status='cancelled',fulfillment_status='cancelled',reservation_closed_at=now() where id=ord.id;next:='cancelled';
 elsif p_action='ready' then
  if ord.reservation_status<>'confirmed_awaiting_pickup' then raise exception 'Confirm the reservation first';end if;
  update shop_orders set reservation_status='ready_for_pickup',fulfillment_status='ready_for_pickup',reservation_ready_at=now() where id=ord.id;next:='ready_for_pickup';
 elsif p_action='paid' then
  if ord.reservation_status not in ('confirmed_awaiting_pickup','ready_for_pickup') then raise exception 'Confirm the reservation before recording payment';end if;
  update shop_orders set reservation_status='completed_paid',status='paid',paid_at=now(),fulfillment_status='delivered',reservation_closed_at=now() where id=ord.id;next:='completed_paid';
 elsif p_action='cancel' then
  if not ord.reservation_status=any(open_states) then raise exception 'This reservation is already closed';end if;
  update shop_orders set reservation_status='cancelled',fulfillment_status='cancelled',reservation_closed_at=now() where id=ord.id;next:='cancelled';
 elsif p_action='expire' then
  if ord.reservation_status not in ('confirmed_awaiting_pickup','ready_for_pickup') then raise exception 'Only a confirmed reservation can expire';end if;
  update shop_orders set reservation_status='expired',reservation_closed_at=now() where id=ord.id;next:='expired';
 elsif p_action='no_show' then
  if ord.reservation_status not in ('confirmed_awaiting_pickup','ready_for_pickup','expired') then raise exception 'Only a confirmed reservation can be marked as no-show';end if;
  update shop_orders set reservation_status='no_show',reservation_closed_at=now() where id=ord.id;next:='no_show';
 elsif p_action='extend' then
  if ord.reservation_status not in ('confirmed_awaiting_pickup','ready_for_pickup','expired') then raise exception 'Only a confirmed or expired reservation can be extended';end if;
  if p_hours is null or p_hours not between 1 and 168 then raise exception 'Extend by 1 to 168 hours';end if;
  update shop_orders set reservation_status=case when ord.reservation_status='expired' then 'confirmed_awaiting_pickup' else ord.reservation_status end,reservation_closed_at=null,hold_until=greatest(now(),coalesce(ord.hold_until,now()))+make_interval(hours=>p_hours) where id=ord.id;
  next:=case when ord.reservation_status='expired' then 'confirmed_awaiting_pickup' else ord.reservation_status end;
 else raise exception 'Unknown action';end if;
 insert into shop_admin_audit(actor_id,sku,previous_value,new_value) values(p_actor,'reservation:'||ord.reservation_ref,jsonb_build_object('status',ord.reservation_status),jsonb_build_object('status',next,'action',p_action));
 select * into ord from shop_orders where id=ord.id;
 return jsonb_build_object('reservation_status',ord.reservation_status,'hold_until',ord.hold_until,'status',ord.status);
end $f$;

-- 8) Expire confirmed reservations whose pickup deadline has passed. Records are kept.
create or replace function public.shop_expire_reservations() returns integer language plpgsql set search_path to 'public' as $f$
declare n integer;
begin
 update shop_orders set reservation_status='expired',reservation_closed_at=now() where reservation_status in ('confirmed_awaiting_pickup','ready_for_pickup') and hold_until is not null and hold_until<now();
 get diagnostics n=row_count;return n;
end $f$;

-- 9) Credit Direct: when an order has a delivery fee, it is sent as its own "Delivery" line so the
-- product lines still add up to the order total. Orders without a fee are sent exactly as before.
create or replace function public.shop_credit_direct_begin(p_reference text, p_session_id text) returns jsonb language plpgsql set search_path to 'public' as $f$
declare ord shop_orders%rowtype; items jsonb; total bigint;
begin
 select * into ord from shop_orders where reference=p_reference for update;
 if not found then raise exception 'Unknown order';end if;
 if ord.status<>'awaiting_payment' or ord.amount_ngn<=0 then raise exception 'Order is not awaiting payment';end if;
 if ord.authorization_url is not null then raise exception 'Order already started with another payment method';end if;
 if (select count(*) from shop_credit_direct_sessions where order_reference=ord.reference)>=10 then raise exception 'Too many checkout attempts';end if;
 select jsonb_agg(jsonb_build_object('productId',i.sku,'productName',left(concat_ws(' ',i.product_snapshot->>'model',i.product_snapshot->>'storage',case when i.quantity>1 then '× '||i.quantity end),200),'productAmount',i.unit_price_ngn*i.quantity) order by i.sku),sum(i.unit_price_ngn*i.quantity)
  into items,total from shop_order_items i where i.order_id=ord.id;
 if coalesce(ord.delivery_fee_ngn,0)>0 then items:=items||jsonb_build_array(jsonb_build_object('productId','delivery','productName','Delivery','productAmount',ord.delivery_fee_ngn));total:=total+ord.delivery_fee_ngn;end if;
 if items is null or total is distinct from ord.amount_ngn then raise exception 'Order items do not match the order total';end if;
 insert into shop_credit_direct_sessions(session_id,order_reference,amount_ngn,products) values(p_session_id,ord.reference,ord.amount_ngn,items);
 update shop_orders set payment_provider='credit_direct' where id=ord.id;
 return jsonb_build_object('sessionId',p_session_id,'amount_ngn',ord.amount_ngn,'products',items,'email',ord.customer->>'email','phone',ord.customer->>'phone');
end $f$;

revoke all on function public.shop_delivery_quote(text,text,text) from public, anon, authenticated;
revoke all on function public.shop_create_order_v3(uuid,jsonb,jsonb,text) from public, anon, authenticated;
revoke all on function public.shop_reservation_action(uuid,text,text,integer) from public, anon, authenticated;
revoke all on function public.shop_expire_reservations() from public, anon, authenticated;
commit;

-- 10) Run the expiry every 15 minutes where pg_cron is available (Supabase). The admin page also runs it on load.
do $$ begin
 if exists(select 1 from pg_available_extensions where name='pg_cron') then
  create extension if not exists pg_cron;
  if not exists(select 1 from cron.job where jobname='mikee-expire-reservations') then
   perform cron.schedule('mikee-expire-reservations','*/15 * * * *','select public.shop_expire_reservations()');
  end if;
 end if;
end $$;
