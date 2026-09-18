import { choices, money, estimateSwap, financePlan } from '../commerce/upgrade-core.mjs';
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
if ($('swap-form')) {
  selectInitial($('current-phone'),'current','iphone-11|64GB');
  selectInitial($('target-phone'),'target','iphone-13|128GB');
  function renderSwap() {
    const current = byId($('current-phone').value), target = byId($('target-phone').value);
    const condition = $('condition').value, battery = $('battery').value, issue = $('issue').value, unlocked = $('unlocked').value === 'yes';
    const result = estimateSwap({ current, target, condition, battery, issue, unlocked });
    const details = ['Hello Mikee Gadget Plug, I would like a phone-swap inspection quote.', `My phone: ${current.label}`, `Condition: ${$('condition').selectedOptions[0].textContent}`, `Battery: ${$('battery').selectedOptions[0].textContent}`, `Repairs / faults: ${$('issue').selectedOptions[0].textContent}`, `Account / network status: ${$('unlocked').selectedOptions[0].textContent}`, `Desired phone: ${target.label}`];
    if (result.manual) {
      $('swap-result').innerHTML = phoneSummary(target) + '<h2>Let’s inspect it first.</h2><p class="manual-note">These details need a personal valuation. Send us your selection and clear photos for a quote; an automatic value would not be reliable.</p>';
      details.push('A manual valuation is required. I will attach photos of my phone.');
    } else {
      $('swap-result').innerHTML = phoneSummary(target) + '<p class="estimate-label">Estimated amount to add</p>' + `<p class="estimate-big">${money(result.addLow)} – ${money(result.addHigh)}</p>` + lines([['Your phone’s indicative value',`${money(result.low)} – ${money(result.high)}`],['Upgrade guide price',money(target.price)],['Your current phone',current.label]]) + (result.excess ? '<p class="manual-note">Your indicative value exceeds the target price. Any surplus or cash difference needs a separate agreement; no payout is promised.</p>' : '');
      details.push(`Indicative trade-in value: ${money(result.low)}–${money(result.high)}`,`Estimated top-up: ${money(result.addLow)}–${money(result.addHigh)}`, 'Please confirm the final valuation after inspection and today’s upgrade price. I understand this is a planning estimate, not a buying offer.');
    }
    $('swap-whatsapp').href = wa(details.join('\n'));
    saveSelection('current',current.id); saveSelection('target',target.id);
  }
  $('swap-form').addEventListener('change',renderSwap); renderSwap();
}
if ($('finance-form')) {
  const oldPhone = params.get('phone');
  const legacy = choices.find(p => `${p.slug}-${p.storage.replace(/GB|TB/g,'').toLowerCase()}` === oldPhone || p.slug === oldPhone);
  selectInitial($('finance-phone'),'phone',legacy?.id || 'iphone-12-pro-max|128GB');
  function renderFinance() {
    const phone = byId($('finance-phone').value);
    const frequencies = allowedFrequencies(phone.series);
    [...$('frequency').options].forEach(option => { option.disabled = !frequencies.includes(option.value); option.hidden = option.disabled; });
    if (!frequencies.includes($('frequency').value)) $('frequency').value = 'monthly';
    $('frequency-note').textContent = frequencies.length > 1 ? 'iPhone 11 and 12: monthly, weekly or twice-monthly planning options.' : 'This model uses monthly planning. Other arrangements require a personal quote.';
    let message;
    if (!phone.price || !phone.finance) {
      $('finance-result').innerHTML = phoneSummary(phone) + '<h2>Request a tailored plan.</h2><p class="manual-note">We need to confirm this model’s price or finance eligibility before calculating payments.</p>';
      $('payment-schedule').innerHTML = '';
      message = `Hello Mikee Gadget Plug, please confirm the price, finance eligibility, deposit and complete payment terms for ${phone.label}.`;
    } else {
      const duration = Number($('duration').value), frequency = $('frequency').value;
      const plan = financePlan(phone,duration,frequency);
      const label = $('frequency').selectedOptions[0].textContent.toLowerCase();
      $('finance-result').innerHTML = phoneSummary(phone) + `<p class="estimate-label">Initial deposit · ${plan.depositRate*100}%</p><p class="estimate-big">${money(plan.deposit)}</p>` + lines([['Balance to finance',money(plan.balance)],['Flat plan cost',money(plan.additionalCost)],[`${plan.repayments} ${label} repayments`, `${money(plan.payments[0])}${plan.payments.at(-1) !== plan.payments[0] ? ' (last adjusted)' : ' each'}`],['Repayment total after deposit',money(plan.balanceRepayment)],['Total paid, including deposit',money(plan.totalPayable)]]) + '<p class="result-note">Delivery and any separately agreed fees are excluded. See the schedule below for each payment.</p>';
      $('payment-schedule').innerHTML = `<h2>Your illustrative payment schedule</h2><p class="fine">${duration} month${duration > 1 ? 's' : ''} · ${label} · exact due dates agreed after approval. Any rounding is adjusted in the final payment.</p><div class="schedule-table"><table><thead><tr><th scope="col">Payment</th><th scope="col">Timing</th><th scope="col">Amount</th></tr></thead><tbody><tr><td>Deposit</td><td>After approval, as agreed</td><td>${money(plan.deposit)}</td></tr>${plan.payments.map((value,index) => `<tr><td>Instalment ${index+1}</td><td>${frequency === 'monthly' ? `Month ${index+1}` : frequency === 'weekly' ? `Planning week ${index+1}` : `Payment ${index+1} of ${plan.repayments}`}</td><td>${money(value)}</td></tr>`).join('')}<tr><td colspan="2"><strong>Total paid</strong></td><td><strong>${money(plan.totalPayable)}</strong></td></tr></tbody></table></div>`;
      message = ['Hello Mikee Gadget Plug, I would like to request this financing plan.',`Phone: ${phone.label}`,`Catalogue guide price: ${money(phone.price)}`,`Deposit: ${money(plan.deposit)} (${plan.depositRate*100}%)`,`Balance financed: ${money(plan.balance)}`,`Plan cost: ${money(plan.additionalCost)}`,`Duration: ${duration} months; ${label}`,`Repayments: ${plan.payments.map(money).join(', ')}`,`Total including deposit: ${money(plan.totalPayable)}`, 'Please confirm current stock, price, eligibility, all fees, exact due dates and written terms before payment. I understand this estimate is not an approval.'].join('\n');
    }
    $('finance-whatsapp').href = wa(message); saveSelection('phone',phone.id);
  }
  $('finance-form').addEventListener('change',renderFinance); renderFinance();
}
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
