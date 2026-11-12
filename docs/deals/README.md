# Managed All Deals

The homepage retains its existing shell and scroll rail. It loads up to five published exact SKUs from `/api/shop/deals`. `/admin/deals/` and `/admin/` expose the same authenticated editor. The owner signs in using the existing email link flow. A server-verified, confirmed owner identity can provision its role once; subsequent revocation cannot be undone by signing in again.

Deal prices use whole-naira half-up rounding: `floor((cataloguePrice * 9 + 5) / 10)` in JavaScript and `round(price_ngn::numeric * 0.90)` in Postgres. Only published SKUs receive the discount; catalogue base prices are untouched. Each new order snapshots its actual unit price, original price and promotion. Payment verification compares the provider amount with that saved total. Publication is atomic, revision-checked and audited. Existing orders never reprice.

## Release setup, 12 November 2026

- Applied `featured_deals` and the previously prepared `catalogue_editor` migration to the Mikee Gadget project.
- Backed up the 178 original inventory rows in `private.inventory_before_deals_20261112` (not exposed to public clients).
- Reconciled product metadata from the repository's generated `assets/shop-data.json`; preserved all existing selling prices; added missing catalogue SKUs with their existing repository prices. Available, priced, non-review variants were enabled. Unpriced/review variants remain blocked.
- Result: 483 variants; 246 purchasable; 236 unpriced; one blocked for review.
- Initial promotion uses the first five existing featured models, choosing the lowest priced available SKU: 18 Pro Max Burgundy 256GB, 18 Pro Glacier 256GB, 17 Pro Max Blue/Orange 256GB, 16 Pro Max 256GB, 15 Pro Max 256GB. These can be replaced or cleared in the editor.

## Verification

`npm run check` runs lint, generation, site checks and 67 tests. `transaction-test.sql` was executed within the migration transaction and rolled back: rounding, mixed carts, immutable original prices, stale publication, duplicate variants, unchanged existing orders, underpayment rejection, payment replay and client write restrictions passed. It is a controlled database fixture, never a production payment.

No Paystack live-mode switch or Credit Direct integration was changed. Do not call an initialized payment a completed payment. Owner email delivery and the real payment provider must also be checked in the deployed environment.

## Rollback

Revert the application release to its prior commit. The old `shop_create_order` RPC remains available unchanged. Clear `shop_deal_settings.skus` if promotions should stop for new orders. Keep existing order records and payment events intact. The database migration is additive and can remain installed. Do not restore inventory wholesale over orders or merchant edits; use the private backup for a reviewed per-SKU restore if needed.
