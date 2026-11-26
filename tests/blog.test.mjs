import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {POSTS} from '../commerce/blog-posts.mjs';
import {groupPrices, priceTablesHtml, fromPrice} from '../commerce/blog-prices.mjs';

test('price tables group by model and show the lowest price per condition', () => {
 const rows = [
  {slug: 'iphone-15', model: 'iPhone 15', condition: 'UK Used', category: 'iphones', price: 700000},
  {slug: 'iphone-15', model: 'iPhone 15', condition: 'UK Used', category: 'iphones', price: 650000},
  {slug: 'iphone-15', model: 'iPhone 15', condition: 'Brand New', category: 'iphones', price: 900000},
  {slug: 'iphone-16', model: 'iPhone 16', condition: 'UK Used', category: 'iphones', price: 800000, enabled: false},
  {slug: 'pixel-9', model: 'Google Pixel 9', condition: 'UK Used', category: 'pixel', price: 0}
 ];
 const groups = groupPrices(rows);
 assert.equal(groups.length, 1);
 assert.deepEqual(groups[0].models, [{slug: 'iphone-15', model: 'iPhone 15', prices: [900000, 650000, null]}]);
 const html = priceTablesHtml(groups);
 assert.match(html, /₦650,000/);
 assert.doesNotMatch(html, /Open Box/);
 assert.equal(fromPrice(rows, 'iphone-15'), 650000);
 assert.equal(fromPrice(rows, 'iphone-16'), null);
});

test('every post is complete and its generated page has no unfilled placeholders', () => {
 const slugs = new Set();
 for (const p of POSTS) {
  for (const k of ['slug', 'title', 'description', 'answer', 'body', 'image', 'published', 'updated']) assert.ok(p[k], `${p.slug} missing ${k}`);
  assert.ok(!slugs.has(p.slug), `duplicate slug ${p.slug}`); slugs.add(p.slug);
  assert.ok(p.description.length <= 170, `${p.slug} description too long for search results`);
  assert.ok(existsSync('.' + p.image), `${p.slug} image missing`);
  const html = readFileSync(`blog/${p.slug}/index.html`, 'utf8');
  assert.doesNotMatch(html, /\{\{|price on request/, `${p.slug} has an unfilled price`);
  for (const [, href] of html.matchAll(/href="(\/[a-z0-9-]+)"/g)) assert.ok(existsSync(`.${href}/index.html`) || existsSync(`.${href}`), `${p.slug} links to missing page ${href}`);
 }
});
