# Credit Direct (Pay Small Small) — activation checklist

Built against Credit Direct Checkout API Documentation v2.0 (Feb 2026). Switched off until every step below is done.

## Owner steps
1. Merchant Portal: confirm sandbox access and copy the test public key, private key and webhook signing secret (`whsec_…`).
2. Vercel → Settings → Environment Variables, **Preview only** first:
   - `CREDIT_DIRECT_PUBLIC_KEY`, `CREDIT_DIRECT_PRIVATE_KEY`, `CREDIT_DIRECT_WEBHOOK_SECRET`
   - `CREDIT_DIRECT_IS_LIVE` = `false`, `CREDIT_DIRECT_ENABLED` = `true`
3. Approve applying `supabase/review/credit-direct.sql` (additive; rollback in `credit-direct-rollback.sql`).
4. Give Credit Direct the webhook URL `https://mikeegadget.com.ng/api/shop/webhook` and redirect URL
   `https://mikeegadget.com.ng/checkout/complete/` during onboarding.

## Questions to confirm with Credit Direct
- Amount unit: we send whole naira (₦1,660,000 → `1660000`). The document does not say naira or kobo.
- Quantity: there is no quantity field; a line of 2 is sent as one product with `productAmount` = unit × 2 and "× 2" in the name. OK?
- Is `metaData` returned in webhooks? We send the order reference there; the sample shows `null`.
- Minimum and maximum order value, and which products are eligible.
- Sandbox: the document warns BVN bank-statement checks may hit live systems and charge. Which test details avoid that?

## How payment is confirmed
- Only a signed `Checkout_Merchant_Payment_Completed` webhook whose product total and product ids match the order marks it paid.
- `Checkout_Customer_Payment_Completed` shows the customer "awaiting merchant payout"; the order is not fulfilled yet.
- Browser callbacks (onSuccess/onClose) never confirm payment.
- Anything that does not match goes to `manual_review` for a person to check in admin.
