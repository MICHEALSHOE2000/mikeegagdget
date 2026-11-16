-- Rollback for 20261116130000_smart_image_staging.sql. Approved photos already copied to catalogue-images and
-- linked to products are NOT affected. Staged (unapproved) files must be emptied from the bucket before it can be
-- removed: Supabase Dashboard → Storage → product-staging → select all → Delete.
begin;
drop table if exists public.shop_image_uploads;
delete from storage.buckets where id='product-staging' and not exists(select 1 from storage.objects where bucket_id='product-staging');
commit;
