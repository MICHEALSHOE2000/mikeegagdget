# Premium retail redesign — audit and release

Audited main commit `9bd4f13237b98c781c80ca9af0e638cee245dba7` on 10 November 2026.

## Existing system

Static generated pages on Vercel, native browser modules, 106 phone pages, 159 catalogue models / 264 variants overall (242 priced). Existing product URLs, SEO metadata and supplied images/prices are retained. No catalogue facts were sourced from model memory.

Supabase project `nrpqiudmdxcabjqalwia`: 178 inventory records, all disabled at audit time; zero legacy checkout orders, one supplier order. RLS is enabled. Existing supplier payment RPC accepted `requested` orders, so “supplier confirmation” did not gate payment. Non-phone listings linked straight to WhatsApp. Existing webhook signatures and server verification are retained.

## Implemented

- White/green retail styling, category and service navigation, compact hero, existing image assets, no invented offers.
- Typo/abbreviation search; persisted catalogue filters; new direct product routes for 53 non-phone models.
- Guest checkout: contact details, pickup/delivery, review. Unknown delivery fees/prices stay unquoted until merchant confirmation.
- Server-side catalogue validation and database pricing; stable request IDs; retry-safe order creation; supplier gate; quote expiry; fixed payment references; total-change guard.
- Credit Direct requests and merchant-supplied provider links. A link never marks approval or payment.
- Phone product swap messages contain SKU, storage, condition, colour and assessment requirement.
- Private order tracking, history, real fulfillment states, notification outbox, authenticated merchant update/reconcile/notification endpoints.
- Transaction pages exclude marketing pixels and use no-referrer to protect private order tokens.

## Release order — not yet applied to production

1. Apply `supabase/migrations/20261110194553_premium_retail.sql` to the intended staging database, then `supabase/retail-inventory.sql`. The import preserves existing merchant prices/stock and enables catalogue entries for order requests. It does not confirm stock. Review any existing database/catalogue price differences.
2. Configure the existing `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `SITE_URL` for the staging deployment. Use Paystack test credentials.
3. Configure `MERCHANT_ADMIN_TOKEN` (32+ random characters, server only). This protects merchant endpoints; never embed it in public JS or source control.
4. For email configure `RESEND_API_KEY` and a verified `ORDER_EMAIL_FROM`. Arrange an authenticated scheduler to POST `/api/supplier/notify` and `/api/supplier/reconcile`; neither is automatically scheduled by this change. Notifications older than 23 hours are flagged failed for manual review instead of risking duplicated sends after the provider's dedupe window.
5. Run successful, failed, abandoned, duplicate webhook, concurrent pay, pickup and delivery checkouts against Paystack test mode. Check actual email delivery. Verify the provider-issued Credit Direct checkout URL. Allowlisted domains: creditdirect.ng and creditdirectafrica.com, including subdomains; add another only after verifying it with the provider.
6. Run Android device testing and measure Core Web Vitals. Desktop browser inspection is not proof of p75 LCP/CLS/INP targets.
7. Coordinate database migration/import with the frontend/API release. Do not roll out schema-only over the old frontend: it intentionally changes the supplier payment gate. Deploy production only after these staging checks pass.

## Merchant operations

Use Supabase Table Editor to inspect `supplier_orders`. The public status API does not expose customer contact details. POST JSON to `/api/supplier/manage` with `Authorization: Bearer <MERCHANT_ADMIN_TOKEN>`:

- Confirm quote: `{ "order_id": "…", "action": "confirm", "supplier_confirmed": true, "price_ngn": 820000, "delivery_fee_ngn": 0, "warranty_terms": "actual written terms", "return_terms": "actual written terms", "expires_at": "a future ISO timestamp within seven days" }`. The sample amount is illustrative; use the verified actual price. Supply actual terms, not placeholders.
- Financing link: `{ "order_id": "…", "action": "finance_link", "url": "the actual provider checkout URL" }`.
- Fulfillment: `{ "order_id": "…", "status": "preparing" }`, then `ready_for_pickup` or `dispatched`, then `delivered`. Record a refund only after actually refunding and setting `refund_verified: true`; this endpoint does not execute refunds.

Payments are confirmed only by server verification/webhooks. Never manually mark an unpaid order paid. If a Paystack initialization succeeds but both its response and persisted URL are lost, keep its reference and reconcile/contact the provider; do not create another order or charge reference. Customers can refresh their order or use support.

## Validation

Build and site validation pass. Automated tests cover existing catalogue/finance behavior plus new routing, search, invalid input, provider URL validation, payment reuse, total changes and unsuccessful verification.

Database upgrade plus full catalogue import were tested inside a rolled-back transaction under `service_role`: unconfirmed payments blocked; repeated submissions return one token; repeated payment initialization retains one reference; successful payment records once; duplicate webhook cannot regress paid; status history is written. No test orders or schema changes were retained in production.

Browser verified real typo search (`ipone 14 pm`), product variant, Buy Now, guest details and review with the actual ₦820,000 catalogue price. Local preview does not execute Vercel serverless functions. End-to-end provider payments, emails, physical Android devices and field performance remain release gates.
