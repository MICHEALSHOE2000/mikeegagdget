-- APPLIED to production 2026-11-23: point the new iPad rows (added today, not yet on the live site) at the owner's photos.
-- Only rows created by 20261123100000_ipad_range.sql are touched. iPad 9th Gen keeps its placeholder.
update public.checkout_inventory set product_data=jsonb_set(product_data,'{image}',to_jsonb('/images/store/ipad/'||(product_data->>'slug')||'-1-720.webp')),updated_at=now()
where product_data->>'priceSource'='iStore Nigeria iPad range, 23 Nov 2026' and product_data->>'slug' in ('ipad-pro-13-inch','ipad-pro-11-inch','ipad-air-13-inch-m4','ipad-air-13-inch-m3','ipad-air-13-inch','ipad-air-11-inch-m3','ipad-air-11-inch','ipad-mini');
