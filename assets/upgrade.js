import { choices, money } from '../commerce/upgrade-core.mjs';
import { commerceSite } from '../commerce/catalog.mjs';
import { allowedFrequencies } from '../easy-buy/easy-buy-core.mjs';
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const byId = id => choices.find(p => p.id === id);
const wa = text => {
  let attribution = {};
  try { attribution = JSON.parse(sessionStorage.getItem('mikee-gadget-plug_ad_attribution') || '{}'); } catch {}
  for (const key of ['gclid','wbraid','gbraid','utm_source','utm_medium','utm_campaign','utm_term','utm_content']) {
    if (params.has(key)) attribution[key] = params.get(key);
  }
  const reference = Object.entries(attribution).filter(([,value]) => typeof value === 'string' && value).map(([key,value]) => `${key}: ${value}`).join(' | ');
  return `https://wa.me/${commerceSite.whatsappNumber}?text=${encodeURIComponent(text + (reference ? `\nCampaign reference: ${reference}` : ''))}`;
};
const menu = document.querySelector('.menu-toggle');
menu.addEventListener('click', () => { const open = $('navigation').classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); });
$('navigation').addEventListener('click', event => { if (event.target.closest('a')) { $('navigation').classList.remove('open'); menu.setAttribute('aria-expanded','false'); } });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { $('navigation').classList.remove('open'); menu.setAttribute('aria-expanded','false'); menu.focus(); } });
document.querySelectorAll('form').forEach(form => form.addEventListener('submit', event => event.preventDefault()));
const phoneSummary = p => `<div class="result-phone">${p.image ? `<img src="${p.image}" alt="${p.model}">` : ''}<div><h3>${p.model}</h3><p>${p.storage} · ${p.price ? `${money(p.price)} guide price` : 'Price on request'}</p></div></div>`;
const lines = rows => `<dl class="quote-lines">${rows.map(([label,value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
function selectInitial(field, key, fallback) { field.value = byId(params.get(key))?.id || fallback; }
function saveSelection(key,value) { const url = new URL(location.href); url.searchParams.set(key,value); history.replaceState({},'',url); }
import './buy-flow.js';
if ($('deal-filters')) {
  const cards = [...document.querySelectorAll('[data-deal]')];
  const normalized = text => text.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  function filterDeals() {
    const tokens = normalized($('deal-search').value).split(' ').filter(Boolean);
    const budget = $('deal-budget').value === 'all' ? Infinity : Number($('deal-budget').value);
    const sort = $('deal-sort').value;
    let visible = 0;
    const sorted = [...cards].sort((a,b) => sort === 'featured' ? cards.indexOf(a)-cards.indexOf(b) : (byId(a.dataset.id).price - byId(b.dataset.id).price) * (sort === 'high' ? -1 : 1));
    sorted.forEach(card => { const phone = byId(card.dataset.id); const matches = phone.price <= budget && tokens.every(token => normalized(phone.label).includes(token)); card.hidden = !matches; if (matches) visible++; $('deal-grid').appendChild(card); });
    $('deal-count').textContent = `${visible} phone option${visible === 1 ? '' : 's'} found`;
    $('deals-empty').hidden = visible > 0;
  }
  $('deal-filters').addEventListener('input',filterDeals);
  $('deal-filters').addEventListener('change',filterDeals);
  $('deal-filters').addEventListener('reset',() => setTimeout(filterDeals,0));
  filterDeals();
}
