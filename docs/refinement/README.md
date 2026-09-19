# Storefront refinement — 19 September 2026

Continues `feature/premium-storefront` from `9576b20`.

The homepage keeps its BUY headline, Inter typography, black/gold/green identity and existing shopping routes. This pass restores dark purchase cards and the trust banner, creates a varied desktop category grid and swipeable mobile rail, adds Laptops and an iPhone Series filter, moves contact actions below shopping, and adds a concise explanation of the existing payment plans.

Legacy reveal styles no longer hide content while waiting for JavaScript. Product and category photography now share `commerce/product-images.mjs`; hero photographs also resolve through that mapping. Below-fold imagery remains lazy loaded, only eight models render initially, and Vercel image caching is explicit. Unconfirmed iPhone 18 listings keep null prices and photo placeholders without asserting specifications, stock or financing eligibility.

## Verification

- `npm run check`: JavaScript syntax checks, production page generation, 107 HTML files and local links, and all 10 existing swap/finance tests passed.
- Rendered homepage, product, category, buy/swap, EasyBuy and deals pages checked at 320, 375, 390, 430, 768 and 1440 px; no horizontal overflow.
- Search, Series/storage/budget/category filters, method selection, menu, empty results, image failure recovery and catalogue-fetch fallback checked in Chromium.
- Swap condition deductions, 7.5%/20% finance calculations, deposit validation and model/storage/condition-specific WhatsApp messages checked in the browser.
- Categories and initial product links remain visible without JavaScript; category links have real page destinations.
- Unique model IDs, 11 categories, newest-first order and unconfirmed model data checked.

This is a static HTML/JavaScript site, so there is no TypeScript compile or framework hydration step. The changes preserve the existing calculation modules and SEO route structure. Final HTML is generated from the templates and data; edit those sources and run `npm run build`.

Better merchant photographs can replace the temporary existing images in the central mapping. Supplied prices are unchanged.
