-- APPLIED to production 2026-11-23: 33 new iPad SKUs (new models only; their pages ship with this branch).
-- Prices: iStore Nigeria sale prices on 23 Nov 2026; iStore's "was" price stored as compareAtPrice and shown crossed out.
-- Additive only; no existing row is touched. All in stock (owner-confirmed).
-- Rollback: delete from public.checkout_inventory where product_data->>'priceSource'='iStore Nigeria iPad range, 23 Nov 2026' and product_data->>'slug'<>'ipad-air-8th-gen-11-inch-m4';
insert into public.checkout_inventory(sku,price_ngn,enabled,product_data)
select v.slug||'|'||v.storage,v.price,true,jsonb_strip_nulls(jsonb_build_object('sku',v.slug||'|'||v.storage,'slug',v.slug,'model',v.model,'category','ipads','brand','Apple','condition','Brand New','capacity',v.capacity,'storage',v.storage,'price',v.price,'compareAtPrice',v.was,'image','/images/store/ipad-range/'||v.slug||'.svg','colors',case when v.color is null then '[]'::jsonb else jsonb_build_array(v.color) end,'ram','','connectivity',v.conn,'enabled',true,'reviewRequired',false,'stockStatus','in_stock','availabilitySource','owner-confirmed','availabilityConfirmedAt','2026-11-23','priceSource','iStore Nigeria iPad range, 23 Nov 2026'))
from (values
('ipad-pro-13-inch','iPad Pro 13-inch','256GB · Wi‑Fi','256GB','Wi-Fi',null,1999000,2399000),
('ipad-pro-13-inch','iPad Pro 13-inch','256GB · Cellular + Wi‑Fi','256GB','Wi-Fi + Cellular',null,2199000,2699000),
('ipad-pro-13-inch','iPad Pro 13-inch','512GB · Cellular + Wi‑Fi','512GB','Wi-Fi + Cellular',null,3599000,null),
('ipad-pro-11-inch','iPad Pro 11-inch','256GB · Wi‑Fi','256GB','Wi-Fi',null,1949000,null),
('ipad-pro-11-inch','iPad Pro 11-inch','256GB · Cellular + Wi‑Fi','256GB','Wi-Fi + Cellular',null,2399000,null),
('ipad-pro-11-inch','iPad Pro 11-inch','1TB · Cellular + Wi‑Fi','1TB','Wi-Fi + Cellular',null,3299000,null),
('ipad-air-13-inch-m4','iPad Air 13-inch M4','128GB · Wi‑Fi','128GB','Wi-Fi',null,1299000,1499000),
('ipad-air-13-inch-m4','iPad Air 13-inch M4','128GB · Cellular + Wi‑Fi','128GB','Wi-Fi + Cellular',null,1749000,1899000),
('ipad-air-13-inch-m4','iPad Air 13-inch M4','256GB · Cellular + Wi‑Fi','256GB','Wi-Fi + Cellular',null,1899000,1999000),
('ipad-air-13-inch-m3','iPad Air 13-inch M3','128GB · Wi‑Fi','128GB','Wi-Fi',null,999000,1199000),
('ipad-air-13-inch-m3','iPad Air 13-inch M3','128GB · Cellular + Wi‑Fi','128GB','Wi-Fi + Cellular',null,1099000,1299000),
('ipad-air-13-inch-m3','iPad Air 13-inch M3','256GB · Wi‑Fi','256GB','Wi-Fi',null,1649000,null),
('ipad-air-13-inch-m3','iPad Air 13-inch M3','256GB · Cellular + Wi‑Fi','256GB','Wi-Fi + Cellular',null,1249000,1399000),
('ipad-air-13-inch-m3','iPad Air 13-inch M3','512GB · Cellular + Wi‑Fi','512GB','Wi-Fi + Cellular',null,1349000,1499000),
('ipad-air-13-inch-m3','iPad Air 13-inch M3','1TB · Wi‑Fi','1TB','Wi-Fi',null,2399000,null),
('ipad-air-13-inch-m3','iPad Air 13-inch M3','1TB · Cellular + Wi‑Fi','1TB','Wi-Fi + Cellular',null,2799000,null),
('ipad-air-13-inch','iPad Air 13-inch','128GB · Wi‑Fi','128GB','Wi-Fi',null,1349000,null),
('ipad-air-13-inch','iPad Air 13-inch','128GB · Cellular + Wi‑Fi','128GB','Wi-Fi + Cellular',null,999000,1299000),
('ipad-air-13-inch','iPad Air 13-inch','256GB · Wi‑Fi','256GB','Wi-Fi',null,899000,1199000),
('ipad-air-13-inch','iPad Air 13-inch','512GB · Wi‑Fi','512GB','Wi-Fi',null,1999000,null),
('ipad-air-13-inch','iPad Air 13-inch','512GB · Cellular + Wi‑Fi','512GB','Wi-Fi + Cellular',null,1099000,1499000),
('ipad-air-11-inch-m3','iPad Air 11-inch M3','128GB · Cellular + Wi‑Fi','128GB','Wi-Fi + Cellular',null,899000,999000),
('ipad-air-11-inch-m3','iPad Air 11-inch M3','1TB · Wi‑Fi','1TB','Wi-Fi',null,2099000,null),
('ipad-air-11-inch-m3','iPad Air 11-inch M3','1TB · Cellular + Wi‑Fi','1TB','Wi-Fi + Cellular',null,2199000,null),
('ipad-air-11-inch','iPad Air 11-inch','128GB · Cellular + Wi‑Fi','128GB','Wi-Fi + Cellular',null,1399000,null),
('ipad-air-11-inch','iPad Air 11-inch','256GB · Cellular + Wi‑Fi','256GB','Wi-Fi + Cellular',null,1799000,null),
('ipad-air-11-inch','iPad Air 11-inch','512GB · Cellular + Wi‑Fi','512GB','Wi-Fi + Cellular',null,1899000,null),
('ipad-air-11-inch','iPad Air 11-inch','1TB · Wi‑Fi','1TB','Wi-Fi',null,1999000,null),
('ipad-mini','iPad mini','128GB · Wi‑Fi · Midnight','128GB','Wi-Fi','Midnight',1349000,null),
('ipad-mini','iPad mini','128GB · Wi‑Fi · Starlight','128GB','Wi-Fi','Starlight',1349000,null),
('ipad-mini','iPad mini','128GB · Cellular + Wi‑Fi · Midnight','128GB','Wi-Fi + Cellular','Midnight',1649000,null),
('ipad-mini','iPad mini','512GB · Wi‑Fi · Midnight','512GB','Wi-Fi','Midnight',1929000,null),
('ipad-9th-gen','iPad 9th Gen 10.2-inch','256GB · Cellular + Wi‑Fi','256GB','Wi-Fi + Cellular',null,899000,999000)
) as v(slug,model,storage,capacity,conn,color,price,was)
on conflict (sku) do nothing;
