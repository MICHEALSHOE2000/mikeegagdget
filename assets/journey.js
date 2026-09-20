import {choices as baseChoices,estimateSwap,financePlan,FINANCE_PLATFORMS,money} from '../commerce/upgrade-core.mjs';
import {offerChoice} from '../commerce/offers.mjs';
import {commerceSite} from '../commerce/catalog.mjs';
import {media,activateImages,escape as esc} from './storefront-ui.mjs';
import {DEPOSIT_RATE,FINANCE_DURATIONS,CREDIT_LIMIT_URL} from '../easy-buy/easy-buy-core.mjs';

const root=document.querySelector('[data-journey]');

if(root){
 const $=id=>document.getElementById(id);
 const mode=root.dataset.journey;
 const query=new URLSearchParams(location.search);
 const choices=baseChoices.map(offerChoice);
 const available=choices.filter(phone=>phone.price>0&&phone.image&&phone.finance);
 const currentPhones=choices.filter(phone=>phone.brand==='Apple'&&!phone.slug.startsWith('iphone-18'));
 const byId=id=>choices.find(phone=>phone.id===id);
 const initialTarget=byId(query.get('phone'))||byId(query.get('target'));
 const initialCurrent=byId(query.get('current'));
 const state={
  target:initialTarget?.price>0?initialTarget.id:'',
  targetModel:initialTarget?.slug||'',
  current:initialCurrent?.id||'',
  currentModel:initialCurrent?.slug||'',
  answers:{},
  deposit:'',
  duration:1,
  platform:'credit',
  searches:{current:initialCurrent?.model||'',target:initialTarget?.model||''}
 };
 let stage=mode==='easy'&&state.target?'plan':'phone';
 let question=0;
 let lastTrackedPlan='';

 const track=(event,data={})=>window.MikeeGadgetPlugTracking?.pushEvent(event,{journey:mode,...data});
 track(mode==='easy'?'start_easybuy':'start_swap',{product_id:state.target});

 const selected=()=>byId(state.target);
 const current=()=>byId(state.current);
 const modelChoices=list=>[...new Map(list.map(phone=>[phone.slug,phone])).values()];
 const normalize=text=>String(text||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const matchingModels=(list,term)=>{
  const tokens=normalize(term).split(' ').filter(Boolean);
  return modelChoices(list).filter(phone=>tokens.every(token=>normalize(`${phone.model} ${phone.brand}`).includes(token)));
 };
 const questions=()=>[
  {key:'faceIdBroken',label:'Does Face ID work?',invert:true,applies:current()?.hasFaceId},
  {key:'batteryChanged',label:'Has the battery been changed?',applies:true},
  {key:'screenChanged',label:'Has the screen been changed?',applies:true},
  {key:'screenCracked',label:'Is the screen cracked?',applies:true},
  {key:'backChanged',label:'Has the back glass been changed?',applies:current()?.hasGlassBack},
  {key:'backCracked',label:'Is the back glass cracked?',applies:current()?.hasGlassBack}
 ].filter(item=>item.applies);
 const valuation=()=>estimateSwap({current:current(),target:current()?.price?current():available[0],...state.answers});
 const quote=()=>estimateSwap({current:current(),target:selected(),...state.answers});

 function syncStateAttributes(){
  root.dataset.currentPhone=state.current;
  root.dataset.currentModel=state.currentModel;
  root.dataset.targetPhone=state.target;
  root.dataset.targetModel=state.targetModel;
 }

 function updateSelectionUrl(key,id){
  const url=new URL(location.href);
  const parameter=key==='current'?'current':mode==='easy'?'phone':'target';
  if(id)url.searchParams.set(parameter,id);
  else url.searchParams.delete(parameter);
  history.replaceState({},'',url);
 }

 function error(text=''){
  $('journey-error').textContent=text;
  $('journey-error').hidden=!text;
 }

 const rows=entries=>`<dl class="journey-lines">${entries.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>`;
 const device=(phone,showPrice=true)=>phone?`<div class="journey-device">${media(phone.image,phone.model)}<div><strong>${esc(phone.model)}</strong><span>${esc(phone.storage)}</span>${showPrice&&phone.price?`<b>${money(phone.price)}</b>`:''}</div></div>`:'';

 function resultButtons(models,selectedSlug=''){
  if(!models.length)return '<p class="model-no-results">No matching phones. Try a shorter name.</p>';
  return models.slice(0,12).map(phone=>`<button type="button" class="model-result" data-model-slug="${esc(phone.slug)}" role="option" aria-selected="${phone.slug===selectedSlug}" ${phone.slug===selectedSlug?'aria-current="true"':''}><span>${esc(phone.model)}</span>${phone.slug===selectedSlug?'<b aria-hidden="true">✓</b>':'<span aria-hidden="true">→</span>'}</button>`).join('');
 }

 function chooseUI(isCurrent){
  const list=isCurrent?currentPhones:available;
  const key=isCurrent?'current':'target';
  const modelKey=isCurrent?'currentModel':'targetModel';
  const chosen=byId(state[key]);
  const slug=state[modelKey]||chosen?.slug||'';
  const models=modelChoices(list);
  const chosenModel=models.find(phone=>phone.slug===slug);
  const variants=list.filter(phone=>phone.slug===slug);
  const sectionLabel=isCurrent?'YOUR CURRENT PHONE':mode==='swap'?'YOUR NEW PHONE':'CHOOSE YOUR PHONE';
  const heading=isCurrent?'What phone are you swapping?':mode==='swap'?'What do you want to upgrade to?':'Which phone do you want?';
  const helper=isCurrent?`<p class="journey-help">Instant estimates are available for listed iPhones. <a href="https://wa.me/${commerceSite.whatsappNumber}?text=Hello%20Mikee%2C%20please%20value%20my%20Samsung%20or%20Pixel%20for%20a%20swap.">Samsung or Pixel? Ask for a valuation.</a></p>`:'';
  const storageOptions=variants.map(phone=>`<option value="${esc(phone.id)}" ${phone.id===state[key]?'selected':''}>${esc(phone.storage)}${!isCurrent?` · ${money(phone.price)}`:''}</option>`).join('');
  const preview=chosen||chosenModel;
  return `<p class="journey-section-label">${sectionLabel}</p><h2>${heading}</h2>${helper}
   <div class="model-finder"><label for="journey-search">Find your model<input id="journey-search" type="search" placeholder="Search, e.g. 13 Pro Max" autocomplete="off" value="${esc(state.searches[key])}" aria-controls="journey-search-results" aria-expanded="false"></label><div id="journey-search-results" class="model-search-results" role="listbox" hidden></div></div>
   <div class="model-control"><span class="model-control-label" id="journey-model-label">Phone Model</span><details class="model-picker" id="journey-model-picker"><summary id="journey-model-summary" aria-labelledby="journey-model-label">${chosenModel?`${esc(chosenModel.model)} <span aria-hidden="true">✓</span>`:'Choose a phone'}</summary><div class="model-picker-panel"><label class="sr-only" for="journey-model-search">Search for model</label><input id="journey-model-search" type="search" placeholder="Search for model..." autocomplete="off"><div id="journey-model-results" class="model-picker-results" role="listbox">${resultButtons(models,slug)}</div></div></details></div>
   <label for="journey-storage">Storage<select id="journey-storage" ${slug?'':'disabled'}><option value="">Choose storage</option>${storageOptions}</select></label>
   <div id="journey-selected">${preview?device(preview,!isCurrent&&Boolean(chosen)):''}</div><p class="journey-help" id="journey-search-status" role="status">${chosenModel&&!chosen?'Model selected. Choose the storage to continue.':''}</p>`;
 }

 function bindChooser(isCurrent){
  const list=isCurrent?currentPhones:available;
  const key=isCurrent?'current':'target';
  const modelKey=isCurrent?'currentModel':'targetModel';
  const models=modelChoices(list);
  const quickSearch=$('journey-search');
  const quickResults=$('journey-search-results');
  const modelPicker=$('journey-model-picker');
  const modelSearch=$('journey-model-search');
  const modelResults=$('journey-model-results');
  const modelSummary=$('journey-model-summary');
  const storage=$('journey-storage');
  const selectedBox=$('journey-selected');
  const status=$('journey-search-status');

  const showResults=(container,items)=>{
   container.innerHTML=resultButtons(items,state[modelKey]);
   container.hidden=false;
  };

  const updateSelectedPreview=()=>{
   const phone=byId(state[key]);
   const model=models.find(item=>item.slug===state[modelKey]);
   selectedBox.innerHTML=phone?device(phone,!isCurrent):model?device(model,false):'';
   activateImages(selectedBox);
  };

  const populateStorage=()=>{
   const variants=list.filter(phone=>phone.slug===state[modelKey]);
   storage.disabled=!variants.length;
   storage.innerHTML='<option value="">Choose storage</option>'+variants.map(phone=>`<option value="${esc(phone.id)}" ${phone.id===state[key]?'selected':''}>${esc(phone.storage)}${isCurrent?'':` · ${money(phone.price)}`}</option>`).join('');
  };

  const selectModel=(slug,{focusStorage=true}={})=>{
   const phone=models.find(item=>item.slug===slug);
   if(!phone)return;
   const modelChanged=state[modelKey]&&state[modelKey]!==slug;
   if(state[modelKey]!==slug){
    state[key]='';
    if(isCurrent)state.answers={};
    else if(mode==='easy')state.deposit='';
   }
   state[modelKey]=slug;
   state.searches[key]=phone.model;
   if(modelChanged)updateSelectionUrl(key,'');
   modelSummary.innerHTML=`${esc(phone.model)} <span aria-hidden="true">✓</span>`;
   quickSearch.value=phone.model;
   modelSearch.value=phone.model;
   quickSearch.setAttribute('aria-expanded','false');
   quickResults.hidden=true;
   modelPicker.open=false;
   populateStorage();
   updateSelectedPreview();
   status.textContent=`${phone.model} selected. Choose the storage to continue.`;
   syncStateAttributes();
   track('select_phone',{phone_model:phone.model,product_id:phone.slug,selection:isCurrent?'current':'target'});
   if(focusStorage)storage.focus({preventScroll:true});
  };

  const selectVariant=id=>{
   const phone=byId(id);
   if(!phone)return;
   if(state[key]!==id){
    if(isCurrent)state.answers={};
    else if(mode==='easy')state.deposit='';
   }
   state[key]=id;
   state[modelKey]=phone.slug;
   state.searches[key]=phone.model;
   modelSummary.innerHTML=`${esc(phone.model)} <span aria-hidden="true">✓</span>`;
   quickSearch.value=phone.model;
   modelSearch.value=phone.model;
   updateSelectedPreview();
   updateSelectionUrl(key,id);
   syncStateAttributes();
   status.textContent=`${phone.label} selected.`;
   track('select_storage',{product_id:id,phone_model:phone.model,storage:phone.storage,selection:isCurrent?'current':'target'});
   error();
  };

  const handleResultClick=event=>{
   const button=event.target.closest('[data-model-slug]');
   if(button)selectModel(button.dataset.modelSlug);
  };

  quickSearch.addEventListener('input',()=>{
   state.searches[key]=quickSearch.value;
   const matches=matchingModels(list,quickSearch.value);
   showResults(quickResults,matches);
   quickSearch.setAttribute('aria-expanded','true');
   status.textContent=matches.length?`${matches.length} matching model${matches.length===1?'':'s'}. Select one below.`:'No matching phones. Try a shorter name.';
  });
  quickSearch.addEventListener('keydown',event=>{
   if(event.key==='Escape'){
    quickResults.hidden=true;
    quickSearch.setAttribute('aria-expanded','false');
   }
  });
  quickResults.addEventListener('click',handleResultClick);
  modelResults.addEventListener('click',handleResultClick);
  modelSearch.addEventListener('input',()=>showResults(modelResults,matchingModels(list,modelSearch.value)));
  modelPicker.addEventListener('toggle',()=>{
   if(modelPicker.open){
    showResults(modelResults,matchingModels(list,modelSearch.value));
    (window.requestAnimationFrame||window.setTimeout)(()=>modelSearch.focus({preventScroll:true}),0);
   }
  });
  storage.addEventListener('change',()=>selectVariant(storage.value));
 }

 function campaignReference(){
  try{
   const saved=JSON.parse(sessionStorage.getItem('mikee-gadget-plug_ad_attribution')||'{}');
   const refs=['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','wbraid','gbraid','fbclid','ttclid'].map(key=>[key,query.get(key)||saved[key]]).filter(([,value])=>value);
   return refs.length?`Campaign reference: ${refs.map(([key,value])=>`${key}: ${value}`).join(' | ')}`:'';
  }catch{return '';}
 }

 function planFor(duration=state.duration){
  return financePlan({amount:selected().price,deposit:Number(state.deposit),duration,platform:state.platform});
 }

 function repaymentCards(plans=[]){
  return FINANCE_DURATIONS.map((duration,index)=>{
   const plan=plans[index];
   return `<label class="repayment-option"><input type="radio" name="duration" value="${duration}" ${state.duration===duration?'checked':''}><span class="repayment-card"><b>${duration} MONTH${duration===1?'':'S'}</b><strong>${plan?money(plan.payments[0]):'—'}<small>/month</small></strong><span>${plan?`Total incl. deposit: ${money(plan.totalPayable)}`:'Check your deposit'}</span><span>${plan?`Interest: ${money(plan.interest)}`:'—'}</span></span></label>`;
  }).join('');
 }

 function planSummary(phone,plan){
  const condition=query.get('condition')||'Confirm with Mikee';
  const colour=query.get('color');
  const monthly=plan.payments.at(-1)===plan.payments[0]?`${money(plan.payments[0])} / month`:`${money(plan.payments[0])} / month · final ${money(plan.payments.at(-1))}`;
  const entries=[
   ['Phone',phone.model],
   ['Storage',phone.storage],
   ['Condition',condition],
   ...(colour?[['Colour',colour]]:[]),
   ['Phone price',money(phone.price)],
   ['Down payment',money(plan.deposit)],
   ['Balance financed',money(plan.balance)],
   ['Duration',`${state.duration} month${state.duration===1?'':'s'}`],
   ['Monthly repayment',monthly],
   ['Total interest / cost',money(plan.interest)],
   ['Total repayment',money(plan.totalPayable)]
  ];
  return `<div class="plan-summary-heading"><div><p class="journey-section-label">YOUR PLAN</p><h3>Your repayment estimate</h3></div><span>Estimate</span></div>${rows(entries)}<p class="journey-help">Final approval, exact due dates, any provider fees and delivery charges are confirmed before payment.</p>`;
 }

 function easyPlanMessage(phone,plan){
  const lines=[
   'Hello Mikee Gadget Plug,',
   'I want to use EasyBuy.',
   `Phone: ${phone.label}`,
   `Phone price: ${money(phone.price)}${phone.offerId?' (20% promotion)':''}`,
   `Preferred condition: ${query.get('condition')||'Please confirm'}`,
   `Preferred colour: ${query.get('color')||'Please confirm'}`,
   `Plan: ${FINANCE_PLATFORMS[state.platform].label}`,
   `Deposit: ${money(plan.deposit)}`,
   `Balance financed: ${money(plan.balance)}`,
   `Interest: ${plan.rate*100}% monthly; ${money(plan.interest)} total`,
   `Duration: ${state.duration} month(s)`,
   `Payments: ${plan.payments.map(money).join(', ')}`,
   `Total repayment including deposit: ${money(plan.totalPayable)}`,
   'Please confirm the exact unit, stock, eligibility, due dates, fees and complete terms before payment.'
  ];
  const campaign=campaignReference();
  if(campaign)lines.push(campaign);
  return lines.join('\n');
 }

 function trackPlan(phone,plan){
  const signature=[phone.id,plan.deposit,state.duration,state.platform,plan.totalPayable].join('|');
  if(signature===lastTrackedPlan)return;
  lastTrackedPlan=signature;
  track('easybuy_calculated',{product_id:phone.id,deposit:plan.deposit,months:state.duration,total:plan.totalPayable,platform:state.platform});
 }

 function updateEasyPlan({shouldTrack=false}={}){
  const phone=selected();
  if(!phone)return;
  const depositInput=$('journey-deposit');
  const platformInput=$('journey-platform');
  if(depositInput)state.deposit=depositInput.value;
  if(platformInput)state.platform=platformInput.value;
  const options=$('repayment-options');
  const summary=$('plan-summary');
  const whatsapp=$('journey-whatsapp');
  let plans=[];
  try{
   plans=FINANCE_DURATIONS.map(duration=>planFor(duration));
   const plan=plans[FINANCE_DURATIONS.indexOf(state.duration)];
   options.innerHTML=repaymentCards(plans);
   summary.innerHTML=planSummary(phone,plan);
   whatsapp.href=`https://wa.me/${commerceSite.whatsappNumber}?text=${encodeURIComponent(easyPlanMessage(phone,plan))}`;
   whatsapp.removeAttribute('aria-disabled');
   whatsapp.tabIndex=0;
   error();
   if(shouldTrack)trackPlan(phone,plan);
  }catch{
   options.innerHTML=repaymentCards();
   summary.innerHTML='<p class="journey-help">Enter a valid whole-naira deposit to compare all six repayment periods.</p>';
   whatsapp.removeAttribute('href');
   whatsapp.setAttribute('aria-disabled','true');
   whatsapp.tabIndex=-1;
   error(`Enter a whole-naira deposit between ${money(Math.round(phone.price*DEPOSIT_RATE))} and ${money(phone.price)}.`);
  }
 }

 function easyPlanUI(){
  const phone=selected();
  if(state.deposit==='')state.deposit=String(Math.round(phone.price*DEPOSIT_RATE));
  let plans=[];
  try{plans=FINANCE_DURATIONS.map(duration=>planFor(duration));}catch{}
  const plan=plans[FINANCE_DURATIONS.indexOf(state.duration)];
  return `<p class="journey-section-label">COMPARE YOUR PAYMENTS</p><h2>How much works for you each month?</h2>${device(phone)}<div class="plan-controls"><label for="journey-deposit">Down payment (₦)<input id="journey-deposit" type="number" inputmode="numeric" min="${Math.round(phone.price*DEPOSIT_RATE)}" max="${phone.price}" step="1" value="${esc(state.deposit)}" aria-describedby="deposit-help"></label><p class="journey-help" id="deposit-help">Starts at ${money(Math.round(phone.price*DEPOSIT_RATE))} (40%). You can pay more upfront.</p><label for="journey-platform">EasyBuy option<select id="journey-platform"><option value="credit" ${state.platform==='credit'?'selected':''}>7.5% monthly · Approved limit</option><option value="noCredit" ${state.platform==='noCredit'?'selected':''}>20% monthly · No limit check</option></select></label><p class="journey-help">Interest uses the balance after your deposit. <a href="${CREDIT_LIMIT_URL}" target="_blank" rel="noopener">Check your Credit Direct limit ↗</a></p></div><fieldset class="repayment-selector"><legend><strong>CHOOSE REPAYMENT PERIOD</strong><span>Compare every option before you choose.</span></legend><div class="repayment-options" id="repayment-options">${repaymentCards(plans)}</div></fieldset><section class="plan-summary" id="plan-summary" aria-live="polite">${plan?planSummary(phone,plan):''}</section>`;
 }

 function bindEasyPlan(){
  const screen=$('journey-screen');
  screen.addEventListener('input',event=>{
   if(event.target.id==='journey-deposit')updateEasyPlan();
  });
  screen.addEventListener('change',event=>{
   if(event.target.id==='journey-platform'){
    state.platform=event.target.value;
    updateEasyPlan({shouldTrack:true});
   }
   if(event.target.name==='duration'){
    state.duration=Number(event.target.value);
    updateEasyPlan({shouldTrack:true});
   }
   if(event.target.id==='journey-deposit')updateEasyPlan({shouldTrack:true});
  });
  $('journey-whatsapp').addEventListener('click',event=>{
   if(event.currentTarget.getAttribute('aria-disabled')==='true'){
    event.preventDefault();
    return;
   }
   try{trackPlan(selected(),planFor());}catch{}
  });
  updateEasyPlan();
 }

 function changeStage(next){
  stage=next;
  error();
  render();
  const heading=$('journey-screen').querySelector('h2');
  if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
  root.scrollIntoView({block:'start',behavior:'auto'});
 }

 function render(){
  const isCurrent=mode==='swap'&&stage==='phone';
  const phone=selected();
  const totalSteps=mode==='easy'?2:5;
  let html='';
  let index=1;
  let label='Choose phone';
  $('journey-back').hidden=stage==='phone';
  $('journey-next').hidden=false;
  $('journey-whatsapp').hidden=true;
  $('journey-next').textContent='Continue →';

  if(stage==='phone'||stage==='target'){
   html=chooseUI(isCurrent);
   index=stage==='target'?4:1;
   label=isCurrent?'Your current phone':mode==='swap'?'Your new phone':'Choose phone';
  }

  if(stage==='plan'){
   index=2;
   label='Compare repayments';
   html=easyPlanUI();
   $('journey-next').hidden=true;
   $('journey-whatsapp').hidden=false;
   $('journey-whatsapp').textContent='Continue with this plan on WhatsApp ↗';
  }

  if(stage==='condition'){
   const items=questions();
   const item=items[question];
   const answer=state.answers[item.key];
   index=2;
   label=`Condition · ${question+1} of ${items.length}`;
   html=`<p class="journey-section-label">YOUR CURRENT PHONE</p><p class="journey-help">${esc(current().label)}</p><h2>${item.label}</h2><fieldset class="journey-answers"><legend class="sr-only">${item.label}</legend>${[['yes','Yes'],['no','No']].map(([value,text])=>{const result=item.invert?value==='no':value==='yes';return `<label><input type="radio" name="answer" value="${value}" ${answer===result?'checked':''}><span>${text}</span></label>`;}).join('')}</fieldset>`;
  }

  if(stage==='value'){
   index=3;
   label='Your estimated value';
   const result=valuation();
   html=`<p class="journey-section-label">SEE WHAT IT IS WORTH</p><h2>${result.manual?'Your phone needs a personal quote.':'Your estimated phone value.'}</h2>${device(current(),false)}${result.manual?'<p>We do not have a confirmed reference price for this model. We’ll value it after inspection.</p>':`<div class="journey-amount"><span>YOUR PHONE IS WORTH ABOUT</span><strong>${money(result.value)}</strong></div><details><summary>See valuation breakdown</summary>${rows([['Market reference',money(current().basePrice)],...result.deductions.map(item=>[item.label,`${item.percent}% · ${money(current().basePrice*item.percent/100)}`])])}</details>`}<p class="journey-help">Final value is subject to physical inspection.</p>`;
   $('journey-next').textContent='Choose my next phone →';
  }

  if(stage==='result'){
   index=5;
   label='Your estimate';
   html=`<p class="journey-section-label">YOUR NEW PHONE</p><h2>Your next upgrade.</h2>${device(phone)}`;
   const result=quote();
   const message=[
    'Hello Mikee Gadget Plug,',
    'I want to swap my phone.',
    `New phone: ${phone.label}`,
    `New phone price: ${money(phone.price)}${phone.offerId?' (20% promotion)':''}`,
    `Preferred condition: ${query.get('condition')||'Please confirm'}`,
    `Preferred colour: ${query.get('color')||'Please confirm'}`,
    `Current phone: ${current().label}`,
    ...questions().map(item=>`${item.label} ${state.answers[item.key]!==Boolean(item.invert)?'Yes':'No'}`)
   ];
   html+=result.manual?'<div class="journey-amount"><span>AMOUNT TO ADD</span><strong>Let’s confirm it.</strong></div><p>We need to inspect your phone and confirm its reference price before quoting the difference.</p>':`<div class="journey-amount"><span>YOU ADD</span><strong>${money(result.topUp)}</strong></div>${rows([['Your phone’s estimated value',money(result.value)],['Your new phone',money(phone.price)]])}${result.surplus?`<p>Your estimated value is ${money(result.surplus)} above this phone’s price. Any cash difference needs a separate agreement; payout is not guaranteed.</p>`:''}<details><summary>See valuation breakdown</summary>${rows(result.deductions.map(item=>[item.label,`${item.percent}% · ${money(current().basePrice*item.percent/100)}`]))}</details>`;
   message.push(result.manual?'Please assess my phone and quote the difference.':`Estimated swap value: ${money(result.value)}\nEstimated amount to add: ${money(result.topUp)}${result.surplus?`\nEstimated surplus: ${money(result.surplus)} — subject to separate agreement`:''}`);
   message.push('Please confirm the exact unit, stock, condition, inspection and complete terms before payment.');
   const campaign=campaignReference();
   if(campaign)message.push(campaign);
   $('journey-whatsapp').href=`https://wa.me/${commerceSite.whatsappNumber}?text=${encodeURIComponent(message.join('\n'))}`;
   $('journey-whatsapp').hidden=false;
   $('journey-whatsapp').textContent='Continue swap on WhatsApp ↗';
   $('journey-next').hidden=true;
  }

  $('journey-screen').innerHTML=html;
  $('journey-progress').max=totalSteps;
  $('journey-progress').value=index;
  $('journey-progress-label').textContent=`${index} / ${totalSteps} · ${label}`;
  activateImages(root);
  syncStateAttributes();
  if(stage==='phone'||stage==='target')bindChooser(isCurrent);
  if(stage==='plan')bindEasyPlan();
  root.querySelectorAll('[name="answer"]').forEach(input=>input.addEventListener('change',()=>{
   const item=questions()[question];
   state.answers[item.key]=item.invert?input.value==='no':input.value==='yes';
   error();
  }));
 }

 $('journey-form').addEventListener('submit',event=>{
  event.preventDefault();
  error();
  if(stage==='phone'||stage==='target'){
   const id=mode==='swap'&&stage==='phone'?state.current:state.target;
   if(!id){error('Choose a phone and storage to continue.');return;}
   if(mode==='swap'&&stage==='phone'){
    question=0;
    changeStage('condition');
   }else changeStage(mode==='easy'?'plan':'result');
   return;
  }
  if(stage==='condition'){
   const item=questions()[question];
   if(typeof state.answers[item.key]!=='boolean'){error('Choose Yes or No to continue.');return;}
   if(question<questions().length-1){question++;render();}
   else{
    const result=valuation();
    track('valuation_complete',{product_id:state.current,value:result.manual?null:result.value,manual:result.manual});
    changeStage('value');
   }
   return;
  }
  if(stage==='value')changeStage('target');
 });

 $('journey-back').addEventListener('click',()=>{
  if(stage==='condition'&&question>0){question--;render();return;}
  const previous=mode==='easy'?{plan:'phone'}:{condition:'phone',value:'condition',target:'value',result:'target'};
  changeStage(previous[stage]||'phone');
 });

 render();
}
