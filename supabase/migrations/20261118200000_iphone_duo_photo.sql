-- iPhone Duo product photo supplied by the owner (18 Nov 2026). Only fills an empty image.
update public.checkout_inventory set product_data=product_data||'{"image":"/images/store/iphone-duo-1-720.webp"}'::jsonb,updated_at=clock_timestamp()
 where product_data->>'slug'='iphone-duo' and coalesce(product_data->>'image','')='';
