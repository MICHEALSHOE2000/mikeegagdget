import {media,activateImages} from './storefront-ui.mjs';
import { choices as baseChoices, money, estimateSwap, financePlan } from '../commerce/upgrade-core.mjs';
import { commerceSite } from '../commerce/catalog.mjs';
import { minimumDeposit, isAppleDevice, MAX_FINANCED } from '../easy-buy/easy-buy-core.mjs';
import {offerChoice} from '../commerce/offers.mjs';
import {suitableCurrentPhone} from '../commerce/device-hierarchy.mjs';
import {selectedCondition as conditionFor} from '../commerce/conditions.mjs';
const choices=baseChoices.map(offerChoice);
const $ = id => document.getElementById(id);
const form = $('buy-flow');
if (form) {
  const query = new URLSearchParams(location.search);
  const find = id => choices.find(phone => phone.id === id);
  const radio = name => form.querySelector(`input[name="${name}"]:checked`)?.value;
  const setRadio = (name,value) => { const input = form.querySelector(`input[name="${name}"][value="${value}"]`); if (input) input.checked = true; };
  const models = [...new Map(choices.map(phone => [phone.slug,phone])).values()];
  const track=(event,data={})=>window.MikeeGadgetPlugTracking?.pushEvent(event,{journey:'buy',...data});
  const legacyId = query.get('phone');
  const initial = find(legacyId) || find(query.get('target')) || choices.find(p => p.slug === legacyId || `${p.slug}-${p.storage.replace('GB','')}` === legacyId) || find('iphone-13|128GB');
  let step = 1, reached = 1, lastSwapQuote='', lastAmount=null;
  let targetCondition=conditionFor(initial,query.get('condition'));
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
    options($(`${prefix}-variant`),rows.map(p => [p.id,`${p.storage}${prefix === "buy" ? (p.price ? ` · ${money(p.price)}` : " · confirm price") : ""}`]),preferred);
    if(prefix==='buy'){
      const chosen=$('buy-variant').value;
      $('buy-storage-choices').innerHTML=rows.map(phone=>`<button type="button" data-buy-storage="${phone.id}" aria-pressed="${phone.id===chosen}" class="${phone.id===chosen?'is-selected':''}"><strong>${phone.storage}</strong><span>${phone.price?money(phone.price):'Confirm price'}</span></button>`).join('');
    }
  }
  modelOptions($('buy-model'),models,initial.slug); variants('buy',initial.id);
  const previous = find(query.get('current')) || find('iphone-x|64GB');
  const swapModels=()=>models.filter(p=>p.brand===selected()?.brand&&suitableCurrentPhone(p,selected()));
  function refreshSwapOptions(term='',preferred=oldPhone()?.id){
    const matching=swapModels().filter(p=>term.split(/\s+/).every(token=>p.model.toLowerCase().includes(token)));
    modelOptions($('swap-model'),matching,find(preferred)?.slug);
    variants('swap',preferred);
    if(preferred&&oldPhone()?.id!==preferred)form.querySelectorAll('.condition-row input').forEach(input=>input.checked=false);
  }
  modelOptions($('swap-model'),swapModels(),previous.slug); variants('swap',previous.id);
  if (query.get('method') === 'swap' || query.get('purchase') === 'swap' || location.pathname.includes('phone-swap')) setRadio('purchase','swap');
  if (query.get('method') === 'easy' || query.get('payment') === 'easy' || location.pathname.includes('easy-buy')) { setRadio('payment','easy'); if(radio('purchase') !== 'swap') setRadio('purchase','easy'); }
  function selected() { return find($('buy-variant').value); }
  function oldPhone() { return find($('swap-variant').value); }
  function conditionNames() { const phone = oldPhone(); return ['batteryChanged','screenChanged','screenCracked',...(phone?.hasFaceId ? ['faceId'] : []),...(phone?.hasGlassBack ? ['backChanged','backCracked'] : [])]; }
  function missingAnswers() { return conditionNames().filter(name => !radio(name)); }
  function quote() {
    const target = selected();
    if (!target) return { pending:true };
    if (radio('purchase') !== 'swap') return { amount:target.price, manual:!target.price };
    const swap = estimateSwap({current:oldPhone(),target,faceIdBroken:radio('faceId') === 'no', batteryChanged:radio('batteryChanged') === 'yes',screenChanged:radio('screenChanged') === 'yes',backChanged:radio('backChanged') === 'yes',screenCracked:radio('screenCracked') === 'yes',backCracked:radio('backCracked') === 'yes'});
    return { ...swap, amount:swap.manual ? null : swap.topUp, swap:true };
  }
  const photo = phone => media(phone?.image,phone?.model || 'Your phone');
  const rows = entries => `<dl class="order-lines">${entries.map(([label,value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
  function error(message) { $('flow-error').textContent = message; $('flow-error').hidden = !message; }
  function invalidDeposit(q) {
    if (radio('payment') !== 'easy') return '';
    if (!q.amount || q.manual || q.pending) return 'Confirm a phone price and a valid amount to finance before applying for EasyBuy.';
    if ($('plan-deposit').value === '') return 'Enter your deposit to see a payment plan.';
    try { financePlan({amount:q.amount,phone:selected(),duration:Number($('plan-duration').value),deposit:Number($('plan-deposit').value)}); return ''; }
    catch { return `The required down payment for this phone is ${money(minimumDeposit(q.amount,selected()))}. Check your selection and try again.`; }
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
    $('flow-next').textContent = step === 1 ? 'Next: choose how to buy →' : 'See my price →';
    render();
    const heading = form.querySelector(`[data-screen="${step}"] h2`); heading.tabIndex = -1; heading.focus({preventScroll:true});
    document.querySelector('.flow-main').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',block:'start'});
  }
  function render() {
    queueMicrotask(() => activateImages(form.parentElement.parentElement));
    const phone = selected(), old = oldPhone();
    const isSwap = radio('purchase') === 'swap', easy = radio('payment') === 'easy';
    $('swap-fields').hidden = !isSwap;
    $('row-faceId').hidden = !old?.hasFaceId; $('row-backChanged').hidden = !old?.hasGlassBack; $('row-backCracked').hidden = !old?.hasGlassBack;
    $('easy-fields').hidden = !easy;
    if (!phone) {
      $('selected-device').innerHTML = '<p>No matching model. Clear your search or try another model.</p>';
      $('order-summary').innerHTML = '<p>Choose a phone to start your upgrade.</p>';
      $('flow-next').disabled = true; $('order-whatsapp').hidden = true; return;
    }
    $('flow-next').disabled = false;
    $('selected-device').innerHTML = `${photo(phone)}<div><strong>${phone.model}</strong><span>${phone.storage}</span><b>${phone.price ? money(phone.price) : 'Ask for today’s price'}</b></div>`;
    targetCondition=conditionFor(phone,targetCondition);
    $('buy-condition').innerHTML=phone.conditions?.length>1?`<label for="buy-condition-select">Condition<select id="buy-condition-select"><option value="Confirm available condition" ${targetCondition==='Confirm available condition'?'selected':''}>Confirm with Mikee</option>${phone.conditions.map(item=>`<option value="${item}" ${targetCondition===item?'selected':''}>${item}</option>`).join('')}</select></label>`:`<p class="buy-condition-badge">${targetCondition}</p>`;
    $('model-feedback').textContent = phone.price ? 'Listed price. Confirm the exact unit and availability before payment.' : 'This model needs a current price from us. You can still send your selection.';
    if (isSwap && !old) { $('order-summary').innerHTML='<p>Choose a current phone or ask us for a personal quote.</p>'; $('flow-next').disabled=true; $('order-whatsapp').hidden=true; return; }
    const q = quote();
    if(isSwap&&step===3&&!q.manual&&!q.pending&&!missingAnswers().length){const signature=[phone.id,old?.id,q.topUp].join('|');if(signature!==lastSwapQuote){lastSwapQuote=signature;track('swap_calculation_completed',{product_id:phone.id,current_phone:old?.id,value:q.topUp});}}
    let summary = `<div class="summary-device">${photo(phone)}<div><h2>${phone.model}</h2><p>${phone.storage}</p></div></div>`;
    summary += rows([['Phone price',phone.price ? money(phone.price) : 'To confirm']]);
    const message = ['Hello Mikee Gadget Plug, here is my phone selection.',`Phone: ${phone.label}`,`Listed price: ${phone.price ? money(phone.price) : 'Please confirm'}`,`Purchase: ${isSwap ? 'Swap' : 'Buy'}`,`Preferred condition: ${targetCondition}`, `Preferred colour: ${query.get('color') || 'Please confirm'}`];
    if (isSwap) {
      message.push(`Swapping from: ${old.label}`);
      if (q.pending) summary += '<div class="summary-hint">Tell us your current phone’s condition to see its swap value.</div>';
      else {
        message.push(`Screen changed: ${radio('screenChanged')}`,`Battery changed: ${radio('batteryChanged')}`,`Back glass changed: ${old.hasGlassBack ? radio('backChanged') : 'Not applicable'}`,`Face ID working: ${old.hasFaceId ? radio('faceId') : 'Not applicable to this model'}`,`Screen cracked: ${radio('screenCracked') || 'Not answered'}`,`Back glass cracked: ${old.hasGlassBack ? radio('backCracked') || 'Not answered' : 'Not applicable'}`);
        if (q.manual) summary += `<div class="summary-hint"><strong>${q.reason === 'crack' ? 'Cracks need a personal quote.' : 'Let’s confirm your swap value.'}</strong><p>${q.reason === 'crack' ? 'Send clear photos on WhatsApp. We’ll assess the damage and confirm the amount to add.' : 'We need a confirmed price for this phone before valuing the swap.'}</p></div>`;
        else {
          if (missingAnswers().length) summary += '<p class="summary-hint">Provisional estimate. Answer all condition questions to continue.</p>';
          summary += rows([['Market reference',money(old.basePrice)],['Your swap value',`− ${money(q.value)}`]]);
          summary += `<details class="swap-breakdown"><summary>How we got ${money(q.value)}</summary><p>${old.label}</p>${rows(q.deductions.map(item => [item.label,`${item.percent}% · ${money(old.basePrice*item.percent/100)}`]))}<p>${money(old.basePrice)} − ${q.deductionPercent}% = <strong>${money(q.value)}</strong></p></details>`;
          message.push(`Swap price basis: ${money(old.basePrice)}`,`Deductions: ${q.deductions.map(d => `${d.label} ${d.percent}%`).join(' + ')}`,`Estimated swap value: ${money(q.value)}`);
          if (q.surplus > 0) { summary += `<p class="fine">Your estimate is ${money(q.surplus)} above the target price. Any cash difference needs a separate agreement; a payout is not guaranteed.</p>`; message.push(`Estimated surplus: ${money(q.surplus)} — please confirm any cash-difference arrangement.`); }
        }
      }
    }
    if (q.amount !== lastAmount) { $('plan-deposit').value = q.amount > 0 ? minimumDeposit(q.amount,phone) : ''; lastAmount = q.amount; }
    $('plan-deposit').disabled = q.manual || q.pending || q.amount === 0;
    $('plan-deposit').min = String(q.amount > 0 ? minimumDeposit(q.amount,phone) : 0); $('plan-deposit').max = String(q.amount || 0);
    $('deposit-help').textContent = q.amount > 0 ? `Required down payment: ${money(minimumDeposit(q.amount,phone))}. ${isAppleDevice(phone)?'The standard iPhone plan uses 20% monthly interest.':'The financed balance for other gadgets cannot exceed '+money(MAX_FINANCED)+'.'}` : 'Choose a priced phone to see your required down payment.';
    let depositError = invalidDeposit(q);
    message.push(`Payment: ${easy ? 'Easy Buy' : 'Outright'}`);
    if (!q.pending && !q.manual) {
      summary += `<div class="amount-due"><span>${isSwap ? 'Amount to add' : 'Outright price'}</span><strong>${money(q.amount)}</strong></div>`;
      message.push(`${isSwap ? 'Estimated amount to add' : 'Outright price'}: ${money(q.amount)}`);
    }
    if (easy) {
      message.push('Pay Small Small: standard plan',`Duration: ${$('plan-duration').value} month(s)`);
      if (!q.manual && !q.pending && q.amount > 0 && !depositError) {
        const plan = financePlan({amount:q.amount,phone,duration:Number($('plan-duration').value),deposit:Number($('plan-deposit').value)});
        summary += `<div class="plan-summary"><span class="eyebrow">MONTHLY REPAYMENT</span><div class="monthly-amount"><strong>${money(plan.payments[0])}</strong><span>/ month${plan.payments.at(-1) !== plan.payments[0] ? ' (last payment adjusted)' : ''}</span></div><p class="fine">Required down payment: ${money(plan.deposit)} · ${plan.rate*100}% monthly interest${plan.processingFee?` · ${money(plan.processingFee)} processing fee`:''}.</p><details><summary>View full payment breakdown</summary>${rows([['Phone price',money(q.amount)],['Down payment',money(plan.deposit)],['Balance financed',money(plan.balance)],['Interest',money(plan.interest)],['Processing fee',money(plan.processingFee)],['Due upfront',money(plan.dueUpfront)],['Total paid',money(plan.totalPayable)]])}</details><p class="fine">${isSwap ? 'Plus your trade-in phone. ' : ''}Final stock, due dates and delivery are confirmed before payment.</p></div>`;
        message.push(`Deposit: ${money(plan.deposit)}`,`Balance financed: ${money(plan.balance)}`,`Interest: ${plan.rate*100}% monthly`, `Total interest: ${money(plan.interest)}`,`Processing fee: ${money(plan.processingFee)} (paid upfront, not financed)`,`Due upfront: ${money(plan.dueUpfront)}`,`Monthly repayments: ${plan.payments.map(money).join(', ')}`,`Total cash paid including deposit and fee: ${money(plan.totalPayable)}${isSwap ? ', plus trade-in phone' : ''}`);
      } else if (q.amount === 0 && !q.pending && !q.manual) summary += '<p class="summary-hint">There is no estimated balance to finance. Ask us to confirm the swap arrangement.</p>';
      else if (depositError) summary += `<p class="summary-hint">${depositError}</p>`;
    }
    message.push(q.manual ? 'Please assess my phone and send a final quote before any payment.' : 'Please confirm current stock, price, any swap inspection and complete payment terms before I pay.');
    if (easy) message.push('Please confirm approval, any fees, actual due dates and collection arrangements.');
    $('order-summary').innerHTML = summary;
    const ready = step === 3 && !q.pending && !depositError && (!isSwap || !missingAnswers().length);
    $('order-whatsapp').hidden = !ready;
    $('order-whatsapp').href = `https://wa.me/${commerceSite.whatsappNumber}?text=${encodeURIComponent(message.join('\n'))}`;
    $('order-whatsapp').textContent = q.manual ? 'Ask for my final quote ↗' : 'Send my selection on WhatsApp ↗';
    if (easy) $('order-whatsapp').dataset.easyBuy = 'true'; else delete $('order-whatsapp').dataset.easyBuy;
    if (step === 3) error(depositError);
    const url = new URL(location.href); url.searchParams.set('phone',phone.id); url.searchParams.set('purchase',radio('purchase')); url.searchParams.set('payment',radio('payment')); url.searchParams.set('condition',targetCondition); history.replaceState({},'',url);
  }
  $('phone-search').addEventListener('input',() => {
    const term = $('phone-search').value.toLowerCase().trim(); const previousId = selected()?.id;
    const filtered = models.filter(p => term.split(/\s+/).every(token => p.model.toLowerCase().includes(token)));
    modelOptions($('buy-model'),filtered,selected()?.slug); variants('buy',previousId);refreshSwapOptions($('swap-search').value.toLowerCase().trim()); render();
  });
  $('swap-search').addEventListener('input',()=>{refreshSwapOptions($('swap-search').value.toLowerCase().trim());render();});
  $('buy-model').addEventListener('change',() => { variants('buy');refreshSwapOptions(); render(); });
  $('buy-storage-choices').addEventListener('click',event=>{const button=event.target.closest('[data-buy-storage]');if(!button)return;$('buy-variant').value=button.dataset.buyStorage;$('buy-variant').dispatchEvent(new window.Event('change',{bubbles:true}));});
  $('swap-model').addEventListener('change',() => { variants('swap'); form.querySelectorAll('.condition-row input').forEach(input => input.checked = false); render(); });
  form.addEventListener('change',event => {
    if(event.target.id==='buy-variant'){
      variants('buy',event.target.value);
      refreshSwapOptions();
      const phone=selected();track('select_storage',{product_id:phone?.id,storage:phone?.storage,value:phone?.price});
      track('target_swap_phone_selected',{product_id:phone?.id,value:phone?.price});
    }
    if(event.target.id==='swap-variant')track('current_swap_phone_selected',{product_id:oldPhone()?.id});
    if(event.target.name==='purchase'){
      setRadio('payment',event.target.value==='easy'?'easy':'outright');
      track(event.target.value==='swap'?'swap_selected':event.target.value==='easy'?'pay_small_small_selected':'buy_outright_selected',{product_id:selected()?.id});
    }
    if(event.target.id==='buy-condition-select'){targetCondition=event.target.value;track('select_condition',{product_id:selected()?.id,condition:targetCondition});}
    if(event.target.id==='plan-duration')track('repayment_duration_selected',{product_id:selected()?.id,months:Number(event.target.value)});
    error(''); render();
  });
  $('flow-next').addEventListener('click',() => showStep(Math.min(3,step+1)));
  $('flow-back').addEventListener('click',() => { error(''); showStep(Math.max(1,step-1)); });
  document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click',() => showStep(Number(button.dataset.step))));
  $('order-whatsapp').addEventListener('click',event => { if (!validate(3)) event.preventDefault(); });
  form.addEventListener('submit',event => { event.preventDefault(); if (step < 3) showStep(step+1); });
  render();
  if (legacyId || query.get('target')) showStep(2);
}
