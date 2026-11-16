-- Rollback for 20261116150000_uk_used_duo_photos.sql
begin;
update public.checkout_inventory c set price_ngn=b.price_ngn,enabled=b.enabled,product_data=b.product_data,updated_at=clock_timestamp()
 from public.checkout_inventory_backup_followup_20261116 b where c.sku=b.sku;
-- iPhone Duo rows are switched off rather than deleted, so any order that references them stays intact.
update public.checkout_inventory set enabled=false,product_data=product_data||'{"enabled":false}'::jsonb,updated_at=clock_timestamp() where sku in ('iphone-duo|256GB · Star White','iphone-duo|256GB · Night Sky','iphone-duo|512GB · Star White');
commit;
