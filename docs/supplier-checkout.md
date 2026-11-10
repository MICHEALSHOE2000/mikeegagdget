# Supplier-backed direct checkout

The store treats all priced phone variants as **Available to Order** because the merchant sources them from Computer Village suppliers. The customer selects a device, enters their details, and goes directly to Paystack. There is **no pre-payment supplier confirmation** in this flow. Do not misrepresent supplier availability as a physically reserved unit.

## Installation

1. Run `supabase/migrations/002_supplier_orders.sql` in Supabase SQL Editor.
2. Ensure Vercel has server-only `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY` (test), `SITE_URL` (correct deployment domain). No secrets in GitHub or browser code.
3. Deploy this branch to a preview, test /buy/: submit a priced phone → server stores supplier order → redirects to Paystack → callback /order/?token=...&reference=... → verification → paid status.
4. Configure and test signed webhook at /api/checkout/webhook. Check duplicate events, payment failure, late payments, mismatched amount, and manual review.

## Operations

- The `supplier_orders` table is the source of truth for customer requests and payment state. `checkout_inventory.stock` is not used for supplier-backed purchases.
- Supplier-backed products are orderable but not reserved; you must source the purchased unit and contact the buyer about pickup.
- A failed Paystack initialization leaves an `awaiting_payment` order for manual review. A late successful payment enters `manual_review`. Do not fulfill or refund automatically without investigating.
- Current supported fulfilment: **store pickup only**. Swap and Pay Small Small retain their prior WhatsApp flows.
- Important launch blockers: add an authenticated admin dashboard, notifications, rate limiting, a cancellation/refund process, order-to-supplier sourcing checks, customer-facing disclosure of fulfilment timelines, and end-to-end tests.
- Do NOT switch to live Paystack keys simply because the code deploys.
