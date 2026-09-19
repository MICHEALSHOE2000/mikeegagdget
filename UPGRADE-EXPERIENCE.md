# Simple buying flow

The original homepage structure remains the foundation: Inter typography, dark/gold/green accents, the phone carousel, shop imagery, original navigation and trust sections are preserved. Homepage search and the phone grid now use the central catalogue. The homepage and deals cards lead to `/buy/`. Existing `/phone-swap/` and `/easy-buy/` links open the same flow with the relevant choice selected. Product pages preserve model and storage when entering the flow.

1. Choose a phone model and storage/colour offer.
2. Buy, or swap and answer the phone-condition questions.
3. Pay outright, or choose a 7.5% credit-check / 20% no-credit-check Easy Buy plan.

Customers send the prepared quote themselves through WhatsApp. The site does not run credit checks, approve loans, collect payments or store applications. On mobile the quote appears before the final action, avoiding a separate calculator page.

## Merchant rules

`commerce/price-list.mjs` contains all 85 supplied price options across 36 models, converted from thousands to naira. iPhone 13 256GB is split into Pink / White (₦400,000) and Other colours (₦390,000). Models without supplied prices remain enquiry-only. The list replaces old prices, including the erroneous older iPhone 15 Pro 512GB entry. Every supplied base price has a programmatic 5% selling markup for purchase display; swap valuation always uses the unmarked base price. There are no invented sale discounts or persistent low-stock claims.

Swap calculation: original listed price × (100% − total deductions).

- Used phone: 40%.
- Changed screen: another 10 percentage points.
- Changed battery: another 5 points.
- Changed back glass: another 2 points.
- Face ID not working: another 8 points.

Deductions are additive against the original listed price, not compounded. The iPhone X 64GB at ₦140,000 is valued at ₦84,000 normally, ₦70,000 with a changed screen, ₦63,000 with changed screen and battery, ₦60,200 with a changed back glass too, and ₦49,000 with all those plus failed Face ID. Phones manufactured without Face ID do not incur that deduction; phones without glass backs do not incur a back-glass deduction. A cracked screen shares the 10% screen deduction, and cracked back glass shares the 2% back-glass deduction; changed + cracked is still deducted once. The flow asks those separately and updates the quote live. Values remain subject to inspection. A negative top-up is never displayed; any surplus needs an explicit agreement.

Financing options: 7.5% monthly with a credit score check and 20% monthly without one. Both apply flat monthly interest to the remaining financed balance after the deposit. The calculator retains the existing 40% starting deposit and 1–3 month duration from the repository, allows a larger deposit, and labels them as planning terms subject to platform confirmation. Provider names and an API were not supplied, so applications go through WhatsApp. No-credit-check is not represented as guaranteed approval.

For swap + finance, the planning calculation subtracts trade-in value first and then applies the deposit to the remaining top-up. Combining swap and financing requires confirmation by the platform; this qualification is shown in the flow. Delivery and separately quoted fees are excluded. Whole-naira repayments reconcile exactly, with rounding adjusted in the final instalment.

## Editing and building

- `commerce/price-list.mjs`: supplied prices and colour-specific offers.
- `commerce/catalog.mjs`: product catalogue, specs, imagery and store contact details.
- `commerce/upgrade-core.mjs`: exact swap and financing calculations.
- `easy-buy/easy-buy-core.mjs`: platform rates and legacy calculator compatibility.
- `scripts/generate-upgrade-pages.mjs`: home, deals and shared three-step markup.
- `assets/buy-flow.js`: step navigation, selections, validation, live quote and WhatsApp message.
- `assets/upgrade.js` / `assets/upgrade.css`: shared navigation, deal filters and visual styling.

Run `npm run check` to regenerate and validate the site. Edit generators rather than generated HTML. Tests cover the supplied valuation example, all deduction combinations, old-model exclusions, cracks, missing prices, colour pricing, finance calculations, invalid deposits and reconciliation across the priced catalogue.

Validation completed: `npm run check` passed (97 HTML pages, 10 calculation/price tests). Chromium checks passed at 1440px, 390px and 320px for all new routes and wizard stages, with no JavaScript errors, broken images or horizontal overflow. Checked condition validation, the exact cumulative X example, older models without Face ID, cracks, duplicate-deduction prevention and manual-price handling, both platforms, deposit errors, colour pricing, product deep links, deal filtering/reset and WhatsApp contents including campaign attribution.
