# Catalogue and mobile repair — preview release

Production has not been changed. This branch requires preview review and database setup before release.

## Implemented
- Light, readable storage controls; independent capacity, color and condition selections; touch and keyboard operation.
- Exact SKU/price selection. Unsupported combinations remain selected but cannot initiate purchase. Legacy Silver/Blue is flagged for review and blocked.
- Apple model-specific color reference from https://support.apple.com/en-us/108044 (checked 12 November 2026). Existing color aliases normalized without changing legacy SKU IDs. New 18 combinations have no invented prices.
- iPhone 18 supports Brand New and UK Used records. All other iPhone records are UK Used. Other brands remain unchanged.
- 16 WiFi-only models / 185 distinct variants; all unpriced; newest first; immediately after Samsung Tablets.
- Category carousel advances every 3.5 seconds, wraps with a cloned track, pauses on interaction, has arrow/pause/progress controls and reduced-motion support.
- Admin metadata editing, image upload endpoint, optimistic concurrency, draft preview, CSV export/import with explicit publish step. Images are converted to WebP in the browser. Existing authorization remains required.
- Product details contain verified catalogue facts; no invented processor/camera/battery specifications.
- Existing homepage hero, colors, header, navigation and purchasing destinations retained.

## Important unresolved deployment dependencies
The inspected Supabase project `nrpqiudmdxcabjqalwia` has 178 checkout_inventory rows, zero enabled rows, zero rows with catalogue slug metadata, and zero shop_admins rows. Consequently live checkout/admin functionality cannot be certified against the current database. No database mutation or payment was performed.

Prepared, not applied:
- migrations/20261112123619_catalogue_editor.sql: authorized editor RPC and public-read image bucket; service-only upload path.
- catalogue-editor-rollback.sql: removes editor RPC without breaking uploaded image URLs.
- catalogue-reconcile-review.sql: backs up inventory and adds catalogue metadata/new disabled SKUs; preserves existing authoritative prices and disabled state.
- catalogue-reconcile-rollback.sql: restores prior metadata/flags, disables new rows, preserves prices/order references.

After preview approval: reconcile catalogue records, assign the administrator role to the verified merchant account, review/enable priced SKUs, and test Paystack with test credentials in an isolated environment. Do not apply production migrations just to make a preview work.

Credit Direct remains on hold: existing /easybuy routing continues to the existing financing-unavailable page. No new lender integration is claimed.

## Image and pricing exceptions
- 94 product listings still lack a verified image. No competitor image was copied without reuse permission. See catalogue-image-audit.csv for every listing, including existing assets.
- All retained local primary image paths exist. This is a file-integrity check, not a claim that all existing merchant photos were independently visually authenticated.
- No new external product photo was added. Category imagery is retained; WiFi-only reuses the corresponding existing model photo.
- 236 variant prices remain missing, including all 185 WiFi-only variants. One additional priced legacy Silver/Blue entry is blocked pending clarification. See catalogue-price-pending.csv.
- Existing differently priced duplicate-model listings retain their original URLs and SKU identities; the merchant should review whether these remain separate offers after the condition correction.
- Per-color photographs are not supplied; the selector changes an image only when that variant has a verified image assigned. It does not recolor or mislabel a generic model photo.

## Validation
`npm run check` passed: syntax checks, generated-site validation (239 HTML pages) and 63 automated tests. Tests cover selection/price isolation, unavailable colors, condition correction, WiFi SKU separation, CSV parsing, admin field validation and existing checkout/idempotency behavior with mocks.
Database RPC migration and image upload are not integration-tested because no isolated preview database is configured. No live card charge was attempted. Browser QA uses 320, 360, 390, 430 pixel iframe fixtures plus desktop; screenshots and measured outcomes are recorded separately.

## Main source files
commerce/catalogue-repair.mjs, apple-colors.json, variant-selection.mjs, catalogue-live.mjs, admin-catalogue.mjs, csv.mjs, retail-inventory.mjs, conditions.mjs, storefront-data.mjs;
assets/product-selection.js, category-carousel.js, commerce.js, storefront.js, storefront-ui.mjs, unified.css, shopping.js, admin.js;
api/admin/manage.mjs, api/admin/image.mjs;
scripts/generate-commerce-pages.mjs, generate-shopping.mjs, unify-shopping.mjs, validate-site.mjs;
tests/catalogue-repair.test.mjs and updated condition/selection regression tests.
Generated product/category pages, catalogue JSON and SQL seed are rebuilt from these sources.
