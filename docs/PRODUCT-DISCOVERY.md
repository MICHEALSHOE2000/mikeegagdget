# Product discovery upgrade

Branch: `feat/universal-product-discovery`. Review before merging; no deployment requested or performed.

## Architecture and source of truth

`commerce/retail-inventory.mjs` remains the merchant inventory. Its 159 records and 264 source variants, prices, images and slugs are unchanged. `commerce/catalog.mjs` derives the phone catalogue; `commerce/offers.mjs` retains promotion policy. There is no `commerce/price-list.mjs` in this checkout.

`commerce/discovery.mjs` adapts inventory into model families and sellable offers, implements search, compatibility, starting-price rules and flow URLs. No product is generated from a search query. `assets/discovery-catalog.json` is generated from this adapter. Homepage search, header search, category search and full search results use the same adapter/index. Existing JSON indexes remain for backward compatibility.

`assets/discovery.js`, `assets/discovery-ui.mjs` and `assets/discovery.css` implement accessible search links, URL filters, grouped cards and the dependent selector. `templates/home.html.template` and `scripts/generate-storefront.mjs` own the homepage, search and non-phone pages. `scripts/generate-commerce-pages.mjs` owns phone and category pages. All generated output is committed because this repository serves generated static HTML.

`commerce/upgrade-core.mjs` adds the normalized configuration to existing purchase choices. `assets/buy-flow.js`, `assets/journey.js` and `commerce/order-messages.mjs` carry that context into summaries/messages. Financing and trade-in arithmetic are unchanged. Attribution stays in existing session/tracking machinery, outside WhatsApp copy.

## Merchant confirmation required

| Field | Current evidence / action |
| --- | --- |
| SIM configuration | No explicit verified entries. All 264 offers show `Other / Unconfirmed`. Confirm per offer; do not infer from model or image. |
| Network status | No explicit verified entries. All offers show `Unconfirmed`. Confirm `Factory Unlocked` or `Network Locked` per exact unit. |
| Carrier and restrictions | Supply `carrier` and `restrictions` for network-locked units. Until then the UI explains that other carriers may not work. |
| Activation | Only storage labels explicitly saying `Non-Active` establish non-activation. Other Brand New offers show `Brand New — Activation unconfirmed`. |
| Condition | `Confirm condition` becomes `Unconfirmed`. Open Box and UK Used remain separate. Age-based condition overrides have been removed. |
| Availability | Source has no verified live stock. UI says `Confirm availability`; a price does not establish stock. |
| Missing prices | Remain null; no instalment price or stock claim is invented. Use an enquiry. |
| Images | 94 source listings have no supplied image; retain honest placeholders. Supply approved images to improve these cards. |
| Laptops / MacBooks | No inventory records currently exist. Search/category enquiry remains available, but no laptop cards are invented. |
| iPhone 13 Pro | Not in the current inventory. The requested `13 pro 256` example correctly returns no match. |
| iPhone 17 Pro Max requested SIM examples | Neither a verified non-activated physical-SIM+eSIM offer nor a UK-used eSIM-only offer exists in this source. These combinations are intentionally not fabricated. |

## Adding or confirming a variant

Edit the existing inventory source, not generated HTML/JSON. Keep existing `slug`, `legacySlug`, `model`, and `storage` values stable because existing deep links and transaction IDs depend on them. Models with the same exact brand/model are grouped. Each source `slug|storage` pair must be unique; use a descriptive source storage label for separately priced configurations, as existing colour groups already do. The customer selector extracts the capacity before ` · ` while keeping the original source label for exact transaction matching.

Optional variant fields (variant overrides listing-level values where supported):

- `id`: optional permanent offer identifier; keep it immutable. Existing offers default to `slug|storage`.
- `condition`: `Brand New`, `UK Used`, `Open Box`, or an explicitly verified condition.
- `activationStatus`: `Not Activated`, `Activated`, or `Unconfirmed`.
- `sim`: `Physical SIM + eSIM`, `eSIM Only`, `Dual Physical SIM`, `Physical SIM Only`, `Other / Unconfirmed`.
- `network`: `Factory Unlocked`, `Network Locked`, `Unconfirmed`.
- `carrier`, `restrictions`: verified carrier and plain-language usage restrictions.
- `color`: a specific colour or an existing slash-separated equal-price colour group. Different prices require separate variants.
- `stockStatus`: `Confirm availability`, `Available`, or `Out of stock`; only mark Available after confirmation.
- `image`: approved exact-variant image, otherwise the listing image is used.
- `price`: the real quoted selling price; use null if it needs confirmation.

Unknown data must remain unknown. Do not put illustrative configurations into the live inventory. Run `npm run check` after every update.

## Validation and review limits

`npm run check` validates generated landing/product pages, links, analytics requirements and the full Node/jsdom suite. New integrity tests compare every normalized offer with its original price and ID; exercise universal categories, empty results, typo tolerance, filter intersections, unknown/missing prices, grouped cards and all three flow URLs. Existing DOM journey tests cover actual selection, colours, Buy, EasyBuy, Swap, financing, WhatsApp and attribution.

Visual browser verification remains blocked in the work environment: Chromium download returned an invalid archive; the connected browser could not reach the local server, and the cloud browser blocked the local preview. No before/after screenshots or successful viewport measurements are claimed. Before merge, run `npx playwright install chromium` then `npm run test:browser` (screenshots are captured per width in `test-results/`). Run the Playwright suite and inspect 320, 375, 390, 768 and desktop widths. The 60-second objective needs real timed usability testing; it is not a measured result of this change.
