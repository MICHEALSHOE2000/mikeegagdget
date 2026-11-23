-- Run only against the intended environment after image assets are available.
BEGIN;
WITH mappings(sku, slug, url, source, licence) AS (VALUES
  ('airpods-4|ANC', 'airpods-4', '/images/store/licensed/airpods-4-720.webp', 'supplier', 'Merchant-confirmed reuse permission (2026-10-12) | https://neostore.ng/shop/cmpxfrml200077xi86mwtkkjr'),
  ('airpods-4|Normal', 'airpods-4', '/images/store/licensed/airpods-4-720.webp', 'supplier', 'Merchant-confirmed reuse permission (2026-10-12) | https://neostore.ng/shop/cmpxfrml200077xi86mwtkkjr'),
  ('airpods-pro-2|Type-C', 'airpods-pro-2', '/images/store/licensed/airpods-pro-2-720.webp', 'licensed', 'CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:AirPods_Pro_(2nd_generation).jpg'),
  ('airpods-pro-3|Standard', 'airpods-pro-3', '/images/store/licensed/airpods-pro-3-720.webp', 'licensed', 'CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:2025-10-24_AirPods_Pro_3_im_Case.jpg'),
  ('ipad-7th-gen|32GB · Wi‑Fi', 'ipad-7th-gen', '/images/store/licensed/ipad-7th-gen-720.webp', 'licensed', 'CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:IPad_7th_generation_lock_screen.jpg'),
  ('ipad-7th-gen|32GB · Wi‑Fi + Cellular (LTE)', 'ipad-7th-gen', '/images/store/licensed/ipad-7th-gen-720.webp', 'licensed', 'CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:IPad_7th_generation_lock_screen.jpg'),
  ('pixel-6-pro|128GB', 'pixel-6-pro', '/images/store/licensed/pixel-6-pro-720.webp', 'licensed', 'CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Google_Pixel_6_Pro_back_(Stormy_Black).svg'),
  ('pixel-6-pro|256GB', 'pixel-6-pro', '/images/store/licensed/pixel-6-pro-720.webp', 'licensed', 'CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Google_Pixel_6_Pro_back_(Stormy_Black).svg'),
  ('pixel-8-pro|128GB', 'pixel-8-pro', '/images/store/licensed/pixel-8-pro-720.webp', 'licensed', 'CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Google_Pixel_8_Pro_back_(Bay).svg'),
  ('pixel-8-pro|128GB · UK Used', 'pixel-8-pro', '/images/store/licensed/pixel-8-pro-720.webp', 'licensed', 'CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Google_Pixel_8_Pro_back_(Bay).svg'),
  ('pixel-8-pro|256GB', 'pixel-8-pro', '/images/store/licensed/pixel-8-pro-720.webp', 'licensed', 'CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Google_Pixel_8_Pro_back_(Bay).svg'),
  ('pixel-8-pro|256GB · UK Used', 'pixel-8-pro', '/images/store/licensed/pixel-8-pro-720.webp', 'licensed', 'CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Google_Pixel_8_Pro_back_(Bay).svg'),
  ('pixel-8a|128GB', 'pixel-8a', '/images/store/licensed/pixel-8a-720.webp', 'licensed', 'CC BY 4.0 | https://commons.wikimedia.org/wiki/File:Pixel_8a.jpg'),
  ('samsung-galaxy-buds-2-pro|Standard', 'samsung-galaxy-buds-2-pro', '/images/store/licensed/samsung-galaxy-buds-2-pro-720.webp', 'supplier', 'Merchant-confirmed reuse permission (2026-10-12) | https://neostore.ng/shop/cmq10kffk00037x4kl9jqkpxw'),
  ('samsung-galaxy-buds-3-pro|Standard', 'samsung-galaxy-buds-3-pro', '/images/store/licensed/samsung-galaxy-buds-3-pro-720.webp', 'supplier', 'Merchant-confirmed reuse permission (2026-10-12) | https://neostore.ng/shop/cmq1cfgia00077xn96k2lk530'),
  ('samsung-galaxy-buds-3|Standard', 'samsung-galaxy-buds-3', '/images/store/licensed/samsung-galaxy-buds-3-720.webp', 'supplier', 'Merchant-confirmed reuse permission (2026-10-12) | https://neostore.ng/shop/cmq1b4efx00057xn9068mqveb'),
  ('samsung-galaxy-tab-s9|128GB · 8GB RAM', 'samsung-galaxy-tab-s9', '/images/store/licensed/samsung-galaxy-tab-s9-720.webp', 'licensed', 'CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_Tab_S9.png'),
  ('samsung-galaxy-tab-s9|256GB · 8GB RAM', 'samsung-galaxy-tab-s9', '/images/store/licensed/samsung-galaxy-tab-s9-720.webp', 'licensed', 'CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_Tab_S9.png'),
  ('samsung-note-20-ultra|128GB', 'samsung-note-20-ultra', '/images/store/licensed/samsung-note-20-ultra-720.webp', 'licensed', 'CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_Note_20_Ultra_Mystic_Bronze.jpg'),
  ('samsung-note-20-ultra|256GB', 'samsung-note-20-ultra', '/images/store/licensed/samsung-note-20-ultra-720.webp', 'licensed', 'CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_Note_20_Ultra_Mystic_Bronze.jpg'),
  ('samsung-s10-lite|128GB', 'samsung-s10-lite', '/images/store/licensed/samsung-s10-lite-720.webp', 'licensed', 'CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_S10_Lite.png'),
  ('samsung-s10e|128GB', 'samsung-s10e', '/images/store/licensed/samsung-s10e-720.webp', 'licensed', 'CC BY 3.0 | https://commons.wikimedia.org/wiki/File:Galaxy_S10e_2.png'),
  ('samsung-s20-ultra|128GB', 'samsung-s20-ultra', '/images/store/licensed/samsung-s20-ultra-720.webp', 'licensed', 'CC BY 4.0 | https://commons.wikimedia.org/wiki/File:R%C3%BCckseite_Galaxy_S20_Ultra_20200305.jpg'),
  ('samsung-s21-fe|128GB', 'samsung-s21-fe', '/images/store/licensed/samsung-s21-fe-720.webp', 'licensed', 'CC BY 3.0 | https://commons.wikimedia.org/wiki/File:Galaxy_S21_FE.png'),
  ('samsung-s24-plus|256GB', 'samsung-s24-plus', '/images/store/licensed/samsung-s24-plus-720.webp', 'licensed', 'CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_S24%2B.jpg'),
  ('samsung-s25-edge|256GB', 'samsung-s25-edge', '/images/store/licensed/samsung-s25-edge-720.webp', 'licensed', 'CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_S25_Edge.jpg'),
  ('samsung-s25-edge|512GB', 'samsung-s25-edge', '/images/store/licensed/samsung-s25-edge-720.webp', 'licensed', 'CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_S25_Edge.jpg'),
  ('samsung-z-fold-8|1TB · 12GB RAM · Warranty', 'samsung-z-fold-8', '/images/store/licensed/samsung-z-fold-8-720.webp', 'licensed', 'CC BY 4.0 | https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_Z_Fold8.jpg'),
  ('samsung-z-fold-8|256GB', 'samsung-z-fold-8', '/images/store/licensed/samsung-z-fold-8-720.webp', 'licensed', 'CC BY 4.0 | https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_Z_Fold8.jpg'),
  ('samsung-z-fold-8|256GB · 12GB RAM · Warranty', 'samsung-z-fold-8', '/images/store/licensed/samsung-z-fold-8-720.webp', 'licensed', 'CC BY 4.0 | https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_Z_Fold8.jpg'),
  ('samsung-z-fold-8|512GB · 12GB RAM · Warranty', 'samsung-z-fold-8', '/images/store/licensed/samsung-z-fold-8-720.webp', 'licensed', 'CC BY 4.0 | https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_Z_Fold8.jpg')
), photos AS (
  SELECT m.*, jsonb_build_array(jsonb_build_object(
    'url', url, 'source', source, 'licence', licence, 'color', '',
    'primary', true, 'approved', true
  )) AS images
  FROM mappings m
)
UPDATE public.checkout_inventory i
SET product_data = jsonb_set(i.product_data - 'images', '{image}', '""'::jsonb)
FROM photos p
WHERE i.sku = p.sku AND i.product_data->>'slug' = p.slug
  AND i.product_data->>'image' = p.url AND i.product_data->'images' = p.images
RETURNING i.sku;
COMMIT;
