// Refreshes blog prices from the live catalogue. The page already shows build-time prices, so a failure changes nothing.
import {groupPrices, priceTablesHtml, fromPrice, naira} from '../commerce/blog-prices.mjs';

const tables = document.querySelector('[data-live-prices]');
const mentions = [...document.querySelectorAll('[data-price-slug]')];
if (tables || mentions.length) {
 fetch('/api/shop/catalog', {cache: 'no-store'}).then(r => r.ok ? r.json() : Promise.reject()).then(rows => {
  if (!Array.isArray(rows) || !rows.length) return;
  if (tables) {
   const html = priceTablesHtml(groupPrices(rows));
   if (html) tables.innerHTML = html;
   const stamp = document.querySelector('[data-prices-date]');
   if (stamp) stamp.textContent = new Date().toLocaleDateString('en-NG', {day: 'numeric', month: 'long', year: 'numeric'});
  }
  for (const el of mentions) {
   const p = fromPrice(rows, el.dataset.priceSlug);
   if (p) el.textContent = 'from ' + naira(p);
  }
 }).catch(() => {});
}
