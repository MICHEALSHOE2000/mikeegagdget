-- Rollback for 2026-11-16 price migration. Restores the backed-up rows and deal list, removes only the rows
-- this migration inserted, and only if they have never been ordered.
begin;
update public.checkout_inventory c set price_ngn=b.price_ngn,enabled=b.enabled,product_data=b.product_data,updated_at=clock_timestamp()
 from public.checkout_inventory_backup_prices_20261116 b where c.sku=b.sku;
delete from public.checkout_inventory where sku in ('iphone-17-air-wifi-only|256GB · Brand New','iphone-17-pro|256GB · Cosmic Orange · Brand New','iphone-17-pro|512GB · Cosmic Orange · Brand New','iphone-17-pro|512GB · Mixed Colours · Brand New','iphone-17-pro-max|256GB · Blue/Orange · Brand New','iphone-17-pro-max|512GB · Cosmic Orange · Brand New','iphone-17-pro-max|512GB · Silver · Brand New','ipad-6th-gen|32GB · Wi‑Fi','ipad-6th-gen|32GB · Wi‑Fi + Cellular (LTE)','ipad-7th-gen|32GB · Wi‑Fi','ipad-7th-gen|32GB · Wi‑Fi + Cellular (LTE)','ipad-8th-gen|32GB · Wi‑Fi','ipad-8th-gen|32GB · Wi‑Fi + Cellular (LTE)','apple-watch-se|40mm · GPS','apple-watch-se|40mm · GPS + Cellular (LTE)','apple-watch-se|44mm · GPS + Cellular (LTE)','apple-watch-series-6|44mm · GPS','apple-watch-series-6|44mm · GPS + Cellular (LTE)','apple-watch-series-7|41mm · GPS + Cellular (LTE)','apple-watch-series-7|45mm · GPS + Cellular (LTE)','green-lion-keyboard-case-ipad-pro-13|Standard','green-lion-keyboard-case-ipad-air-11|Standard','green-lion-keyboard-case-ipad-pro-11-m4|Standard','green-lion-keyboard-case-ipad-air-13-pro-12-9|Standard','jbl-tune-530bt|Standard','jbl-tune-720bt|Standard','jbl-clip-5|Standard','jbl-flip-6|Standard','jbl-flip-7|Standard','jbl-charge-5|Standard','jbl-charge-6|Standard','jbl-boombox-3|Standard','jbl-xtreme-4|Standard','harman-kardon-onyx-studio-9|Standard')
 and not exists(select 1 from public.shop_order_items i where i.sku=checkout_inventory.sku);
update public.shop_deal_settings d set skus=b.skus,revision=d.revision+1,updated_at=clock_timestamp() from public.shop_deal_settings_backup_20261116 b where d.id=b.id;
create or replace function public.shop_publish_hot_deals(p_actor uuid, p_skus text[], p_revision integer) returns jsonb language plpgsql set search_path to 'public' as $f$
begin
 if p_skus is not null and cardinality(p_skus)>4 then raise exception 'Select up to four unique variants';end if;
 return shop_publish_deals(p_actor,p_skus,p_revision);
end $f$;
-- To restore the previous iPhone condition rule, re-run the function body from 20261114120000 or earlier.
commit;
