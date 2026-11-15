-- Rollback for 20261115160000_reviews_and_google_link.sql. Run only if the feature must be removed.
-- Reviews entered since the migration would be lost; export public.shop_reviews first.
begin;
alter table public.shop_settings drop column if exists google_reviews_url;
drop table if exists public.shop_reviews;
commit;
