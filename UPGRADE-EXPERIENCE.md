# Buy, swap and finance experience

Run `npm run check` to regenerate pages and validate the catalogue, local links and quote calculations. This is a static website. WhatsApp enquiries are prepared in the browser and sent only when the customer opens WhatsApp and sends them. No loan is approved, payment collected or customer application stored by this website.

## Editing the site

- `scripts/generate-upgrade-pages.mjs`: homepage, `/phone-swap`, `/easy-buy/`, `/deals/`, explanatory copy and shared navigation. These HTML files are generated; edit the generator, not its output.
- `assets/upgrade.css`: responsive visual design.
- `assets/upgrade.js`: selections, filters, result panels, payment schedule and WhatsApp handoff.
- `commerce/catalog.mjs`: catalogue prices, images, models and store contact details. Prices needing extra confirmation are excluded from the new tools and deals cards. Missing prices/finance eligibility use manual enquiries.
- `commerce/upgrade-core.mjs`: indicative swap assumptions and finance schedule reconciliation.
- `easy-buy/easy-buy-core.mjs`: existing deposit and repayment factors. Product calculators now import this calculation too.

## Confirm before launch

The repository's existing **40% deposit and 20% monthly flat cost on the financed balance** are preserved. Factors are 1.2 / 1.4 / 1.6 for 1 / 2 / 3 months. These conflict with a previously discussed 7.5% offer; this draft does not silently replace them. Confirm the final offer, deposit tiers and any additional fees, then update the shared core, explanatory copy and legacy campaign pages together. Changing financial terms needs corresponding calculation test updates.

The swap model is an explicitly labelled **planning assumption, not an approved buy-back price list**: excellent 65–75%, good 55–65%, fair 40–50% of the catalogue guide price; low battery deducts eight percentage points. Values are rounded down to thousands. Replace with approved variant-specific buying prices when supplied. No quote is calculated for known faults, repairs, locks, unknown battery condition or missing prices. Inspection may produce a value outside the estimated range. Surplus value does not promise cash back.

Deals are catalogue budget/upgrade picks, without invented discounts, stock levels, countdowns or crossed-out prices. Confirm present-day price and condition on WhatsApp. Samsung and Pixel remain available through manual price/finance enquiries.

Finance and swap estimates are separate: combining trade-in credit and financing requires an approved agreement. Financing shows deposit, flat cost, balance repayment, total paid and a reconciled instalment schedule. Four weekly or two twice-monthly payments per planning month are illustrative; actual due dates are confirmed after approval. The last instalment absorbs whole-naira rounding.

## Validation

`npm run check` covers JavaScript syntax, generation, 82 HTML pages and local asset/link references, plus swap and financial edge cases. Browser interaction checks, when available, should cover 320px, 390px and desktop viewports; model/storage deep links; filter reset and empty states; faulty/locked phone fallback; changing finance eligibility/frequency; and WhatsApp quote contents.

Browser validation completed at 1440px, 390px and 320px using Chromium: no horizontal overflow, broken images or JavaScript exceptions; swap ranges and faults/locks; finance schedule totals and unsupported-model fallback; search, budget, sorting and reset; selected storage carried from product pages; mobile navigation and Escape close all passed.
