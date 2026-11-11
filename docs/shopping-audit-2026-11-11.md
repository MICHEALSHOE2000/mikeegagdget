# Mikee Gadget shopping audit and proposed implementation
Date: 11 November 2026. Status: audit complete enough for scope review; implementation not started.

## Protected baseline
- Repository: MICHEALSHOE2000/mikeegagdget
- Default branch: main
- Restored commit: 0ef1a11019b49967d5b94a9b094ecccf0e65ded2 — Restore Mikee Gadget website to original October design.
- Remote backup branch created: backup/restored-homepage-2026-11-11.
- Remote feature branch created: feature/preserve-design-shopping.
- Annotated tag created locally: restored-homepage-2026-11-11. Publishing this tag is pending: shell Git lacks push credentials; the connected GitHub tools successfully created both branches but expose no tag-creation operation.
- No application source edits, production deployment, database changes, or payment attempts were made.
- Baseline npm run check passed (syntax checks, generated build, site validation, 50 tests). Build left the tracked working tree unchanged.
- No AGENTS.md was found in the current tracked repository.

## Repository and live-site findings
This is an existing static HTML/CSS/JavaScript site with Node page generators and Vite development tooling. Retain this stack and its current Vercel deployment approach.

| Area | Evidence | Required work |
|---|---|---|
| Homepage | Restored layout and existing sliders, category navigation, filters, imagery, and mobile navigation exist | Preserve templates and styles; narrowly patch functionality |
| Search | assets/storefront.js loads assets/store-catalog.json; live search returned iPhone 15 Pro Max UK Used 256GB at the configured price | Add typo tolerance, model ranking, complete keyboard interaction and a dedicated results page; Enter currently opens the first suggestion |
| Deals | commerce/offers.mjs has an empty promotion.models array; featuredDeals requires an offerId | Separate featured products from promotions; render 5–7 priced phones with existing carousel styling |
| Catalogue | commerce/retail-inventory.mjs contains 159 entries, 264 variants, 242 positively priced variants | Reconcile identities and prices; 22 unpriced variants must not accept payment |
| Variant structure | Storage strings can contain colour groups and activation status; variants lack a normalized independent SKU field in this source | Introduce stable SKU mapping and explicit attributes without inventing combinations |
| Non-phone products | commerce/storefront-data.mjs sends non-phone product routes to WhatsApp | Add actual detail pages using the existing design |
| Direct purchase | assets/buy-flow.js builds order-whatsapp links and browser-generated references | Introduce persistent multi-item cart, guest checkout, database order references and server payment initiation |
| Checkout backend | Current restored tree has no api/ or supabase/ directory | Selectively recover and adapt useful backend code from history |
| Historical backend | Commit 6c1a339 contains Paystack API handlers, server verification and SQL migrations | Review and reuse safe primitives; do not restore its redesign or supplier approval gate |
| Financing | Current UI advertises old 20%/7.5% plans and links to Credit Direct eligibility | Replace with official configured Credit Direct purchasing flow; old rates are not approved new terms |
| Swap | Existing estimate logic permits deductions for replaced parts and damaged devices | Replace with strict perfect-condition qualification and configured valuations |
| Admin | No admin application in the current tracked tree | Add authenticated management with server-side authorization and RLS |

### Important product-data limitation
The current iPhone 15 Pro Max entry contains only UK Used 256GB at NGN 940,000 and no configured colours. The requested 256GB-to-512GB test cannot pass for this model until a genuine 512GB SKU and selling price are supplied. Do not manufacture this variant. Other storage-changing tests can use genuinely configured products.

## Existing Supabase
Identified project: mikeegadget (nrpqiudmdxcabjqalwia). Read-only schema inspection found:
- checkout_inventory: 178 rows; all priced, zero enabled. Fields include sku, price_ngn, stock and enabled.
- checkout_orders: existing single-SKU order structure; pickup-only fulfillment constraint.
- supplier_orders: existing single-SKU request/approval/payment structure.
- RLS is enabled on all three tables. Full policy, function grant, and admin authorization testing remains part of implementation.
- Historical premium-retail migration fields are absent from the inspected live schema. Repository history is not proof a migration was applied.
- The difference between 178 inventory rows and 264 catalogue variants requires SKU-by-SKU reconciliation, not an automatic overwrite or enable-all operation.

## Features to preserve
- Approved homepage colours, typography, spacing, logo, header, hero imagery and motion.
- Existing navigation, mobile bottom navigation and responsive layouts.
- Existing product routes, SEO metadata, sitemap and landing pages.
- Existing genuine catalogue prices and image assignments.
- Working filtering and search data loading, enhanced incrementally.
- Safe payment verification primitives in history, after review.
- Existing database rows and historical order/payment references.
- Analytics hooks where compatible with the new checkout and appropriate data handling.

Preserve presentation, not superseded business rules: WhatsApp-first buying, old loan calculations, damaged-device swap deductions and manual supplier approval must not remain the main purchasing journey.

