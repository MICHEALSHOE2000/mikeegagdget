# Samsung smartphone image audit

Generated from the active catalogue with `node scripts/audit-samsung-images.mjs`.

- Samsung phone listings: 66
- Distinct model names: 51
- Storage/colour variant entries: 109
- Listings with an image assigned: 0
- Listings without an image: 66

This audit checks assignments and local file existence, not visual identity or licensing. Separate condition listings remain separate. Samsung tablets, watches and audio products are excluded. Prices are neither exported nor modified.

## Source review — 12 October 2026

No new photos were downloaded, hotlinked or integrated. No reuse permission was established. All models below remain unverified for new image integration.

| Source | Observation | Integration status |
|---|---|---|
| https://neostore.ng/category/foreign-used-phones?brand=Samsung | Category URL was inaccessible through the web retrieval tool. Indexed site pages show an all-rights-reserved footer; no affirmative image reuse permission was found. | Manual sourcing and permission required |
| https://revenes.com/samsung/ | Direct category retrieval returned HTTP 403. No attempt was made to bypass the restriction. Indexed product text was available, but does not verify image quality, identity or reuse permission. | Manual sourcing and permission required |

Indexed references for subsequent manual review (not approved image sources):

- https://revenes.com/samsung/ng/ — names include S26 Ultra, S25 Ultra, S25, S25 FE, A07, A16 5G, A17 5G, A26 5G, A36 5G and A56 5G. Check exact connectivity/model codes where the Mikee listing omits 4G/5G.
- https://revenes.com/product/samsung-galaxy-a06/ — candidate A06 product page; photograph and permission unverified.
- https://revenes.com/product/samsung-galaxy-a27-5g/ — candidate A27 5G page; catalogue connectivity is unspecified, so do not assume a match.
- https://revenes.com/shop/ — indexed S22+ 5G listing; verify exact variant before considering its photographs.

## Existing implementation and handoff

- Active phone images originate in `commerce/retail-inventory.mjs` (`item.image` → `retailPhoneProducts[].images`). Editing `commerce/product-images.mjs` alone does not assign an image to these active phone listings.
- `commerce/storefront-data.mjs`, the commerce page generator and `commerce/upgrade-core.mjs` consume the active product images for cards, details, search data and purchase/upgrade selectors.
- `assets/storefront-ui.mjs` already provides lazy loading, fixed image dimensions, responsive 360/720 WebP paths and a model-labelled fallback. Preserve its display conventions.
- The detail template supports galleries, but the active inventory adapter currently supplies one image. Do not introduce duplicate gallery images. Its thumbnail convention expects a matching `-160.webp` when using `-720.webp` assets.
- Obtain supplier permission covering commercial display and local optimisation, or merchant-owned photographs with permission to publish. Record the exact product page, original image URL, rights evidence, model code, colour and checked local filenames before integration.
- Inspect each image visually. Require Black for the explicitly Black Z Fold 7 variant; confirm unspecified colours and 4G/5G variants. Do not substitute Ultra/Plus/FE/Edge, Fold/Flip or a different generation.
- Use the existing `images/store/` structure with meaningful filenames and actual 160/360/720 WebP variants where that naming convention is used. Update only verified listing image fields; retain all commercial data.
- Rebuild and test the category, details, search, Buy Outright, EasyBuy and Swap at mobile and desktop sizes once approved photographs are available.

## Validation of this audit-only change

At preparation, `npm run check` passed lint, all page generators, site validation and 47 tests. The build left all tracked storefront files byte-for-byte unchanged. The audit script also passed `node --check`.

Only this report and its audit script are added. Product prices, financing, conditions, stock, storage variants, WhatsApp messages, tracking, existing images and website design remain unchanged. No manual mobile/desktop browser verification or new-image load/visual checks were performed because no storefront images were integrated. This is a blocked sourcing draft, not a completed photography upgrade.

## Complete manual sourcing checklist

