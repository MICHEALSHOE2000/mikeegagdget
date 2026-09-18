import { choices, money, estimateSwap, financePlan, FINANCE_PLATFORMS } from '../commerce/upgrade-core.mjs';
import { commerceSite } from '../commerce/catalog.mjs';
import { DEPOSIT_RATE } from '../easy-buy/easy-buy-core.mjs';
const $ = id => document.getElementById(id);
const form = $('buy-flow');
if (form) {
  const query = new URLSearchParams(location.search);
  const find = id => choices.find(phone => phone.id === id);
  const radio = name => form.querySelector(`input[name="${name}"]:checked`)?.value;
  const setRadio = (name,value) => { const input = form.querySelector(`input[name="${name}"][value="${value}"]`); if (input) input.checked = true; };
  const models = [...new Map(choices.map(phone => [phone.slug,phone])).values()];
  const legacyId = query.get('phone');
  const initial = find(legacyId) || find(query.get('target')) || choices.find(p => p.slug === legacyId || `${p.slug}-${p.storage.replace('GB','')}` === legacyId) || find('iphone-13|128GB');
  let step = 1, reached = 1, lastAmount = null;
  const summaryPanel = document.querySelector('.order-summary');
  const mobile = matchMedia('(max-width: 650px)');
  function placeSummary() {
    if (mobile.matches) form.insertBefore(summaryPanel,document.querySelector('.flow-actions'));
    else document.querySelector('.flow-layout').appendChild(summaryPanel);
    summaryPanel.hidden = mobile.matches && step === 1;
  }
  mobile.addEventListener('change',placeSummary);
  placeSummary();
  function options(field, rows, preferred) {
    field.replaceChildren(...rows.map(([value,label]) => new Option(label,value)));
    if (rows.some(([value]) => value === preferred)) field.value = preferred;
  }
  function modelOptions(field, list = models, preferred) { options(field,list.map(p => [p.slug,p.model]),preferred); }
  function variants(prefix,preferred) {
    const rows = choices.filter(p => p.slug === $(`${prefix}-model`).value);
    options($(`${prefix}-variant`),rows.map(p => [p.id,`${p.storage}${p.price ? ` · ${money(p.price)}` : ' · ask for price'}`]),preferred);
  }
  modelOptions($('buy-model'),models,initial.slug); variants('buy',initial.id);
  const previous = find(query.get('current')) || find('iphone-x|64GB');
  modelOptions($('swap-model'),models,previous.slug); variants('swap',previous.id);
  if (query.get('purchase') === 'swap' || location.pathname.includes('phone-swap')) setRadio('purchase','swap');
  if (query.get('payment') === 'easy' || location.pathname.includes('easy-buy')) setRadio('payment','easy');
  function selected() { return find($('buy-variant').value); }
  function oldPhone() { return find($('swap-variant').value); }
  function conditionNames() { const phone = oldPhone(); return ['batteryChanged','screenChanged','cracked',...(phone?.hasFaceId ? ['faceId'] : []),...(phone?.hasGlassBack ? ['backChanged'] : [])]; }
  function missingAnswers() { return conditionNames().filter(name => !radio(name)); }
  function quote() {
    const target = selected();
    if (!target) return { pending:true };
    if (radio('purchase') === 'buy') return { amount:target.price, manual:!target.price };
    if (missingAnswers().length) return { pending:true };
    const swap = estimateSwap({current:oldPhone(),target,faceIdBroken:radio('faceId') === 'no', batteryChanged:radio('batteryChanged') === 'yes',screenChanged:radio('screenChanged') === 'yes',backChanged:radio('backChanged') === 'yes',cracked:radio('cracked') === 'yes'});
    return { ...swap, amount:swap.manual ? null : swap.topUp, swap:true };
  }
  const photo = phone => phone?.image ? `<img src="${phone.image}" alt="${phone.model}">` : '<span class="mini-phone" aria-hidden="true">m.</span>';
  const rows = entries => `<dl class="order-lines">${entries.map(([label,value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
  function error(message) { $('flow-error').textContent = message; $('flow-error').hidden = !message; }
  function invalidDeposit(q) {
    if (radio('payment') !== 'easy' || !q.amount || q.manual || q.pending) return '';
    try { financePlan({amount:q.amount,platform:radio('platform'),duration:Number($('plan-duration').value),deposit:Number($('plan-deposit').value)}); if ($('plan-deposit').value === '') return 'Enter your deposit to see a payment plan.'; return ''; }
    catch { return `Enter a whole-naira deposit between ${money(Math.round(q.amount*DEPOSIT_RATE))} and ${money(q.amount)}.`; }
  }
  function validate(upTo) {
    if (!selected()) { error('Choose a phone model and storage first.'); return false; }
    if (upTo >= 2 && radio('purchase') === 'swap' && missingAnswers().length) {
      error('Please answer each phone-condition question before continuing.');
      form.querySelector(`input[name="${missingAnswers()[0]}"]`)?.focus(); return false;
    }
    const depositError = upTo >= 3 ? invalidDeposit(quote()) : '';
    if (depositError) { error(depositError); return false; }
    error(''); return true;
  }
  function showStep(next) {
    if (next > step && !validate(next-1)) return;
    step = next; reached = Math.max(reached,step); placeSummary();
    document.querySelectorAll('[data-screen]').forEach(el => { el.hidden = Number(el.dataset.screen) !== step; });
    document.querySelectorAll('[data-step]').forEach(button => {
      button.disabled = Number(button.dataset.step) > reached;
      if (Number(button.dataset.step) === step) button.setAttribute('aria-current','step'); else button.removeAttribute('aria-current');
    });
    $('flow-back').hidden = step === 1; $('flow-next').hidden = step === 3;
    $('flow-next').textContent = step === 1 ? 'Next: buy or swap →' : 'Next: choose payment →';
    render();
    const heading = form.querySelector(`[data-screen="${step}"] h2`); heading.tabIndex = -1; heading.focus({preventScroll:true});
    document.querySelector('.flow-main').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',block:'start'});
  }
  function render() {
    const phone = selected(), old = oldPhone();
    const isSwap = radio('purchase') === 'swap', easy = radio('payment') === 'easy';
    $('swap-fields').hidden = !isSwap;
    $('row-faceId').hidden = !old?.hasFaceId; $('row-backChanged').hidden = !old?.hasGlassBack;
    $('easy-fields').hidden = !easy;
    if (!phone) {
      $('selected-device').innerHTML = '<p>No matching model. Clear your search or try another model.</p>';
      $('order-summary').innerHTML = '<p>Choose a phone to start your upgrade.</p>';
      $('flow-next').disabled = true; $('order-whatsapp').hidden = true; return;
    }
    $('flow-next').disabled = false;
    $('selected-device').innerHTML = `${photo(phone)}<div><strong>${phone.model}</strong><span>${phone.storage}</span><b>${phone.price ? money(phone.price) : 'Ask for today’s price'}</b></div>`;
    $('model-feedback').textContent = phone.price ? 'Listed price. Confirm the exact unit and availability before payment.' : 'This model needs a current price from us. You can still send your selection.';
    const q = quote();
    let summary = `<div class="summary-device">${photo(phone)}<div><h2>${phone.model}</h2><p>${phone.storage}</p></div></div>`;
    summary += rows([['Phone price',phone.price ? money(phone.price) : 'To confirm']]);
    const message = ['Hello Mikee Gadget Plug, here is my phone selection.',`Phone: ${phone.label}`,`Listed price: ${phone.price ? money(phone.price) : 'Please confirm'}`,`Purchase: ${isSwap ? 'Swap' : 'Buy'}`];
    if (isSwap) {
      message.push(`Swapping from: ${old.label}`);
      if (q.pending) summary += '<div class="summary-hint">Tell us your current phone’s condition to see its swap value.</div>';
      else {
        message.push(`Screen changed: ${radio('screenChanged')}`,`Battery changed: ${radio('batteryChanged')}`,`Back glass changed: ${old.hasGlassBack ? radio('backChanged') : 'Not applicable'}`,`Face ID working: ${old.hasFaceId ? radio('faceId') : 'Not applicable to this model'}`,`Any cracks: ${radio('cracked')}`);
        if (q.manual) summary += `<div class="summary-hint"><strong>${q.reason === 'crack' ? 'Cracks need a personal quote.' : 'Let’s confirm your swap value.'}</strong><p>${q.reason === 'crack' ? 'Send clear photos on WhatsApp. We’ll assess the damage and confirm the amount to add.' : 'We need a confirmed price for this phone before valuing the swap.'}</p></div>`;
        else {
          summary += rows([['Your phone’s listed price',money(old.price)],['Your swap value',`− ${money(q.value)}`]]);
          summary += `<details class="swap-breakdown"><summary>How we got ${money(q.value)}</summary><p>${old.label}</p>${rows(q.deductions.map(item => [item.label,`${item.percent}% · ${money(old.price*item.percent/100)}`]))}<p>${money(old.price)} − ${q.deductionPercent}% = <strong>${money(q.value)}</strong></p></details>`;
          message.push(`Swap price basis: ${money(old.price)}`,`Deductions: ${q.deductions.map(d => `${d.label} ${d.percent}%`).join(' + ')}`,`Estimated swap value: ${money(q.value)}`);
          if (q.surplus > 0) { summary += `<p class="fine">Your estimate is ${money(q.surplus)} above the target price. Any cash difference needs a separate agreement; a payout is not guaranteed.</p>`; message.push(`Estimated surplus: ${money(q.surplus)} — please confirm any cash-difference arrangement.`); }
        }
      }
    }
    if (q.amount !== lastAmount) { $('plan-deposit').value = q.amount != null ? Math.round(q.amount*DEPOSIT_RATE) : ''; lastAmount = q.amount; }
    $('plan-deposit').disabled = q.manual || q.pending || q.amount === 0;
    $('plan-deposit').min = String(Math.round((q.amount || 0)*DEPOSIT_RATE)); $('plan-deposit').max = String(q.amount || 0);
    let depositError = invalidDeposit(q);
    message.push(`Payment: ${easy ? 'Easy Buy' : 'Outright'}`);
    if (!q.pending && !q.manual) {
      summary += `<div class="amount-due"><span>${isSwap ? 'Amount to add' : 'Outright price'}</span><strong>${money(q.amount)}</strong></div>`;
      message.push(`${isSwap ? 'Estimated amount to add' : 'Outright price'}: ${money(q.amount)}`);
    }
    if (easy) {
      const platform = FINANCE_PLATFORMS[radio('platform')];
      message.push(`Easy Buy platform: ${platform.label}`,`Interest: ${platform.rate*100}% monthly on the balance after deposit`,`Duration: ${$('plan-duration').value} month(s)`);
      $('plan-note').innerHTML = `<strong>${platform.creditCheck ? 'This platform will check your credit score.' : 'This platform does not check your credit score.'}</strong><p>Approval and final terms are confirmed by the platform. ${isSwap ? 'This planning estimate applies the swap credit first, then your deposit. Combining swap and finance is subject to approval.' : 'Interest is calculated on the phone balance after your deposit.'}</p>`;
      if (!q.manual && !q.pending && q.amount > 0 && !depositError) {
        const plan = financePlan({amount:q.amount,platform:radio('platform'),duration:Number($('plan-duration').value),deposit:Number($('plan-deposit').value)});
        summary += `<div class="plan-summary"><span class="eyebrow">${platform.label.toUpperCase()}</span>${rows([['Deposit now',money(plan.deposit)],['Balance financed',money(plan.balance)],[`Interest · ${plan.rate*100}% × ${plan.payments.length} month(s)`,money(plan.interest)]])}<div class="monthly-amount"><strong>${money(plan.payments[0])}</strong><span>/ month${plan.payments.at(-1) !== plan.payments[0] ? ' (last payment adjusted)' : ''}</span></div><details><summary>Your ${plan.payments.length} monthly payment${plan.payments.length > 1 ? 's' : ''}</summary>${rows(plan.payments.map((value,i) => [`Month ${i+1}`,money(value)]))}</details>${rows([['Total cash paid, including deposit',money(plan.totalPayable)]])}<p class="fine">${isSwap ? 'Plus your trade-in phone. ' : ''}Delivery is separate. Final due dates and fees are confirmed before payment.</p></div>`;
        message.push(`Deposit: ${money(plan.deposit)}`,`Balance financed: ${money(plan.balance)}`,`Total interest: ${money(plan.interest)}`,`Monthly repayments: ${plan.payments.map(money).join(', ')}`,`Total cash paid including deposit: ${money(plan.totalPayable)}${isSwap ? ', plus trade-in phone' : ''}`);
      } else if (q.amount === 0 && !q.pending && !q.manual) summary += '<p class="summary-hint">There is no estimated balance to finance. Ask us to confirm the swap arrangement.</p>';
      else if (depositError) summary += `<p class="summary-hint">${depositError}</p>`;
    }
    message.push(q.manual ? 'Please assess my phone and send a final quote before any payment.' : 'Please confirm current stock, price, any swap inspection and complete payment terms before I pay.');
    if (easy) message.push('Please confirm approval, any fees, actual due dates and collection arrangements.');
    // Preserve ad attribution in dynamically rebuilt WhatsApp links.
    try {
      const saved = JSON.parse(sessionStorage.getItem('mikee-gadget-plug_ad_attribution') || '{}');
      const refs = ['gclid','wbraid','gbraid','utm_source','utm_medium','utm_campaign','utm_term','utm_content'].map(key => [key,query.get(key)||saved[key]]).filter(([,value]) => value);
      if (refs.length) message.push(`Campaign reference: ${refs.map(([key,value]) => `${key}: ${value}`).join(' | ')}`);
    } catch { /* Enquiries still work when storage is unavailable. */ }
    $('order-summary').innerHTML = summary;
    const ready = step === 3 && !q.pending && !depositError;
    $('order-whatsapp').hidden = !ready;
    $('order-whatsapp').href = `https://wa.me/${commerceSite.whatsappNumber}?text=${encodeURIComponent(message.join('\n'))}`;
    $('order-whatsapp').textContent = q.manual ? 'Ask for my final quote ↗' : 'Send my selection on WhatsApp ↗';
    if (easy) $('order-whatsapp').dataset.easyBuy = 'true'; else delete $('order-whatsapp').dataset.easyBuy;
    if (step === 3) error(depositError);
    const url = new URL(location.href); url.searchParams.set('phone',phone.id); url.searchParams.set('purchase',radio('purchase')); url.searchParams.set('payment',radio('payment')); history.replaceState({},'',url);
  }
  $('phone-search').addEventListener('input',() => {
    const term = $('phone-search').value.toLowerCase().trim(); const previousId = selected()?.id;
    const filtered = models.filter(p => term.split(/\s+/).every(token => p.model.toLowerCase().includes(token)));
    modelOptions($('buy-model'),filtered,selected()?.slug); variants('buy',previousId); render();
  });
  $('buy-model').addEventListener('change',() => { variants('buy'); render(); });
  $('swap-model').addEventListener('change',() => { variants('swap'); form.querySelectorAll('.condition-row input').forEach(input => input.checked = false); render(); });
  form.addEventListener('change',() => { error(''); render(); });
  $('plan-deposit').addEventListener('input',render);
  $('flow-next').addEventListener('click',() => showStep(Math.min(3,step+1)));
  $('flow-back').addEventListener('click',() => { error(''); showStep(Math.max(1,step-1)); });
  document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click',() => showStep(Number(button.dataset.step))));
  $('order-whatsapp').addEventListener('click',event => { if (!validate(3)) event.preventDefault(); });
  form.addEventListener('submit',event => { event.preventDefault(); if (step < 3) showStep(step+1); });
  render();
}
