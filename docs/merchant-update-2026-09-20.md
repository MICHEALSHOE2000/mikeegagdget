# Merchant update — 20 September 2026

Continues `feature/premium-storefront`. The homepage uses the existing main-branch theme from `6dae428`, with the working search, product routes, progressive calculators and five-item mobile navigation retained.

## Stock and prices

`commerce/merchant-listings.mjs` contains the six merchant-supplied iPhone 18 Pro / Pro Max colour and storage prices. These are final displayed selling prices, with no extra markup. The supplied photos are resized WebP assets mapped centrally in `commerce/product-images.mjs`; their original markings are retained. Specifications and condition were not supplied and are confirmed with the store. These listings can be purchase, finance and swap targets; their own trade-in reference values have not been invented.

The eight real phones in `commerce/offers.mjs` receive the requested 20% promotion. Their carousel order changes on page load and advances every 5.5 seconds. Offer prices remain consistent across search, products, calculators and WhatsApp. Hover, keyboard interaction, manual controls and reduced-motion preferences pause automatic movement. Original trade-in valuation references are unchanged.

## Financing

Both plans support 1–6 months. Interest = (selling price − deposit) × monthly rate × months: 7.5% for the approved-limit plan, 20% for the no-limit-check plan. Payments reconcile to the full repayment amount, including any rounding adjustment in the last payment. The existing minimum-deposit and valuation rules are preserved.

The homepage and approved-limit journey link to https://www.creditdirect.ng/know-your-limit. The provider page supports limit checking and financing up to six months but does not publish the requested 7.5% rate. The site describes these as Mikee's quoted estimates, subject to approval and final terms. No provider credentials, BVN collection or invented integration were added.

## Shop image

Created with ImageGen in generation mode: a photorealistic compact Nigerian phone shop, black/gold/green Mikee Gadget Plug branding, glass device counters and stocked shelves, natural retail lighting, with the visible label “Store concept illustration”. This is a branded concept, not evidence of the actual premises. The page also displays that disclosure alongside the real supplied store address.

Original generated output: `/workspace/scratch/bead3a821437/generated_images/exec-c11ec513-eccf-4c12-a551-4bc3e8371877.png`.
Website assets: `images/store/shop-concept-480.webp` and `images/store/shop-concept-960.webp` (26 KB / 75 KB). Replace the central mapping when a genuine premises photo is supplied.

## Verification

- `npm run check`: production build, syntax checks, 110 HTML files, local links and required event hooks pass; all 21 tests pass.
- Browser review at iframe widths 320, 360, 375, 390, 412, 430, 768 and 1440: home, both new phones, EasyBuy result, Swap entry, Deals, Samsung and Laptops. No horizontal page overflow; mobile navigation has 10px extra content clearance. This desktop review browser reserves a 15px scrollbar, so the content areas are slightly narrower than the frame widths.
- Checked instant search and empty results; moving deals and pause/resume; Burgundy selection and exact WhatsApp price; invalid deposits; both six-month repayment summaries and prefilled WhatsApp messages.
- Verified missing-image handling in the automated interaction test. Browser shop review caught an unresolved responsive-image token; corrected the generator and added a regression test.
- No messages were sent, provider applications submitted or live main-branch deployment triggered.

Review remains in the existing draft PR. Vercel preview may require the owner's sign-in.
