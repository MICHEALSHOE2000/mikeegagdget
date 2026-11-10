# Secure checkout backend (Phase 1: outright + store pickup)
This branch adds a Vercel Functions / Supabase / Paystack checkout while preserving the existing WhatsApp flows.
**It is NOT live until the Supabase migration, environment variables, stock, Paystack keys and webhook are configured and tested.**

## Setup
1. Run `supabase/migrations/001_checkout.sql` in Supabase SQL Editor.
2. In Supabase, enable PostgREST access to the `public` schema (usually default). Do not create anon policies for these tables.
3. In Vercel Project Settings → Environment Variables, enter server-only:
   - `SUPABASE_URL` (e.g. `https://YOURPROJECT.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY` (secret; NEVER use `NEXT_PUBLIC_` or `VITE_` prefixes)
   - `PAYSTACK_SECRET_KEY` (start with `sk_test_`)
   - `PAYSTACK_WEBHOOK_SECRET` (only when using new Paystack-Signature format)
   - `SITE_URL` (e.g. `https://www.mikeegadget.com.ng`)
4. Enter verified inventory manually in `checkout_inventory`. Stock starts at 0 and enabled defaults false, on purpose. Match `sku` to the catalogue variant ID exactly (e.g. `iphone-13|128GB`). The inventory table controls actual checkout price, while frontend catalogue price is informative; set the same price in both and keep them in sync.
5. In Paystack developer settings point the webhook to `https://www.mikeegadget.com.ng/api/checkout/webhook`. Verify which webhook signature format your Paystack account uses.
6. Make a test payment, verify success, stock decrement, callback page, duplicate webhook idempotency, failure behavior, expiration and mismatch manual review. Switch to live credentials only after testing.

## Limits
- Currently online payment is restricted to straightforward outright purchases with store pickup, never EasyBuy, delivery or swap.
- The reservation protects concurrent pending checkouts for 15 minutes. Late payments get manual review instead of automatic fulfilment. Add customer refund/late-payment operations before scaling.
- In case Paystack initialization fails, a 15-minute pending reservation remains; it expires automatically for stock calculations.
- Administration dashboard, email/SMS receipts, refunds, order history and shipping fee quotation are future phases.
- **Important:** server-side inventory pricing is authoritative; do not treat a price passed from the browser as authoritative.
- Add rate limiting and fraud monitoring before public production launch; do not activate live payment solely by deploying this branch.
