# Search and AI-search visibility: audit and fixes (22 Nov 2026)

**Scope:** www.mikeegadget.com.ng, covering Google, Bing, ChatGPT Search (OAI-SearchBot / ChatGPT-User) and other AI search engines.

**Method:**
- Every generated page in the repository was audited by script (`/home/claude/seo/audit.mjs` during the work; the same checks now live in `tests/seo.test.mjs`).
- The live production site was fetched for status codes, headers, redirects and server-rendered HTML.
- The Vercel project, domain and firewall settings were checked.

Problems are labelled:
- **Confirmed:** seen on the live site or in the built pages.
- **Possible:** a risk that needs data I couldn't access, such as Search Console or field Core Web Vitals.

## 1. Crawler access

| Check | Result |
|---|---|
| `robots.txt` (live) | `User-agent: * / Allow: /` plus the sitemap. Nothing blocks Googlebot, Bingbot, OAI-SearchBot or ChatGPT-User. ✅ |
| `X-Robots-Tag` on www.mikeegadget.com.ng | Not present (checked on `/robots.txt` and `/iphone-15-pro-max/`). ✅ The `noindex` header only appears on `*.vercel.app` deployment addresses, which is expected. |
| Apex domain | `mikeegadget.com.ng/...` gives a **308** to `www.` ✅ |
| Vercel firewall | No custom rules or bot blocking; the default firewall applies. ✅ |
| Vercel deployment protection | Applies to `*.vercel.app` only; custom domains are public. ✅ |
| Product HTML without JavaScript | Product pages are rendered at the edge with live prices and Product schema in the first response (`x-mg-render: product`). ✅ |

**Change:** `robots.txt` now also disallows private paths (`/admin/`, `/api/`, `/checkout/`, `/cart/`, `/account/`, `/buy/`). All public pages stay open to every crawler, and no crawler is singled out.

## 2. Indexing

### Confirmed problems (fixed)

1. **The sitemap listed pages that shouldn't be indexed.**
   - `/buy/` has `noindex`.
   - `/easybuy/` and `/easy-buy/` are aliases of Pay Small Small.
   - `/swap/` is a duplicate of `/phone-swap` (same title and content).
   - `/financing/`, the real Pay Small Small page, was missing.
   - *After:* `sitemap.xml` is rebuilt on every build from the pages themselves. It lists only pages that are indexable, point canonical to themselves and aren't redirected. That's 262 URLs, including the new `/about/`, `/faq/` and `/contact/`, and `/financing/`. A test enforces this.
2. **Duplicate pages.** `/swap/` and `/phone-swap` had the same title and content, both canonical to themselves.
   - *After:* `/swap/` points its canonical at `/phone-swap`; `/easybuy/` and `/easy-buy/` point at `/financing/`.
3. **Category pages showed only 8 products to crawlers.** For example, Samsung has 60 models but only 8 were in the HTML; the rest loaded with JavaScript.
   - *After:* every category page carries an `ItemList` of all its models, plus a collapsed "See all N models in this category" link list. The design is unchanged until a shopper opens it.

### Possible problems (not changed — need a decision or data)

- **Trailing-slash duplicates.** `/iphone-15-pro-max/` returns 200 as well as `/iphone-15-pro-max`. The canonical consolidates them, so this is low risk. A trailing-slash redirect rule would remove it, but it touches every route, so it needs a separate, careful change.
- **Empty category pages.** `/laptops`, `/shop/laptops/` and `/shop/macbooks/` list no products. Google may treat them as thin or soft-404 pages. Either add stock or consider `noindex` until stock arrives.
- **`/cheap-iphones` sort order.** It shows the newest, most expensive iPhones first, which doesn't match the page's intent. It needs a decision on what "cheap" means (a price ceiling).
- **Core Web Vitals.** Field data (CrUX) couldn't be read from here. Local lab checks on mobile (iPhone 13 viewport) for the home, product, category, FAQ, About and Contact pages showed CLS 0, LCP under 0.6 s locally and no horizontal overflow. Check real-user data in Search Console → Core Web Vitals.

## 3. Structured data

| | Before | After |
|---|---|---|
| Business entity | `LocalBusiness` + `Store` on 107 pages; **no `Organization`, no `legalName`** | One graph sitewide:<br>• `Organization` (name, **legalName MIKEEGADGETS & COMMUNICATIONS LIMITED**, alternate names, logo, contact point, address, 7-day `MerchantReturnPolicy`)<br>• `WebSite` with `SearchAction`<br>• `MobilePhoneStore`/`ElectronicsStore` linked to the organization (geo, payment methods, area served) |
| Product | Live `ProductGroup`/`Product`/`Offer` from Supabase at the edge (price, availability, condition, shipping) ✅ | Unchanged (already correct) |
| Categories | `Store` only | Plus `ItemList` of every model |
| Breadcrumbs | `BreadcrumbList` on 155 pages ✅ | Unchanged |
| FAQ / About / Contact | — | `FAQPage`, `AboutPage`, `ContactPage` |

No ratings, reviews, founding date or closing time were added, because none of these are verified.

## 4. Product pages

**Confirmed problem (fixed): the search snippet showed a different price from the page.**
- *Before* (live, iPhone 15 Pro Max):
  - meta description: "…(256GB) for **₦940,000**…"
  - visible price and Product schema: **₦846,000** (Hot Deal)
- *After:* the edge renderer rewrites the meta, Open Graph and Twitter descriptions to the live price. It also updates the browser's variant data with live prices.

