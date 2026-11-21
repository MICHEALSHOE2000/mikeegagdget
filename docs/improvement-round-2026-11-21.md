# Improvement round — 21 Nov 2026

Branch `feature/catalogue-images-performance-cro`. Nothing merged, deployed or published. No prices, conditions, storage, colours or live payment settings changed.

## 1. Product photos
See [product-image-audit.md](product-image-audit.md) and the per-variant [CSV](product-image-audit.csv).

- 177 published products / 349 variants (live catalogue).
- 65 products (36.7%) show a photo; 112 (63.3%) show the named placeholder.
- 0% have a photo approved in admin with source and permission recorded — every current photo pre-dates the approval workflow.
- 13 products' current photos (12 files) flagged for a second look: renders, possible wrong model, low resolution, Apple support-site images.
- 35 unused repository photos matched to 19 live products and checked by eye: 26 look right, 5 need the owner to confirm, 4 rejected (mixed models, concept render, marketing render). The non-rejected ones are offered in Admin → Products → Photos as "Suggested from our photo library" — nothing is published until approved.

## 2. Speed (Lighthouse, local production build, simulated mobile 4G / desktop)
| Page | Performance | LCP | CLS | TBT | FCP | Accessibility |
|---|---|---|---|---|---|---|
| mobile · home | 100 → 99 | 1.5s → 2.18s | 0 → 0 | 0 → 0 ms | 1.38s → 1.05s | 91 → 100 |
| mobile · category | 99 → 99 | 1.73s → 2.18s | 0 → 0 | 0 → 0 ms | 1.38s → 1.05s | 98 → 98 |
| mobile · search | 99 → 99 | 1.74s → 2.11s | 0.024 → 0.024 | 0 → 0 ms | 1.38s → 1.06s | 95 → 100 |
| mobile · product | 99 → 99 | 1.8s → 2.1s | 0.003 → 0.008 | 20 → 5 ms | 1.38s → 1.2s | 96 → 100 |
| mobile · cart | 95 → 100 | 1.38s → 1.06s | 0.135 → 0.046 | 0 → 0 ms | 1.38s → 1.06s | 100 → 100 |
| mobile · checkout | 100 → 100 | 1.38s → 1.07s | 0.017 → 0 | 0 → 0 ms | 1.38s → 1.07s | 100 → 100 |
| mobile · tracking | 99 → 100 | 1.38s → 1.06s | 0.041 → 0.042 | 0 → 0 ms | 1.38s → 1.06s | 100 → 100 |
| desktop · home | 100 → 100 | 0.39s → 0.53s | 0.014 → 0.014 | 0 → 0 ms | 0.39s → 0.29s | 91 → 100 |
| desktop · category | 100 → 100 | 0.41s → 0.52s | 0 → 0 | 0 → 0 ms | 0.39s → 0.28s | 98 → 98 |
| desktop · search | 100 → 100 | 0.44s → 0.51s | 0.015 → 0.015 | 0 → 0 ms | 0.39s → 0.29s | 95 → 100 |
| desktop · product | 100 → 100 | 0.44s → 0.52s | 0.01 → 0.019 | 0 → 0 ms | 0.39s → 0.28s | 96 → 97 |
| desktop · cart | 98 → 100 | 0.39s → 0.29s | 0.094 → 0.012 | 0 → 0 ms | 0.39s → 0.29s | 100 → 100 |
| desktop · checkout | 100 → 100 | 0.39s → 0.28s | 0.002 → 0 | 0 → 0 ms | 0.39s → 0.28s | 100 → 100 |
| desktop · tracking | 100 → 100 | 0.4s → 0.31s | 0.017 → 0.035 | 0 → 0 ms | 0.4s → 0.31s | 100 → 100 |

Targets met on every page: mobile 99–100, desktop 100, LCP ≤ 2.2 s, CLS ≤ 0.05, TBT ≤ 20 ms.

How to read the LCP column: the sandbox cannot reach Google Fonts, so the "before" pages loaded no web font at all and look faster than they are in production. After the change Inter is served from our own domain (48 KB + a 1 KB ₦ subset, preloaded), which removes two extra connections and a render-blocking stylesheet on the live site. First paint improved on every page (FCP 1.38 s → 1.05 s mobile).

Changes: self-hosted font; hero poster preloaded with high priority; space reserved on cart/checkout (cart CLS 0.135 → 0.046); photo label overlaid instead of pushing the page; cache headers for fonts (1 year), CSS/JS (5 min + background refresh), hero video (1 day). Lighthouse could not be run against the live site from here (network blocked) — re-run on the Vercel preview to confirm.

## 3. Delivery accuracy
- Product pages said "Lagos: same-day delivery… Other states: estimated 24–48 hours" — removed (not in the fee table). Now: Lagos ₦5,000–₦10,000 by LGA, transport park ₦8,000–₦15,000, free pickup — computed from the checkout fee table.
- "Nationwide delivery" chips, "Lagos & nationwide", meta text "7-day warranty and nationwide delivery", homepage "Store pickup or nationwide delivery" and the Terms line "nationwide across Nigeria and neighboring African countries" reworded to match.
- Emails contain no delivery promises (checked).

## 4. Trust and buying flow
- Product pages: UK Used standard (Grade A, original non-boosted battery 85%+, original screen, Face ID/fingerprint, cameras, charging, speaker and mic); "Reserve online, inspect in store, pay after"; delivery, payment options, warranty/returns links, store address with Google Maps link.
- UK Used photos labelled "Representative image".
- Battery wording changed from "above 83%" to "85% or above" to match the brief — please confirm.
- Fixed near-invisible text on every product page (delivery and FAQ headings, FAQ answers, trust chips).
- Gallery: thumbnails, swipe, keyboard, full-screen viewer with double-tap/pinch zoom; admin-approved photos per variant replace the catalogue photos.
- Search: "under ₦500k", "below 1.2m", "between 300k and 500k"; "17pro"/"16ProMax" joined words; typos; "max 256" is not read as a price.
- Order tracking explains MGP2-/RSV- references and shows reservations correctly.
- Header no longer overflows at 320–360 px or ~768 px.

## 5. Features
Compare (up to 3, from product pages, table on the account page, recorded data only), recently viewed (account page), saved item → Add to cart (only when the product has one buyable option), branded 404 page. Accessory suggestions skipped: no compatibility data is recorded.

## 6. SEO
Product structured data, canonicals, titles, descriptions, sitemap (262 URLs) and robots checked. Merchant Center: not ready — offers lack `availability` unless stock status is set in admin, and there is no shipping/return-policy markup (Lagos fees are per LGA, which Merchant Center cannot express by postcode).

## 7. Security
- RLS on every table; anonymous/authenticated users have no access to customer tables or functions; Paystack webhook HMAC (timing-safe) and Credit Direct signed webhooks verified; duplicate payment events de-duplicated in the database; no secrets in front-end files.
- Found: reservations need no payment and had no limits. Added migration `20261121090000_reservation_limits.sql` (max 3 open reservations per phone/email, 60 per hour store-wide, message shown to the customer) — written and tested locally, **not applied**.
- Found: three old backup tables still grant SELECT to anonymous users (RLS returns no rows, catalogue prices only). The same migration revokes this.
- No general rate limiting on order creation (serverless). Recommend Vercel Firewall rate-limit rules on /api/shop/create.
