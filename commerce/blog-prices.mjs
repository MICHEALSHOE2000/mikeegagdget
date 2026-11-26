// Price tables for the blog. The same code runs at build time (from a snapshot, so search engines see real prices)
// and in the browser (from /api/shop/catalog, so readers always see today's prices).

const GROUPS = [
 {id: 'iphones', title: 'iPhone prices', match: r => r.category === 'iphones'},
 {id: 'samsung', title: 'Samsung Galaxy prices', match: r => r.category === 'samsung'},
 {id: 'pixel', title: 'Google Pixel prices', match: r => r.category === 'pixel'},
 {id: 'wifi-only', title: 'WiFi-only iPhone prices', match: r => r.category === 'wifi-only'}
];
const COLS = ['Brand New', 'UK Used', 'Open Box / other'];

export const naira = n => '₦' + Math.round(n).toLocaleString('en-US');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const column = c => /brand new/i.test(c) ? 0 : /uk used/i.test(c) ? 1 : 2;
const label = m => String(m).replace(/ — WiFi Only$/, '');

// Visible, priced rows → [{id,title,models:[{slug,model,prices:[min per column]}]}], dearest model first.
export function groupPrices(rows) {
 const ok = rows.filter(r => r && r.slug && r.price > 0 && r.enabled !== false && r.stockStatus !== 'out_of_stock' && !r.reviewRequired);
 return GROUPS.map(g => {
  const bySlug = new Map();
  for (const r of ok.filter(g.match)) {
   const m = bySlug.get(r.slug) || {slug: r.slug, model: label(r.model), prices: [null, null, null]};
   const i = column(r.condition || '');
   if (m.prices[i] == null || r.price < m.prices[i]) m.prices[i] = r.price;
   bySlug.set(r.slug, m);
  }
  const models = [...bySlug.values()].sort((a, b) => Math.max(...b.prices.filter(Boolean)) - Math.max(...a.prices.filter(Boolean)));
  return {...g, models};
 }).filter(g => g.models.length);
}

export function priceTablesHtml(groups) {
 return groups.map(g => {
  const used = COLS.map((_, i) => g.models.some(m => m.prices[i] != null));
  const head = COLS.filter((_, i) => used[i]).map(c => `<th>${c} from</th>`).join('');
  const body = g.models.map(m => `<tr><td><a href="/${esc(m.slug)}">${esc(m.model)}</a></td>${m.prices.map((p, i) => used[i] ? `<td>${p == null ? '—' : naira(p)}</td>` : '').join('')}</tr>`).join('');
  return `<h2 id="${g.id}">${g.title}</h2>\n<table class="blog-table"><tr><th>Model</th>${head}</tr>${body}</table>`;
 }).join('\n');
}

// Lowest live price for one model page, for "from ₦…" mentions inside articles.
export function fromPrice(rows, slug) {
 const p = rows.filter(r => r.slug === slug && r.price > 0 && r.enabled !== false && r.stockStatus !== 'out_of_stock').map(r => r.price);
 return p.length ? Math.min(...p) : null;
}