| Model | Listing slug | Condition | Storage/variant labels | Listed colours | Assigned image | Status |
|---|---|---|---|---|---|---|
| Samsung Galaxy S26 Ultra | samsung-s26-ultra | Brand New | 1TB, 512GB · Warranty, 256GB · Warranty, 256GB · International Warranty, 512GB, 256GB | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy S26 Plus | samsung-s26-plus | Brand New | 512GB · 12GB RAM, 256GB · 12GB RAM | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy S26 | samsung-s26 | Brand New | 256GB · 12GB RAM, 512GB · 12GB RAM | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy S25 Ultra | samsung-s25-ultra | Brand New | 256GB, 512GB, 1TB | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy S25 Plus | samsung-s25-plus | Brand New | 256GB, 512GB | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy S25 | samsung-s25 | Brand New | 256GB · 8GB RAM | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy S25 Edge | samsung-s25-edge | Brand New | 256GB, 512GB | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy S25 FE | samsung-s25-fe | Brand New | 256GB · 8GB RAM | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy S24 Ultra | samsung-s24-ultra | Confirm condition | 512GB, 256GB | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy S24 Plus | samsung-s24-plus | Confirm condition | 256GB | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy S23 Ultra | samsung-s23-ultra | Confirm condition | 512GB, 256GB | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy S23 Plus | samsung-s23-plus | Confirm condition | 256GB | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy S23 | samsung-s23 | Confirm condition | 256GB, 128GB | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy S22 Ultra | samsung-s22-ultra | Confirm condition | 256GB, 128GB | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy S22 Plus | samsung-s22-plus | Confirm condition | 256GB, 128GB | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy S22 | samsung-s22 | Confirm condition | Standard | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy S21 Ultra | samsung-s21-ultra | Confirm condition | 256GB, 128GB | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy S21 Plus | samsung-s21-plus | Confirm condition | 256GB, 128GB | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy S21 | samsung-s21 | Confirm condition | Standard | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy S20 FE | samsung-s20-fe | Confirm condition | Standard | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy Z Fold 8 Ultra | samsung-z-fold-8-ultra | Brand New | 1TB · 16GB RAM, 512GB · 12GB RAM · Warranty, 256GB · 12GB RAM · Warranty, 256GB | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy Z Fold 8 | samsung-z-fold-8 | Brand New | 1TB · 12GB RAM · Warranty, 512GB · 12GB RAM · Warranty, 256GB · 12GB RAM · Warranty, 256GB | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy Z TriFold | samsung-z-trifold | Brand New | 512GB · 16GB RAM RAM · Dual SIM | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy Z Fold 7 | samsung-z-fold-7 | Brand New | 1TB, 512GB · Black, 256GB | Black | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy Z Fold 6 | samsung-z-fold-6 | Brand New | 1TB, 512GB, 256GB | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy Z Fold 6 | samsung-z-fold-6-confirm-condition | Confirm condition | 256GB | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy Z Flip 7 | samsung-z-flip-7 | Brand New | 512GB, 256GB | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy Z Flip 6 | samsung-z-flip-6 | Brand New | 256GB, 512GB | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy Z Flip 6 | samsung-z-flip-6-confirm-condition | Confirm condition | 256GB | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A07 | samsung-a07 | Brand New | 128GB · 4GB RAM | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A07 | samsung-a07-open-box | Open Box | Standard | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A07 | samsung-a07-uk-used | UK Used | Standard | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A17 | samsung-a17 | Brand New | 128GB · 4GB RAM, 128GB · 4GB RAM 5G, 256GB · 6GB RAM 5G, 128GB · 6GB RAM, 256GB · 8GB RAM | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A27 | samsung-a27 | Brand New | 256GB · 6GB RAM, 128GB · 6GB RAM | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A37 | samsung-a37 | Brand New | 128GB · 6GB RAM, 256GB · 8GB RAM | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A57 | samsung-a57 | Brand New | 128GB · 8GB RAM, 256GB · 8GB RAM | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A06 | samsung-a06 | Brand New | 64GB · 4GB RAM, 128GB · 4GB RAM | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A16 | samsung-a16 | Brand New | 128GB · 4GB RAM, 128GB · 6GB RAM, 256GB · 8GB RAM | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A16 | samsung-a16-open-box | Open Box | Standard | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A16 | samsung-a16-uk-used | UK Used | Standard | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A26 | samsung-a26 | Brand New | 128GB · 6GB RAM, 256GB · 6GB RAM | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A36 | samsung-a36 | Brand New | 128GB · 8GB RAM, 256GB · 8GB RAM | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A56 | samsung-a56 | Brand New | 128GB · 8GB RAM, 256GB · 8GB RAM | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy Z Fold 5 | samsung-z-fold-5 | Confirm condition | 256GB | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy Z Fold 4 | samsung-z-fold-4 | Confirm condition | 256GB | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy Z Fold 3 | samsung-z-fold-3 | Confirm condition | 256GB | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy Z Flip 4 | samsung-z-flip-4 | Confirm condition | 256GB | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy Note 20 | samsung-note-20 | Confirm condition | 256GB | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A05 | samsung-a05 | Open Box | Standard | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A05 | samsung-a05-uk-used | UK Used | Standard | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A13 | samsung-a13 | Open Box | Standard | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A13 | samsung-a13-uk-used | UK Used | Standard | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A14 | samsung-a14 | Open Box | Standard | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A14 | samsung-a14-uk-used | UK Used | Standard | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A15 | samsung-a15 | Open Box | Standard | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A15 | samsung-a15-uk-used | UK Used | Standard | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A52 | samsung-a52 | Open Box | Standard | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A52 | samsung-a52-uk-used | UK Used | Standard | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A53 | samsung-a53 | Open Box | Standard | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A53 | samsung-a53-uk-used | UK Used | Standard | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A71 | samsung-a71 | Open Box | Standard | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A71 | samsung-a71-uk-used | UK Used | Standard | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A70 | samsung-a70 | Open Box | Standard | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A70 | samsung-a70-uk-used | UK Used | Standard | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A90 | samsung-a90 | Open Box | Standard | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
| Samsung Galaxy A90 | samsung-a90-uk-used | UK Used | Standard | Ask for today’s available colours | None | Placeholder; approved exact-model photo needed |
