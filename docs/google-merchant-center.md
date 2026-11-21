# Google Merchant Center — setup and status

Branch `feature/google-merchant-center-integration`. Nothing here has been submitted to Google. Account creation, website verification and product approval only happen in Merchant Center, and none of them is confirmed yet.

## What the website now provides

| Item | Where |
|---|---|
| Product feed (RSS 2.0 / XML, Google namespace) | `https://www.mikeegadget.com.ng/google-merchant-feed.xml`, available once this branch is live. Preview: `https://mikeegagdget-mvh7492jo-michealshoe2000s-projects.vercel.app/google-merchant-feed.xml` (Vercel login required) |
| Live structured data on every product page (`ProductGroup` → `Product` → `Offer`) | Rendered at the edge from Supabase (`middleware.js`) |
| Availability per variant (in stock / out of stock / pre-order / backorder) | Admin → Prices & products → Product details |
| Google Shopping report (counts, exclusions, warnings, last feed generation) | Admin → Google Shopping |
| Product-by-product eligibility list | `docs/merchant-eligibility.csv` (`node scripts/merchant-report.mjs`) |

### How the feed works
- **Data sources:** prices, availability, condition, colours and variants are read directly from Supabase (`shop_deal_catalogue()`). The page address and website photos come from the built product pages.
- **Item IDs:** one item per variant and colour, with a stable ID (`MG-` + 16 hex characters). Hot Deals are sent as `sale_price`.
- **Variant grouping:** variants are grouped per product and condition (`item_group_id`), with the storage sent as `size`.
- **Excluded items:** an item is left out (never sent half-complete) when it has:
  - no price;
  - no product page, or a variant that isn't on the page;
  - an unconfirmed condition;
  - no availability;
  - a pre-order or backorder without a date;
  - no legitimate photo.
- **Photos:** a photo approved in admin with its source and permission is always used. Otherwise the website photo is used, unless it is on the hold list: possible wrong model, devices in cases, or a manufacturer image without confirmed permission.
- **Caching and outages:**
  - The CDN caches the feed for 1 hour and may serve it while refreshing.
  - If Supabase is down, or the feed would be empty, the address answers **503** instead of an empty feed. A failed fetch does not delete your products in Merchant Center; the last successful fetch stays in place.
- **Last generation:** every successful generation is recorded (`shop_merchant_feed_status`) and shown in admin.
- **Security:** only public catalogue data is in the feed. The service-role key stays on the server.

## Database changes (applied to Supabase on 21 Nov 2026)
Migration `20261121130000_merchant_center.sql` is additive:
- **New table `shop_merchant_feed_status`:** the last feed generation. It is server-only.
- **New table `shop_availability_changes`:** a log of availability changes.
- **Availability:**
  - What changed: the existing field `product_data.stockStatus` was set to `in_stock` on **all 349 enabled, priced variants**, following your rule that every product currently offered can be fulfilled through suppliers.
  - What was left alone: no variant had a status before, so no exception was overridden, and the 254 hidden variants were not touched.
  - Unchanged: prices.
  - Logging: each change was recorded with the reason "Owner confirmed supplier fulfilment".
- **Rollback:** `supabase/merchant-center-rollback.sql` clears only the statuses set by this change that nobody has edited since.

From now on, changing availability in admin records who confirmed it and when. If a supplier can no longer supply an item, set it to **Out of stock**. Google receives the change at its next fetch, and the website changes immediately.

## Counts (live catalogue, 21 Nov 2026)
| | Count |
|---|---:|
| Catalogue variants (enabled) | 349 |
| In stock | 349 |
| Feed items sent (one per colour) | 143 |
| Variants with at least one item sent | 135 |
| Products with at least one item sent | 51 of 177 |
| Items left out | 216 (214 variants) |

Why items are left out (one item can have several reasons):

| Reason | Items |
|---|---:|
| No product photo | 182 |
| Photo held: phones shown inside cases (iPhone 18 Pro / Pro Max) | 11 |
| Photo held: Apple support-site image, permission not confirmed | 6 |
| Photo held: Apple product image, permission not confirmed | 5 |
| Photo held: may show a different Pixel model (Pixel 11 Pro XL) | 2 |
| Condition not confirmed ("Confirm condition", Samsung) | 14 |

Warnings (still sent):
- 143 items use website photos that are not yet approved in admin with source and permission.
- 68 new items have no GTIN. Google may show them less often, and no GTINs were invented.

## Delivery prices on Google (limitation and recommendation)
- **What Merchant Center supports for Nigeria:** regions by state for regional availability and pricing only. It lists **no region-based shipping costs** for Nigeria. Google therefore cannot show your Lagos LGA prices or your per-state transport-park prices.
- **What the integration does:**
  - It sends one Nigeria-wide delivery price equal to your **highest delivery fee, ₦15,000** (calculated automatically from the delivery price table).
  - Google's figure is therefore never lower than what a customer pays.
  - Most customers pay less at checkout: ₦5,000–₦10,000 in Lagos and ₦8,000–₦15,000 for parks.
  - Your website fees, park rules and pickup/reservation are unchanged.