**Confirmed problem (fixed): buyer FAQs dodged the price question.**
- *Before:*
  - "Select your exact storage… to see its listed price."
  - "…use WhatsApp to request today's price."
- *After:* both the visible FAQ and the FAQ structured data quote the live price:
  - "The iPhone 15 Pro Max currently costs ₦846,000 (256GB, UK Used)…"
  - "The iPhone 15 Pro Max 256GB is ₦846,000 (UK Used)."
- These are the answers AI search engines lift.

**Other FAQ and fact changes:**
- The UK-used answer now states the owner's facts: battery health above 85% and working Face ID.
- The swap answer points to the swap estimate.
- **"Battery health above 83%" became "above 85%"** sitewide, following the owner's confirmation on 21 Nov 2026.

Titles, H1s, canonicals and image alt text were already unique and correct; this is now enforced by tests. 109 images have empty `alt`. These are decorative thumbnails inside labelled buttons, which is correct.

## 5. Brand discoverability

- **New pages:**
  - `/about/`: trading name ↔ MIKEEGADGETS & COMMUNICATIONS LIMITED, what we sell, how we sell, location.
  - `/contact/`: phone/WhatsApp, email, address with map, opening time.
  - `/faq/`: 14 real buyer questions with verified answers.
- They're linked from the footer and the policy navigation. Delivery, Warranty and Returns are linked from all three.
- **`/llms.txt`:** a plain summary of the store with links to key pages. It's optional and not an official standard, but it's cheap, accurate and harmless.

## 6. ChatGPT product feed (prepared, not uploaded)

- **Spec reviewed:** OpenAI's product feed spec (developers.openai.com/commerce/specs/file-upload/products).
  - Required fields: `item_id`, `title`, `description`, `url`, `brand`, `seller_name`, `image_url`, `availability`, `price` ("846000.00 NGN"), `target_countries`, `store_country`.
- **Endpoint:** `GET /openai-product-feed.jsonl`, rewritten to `/api/shop/catalog?format=openai`. It returns JSONL, one row per variant.
  - It's built from **exactly the same eligible items as the Google Merchant feed**, so prices are never changed or invented.
  - Hot Deals go in `sale_price`; condition is new/used; variants are grouped.
  - Seller, privacy, terms and return-policy URLs are included. `is_eligible_checkout` is `false`.
  - It answers **503** rather than an empty feed if Supabase is down, and is `noindex`.
- **Validation** against the live catalogue snapshot: **143 rows, 0 spec errors.** 216 variants are excluded, the same as the Google feed. The main reason is **no approved product photo (182)**; the others are unconfirmed condition (14) and photos waiting for approval (24).
- **Possible issue:** images are WebP. The spec's example formats are JPEG/PNG, and WebP acceptance isn't stated. If OpenAI rejects them during onboarding, JPEG copies are needed.
- **Not done:** nothing has been uploaded or connected. Onboarding is by application at chatgpt.com/merchants and needs your approval.

## 7. What you need to do outside the code

1. **Google Search Console** (search.google.com/search-console):
   - Add a *Domain* property for `mikeegadget.com.ng` (verify with a DNS TXT record).
   - Submit `https://www.mikeegadget.com.ng/sitemap.xml`.
   - Use URL Inspection → *Request indexing* on `/`, `/iphones`, `/faq/` and two product pages.
   - Watch *Pages*, *Merchant listings* and *Core Web Vitals*.
2. **Bing Webmaster Tools** (bing.com/webmasters):
   - Choose *Import from Google Search Console*, or verify by DNS.
   - Submit the sitemap.
   - Bing's index also feeds several AI assistants.
3. **Google Business Profile:**
   - Claim or verify the store with exactly the same name, address and phone as the site.
   - Add opening hours, **including closing time** (which I don't have).
   - Ask real customers for reviews; this is the honest route to ratings.
4. **ChatGPT merchants** (chatgpt.com/merchants):
   - Apply when you're ready.
   - After approval, give OpenAI the feed URL `https://www.mikeegadget.com.ng/openai-product-feed.jsonl`.
5. **Admin → Google Shopping:**
   - Approve or add photos for the 182 variants without one.
   - Confirm the condition for the 14 "Confirm condition" variants.
   - This single step adds the most products to Google Shopping and ChatGPT.

## 8. Priority plan

| Priority | Action | Why |
|---|---|---|
| 1 | Merge this PR; submit the sitemap in Search Console and Bing | Gets the corrected sitemap, canonicals and structured data read |
| 1 | Approve or add product photos and confirm conditions in admin | 216 of 359 variants are invisible to Google Shopping and ChatGPT feeds |
| 1 | Google Business Profile with hours | Local "phone shop in Computer Village" searches and AI answers lean on it |
| 2 | Apply to ChatGPT merchants with the prepared feed | Direct product listing in ChatGPT shopping |
| 2 | Add GTINs for Brand New products | Better matching in Google and ChatGPT |
| 2 | Decide on the empty category pages and the `/cheap-iphones` intent | Avoid thin pages |
| 3 | A monthly "Phone prices in Nigeria" page generated from the catalogue (by model and condition) | The most-asked question type; AI engines quote current price tables |
| 3 | Comparison guides (e.g. iPhone 15 Pro Max vs S24 Ultra) from catalogue facts | Matches how people ask ChatGPT |
| 3 | Trailing-slash redirect rule | Removes the remaining duplicate URL forms |
