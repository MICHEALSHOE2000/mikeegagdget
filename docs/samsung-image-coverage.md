# Samsung smartphone image coverage

Generated with `node scripts/audit-samsung-images.mjs` from the active catalogue and `commerce/samsung-image-sources.json`.

- Samsung phone listings: 66
- Distinct models: 51
- Listings updated with photographs: 37
- Models with selected photographs: 31
- Distinct photos added: 61
- Local WebP assets (160/360/720 widths): 183
- Combined asset size: 4.74 MiB
- Remaining placeholder listings: 29 (20 models)

## Permission and source review — 12 October 2026

The merchant confirmed that Neostore and Revenes gave permission to reuse their photos and explicitly instructed integration. This supersedes the original permission blocker. The confirmation is recorded as merchant-provided, not an independently reviewed written licence.

Neostore's normal public page request succeeded after the web search retrieval tool could not access it. Product records and image URLs were read from the page's embedded catalogue data. Both the foreign-used and brand-new Samsung categories were reviewed. No access restrictions were bypassed. Revenes continued to return HTTP 403/bot verification, so none of its images were copied.

Selected photographs were checked against source model titles and visually reviewed. Existing photographs were not overwritten. No source prices, conditions, storage, stock or commercial terms were copied. Colours in photographs illustrate the model; existing stock-confirmation copy remains in place. The explicitly Black Z Fold 7 listing uses the black device only. Photos do not establish the condition or accessories of Mikee's exact stock unit.

Source data contained incorrect images: an Ultra in the S21 listing, a non-Ultra in the S25 Ultra listing, an Ultra in the S25 listing, and an A55 box in the A56 listing. These were excluded. Mixed A-series box photos were excluded. Fold8 Ultra artwork was rejected because the exact variant could not be verified and some artwork was watermarked. No generated device imagery was used.

## Catalogue wiring

- `commerce/retail-inventory.mjs` holds the primary image and optional additional `gallery` paths, with no more than three photos passed to the existing detail gallery.
- Cards, search, details and Buy Outright/EasyBuy/Swap data retain their existing shared catalogue path.
- Local files follow the existing responsive WebP naming conventions. All 160/360/720 variants exist. Only Samsung image fit is scoped to `contain`; card and page geometry remain unchanged.
- Each selected original image URL, source product ID, dimensions and SHA-256 is recorded in the JSON manifest. Validation results are recorded in `docs/samsung-image-validation.md`.

## Models still requiring exact photographs

- Samsung Galaxy S25 Edge
- Samsung Galaxy S25 FE
- Samsung Galaxy S24 Plus
- Samsung Galaxy S23 Plus
- Samsung Galaxy S20 FE
- Samsung Galaxy Z Fold 8 Ultra
- Samsung Galaxy Z Fold 8
- Samsung Galaxy A27
- Samsung Galaxy Z Fold 4
- Samsung Galaxy Z Fold 3
- Samsung Galaxy Note 20
- Samsung Galaxy A05
- Samsung Galaxy A13
- Samsung Galaxy A14
- Samsung Galaxy A15
- Samsung Galaxy A52
- Samsung Galaxy A53
- Samsung Galaxy A71
- Samsung Galaxy A70
- Samsung Galaxy A90

These models retain their neutral placeholders. They had no verified usable match in the reviewed accessible Neostore categories; Revenes retrieval remained blocked. Do not substitute nearby models.

## All Samsung phone listings

