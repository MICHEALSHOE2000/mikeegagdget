# Visual refinement and browser review — 20 September 2026

Continues `feature/premium-storefront` from remote commit `901fb08`, retaining the static generators, catalogue, promotion rules, routes and calculation modules.

## Changes

- Restored the BUY graphic and brought a real product photograph into the mobile hero. The desktop feature price comes from the same promoted catalogue as the product page.
- Introduced a warm neutral Hot Deals section, larger swipeable deal photography, stronger category imagery and a distinct green Swap section.
- Simplified product purchase surfaces, restored usable mobile gallery thumbnails and aligned the product header with the black/gold identity.
- Reduced spacing in mobile EasyBuy and Swap screens. Removed the retail selling price from the customer's current-phone summary, so it cannot be mistaken for their swap valuation. Valuation mathematics are unchanged.
- Replaced the blank Accessories asset through the central image mapping. Category enquiry buttons now precede the detailed information.
- Corrected the local Vite preview's static directory routing. Production remains the existing generated static site on Vercel.

## Verification

`npm run check` passes: syntax checks, production build, validation of 110 HTML files/local links/tracking hooks, and all 17 tests. The original calculation tests pass without changes.

Chromium review used the internal preview and the repository's responsive review page. Home, iPhone 14 Pro Max, the unpriced iPhone 13 Pro Max, EasyBuy, Swap, Deals, Samsung and Laptops were measured at 320, 360, 375, 390, 412, 430, 768 and 1440 px. EasyBuy and Swap result screens were also measured at all eight widths. No document horizontal overflow was reported. On mobile, body padding clears the bottom navigation by 10 px, plus the safe-area adjustment.

Screenshots were inspected for the mobile and desktop homepage, tablet hero, product purchase area, mobile EasyBuy/Swap, categories and the store section. Final 320 px product review confirms that the image, name, price, storage and all three purchase choices remain distinct; gallery thumbnails are operable without covering the name or price.

Browser interactions verified:

- Instant `13 pro` search, empty results, Samsung search and navigation.
- Product image switching, 256GB selection, Brand New selection and corresponding Buy/EasyBuy URLs.
- Deals search, empty state, reset, and a 256GB offer opening the correct product storage.
- An intentionally missing product image retains its dimensions, fallback label and purchase link.
- EasyBuy rejects a zero deposit. A ₦625,800 phone with ₦250,320 deposit over three months at 7.5% produces ₦153,321 monthly, ₦84,483 interest and ₦710,283 total including deposit; the WhatsApp quote agrees.
- Swap rejects incomplete choices, asks six separate condition questions, values an unchanged iPhone X 64GB at ₦84,000, and quotes ₦541,800 to add for the promoted iPhone 14 Pro Max 128GB. The WhatsApp message preserves the actual answers.
- Product-to-EasyBuy navigation carries storage, condition, campaign source and campaign name through to the WhatsApp quote. Messages were inspected without sending them.

No financing or valuation formula was replaced. No analytics credentials, reviews, sales counts or premises photos were invented. Field Core Web Vitals require traffic measurements; the browser review is not a claim of measured production performance.

The Vercel preview remains subject to its existing sign-in protection. The live production branch has not been merged as part of this refinement.
