import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {pixelCatalog} from '../commerce/pixel-catalog.mjs';
import {products} from '../commerce/catalog.mjs';
import {storeItems} from '../commerce/storefront-data.mjs';
import {choices, financePlan} from '../commerce/upgrade-core.mjs';

test('both Revenes pages map to 24 distinct Pixel listings and 48 priced variants', async () => {
  assert.equal(pixelCatalog.length, 24);
  assert.equal(pixelCatalog.reduce((sum, item) => sum + item.variants.length, 0), 48);
  assert.equal(new Set(pixelCatalog.map(item => item.slug)).size, 24);
  assert.equal(storeItems.filter(item => item.category === 'pixel').length, 24);

  for (const entry of pixelCatalog) {
    const product = products.find(item => item.slug === entry.slug);
    const store = storeItems.find(item => item.slug === entry.slug);
    const html = await readFile(`${entry.slug}/index.html`, 'utf8');
    assert.ok(product && store, entry.slug);
    assert.equal(product.conditions[0], entry.condition);
    assert.equal(product.variants.length, entry.variants.length);
    assert.match(entry.sourceUrl, /^https:\/\/revenes\.com\/product\//);
    assert.match(html, /Buy Outright/);
    assert.match(html, /Pay Small Small/);
    assert.match(html, /Swap &(?:amp;)? Upgrade/);
    assert.match(html, /data-page-type="product"/);

    for (const path of entry.images) {
      assert.ok((await stat(`.${path}`)).size < 100_000, `${path} is an optimized local image`);
      assert.ok(html.includes(path), `${path} is on the product page`);
    }
    for (const variant of entry.variants) {
      const matching = product.variants.filter(item => item.storage === variant.storage);
      assert.equal(matching.length, 1, `${entry.slug} ${variant.storage}`);
      assert.equal(matching[0].price, variant.price);
      assert.equal(store.variants.find(item => item.storage === variant.storage)?.price, variant.price);
      assert.equal(choices.find(item => item.id === `${entry.slug}|${variant.storage}`)?.price, variant.price);
      assert.ok(html.includes(variant.price.toLocaleString('en-NG')));
      assert.ok(financePlan({amount: variant.price}).balance <= 200_000);
    }
  }
});

test('SIM, colour and condition differences retain their exact source prices', () => {
  const variant = (slug, storage) => pixelCatalog.find(item => item.slug === slug)?.variants.find(item => item.storage === storage);
  assert.equal(variant('google-pixel-10', '128GB · eSIM')?.price, 785_000);
  assert.equal(variant('google-pixel-10', '128GB · Physical SIM · Obsidian')?.price, 930_000);
  assert.equal(variant('google-pixel-10', '128GB · Physical SIM · Frost / Indigo / Lemongrass')?.price, 950_000);
  assert.equal(variant('google-pixel-9', '128GB · Obsidian Black')?.price, 775_000);
  assert.equal(variant('google-pixel-9', '128GB · Wintergreen')?.price, 850_000);
  assert.equal(variant('google-pixel-9-pro', '128GB')?.price, 960_000);
  assert.equal(variant('google-pixel-9-pro-uk-used', '128GB')?.price, 660_000);
  assert.equal(pixelCatalog.find(item => item.slug === 'google-pixel-10-pro-xl')?.variants[0].price, 1_350_000);
});

test('the generated Pixel category shows every model and filters conditions without duplicate cards', async () => {
  const dom = new JSDOM(await readFile('google-pixel-phones/index.html', 'utf8'));
  const {document} = dom.window;
  const cards = [...document.querySelectorAll('[data-catalog-card]')];
  assert.equal(cards.length, 24);
  assert.equal(new Set(cards.map(card => card.querySelector('a[href^="/google-pixel-"]')?.getAttribute('href'))).size, 24);
  assert.ok(cards.some(card => card.textContent.includes('UK Used')));
  assert.ok(cards.some(card => card.textContent.includes('Brand New')));
  assert.ok(cards.every(card => card.querySelector('img[src^="/images/pixel/"]')));
  const search = JSON.parse(await readFile('assets/catalog-search.json', 'utf8'));
  assert.equal(search.filter(item => item.type === 'product' && item.brand === 'Google').length, 24);
  dom.window.close();
});

test('Pixel storage selection carries the exact SIM price and colour into the buying paths', async () => {
  const dom = new JSDOM(await readFile('google-pixel-10/index.html', 'utf8'), {
    url: 'https://mikee.test/google-pixel-10', runScripts: 'outside-only'
  });
  for (const key of ['window', 'document', 'location', 'history', 'HTMLElement']) globalThis[key] = dom.window[key];
  globalThis.matchMedia = () => ({matches: false, addEventListener() {}});
  dom.window.matchMedia = globalThis.matchMedia;
  await import('../assets/commerce.js?pixel-selection');

  const storage = '128GB · Physical SIM · Frost / Indigo / Lemongrass';
  document.querySelectorAll('[data-storage]').item(2).click();
  assert.equal(document.querySelector('[data-product-price]').textContent, '₦950,000');
  assert.equal(document.querySelector('[data-color-select]').value, 'Frost');
  assert.deepEqual([...document.querySelector('[data-color-select]').options].map(option => option.value), ['Frost', 'Indigo', 'Lemongrass']);
  assert.equal(new URL(document.querySelector('[data-action="easyBuy"]').href).searchParams.get('phone'), `google-pixel-10|${storage}`);
  assert.equal(new URL(document.querySelector('[data-action="swap"]').href).searchParams.get('target'), `google-pixel-10|${storage}`);
  assert.match(new URL(document.querySelector('[data-action="buy"]').href).searchParams.get('text'), /950,000/);
  dom.window.close();
});
