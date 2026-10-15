// Run from the repository root. Reads catalogue/manifest; never retrieves photos.
import { existsSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { products } from '../commerce/catalog.mjs';
const manifest = JSON.parse(readFileSync('commerce/samsung-image-sources.json', 'utf8'));
const phones = products.filter(product => product.brand === 'Samsung');
const sourceFor = slug => manifest.sources.find(source => source.listings.includes(slug));
const cell = value => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
const photos = manifest.sources.flatMap(source => source.photos);
const files = photos.flatMap(photo => Object.values(photo.assets));
const missing = files.filter(path => !existsSync(`.${path}`));
if (missing.length) throw new Error(`Missing Samsung assets: ${missing.join(', ')}`);
const pending = [...new Set(phones.filter(p => !p.images.length).map(p => p.model))];
const rows = phones.map(p => [p.model, p.slug, p.conditions.join(', '), p.variants.map(v => v.storage).join(', '), p.colors.join(', '), sourceFor(p.slug) ? `${p.images.length} local photos` : 'Placeholder; exact photo unverified']);
const report = `# Samsung smartphone image coverage

Generated with \`node scripts/audit-samsung-images.mjs\` from the active catalogue and \`commerce/samsung-image-sources.json\`.

- Samsung phone listings: ${phones.length}
- Distinct models: ${new Set(phones.map(p => p.model)).size}
- Listings updated with photographs: ${phones.filter(p => sourceFor(p.slug)).length}
- Models with selected photographs: ${manifest.sources.length}
- Distinct photos added: ${photos.length}
- Local WebP assets (160/360/720 widths): ${files.length}
- Combined asset size: ${(files.reduce((sum, path) => sum + statSync(`.${path}`).size, 0) / 1024 / 1024).toFixed(2)} MiB
- Remaining placeholder listings: ${phones.filter(p => !p.images.length).length} (${pending.length} models)

## Permission and source review — 12 October 2026

The merchant confirmed that Neostore and Revenes gave permission to reuse their photos and explicitly instructed integration. This supersedes the original permission blocker. The confirmation is recorded as merchant-provided, not an independently reviewed written licence.

Neostore's normal public page request succeeded after the web search retrieval tool could not access it. Product records and image URLs were read from the page's embedded catalogue data. Both the foreign-used and brand-new Samsung categories were reviewed. No access restrictions were bypassed. Revenes continued to return HTTP 403/bot verification, so none of its images were copied.

Selected photographs were checked against source model titles and visually reviewed. Existing photographs were not overwritten. No source prices, conditions, storage, stock or commercial terms were copied. Colours in photographs illustrate the model; existing stock-confirmation copy remains in place. The explicitly Black Z Fold 7 listing uses the black device only. Photos do not establish the condition or accessories of Mikee's exact stock unit.

Source data contained incorrect images: an Ultra in the S21 listing, a non-Ultra in the S25 Ultra listing, an Ultra in the S25 listing, and an A55 box in the A56 listing. These were excluded. Mixed A-series box photos were excluded. Fold8 Ultra artwork was rejected because the exact variant could not be verified and some artwork was watermarked. No generated device imagery was used.

## Catalogue wiring

- \`commerce/retail-inventory.mjs\` holds the primary image and optional additional \`gallery\` paths, with no more than three photos passed to the existing detail gallery.
- Cards, search, details and Buy Outright/EasyBuy/Swap data retain their existing shared catalogue path.
- Local files follow the existing responsive WebP naming conventions. All 160/360/720 variants exist. Only Samsung image fit is scoped to \`contain\`; card and page geometry remain unchanged.
- Each selected original image URL, source product ID, dimensions and SHA-256 is recorded in the JSON manifest. Validation results are recorded in \`docs/samsung-image-validation.md\`.

## Models still requiring exact photographs

${pending.map(model => `- ${model}`).join('\n')}

These models retain their neutral placeholders. They had no verified usable match in the reviewed accessible Neostore categories; Revenes retrieval remained blocked. Do not substitute nearby models.

## All Samsung phone listings

| Model | Listing slug | Condition | Storage/variant labels | Listed colours | Image status |
|---|---|---|---|---|---|
${rows.map(row => '| ' + row.map(cell).join(' | ') + ' |').join('\n')}

## Original source URLs for each added photo

The same photo may serve separate condition listings of the exact same model. Only resizing and WebP encoding were applied; no devices were cropped out or altered.

| Model | Main 720px asset | Original image | Source category |
|---|---|---|---|
${manifest.sources.flatMap(source => source.photos.map(photo => `| ${source.model} | ${photo.assets['720']} | ${encodeURI(photo.sourceImageUrl)} | ${source.sourceCategoryUrl} |`)).join('\n')}
`;
writeFileSync('docs/samsung-image-coverage.md', report);
console.log(`Samsung: ${phones.filter(p => sourceFor(p.slug)).length}/${phones.length} listings; ${photos.length} photos; all ${files.length} assets exist.`);
