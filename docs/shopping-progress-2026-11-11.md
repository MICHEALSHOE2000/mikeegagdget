# Shopping implementation checkpoint — 11 November 2026

**Not ready for production.** Work is isolated on `feature/preserve-design-shopping`. Main and the live database have not been changed. This status supersedes the original audit's pre-implementation statements.

## Implemented
- Shared catalogue search with exact-model ranking, conservative typo handling, keyboard navigation and dedicated results page.
- Six featured phones rendered through existing carousel styling; no fabricated discounts. Existing global styles, hero, header and navigation layout preserved.
- Detail pages for existing non-phone products, stable SKU selection, persistent cart, quantities/removal and a separate Buy Now checkout.
- Guest checkout: Nigeria/Lagos defaults, all states and FCT, manual city entry, delivery/pickup, free delivery, same-day Lagos / 24–48 hours elsewhere, seven-day warranty.
- Paystack server initialization, verification and signed webhook handlers; default test-only key guard. Server database prices determine totals. A mismatch against the customer's reviewed total prevents payment initialization.
- Additive draft SQL for new multi-item order/payment records, RLS and restricted function grants. Legacy orders are preserved. Catalogue reconciliation SQL is generated for review, not applied.
- Five previously missing prices verified by selecting exact variants on Revenes. See `price-observations-2026-11-11.json`. Existing non-null prices retained.
- Existing swap calculations preserved as requested by the owner; earlier strict-condition proposal is superseded.

## Validation
`npm run check`: syntax checks, generator build, static validation, **55 tests passed**. New tests cover cart normalization/persistence, typo search, consent/address validation, untrusted client prices, payment reference/currency checks and webhook body signatures. These are not a substitute for a real Paystack sandbox transaction or database integration test.
Browser: typo search opened the matching result page; product Add to cart persisted through navigation; checkout defaulted to Lagos and accepted a different state with a manual locality. No checkout submission, payment or live database write was performed.

## Remaining acceptance work
- 17 variants still lack verified prices. Keep listings and cart actions visible; do not accept payment with missing prices. CSE Fold 6 listings showed different SIM prices but did not confirm condition; no ambiguous price was imported. Further Revenes browsing was stopped by automatic approval review's usage limit.
- Credit Direct requires the merchant's official integration documentation and supported checkout parameters. Screenshots/fixed-amount payment links are insufficient for a dynamic secure checkout. Existing legacy financing pages still require replacement; this checkpoint must not be released with those old calculations representing Credit Direct terms.
- Admin dashboard, admin authorization and management workflows are not implemented. Need owner account identity before assigning access. Support/return request storage and swap request storage remain to be implemented.
- Reconcile the live database's 178 inventory rows with the 264 source variants before enabling existing rows. The public catalogue endpoint is optional until this migration is installed; static fallback supports preview only.
- Apply/test migrations on an isolated test database, run real successful/failed/cancelled/repeated Paystack test transactions and verify saved order rows. The configured Vercel test key has not been inspected or used here.
- Validate all device/SIM combinations and requested responsive visual comparisons. iPhone 15 Pro Max still only has a genuine configured UK Used 256GB variant; no 512GB variant was invented.
- Preview UI is available locally through the managed preview. No hosted preview URL has been verified.

## Environment and activation
Server-only: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY` (`sk_test_…`), `SHOP_ORIGIN` (exact preview origin). Do not store secrets in this repository or chat. `SHOP_LIVE_PAYMENTS` must remain unset/false for testing.
Paystack webhook path: `/api/shop/webhook`; callback: `/checkout/complete/`.
Run `npm ci`, `npm run check`, and review SQL plus inventory changes. Configure an isolated database and preview environment first. Do not apply `supabase/shopping-catalogue-review.sql` blindly: existing rows intentionally keep their existing prices/enabled flags.

Production deployment requires separate approval after outstanding acceptance tests pass. Roll back application code to backup branch `backup/restored-homepage-2026-11-11`; retain order records and use a reviewed forward fix for database issues rather than deleting tables with customer data.

## Owner deployment request and administrator setup
Owner approved deployment on 11 November and deferred official Credit Direct checkout. Administrator email: `aderintomicheal6@gmail.com`.

Prepared since the checkpoint:
- `/admin/` with email-link sign-in, authenticated inventory price updates and recent-order viewing. Server validates the user through Supabase Auth, requires a confirmed email matching the owner, and ignores editable user metadata. No marketing scripts load on the auth callback page.
- Draft admin audit table and transactional price-update function with concurrent-edit checks. Not yet applied.
- Credit Direct hold page and temporary redirects from EasyBuy checkout paths; homepage financing rates/deposits are removed while held.
- Product pages refresh their selected prices from the server catalogue when available.
- `npm run check`: **57 tests pass**, including administrator identity rejection and absence of tracking on the auth callback page.

Vercel connection was confirmed by the user, but no Vercel operations were exposed in the tool registry after connection. This is a tool availability problem, not a request to reconnect. Existing GitHub checks confirmed the prior feature-branch Vercel build succeeded. Production has not been promoted.

Additional admin setting: `SUPABASE_PUBLISHABLE_KEY` (publishable/anon key, never the service-role key). Configure Supabase Auth redirect allowlist for the exact `/admin/` URL and email delivery before testing sign-in. The owner email did not yet exist in Auth at inspection; the email-link request can create it, but admin access requires email verification. No email was sent by this implementation session.

Release still requires migration execution/testing, catalogue reconciliation, deployed environment verification, and a real Paystack test transaction. Production authorization is recorded; do not ask for it again merely because this checklist remains. Do not promote the unfinished checkout until these concrete checks can be completed.
