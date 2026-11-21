-- Reverses the availability change made by 20261121130000_merchant_center.sql for variants whose availability was
-- not changed afterwards in admin. Keeps the log and status tables (nothing is deleted).
update public.checkout_inventory i
   set product_data=i.product_data-'stockStatus'-'availabilityConfirmedAt'-'availabilitySource',updated_at=now()
  from public.shop_availability_changes c
 where c.sku=i.sku and c.reason like 'Owner confirmed supplier fulfilment%'
   and i.product_data->>'stockStatus'='in_stock' and i.product_data->>'availabilitySource'='owner-confirmed';