| Model | Listing slug | Condition | Storage/variant labels | Listed colours | Image status |
|---|---|---|---|---|---|
| Samsung Galaxy S26 Ultra | samsung-s26-ultra | Brand New | 1TB, 512GB · Warranty, 256GB · Warranty, 256GB · International Warranty, 512GB, 256GB | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy S26 Plus | samsung-s26-plus | Brand New | 512GB · 12GB RAM, 256GB · 12GB RAM | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy S26 | samsung-s26 | Brand New | 256GB · 12GB RAM, 512GB · 12GB RAM | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy S25 Ultra | samsung-s25-ultra | Brand New | 256GB, 512GB, 1TB | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy S25 Plus | samsung-s25-plus | Brand New | 256GB, 512GB | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy S25 | samsung-s25 | Brand New | 256GB · 8GB RAM | Ask for today’s available colours | 1 local photos |
| Samsung Galaxy S25 Edge | samsung-s25-edge | Brand New | 256GB, 512GB | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy S25 FE | samsung-s25-fe | Brand New | 256GB · 8GB RAM | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy S24 Ultra | samsung-s24-ultra | Confirm condition | 512GB, 256GB | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy S24 Plus | samsung-s24-plus | Confirm condition | 256GB | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy S23 Ultra | samsung-s23-ultra | Confirm condition | 512GB, 256GB | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy S23 Plus | samsung-s23-plus | Confirm condition | 256GB | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy S23 | samsung-s23 | Confirm condition | 256GB, 128GB | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy S22 Ultra | samsung-s22-ultra | Confirm condition | 256GB, 128GB | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy S22 Plus | samsung-s22-plus | Confirm condition | 256GB, 128GB | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy S22 | samsung-s22 | Confirm condition | Standard | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy S21 Ultra | samsung-s21-ultra | Confirm condition | 256GB, 128GB | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy S21 Plus | samsung-s21-plus | Confirm condition | 256GB, 128GB | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy S21 | samsung-s21 | Confirm condition | Standard | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy S20 FE | samsung-s20-fe | Confirm condition | Standard | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy Z Fold 8 Ultra | samsung-z-fold-8-ultra | Brand New | 1TB · 16GB RAM, 512GB · 12GB RAM · Warranty, 256GB · 12GB RAM · Warranty, 256GB | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy Z Fold 8 | samsung-z-fold-8 | Brand New | 1TB · 12GB RAM · Warranty, 512GB · 12GB RAM · Warranty, 256GB · 12GB RAM · Warranty, 256GB | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy Z TriFold | samsung-z-trifold | Brand New | 512GB · 16GB RAM RAM · Dual SIM | Ask for today’s available colours | 3 local photos |
| Samsung Galaxy Z Fold 7 | samsung-z-fold-7 | Brand New | 1TB, 512GB · Black, 256GB | Black | 1 local photos |
| Samsung Galaxy Z Fold 6 | samsung-z-fold-6 | Brand New | 1TB, 512GB, 256GB | Ask for today’s available colours | 3 local photos |
| Samsung Galaxy Z Fold 6 | samsung-z-fold-6-confirm-condition | Confirm condition | 256GB | Ask for today’s available colours | 3 local photos |
| Samsung Galaxy Z Flip 7 | samsung-z-flip-7 | Brand New | 512GB, 256GB | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy Z Flip 6 | samsung-z-flip-6 | Brand New | 256GB, 512GB | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy Z Flip 6 | samsung-z-flip-6-confirm-condition | Confirm condition | 256GB | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy A07 | samsung-a07 | Brand New | 128GB · 4GB RAM | Ask for today’s available colours | 1 local photos |
| Samsung Galaxy A07 | samsung-a07-open-box | Open Box | Standard | Ask for today’s available colours | 1 local photos |
| Samsung Galaxy A07 | samsung-a07-uk-used | UK Used | Standard | Ask for today’s available colours | 1 local photos |
| Samsung Galaxy A17 | samsung-a17 | Brand New | 128GB · 4GB RAM, 128GB · 4GB RAM 5G, 256GB · 6GB RAM 5G, 128GB · 6GB RAM, 256GB · 8GB RAM | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy A27 | samsung-a27 | Brand New | 256GB · 6GB RAM, 128GB · 6GB RAM | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy A37 | samsung-a37 | Brand New | 128GB · 6GB RAM, 256GB · 8GB RAM | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy A57 | samsung-a57 | Brand New | 128GB · 8GB RAM, 256GB · 8GB RAM | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy A06 | samsung-a06 | Brand New | 64GB · 4GB RAM, 128GB · 4GB RAM | Ask for today’s available colours | 1 local photos |
| Samsung Galaxy A16 | samsung-a16 | Brand New | 128GB · 4GB RAM, 128GB · 6GB RAM, 256GB · 8GB RAM | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy A16 | samsung-a16-open-box | Open Box | Standard | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy A16 | samsung-a16-uk-used | UK Used | Standard | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy A26 | samsung-a26 | Brand New | 128GB · 6GB RAM, 256GB · 6GB RAM | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy A36 | samsung-a36 | Brand New | 128GB · 8GB RAM, 256GB · 8GB RAM | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy A56 | samsung-a56 | Brand New | 128GB · 8GB RAM, 256GB · 8GB RAM | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy Z Fold 5 | samsung-z-fold-5 | Confirm condition | 256GB | Ask for today’s available colours | 2 local photos |
| Samsung Galaxy Z Fold 4 | samsung-z-fold-4 | Confirm condition | 256GB | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy Z Fold 3 | samsung-z-fold-3 | Confirm condition | 256GB | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy Z Flip 4 | samsung-z-flip-4 | Confirm condition | 256GB | Ask for today’s available colours | 3 local photos |
| Samsung Galaxy Note 20 | samsung-note-20 | Confirm condition | 256GB | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy A05 | samsung-a05 | Open Box | Standard | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy A05 | samsung-a05-uk-used | UK Used | Standard | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy A13 | samsung-a13 | Open Box | Standard | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy A13 | samsung-a13-uk-used | UK Used | Standard | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy A14 | samsung-a14 | Open Box | Standard | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy A14 | samsung-a14-uk-used | UK Used | Standard | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy A15 | samsung-a15 | Open Box | Standard | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy A15 | samsung-a15-uk-used | UK Used | Standard | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy A52 | samsung-a52 | Open Box | Standard | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy A52 | samsung-a52-uk-used | UK Used | Standard | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy A53 | samsung-a53 | Open Box | Standard | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy A53 | samsung-a53-uk-used | UK Used | Standard | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy A71 | samsung-a71 | Open Box | Standard | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy A71 | samsung-a71-uk-used | UK Used | Standard | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy A70 | samsung-a70 | Open Box | Standard | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy A70 | samsung-a70-uk-used | UK Used | Standard | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy A90 | samsung-a90 | Open Box | Standard | Ask for today’s available colours | Placeholder; exact photo unverified |
| Samsung Galaxy A90 | samsung-a90-uk-used | UK Used | Standard | Ask for today’s available colours | Placeholder; exact photo unverified |

