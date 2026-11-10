# Supplier-backed checkout
Every priced phone variant is orderable from the catalogue, even when stock is sourced from Computer Village partners.
Payment MUST stay disabled until the merchant verifies the exact device, quantity, and price.
This path is separate from the original upfront-payment checkout and does not decrement `checkout_inventory.stock`.

## Deploy
1. Run `supabase/migrations/002_supplier_orders.sql` in Supabase.
2. Set Vercel server-only environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY` (test key), `SITE_URL`.
3. Test the flow on a preview deployment. Customer submits a request and receives /order/?token=...
4. For manual pilot approval in Supabase Table Editor, open `supplier_orders`, find the request, set `confirmed_price_ngn` to a checked price per unit, set `quote_expires_at` to a timestamp in the near future (e.g. 2 hours), then set `status` to `approved`. Only do this after supplier confirmation. Never share the database service role key.
5. Customer opens their original order link, sees the approved total and pays with Paystack test checkout.
6. Set a signed Paystack webhook to /api/checkout/webhook (existing signature handling) and verify the charge.success event, idempotence, expiry and mismatch handling. Confirm `supplier_orders.status=paid`.
7. Avoid enabling live checkout before protected admin approval, rate limiting, refund/manual review workflow, webhook and checkout tests.

## Security & operations
Order tokens grant access to order status/payment, so treat the URL as sensitive. Do not publish links. No privileged public approval endpoint.
A failed payment initialization leaves the quote `awaiting_payment` until manual review. Late paid transactions enter `manual_review` and need refund or fulfilment decisions.
No automatic customer email/SMS, admin dashboard or delivery fee logic exists yet; status/approval is manual.
The legacy /api/checkout/create still exists; do not expose the legacy payment button for supplier checkout.