- **Discrepancy to know about:** Google will show ₦15,000 to Lagos shoppers who will actually pay ₦5,000–₦10,000. Charging less than advertised is not misleading, but it may reduce clicks. This is the most accurate setting Merchant Center allows for Nigeria today.
- **FCT (Abuja):** it has no delivery price, so the website does not deliver there. A Nigeria-wide shipping setting implies delivery to Abuja. Either set an FCT price in Admin → Delivery prices (₦15,000 or less keeps the ₦15,000 figure correct), or accept that Abuja shoppers could see the product and then be unable to order delivery. Until then, Google shipping is **not fully compliant for FCT**.
- **Store pickup:** free pickup is not advertised as free shipping. Showing pickup on Google needs a separate local-inventory setup (not included).

**Manual setting in Merchant Center (only if you prefer account-level shipping to the feed value):** Settings → Shipping and returns → Shipping → add a service:
- Name: `Delivery`
- Country: Nigeria, currency NGN
- Price: flat **₦15,000**
- Delivery times: leave blank unless you can commit to them; the website promises none

The feed already carries this value per item, so this step is optional.

## Return policy
- **Your policy:** refunds or replacement only for factory defects, faults present at delivery or wrong items, within 7 days; no change-of-mind returns.
- **Why it's not in the structured data:** Google's return-policy fields cannot express "defects only".
- **Recommended Merchant Center setting:** Settings → Shipping and returns → Returns → **No returns accepted**, with your policy page `https://www.mikeegadget.com.ng/returns-refunds/` as the policy URL. This is the honest choice for "no change-of-mind returns"; defect replacements fall under your warranty.
- **Before you save:** confirm the wording in Merchant Center, because Google's options may change.

## Steps you must do in Merchant Center
1. **Create or connect the account.** Go to merchants.google.com and sign in with the business Google account.
   - Business name: Mikee Gadget Plug.
   - Business address: 1 Ola Ayeni Street, Off Simbiat Abiola Way, Computer Village, Ikeja, Lagos.
   - Country: Nigeria.
2. **Verify and claim mikeegadget.com.ng** under Settings → Business info → Website. Choose verification by Google Search Console (easiest if you have it), a DNS TXT record at your domain registrar, or an HTML meta tag. I can add a meta tag to the site if you send me the code Google gives you.
3. **Add the product source.** Products → Add products → Add products from a file → **Enter a link to your file**:
   - URL: `https://www.mikeegadget.com.ng/google-merchant-feed.xml`
   - Country: Nigeria; language: English; currency: NGN
   - Schedule: daily (or "Update and fetch now" for the first run)
   - Leave "Add products automatically from your online store" **off** so products are not duplicated. If offered, "automatic item updates" (price/availability from the page) can stay on; the page data matches the feed.
4. **Delivery.** Use the feed value (nothing to do), or add the account-level service above. Decide on FCT (see above).
5. **Returns.** Set the return policy as described above.
6. **Free listings.** Settings → Apps and services, or Marketing → **Free product listings**, and turn on free listings for Nigeria where offered.
7. **Diagnostics.** Products → Needs attention. Expect warnings for missing GTINs on new devices and possibly for image quality. Fix items in admin; the feed updates on the next fetch.
8. **Disapprovals.** For each issue Google lists, open Admin → Google Shopping to see whether the item is left out on our side, fix it there (photo, availability, condition), then use "Update and fetch now" on the data source. Common causes:
   - price mismatch: the feed and page now use the same live data;
   - missing identifiers: add a GTIN from the box in Product details;
   - image policy: approve a clean photo.

## Merchant API — evaluated, not used
Scheduled fetch of the feed URL updates daily, with no Google credentials stored on our side. It also needs no extra serverless function (the Vercel Hobby plan is at its 12-function limit). The Merchant API would add real-time pushes but needs OAuth credentials, a service account and another function. It is worth revisiting only if prices or availability start changing several times a day.

## Remaining issues before Google can approve everything
1. **Photos:** 126 products have nothing in the feed, mostly because they have no photo. Add real photos and approve them in admin with source and permission.
2. **Held photos:** Apple images without confirmed permission, the iPhone 18 photos with cases, and the Pixel 11 Pro XL photo. Approve a replacement photo in admin to release each product.
3. **Unconfirmed condition:** 14 Samsung variants marked "Confirm condition".
4. **FCT delivery price** (see Delivery).
5. **GTINs:** add them for new devices where you have the box.
6. **Account steps:** account, website verification, returns setting, free listings and Google's review are not done yet. Nothing is approved until Google says so.
7. **Older product-page wording:** "Nationwide delivery", "Lagos & nationwide" and "above 83%" are fixed in PR #48. Merge that PR too, so the visible pages match the delivery prices.