## Reference study
Browsed Revenes homepage, a Samsung Galaxy A56 product page, cart drawer, checkout and returns page.
Useful patterns: separate colour/RAM/storage controls, exact variant in the order summary, accessible cart entry, guest checkout, address fields, delivery cost separated from subtotal, financing choices and policy agreement before Place Order.
Do not copy Revenes prices, shipping fees, policies, branding or lending terms.
Limitations: no order or payment was submitted; no end-to-end reference purchase was verified. Search suggestion and full category/filter behaviour were not exhaustively tested. A pre-existing cart was only observed, not altered.
Desktop screenshots were captured. Requested responsive overrides did not reliably apply to the Mikee tab (reported width remained 1366 during a 390-width request). These are not valid three-breakpoint regression baselines. Obtain verified desktop/tablet/mobile screenshots before editing homepage presentation; compare the same viewport, loaded-image state, scroll position and frozen animation frame.

## Proposed database changes
Use additive, versioned migrations against the inspected schema:
1. Retain checkout_inventory as the SKU pricing/orderability authority. Add product linkage and normalized variant attributes, preserving legacy SKU mappings. Import catalogue records only after reconciliation.
2. Add product/category records, image metadata, featured-product order and explicitly configured promotions. Expose a restricted public catalogue projection with no customer data.
3. Extend checkout_orders for multi-item orders while preserving legacy single-item records. Add order_items containing immutable SKU, chosen attributes, quantity and price snapshots. Backfill existing rows safely where needed.
4. Add structured address/delivery fields, delivery zones/fees, policy version and consent time; support Nigeria/Lagos defaults and manual locality entry.
5. Add payment attempts and webhook processing records with unique references and transactional idempotency. Calculate order totals from server-side pricing and configured fees.
6. Add swap requests, condition answers and configured valuations; financing references only where the provider supports them.
7. Add support/return requests, policy content, admin authorization and audit logs. Apply RLS and explicit least-privilege grants; keep service-role and payment secrets server-only.
8. Preserve supplier_orders as historical records; do not route new direct purchases through manual approval.
No migrations are applied at this stage. Resolve migration sequencing and existing function dependencies before execution.

## Proposed customer journeys
- Direct: search/category → product → exact valid SKU → Buy Now or cart → guest checkout → Paystack → verified order confirmation.
- Financing: selected SKU → product price and eligibility explanation → official Credit Direct process. No fabricated eligibility or repayment figures.
- Alternative financing: eligible iPhones only, disabled until terms and assisted/provider process are configured.
- Swap: target SKU → current phone details → strict condition checks → configured estimate or assessment request → saved reference → physical inspection.
- Support: order reference → support/return request → saved confirmation.

## Staged implementation scope
1. Finish baseline protection: publish tag if supported; obtain reproducible screenshots; document catalogue reconciliation and any unresolved data.
2. Discovery: improve existing search, add results page, populate featured carousel, preserve category/product URLs and build missing genuine product pages.
3. Variants/cart: stable SKU selection, independent attributes, dynamic configured prices and persistent multi-item cart.
4. Checkout/backend: additive schema changes in a test environment, server totals, delivery/pickup, guest details, Paystack test payments, signature verification and duplicate-safe processing.
5. Financing/swaps/support: configured provider link, strict swap workflow and real request storage; owner-approved service and policy content.
6. Admin: secure catalogue/price/featured/order/delivery/request/policy management with authorization tests.
7. Acceptance: requested customer scenarios, mobile/tablet/desktop journeys, visual comparisons, SEO/link checks and payment failure/cancellation/duplicate tests.
8. Preview and production review: deliver tested preview, environment/setup instructions, migration and rollback instructions. Production deployment requires separate approval.

## Owner-provided information needed before activation
- Official Credit Direct merchant checkout/application link and supported product/reference parameters.
- Alternative iPhone financing eligibility, terms, fees and actual processing workflow.
- Missing SKU attributes/prices, including the requested iPhone 15 Pro Max 512GB if sold.
- Delivery zones, fees, pickup settings, same-day cutoff and eligible locations.
- Warranty/returns terms, support hours and inspection arrangements.
- Swap valuation table and any additional perfect-condition thresholds.
- Verified location dataset if available; manual city entry remains supported.
- Admin account identity and Paystack test configuration through secure environment settings. Do not put secrets in chat or commits.

Expected server environment, subject to recovered-code validation: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PAYSTACK_SECRET_KEY (test mode), and an approved site origin/callback setting. Client admin authentication needs a Supabase publishable key; never a service-role key.

## Validation and outstanding gates
Completed: read-only repository/live-site/database audit; remote backup and feature branches; unchanged baseline build and all 50 existing tests.
Not completed: full responsive visual baseline; SKU reconciliation; new implementation; checkout integration tests; live or test payment; admin authorization verification; provider integration; preview deployment.
The old 50 tests include obsolete financing/swap expectations and must be updated with the approved requirements, not treated as acceptance tests for the new shopping system.

## Rollback approach
Keep main at the restored baseline until release approval. Preview from the feature branch. For application rollback, redeploy the recorded baseline commit/backup branch. Use additive migrations and compatibility handling so application rollback does not require deleting orders or customer records; prepare backups and a tested database rollback/forward-fix plan before migration deployment.

## Approval requested
Approve implementation of stages 1–7 on the isolated feature branch, with missing business configuration left inactive and production deployment reserved for separate approval. This scope approval gate comes from Phase 15 of the supplied brief.