## Original source URLs for each added photo

The same photo may serve separate condition listings of the exact same model. Only resizing and WebP encoding were applied; no devices were cropped out or altered.

| Model | Main 720px asset | Original image | Source category |
|---|---|---|---|
| Samsung Galaxy Z Fold 7 | /images/store/samsung/samsung-galaxy-z-fold-7-1-720.webp | https://images.neostore.ng/shop/86872936-026b-4a34-b588-eeb15c7731df-WhatsApp%20Image%202026-05-15%20at%206.17.28%20PM%20(2).jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy Z Fold 6 | /images/store/samsung/samsung-galaxy-z-fold-6-1-720.webp | https://images.neostore.ng/shop/ba2cc1ed-6558-4fd5-bfd8-ff280b21aad3-WhatsApp%20Image%202026-05-15%20at%206.15.16%20PM.jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy Z Fold 6 | /images/store/samsung/samsung-galaxy-z-fold-6-2-720.webp | https://images.neostore.ng/shop/214b5170-7bd0-4fd1-995f-052420546cdc-WhatsApp%20Image%202026-05-15%20at%206.15.15%20PM.jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy Z Fold 6 | /images/store/samsung/samsung-galaxy-z-fold-6-3-720.webp | https://images.neostore.ng/shop/55f53c52-6f0e-45d5-a9c8-c64924f5735f-WhatsApp%20Image%202026-05-15%20at%206.15.16%20PM%20(1).jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy Z Fold 5 | /images/store/samsung/samsung-galaxy-z-fold-5-1-720.webp | https://images.neostore.ng/shop/6955c64c-6661-427e-840a-eb99536c48b6-WhatsApp%20Image%202026-05-15%20at%206.12.50%20PM%20(2).jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy Z Fold 5 | /images/store/samsung/samsung-galaxy-z-fold-5-2-720.webp | https://images.neostore.ng/shop/e83cd523-3840-4b14-a36a-77a2b364513f-WhatsApp%20Image%202026-05-15%20at%206.12.50%20PM%20(1).jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy Z Flip 4 | /images/store/samsung/samsung-galaxy-z-flip-4-1-720.webp | https://images.neostore.ng/shop/6f34e6a8-a022-4a11-a2b4-22397b595bd8-WhatsApp%20Image%202026-05-15%20at%206.09.40%20PM.jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy Z Flip 4 | /images/store/samsung/samsung-galaxy-z-flip-4-2-720.webp | https://images.neostore.ng/shop/7c800c48-1eac-4346-9c08-a6a6c589c442-WhatsApp%20Image%202026-05-15%20at%206.09.40%20PM%20(1).jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy Z Flip 4 | /images/store/samsung/samsung-galaxy-z-flip-4-3-720.webp | https://images.neostore.ng/shop/3826b187-7f35-48a9-b341-93047d1124ae-WhatsApp%20Image%202026-05-15%20at%206.09.40%20PM%20(2).jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy S25 Ultra | /images/store/samsung/samsung-galaxy-s25-ultra-1-720.webp | https://images.neostore.ng/shop/74681978-6c1e-4cda-8877-451305455ead-WhatsApp%20Image%202026-05-15%20at%205.58.21%20PM%20(1).jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy S25 Ultra | /images/store/samsung/samsung-galaxy-s25-ultra-2-720.webp | https://images.neostore.ng/shop/c1168c0d-c881-4876-adf0-e92a7140c7c2-WhatsApp%20Image%202026-05-15%20at%205.58.21%20PM.jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy S24 Ultra | /images/store/samsung/samsung-galaxy-s24-ultra-1-720.webp | https://images.neostore.ng/shop/db2b58a7-a4c3-445c-a833-cd059c02a7e2-WhatsApp%20Image%202026-05-15%20at%205.52.29%20PM.jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy S24 Ultra | /images/store/samsung/samsung-galaxy-s24-ultra-2-720.webp | https://images.neostore.ng/shop/0744d1ae-f81b-46ee-a32b-6030887e7365-WhatsApp%20Image%202026-05-15%20at%205.52.30%20PM%20(1).jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy S23 Ultra | /images/store/samsung/samsung-galaxy-s23-ultra-1-720.webp | https://images.neostore.ng/shop/741d47b5-aa69-43ed-a697-ebb28495a634-WhatsApp%20Image%202026-05-15%20at%205.49.03%20PM.jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy S23 Ultra | /images/store/samsung/samsung-galaxy-s23-ultra-2-720.webp | https://images.neostore.ng/shop/3f70382b-c31d-4261-b5e4-027428346ae2-WhatsApp%20Image%202026-05-15%20at%205.49.04%20PM%20(1).jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy S23 | /images/store/samsung/samsung-galaxy-s23-1-720.webp | https://images.neostore.ng/shop/b14eb176-7fe1-44f1-b4d3-2c7e172375bb-WhatsApp%20Image%202026-05-15%20at%205.46.54%20PM.jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy S23 | /images/store/samsung/samsung-galaxy-s23-2-720.webp | https://images.neostore.ng/shop/32adde48-3b91-47cd-b282-1bf2ab09e00e-WhatsApp%20Image%202026-05-15%20at%205.46.54%20PM%20(1).jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy S22 Ultra | /images/store/samsung/samsung-galaxy-s22-ultra-1-720.webp | https://images.neostore.ng/shop/95f744aa-e8e8-4749-9960-f565d41342d0-WhatsApp%20Image%202026-05-15%20at%205.45.01%20PM%20(2).jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy S22 Ultra | /images/store/samsung/samsung-galaxy-s22-ultra-2-720.webp | https://images.neostore.ng/shop/d2b56863-12ad-4bfa-8e6e-9355a4cbfe74-WhatsApp%20Image%202026-05-15%20at%205.45.01%20PM%20(1).jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy S22 Plus | /images/store/samsung/samsung-galaxy-s22-plus-1-720.webp | https://images.neostore.ng/shop/f41c5743-bdde-4b30-a7c5-6de64727a8c5-WhatsApp%20Image%202026-05-15%20at%205.31.49%20PM.jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy S22 Plus | /images/store/samsung/samsung-galaxy-s22-plus-2-720.webp | https://images.neostore.ng/shop/4fb7d4cf-e4d5-4960-9ed5-63ce10eb2bde-WhatsApp%20Image%202026-05-15%20at%205.31.49%20PM%20(1).jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy S22 | /images/store/samsung/samsung-galaxy-s22-1-720.webp | https://images.neostore.ng/shop/191d64dc-ec79-487d-8752-b82539b4c6c8-WhatsApp%20Image%202026-05-15%20at%205.26.47%20PM%20(1).jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy S22 | /images/store/samsung/samsung-galaxy-s22-2-720.webp | https://images.neostore.ng/shop/aa94cdeb-d017-4d2c-a75d-badda70c0de4-WhatsApp%20Image%202026-05-15%20at%205.26.47%20PM.jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy S21 Ultra | /images/store/samsung/samsung-galaxy-s21-ultra-1-720.webp | https://images.neostore.ng/shop/e141c56b-0bc2-4279-8a2c-668f98e588c5-WhatsApp%20Image%202026-05-15%20at%202.37.38%20PM.jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy S21 Ultra | /images/store/samsung/samsung-galaxy-s21-ultra-2-720.webp | https://images.neostore.ng/shop/382a36fd-3775-4556-9f0f-58402aeeb22a-WhatsApp%20Image%202026-05-15%20at%202.37.38%20PM%20(1).jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy S21 Plus | /images/store/samsung/samsung-galaxy-s21-plus-1-720.webp | https://images.neostore.ng/shop/08dd28e5-e9d2-4c9b-b2f9-d49813eccf03-WhatsApp%20Image%202026-05-15%20at%202.32.55%20PM.jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy S21 Plus | /images/store/samsung/samsung-galaxy-s21-plus-2-720.webp | https://images.neostore.ng/shop/6abdc098-a841-463d-bccd-2f28051fa86e-WhatsApp%20Image%202026-05-15%20at%202.32.55%20PM%20(2).jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy S21 | /images/store/samsung/samsung-galaxy-s21-1-720.webp | https://images.neostore.ng/shop/7644ac95-5288-4591-b736-3a948d59e5dd-WhatsApp%20Image%202026-05-15%20at%202.20.27%20PM%20(1).jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy S21 | /images/store/samsung/samsung-galaxy-s21-2-720.webp | https://images.neostore.ng/shop/6a3d083e-1bae-4b36-8839-abadbf3292e0-WhatsApp%20Image%202026-05-15%20at%202.20.24%20PM.jpeg | https://neostore.ng/category/foreign-used-phones?brand=Samsung |
| Samsung Galaxy A07 | /images/store/samsung/samsung-galaxy-a07-1-720.webp | https://images.neostore.ng/shop/03e72813-025d-4d6a-991e-5222532608b2-WhatsApp%20Image%202026-09-02%20at%2010.48.48%20AM%20(1).webp | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy A17 | /images/store/samsung/samsung-galaxy-a17-1-720.webp | https://images.neostore.ng/shop/f8036d60-7f4e-4224-b22d-a7ba3807dbf7-WhatsApp%20Image%202026-08-16%20at%201.04.16%20PM%20(2).webp | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy A17 | /images/store/samsung/samsung-galaxy-a17-2-720.webp | https://images.neostore.ng/shop/a4f360eb-2872-47ff-aafc-5a78e3226c22-WhatsApp%20Image%202026-08-16%20at%201.04.15%20PM.webp | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy A37 | /images/store/samsung/samsung-galaxy-a37-1-720.webp | https://images.neostore.ng/shop/ac3b27f9-86c8-421e-9cf9-1b9d9fa6ccef-WhatsApp%20Image%202026-08-16%20at%2012.55.02%20PM.webp | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy A37 | /images/store/samsung/samsung-galaxy-a37-2-720.webp | https://images.neostore.ng/shop/019f4eb9-6ab4-48bc-b68c-dccad240cf46-WhatsApp%20Image%202026-08-16%20at%2012.55.03%20PM%20(1).webp | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy A57 | /images/store/samsung/samsung-galaxy-a57-1-720.webp | https://images.neostore.ng/shop/67ce7158-b5fd-4ddf-96e8-b90d6c120777-WhatsApp%20Image%202026-08-10%20at%2011.04.27%20PM%20(1).webp | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy A57 | /images/store/samsung/samsung-galaxy-a57-2-720.webp | https://images.neostore.ng/shop/6ce36e2c-0206-4eac-91fd-0470c45e492f-WhatsApp%20Image%202026-08-10%20at%2011.04.27%20PM.webp | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy Z TriFold | /images/store/samsung/samsung-galaxy-z-trifold-1-720.webp | https://images.neostore.ng/shop/4ef2a18d-f4f0-495b-b816-e861e64cb225-WhatsApp%20Image%202026-06-03%20at%2011.08.48%20AM%20(4).webp | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy Z TriFold | /images/store/samsung/samsung-galaxy-z-trifold-2-720.webp | https://images.neostore.ng/shop/eafd804d-1c13-4550-9d99-603870ce75af-WhatsApp%20Image%202026-06-03%20at%2011.08.48%20AM.webp | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy Z TriFold | /images/store/samsung/samsung-galaxy-z-trifold-3-720.webp | https://images.neostore.ng/shop/61ff1e12-c0cb-4069-aff3-3335be1cd0d1-WhatsApp%20Image%202026-06-03%20at%2011.08.48%20AM%20(1).webp | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy S26 | /images/store/samsung/samsung-galaxy-s26-1-720.webp | https://images.neostore.ng/shop/af7a3e24-d460-428e-a897-a80f6a2c92ce-jodieohhh_9bd9208c_2.jpg | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy S26 | /images/store/samsung/samsung-galaxy-s26-2-720.webp | https://images.neostore.ng/shop/d0cd2819-43fe-4105-a175-deeab0860ac1-jodieohhh_9bd9208c_3.jpg | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy S26 Plus | /images/store/samsung/samsung-galaxy-s26-plus-1-720.webp | https://images.neostore.ng/shop/e6aea22d-b75f-4a20-9ace-d3cfa97ddfa1-daviimportscba_851c5454_3.jpg | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy S26 Plus | /images/store/samsung/samsung-galaxy-s26-plus-2-720.webp | https://images.neostore.ng/shop/481de00f-bfb8-4dc0-9c7b-239cc27b7f0e-daviimportscba_851c5454_2.jpg | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy S26 Ultra | /images/store/samsung/samsung-galaxy-s26-ultra-1-720.webp | https://images.neostore.ng/shop/e27e9ba2-6ec4-49bb-9bbe-488debc04093-royal_tech_05_61f2e006_3.jpg | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy S26 Ultra | /images/store/samsung/samsung-galaxy-s26-ultra-2-720.webp | https://images.neostore.ng/shop/5651f0da-8731-404d-a113-d60938a3b74e-royal_tech_05_61f2e006_2.jpg | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy A06 | /images/store/samsung/samsung-galaxy-a06-1-720.webp | https://images.neostore.ng/shop/c0d6df54-abab-4e10-b86f-05bf390b593b-15898.jpg | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy A16 | /images/store/samsung/samsung-galaxy-a16-1-720.webp | https://images.neostore.ng/shop/7491aeb1-2746-48bc-bb30-34533122d428-14157.jpg | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy A16 | /images/store/samsung/samsung-galaxy-a16-2-720.webp | https://images.neostore.ng/shop/4c6a7a07-a582-441b-874d-77e6ea78d316-14151.jpg | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy A26 | /images/store/samsung/samsung-galaxy-a26-1-720.webp | https://images.neostore.ng/shop/8cd56070-8a4a-4a30-ae00-6ae94f7471a2-14137.jpg | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy A26 | /images/store/samsung/samsung-galaxy-a26-2-720.webp | https://images.neostore.ng/shop/ce18ea9f-ea8c-4019-9f72-e96c840e8d1e-14131.jpg | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy A36 | /images/store/samsung/samsung-galaxy-a36-1-720.webp | https://images.neostore.ng/shop/8f0a4e70-3e99-499b-8aa5-314b13fd525d-14116.jpg | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy A36 | /images/store/samsung/samsung-galaxy-a36-2-720.webp | https://images.neostore.ng/shop/430a1a8d-e9b2-4533-8176-1aef4c30500d-14103.jpg | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy A56 | /images/store/samsung/samsung-galaxy-a56-1-720.webp | https://images.neostore.ng/shop/43d9e269-a202-4a24-9659-6c2c3efeb545-14087.jpg | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy A56 | /images/store/samsung/samsung-galaxy-a56-2-720.webp | https://images.neostore.ng/shop/eb6b6a1a-45f1-4db6-b70b-7c88c792e718-14084.jpg | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy S25 Plus | /images/store/samsung/samsung-galaxy-s25-plus-1-720.webp | https://images.neostore.ng/shop/8d39d3ce-0bc7-4167-820e-a423227d1e65-13952%20(1).png | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy S25 Plus | /images/store/samsung/samsung-galaxy-s25-plus-2-720.webp | https://images.neostore.ng/shop/04e190ea-06a4-4219-ae2d-16588f94f7b2-13947.jpg | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy S25 | /images/store/samsung/samsung-galaxy-s25-1-720.webp | https://images.neostore.ng/shop/2162c8ee-7b21-4343-96c4-f015f1595bb4-13936.jpg | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy Z Flip 6 | /images/store/samsung/samsung-galaxy-z-flip-6-1-720.webp | https://images.neostore.ng/shop/80bf13c8-3dba-44be-a1b4-033223a05837-13874%20(1).jpg | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy Z Flip 6 | /images/store/samsung/samsung-galaxy-z-flip-6-2-720.webp | https://images.neostore.ng/shop/55b565ce-6caf-436d-8aa9-79230b4a2c96-13878.jpg | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy Z Flip 7 | /images/store/samsung/samsung-galaxy-z-flip-7-1-720.webp | https://images.neostore.ng/shop/927f3abd-5fb0-4a10-94ff-25f6bef2807d-13814.jpg | https://neostore.ng/category/brand-new-phones?brand=Samsung |
| Samsung Galaxy Z Flip 7 | /images/store/samsung/samsung-galaxy-z-flip-7-2-720.webp | https://images.neostore.ng/shop/eba7dbde-4d00-4d51-97d4-64e6780ee576-13811.jpg | https://neostore.ng/category/brand-new-phones?brand=Samsung |
