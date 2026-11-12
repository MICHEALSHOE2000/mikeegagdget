-- Restore only catalogue metadata and flags for pre-existing SKUs.
-- Prices are deliberately not rewound after subsequent merchant edits.
begin;
update public.checkout_inventory i set product_data=b.product_data,enabled=b.enabled,updated_at=clock_timestamp()
from private.catalogue_before_20261112 b where i.sku=b.sku;
-- New SKUs remain as disabled records so historical foreign keys cannot break.
update public.checkout_inventory set enabled=false where sku not in (select sku from private.catalogue_before_20261112);
commit;
