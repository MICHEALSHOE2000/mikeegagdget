// Read-only catalogue audit. Does not fetch images or change storefront data.
// Run from the repository root: node scripts/audit-samsung-images.mjs
import { existsSync, writeFileSync } from 'node:fs';
import { products } from '../commerce/catalog.mjs';

const phones = products.filter(product => product.brand === 'Samsung');
const cell = value => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
const rows = phones.map(product => {
  const paths = product.images;
  const status = !paths.length ? 'Placeholder; approved exact-model photo needed'
    : paths.every(path => path.startsWith('/') && existsSync(`.${path}`))
      ? 'Local asset exists; model, colour and rights review still required'
      : 'Asset needs review; missing local file or external URL';
  return [product.model, product.slug, product.conditions.join(', '),
    product.variants.map(variant => variant.storage).join(', '),
    product.colors.join(', '), paths.join(', ') || 'None', status];
});
const report = `# Samsung smartphone image audit

Generated from the active catalogue with \`node scripts/audit-samsung-images.mjs\`.

- Samsung phone listings: ${phones.length}
- Distinct model names: ${new Set(phones.map(product => product.model)).size}
- Storage/colour variant entries: ${phones.reduce((count, product) => count + product.variants.length, 0)}
- Listings with an image assigned: ${phones.filter(product => product.images.length).length}
- Listings without an image: ${phones.filter(product => !product.images.length).length}

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

- Active phone images originate in \`commerce/retail-inventory.mjs\` (\`item.image\` → \`retailPhoneProducts[].images\`). Editing \`commerce/product-images.mjs\` alone does not assign an image to these active phone listings.
- \`commerce/storefront-data.mjs\`, the commerce page generator and \`commerce/upgrade-core.mjs\` consume the active product images for cards, details, search data and purchase/upgrade selectors.
- \`assets/storefront-ui.mjs\` already provides lazy loading, fixed image dimensions, responsive 360/720 WebP paths and a model-labelled fallback. Preserve its display conventions.
- The detail template supports galleries, but the active inventory adapter currently supplies one image. Do not introduce duplicate gallery images. Its thumbnail convention expects a matching \`-160.webp\` when using \`-720.webp\` assets.
- Obtain supplier permission covering commercial display and local optimisation, or merchant-owned photographs with permission to publish. Record the exact product page, original image URL, rights evidence, model code, colour and checked local filenames before integration.
- Inspect each image visually. Require Black for the explicitly Black Z Fold 7 variant; confirm unspecified colours and 4G/5G variants. Do not substitute Ultra/Plus/FE/Edge, Fold/Flip or a different generation.
- Use the existing \`images/store/\` structure with meaningful filenames and actual 160/360/720 WebP variants where that naming convention is used. Update only verified listing image fields; retain all commercial data.
- Rebuild and test the category, details, search, Buy Outright, EasyBuy and Swap at mobile and desktop sizes once approved photographs are available.

## Validation of this audit-only change

At preparation, \`npm run check\` passed lint, all page generators, site validation and 47 tests. The build left all tracked storefront files byte-for-byte unchanged. The audit script also passed \`node --check\`.

Only this report and its audit script are added. Product prices, financing, conditions, stock, storage variants, WhatsApp messages, tracking, existing images and website design remain unchanged. No manual mobile/desktop browser verification or new-image load/visual checks were performed because no storefront images were integrated. This is a blocked sourcing draft, not a completed photography upgrade.

## Complete manual sourcing checklist

| Model | Listing slug | Condition | Storage/variant labels | Listed colours | Assigned image | Status |
|---|---|---|---|---|---|---|
${rows.map(row => '| ' + row.map(cell).join(' | ') + ' |').join('\n')}
`;
writeFileSync('docs/samsung-image-coverage.md', report);
console.log(`Audited ${phones.length} Samsung listings (${new Set(phones.map(product => product.model)).size} distinct models). Wrote docs/samsung-image-coverage.md.`);
