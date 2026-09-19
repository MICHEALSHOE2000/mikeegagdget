import {choices as baseChoices,estimateSwap,financePlan,FINANCE_PLATFORMS,money} from '../commerce/upgrade-core.mjs';
import {offerChoice} from '../commerce/offers.mjs';
import {commerceSite} from '../commerce/catalog.mjs';
import {media,activateImages,escape as esc} from './storefront-ui.mjs';
import {DEPOSIT_RATE} from '../easy-buy/easy-buy-core.mjs';
const root=document.querySelector('[data-journey]');
if(root){
 const $=id=>document.getElementById(id),mode=root.dataset.journey,q=new URLSearchParams(location.search);
 const choices=baseChoices.map(offerChoice),available=choices.filter(p=>p.price>0&&p.image&&p.finance),currentPhones=choices.filter(p=>p.brand==='Apple'&&!p.slug.startsWith('iphone-18'));
 const byId=id=>choices.find(p=>p.id===id);
 const initial=byId(q.get('phone'))||byId(q.get('target'));
 const state={target:initial?.price>0?initial.id:'',current:byId(q.get('current'))?.id||'',answers:{},deposit:'',duration:1,platform:'credit',search:''};
 let stage=mode==='easy'&&state.target?'deposit':'phone',question=0;
 const track=(event,data={})=>window.MikeeGadgetPlugTracking?.pushEvent(event,{journey:mode,...data});
 track(mode==='easy'?'start_easybuy':'start_swap',{product_id:state.target});
 const questions=()=>[{key:'faceIdBroken',label:'Does Face ID work?',invert:true,applies:byId(state.current)?.hasFaceId},{key:'batteryChanged',label:'Has the battery been changed?',applies:true},{key:'screenChanged',label:'Has the screen been changed?',applies:true},{key:'screenCracked',label:'Is the screen cracked?',applies:true},{key:'backChanged',label:'Has the back glass been changed?',applies:byId(state.current)?.hasGlassBack},{key:'backCracked',label:'Is the back glass cracked?',applies:byId(state.current)?.hasGlassBack}].filter(p=>p.applies);
 const selected=()=>byId(state.target),current=()=>byId(state.current);
 const valuation=()=>estimateSwap({current:current(),target:current()?.price?current():available[0],...state.answers});
 const quote=()=>estimateSwap({current:current(),target:selected(),...state.answers});
 function error(text=''){$('journey-error').textContent=text;$('journey-error').hidden=!text;}
 const rows=entries=>`<dl class="journey-lines">${entries.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
 const device=phone=>phone?`<div class="journey-device">${media(phone.image,phone.model)}<div><strong>${esc(phone.model)}</strong><span>${esc(phone.storage)}</span>${phone.price?`<b>${money(phone.price)}</b>`:''}</div></div>`:'';
 function chooseUI(isCurrent){
  const list=isCurrent?currentPhones:available,id=isCurrent?state.current:state.target,chosen=byId(id);
  const models=[...new Map(list.map(p=>[p.slug,p])).values()];
  return `<h2>${isCurrent?'What phone do you have?':'What phone do you want?'}</h2>${isCurrent?'<p class="journey-help">Instant estimates for iPhones. <a href="https://wa.me/'+commerceSite.whatsappNumber+'?text=Hello%20Mikee%2C%20please%20value%20my%20Samsung%20or%20Pixel%20for%20a%20swap.">Samsung or Pixel? Ask for a valuation.</a></p>':''}<label for="journey-search">Find your model<input id="journey-search" type="search" placeholder="Search a model, e.g. 13 Pro" autocomplete="off" value="${esc(state.search)}"></label><label for="journey-model">Phone model<select id="journey-model"><option value="">Choose a phone</option>${models.map(p=>`<option value="${p.slug}" ${p.slug===chosen?.slug?'selected':''}>${esc(p.model)}</option>`).join('')}</select></label><label for="journey-storage">Storage<select id="journey-storage"><option value="">Choose storage</option>${list.filter(p=>p.slug===chosen?.slug).map(p=>`<option value="${esc(p.id)}" ${p.id===id?'selected':''}>${esc(p.storage)}${!isCurrent?` · ${money(p.price)}`:''}</option>`).join('')}</select></label><div id="journey-selected">${device(chosen)}</div><p class="journey-help" id="journey-search-status" role="status"></p>`;
 }
 function changeStage(next){stage=next;state.search='';error();render();const h=$('journey-screen').querySelector('h2');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}root.scrollIntoView({block:'start',behavior:'instant'});}
 function render(){
  const isCurrent=mode==='swap'&&stage==='phone',phone=selected();let html='',index=1,label='Choose phone';
  $('journey-back').hidden=stage==='phone';$('journey-next').hidden=false;$('journey-whatsapp').hidden=true;$('journey-next').textContent='Continue →';
  if(stage==='phone'||stage==='target'){html=chooseUI(isCurrent);index=stage==='target'?4:1;label=isCurrent?'Your phone':'Your next phone';}
  if(stage==='condition'){
   const items=questions(),item=items[question],answer=state.answers[item.key];index=2;label=`Condition · ${question+1} of ${items.length}`;
   html=`<p class="journey-help">${esc(current().label)}</p><h2>${item.label}</h2><fieldset class="journey-answers"><legend class="sr-only">${item.label}</legend>${[['yes','Yes'],['no','No']].map(([value,text])=>{const result=item.invert?value==='no':value==='yes';return `<label><input type="radio" name="answer" value="${value}" ${answer===result?'checked':''}><span>${text}</span></label>`;}).join('')}</fieldset>`;
  }
  if(stage==='value'){
   index=3;label='Your estimated value';const result=valuation();
   html=`<h2>${result.manual?'Your phone needs a personal quote.':'Your estimated phone value.'}</h2>${device(current())}${result.manual?'<p>We do not have a confirmed reference price for this model. We’ll value it after inspection.</p>':`<div class="journey-amount"><span>YOUR PHONE IS WORTH ABOUT</span><strong>${money(result.value)}</strong></div><details><summary>See valuation breakdown</summary>${rows([['Market reference',money(current().basePrice)],...result.deductions.map(d=>[d.label,`${d.percent}% · ${money(current().basePrice*d.percent/100)}`])])}</details>`}<p class="journey-help">Final value is subject to physical inspection.</p>`;
   $('journey-next').textContent='Choose my next phone →';
  }
  if(stage==='deposit'){
   index=2;label='Your deposit';if(state.deposit==='')state.deposit=String(Math.round(phone.price*DEPOSIT_RATE));
   html=`<h2>How much will you pay today?</h2>${device(phone)}<label for="journey-deposit">Your deposit (₦)<input id="journey-deposit" type="number" inputmode="numeric" min="${Math.round(phone.price*DEPOSIT_RATE)}" max="${phone.price}" step="1" value="${esc(state.deposit)}" aria-describedby="deposit-help"></label><p class="journey-help" id="deposit-help">Estimate starts at ${money(Math.round(phone.price*DEPOSIT_RATE))} (40%). You can pay more. The provider confirms the final deposit requirement.</p><label for="journey-platform">Choose a plan<select id="journey-platform"><option value="credit" ${state.platform==='credit'?'selected':''}>7.5% monthly · Credit check</option><option value="noCredit" ${state.platform==='noCredit'?'selected':''}>20% monthly · No credit check</option></select></label><p class="journey-help">Interest is calculated on the balance after your deposit.</p>`;
  }
  if(stage==='duration'){
   index=3;label='Your duration';html=`<h2>How long do you need?</h2><p>Paying ${money(Number(state.deposit))} today for ${esc(phone.label)}.</p><fieldset class="journey-answers duration-answers"><legend class="sr-only">Payment duration</legend>${[1,2,3].map(n=>`<label><input type="radio" name="duration" value="${n}" ${state.duration===n?'checked':''}><span>${n} month${n>1?'s':''}</span></label>`).join('')}</fieldset><p class="journey-help">${FINANCE_PLATFORMS[state.platform].rate*100}% interest per month on the financed balance. Review the full cost next.</p>`;$('journey-next').textContent='See my payment plan →';
  }
  if(stage==='result'){
   index=mode==='easy'?4:5;label='Your estimate';html=`<h2>${mode==='easy'?'Your payment plan.':'Your next upgrade.'}</h2>${device(phone)}`;
   const message=['Hello Mikee Gadget Plug,',`I want to ${mode==='easy'?'use EasyBuy':'swap my phone'}.`,`Phone: ${phone.label}`,`Phone price: ${money(phone.price)}${phone.offerId?' (20% promotion)':''}`,`Preferred condition: ${q.get('condition')||'Please confirm'}`,`Preferred colour: ${q.get('color')||'Please confirm'}`];
   if(mode==='easy'){
    let plan;try{plan=financePlan({amount:phone.price,deposit:Number(state.deposit),duration:state.duration,platform:state.platform});}catch{changeStage('deposit');error('Check your deposit before continuing.');return;}
    html+=`<div class="journey-amount"><span>PAY TODAY</span><strong>${money(plan.deposit)}</strong></div><div class="journey-monthly"><span>THEN</span><strong>${money(plan.payments[0])}<small> / month</small></strong><span>FOR ${state.duration} MONTH${state.duration>1?'S':''}${plan.payments.at(-1)!==plan.payments[0]?` · Final payment ${money(plan.payments.at(-1))}`:''}</span></div>${rows([['Total repayment, including deposit',money(plan.totalPayable)],['Interest',`${plan.rate*100}% monthly · ${money(plan.interest)} total`]])}<details><summary>See full breakdown</summary>${rows([['Phone price',money(phone.price)],['Deposit',money(plan.deposit)],['Balance financed',money(plan.balance)],...plan.payments.map((p,i)=>[`Month ${i+1}`,money(p)]),['Repayment after deposit',money(plan.repaymentTotal)]])}<p>${FINANCE_PLATFORMS[state.platform].creditCheck?'Credit check required.':'No credit check on this plan.'} Approval, due dates, fees and delivery charges are confirmed before payment.</p></details>`;
    message.push(`Plan: ${FINANCE_PLATFORMS[state.platform].label}`,`Deposit: ${money(plan.deposit)}`,`Balance financed: ${money(plan.balance)}`,`Interest: ${plan.rate*100}% monthly; ${money(plan.interest)} total`,`Duration: ${state.duration} month(s)`,`Payments: ${plan.payments.map(money).join(', ')}`,`Total repayment including deposit: ${money(plan.totalPayable)}`);
    track('easybuy_calculated',{product_id:phone.id,deposit:plan.deposit,months:state.duration,total:plan.totalPayable,platform:state.platform});
   } else {
    const result=quote();message.push(`Current phone: ${current().label}`,...questions().map(item=>`${item.label} ${state.answers[item.key]!==item.invert?'Yes':'No'}`));
    html+=result.manual?'<div class="journey-amount"><span>AMOUNT TO ADD</span><strong>Let’s confirm it.</strong></div><p>We need to inspect your phone and confirm its reference price before quoting the difference.</p>':`<div class="journey-amount"><span>YOU ADD</span><strong>${money(result.topUp)}</strong></div>${rows([['Your phone’s estimated value',money(result.value)],['Next phone',money(phone.price)]])}${result.surplus?`<p>Your estimated value is ${money(result.surplus)} above this phone’s price. Any cash difference needs a separate agreement; payout is not guaranteed.</p>`:''}<details><summary>See valuation breakdown</summary>${rows(result.deductions.map(d=>[d.label,`${d.percent}% · ${money(current().basePrice*d.percent/100)}`]))}</details>`;
    message.push(result.manual?'Please assess my phone and quote the difference.':`Estimated swap value: ${money(result.value)}\nEstimated amount to add: ${money(result.topUp)}${result.surplus?`\nEstimated surplus: ${money(result.surplus)} — subject to separate agreement`:''}`);
   }
   message.push('Please confirm the exact unit, stock, condition, inspection and complete terms before payment.');
   try{const saved=JSON.parse(sessionStorage.getItem('mikee-gadget-plug_ad_attribution')||'{}'),refs=['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','wbraid','gbraid','fbclid','ttclid'].map(k=>[k,q.get(k)||saved[k]]).filter(([,v])=>v);if(refs.length)message.push(`Campaign reference: ${refs.map(([k,v])=>`${k}: ${v}`).join(' | ')}`);}catch{}
   $('journey-whatsapp').href=`https://wa.me/${commerceSite.whatsappNumber}?text=${encodeURIComponent(message.join('\n'))}`;$('journey-whatsapp').hidden=false;$('journey-next').hidden=true;
   $('journey-whatsapp').textContent=mode==='easy'?'Continue on WhatsApp ↗':'Continue swap on WhatsApp ↗';
  }
  $('journey-screen').innerHTML=html;$('journey-progress').max=mode==='easy'?4:5;$('journey-progress').value=index;$('journey-progress-label').textContent=`${index} / ${mode==='easy'?4:5} · ${label}`;activateImages(root);
  if(stage==='phone'||stage==='target')bindChooser(isCurrent);
  $('journey-deposit')?.addEventListener('input',e=>{state.deposit=e.target.value;error();});
  $('journey-platform')?.addEventListener('change',e=>state.platform=e.target.value);
  root.querySelectorAll('[name="duration"]').forEach(input=>input.addEventListener('change',()=>state.duration=Number(input.value)));
  root.querySelectorAll('[name="answer"]').forEach(input=>input.addEventListener('change',()=>{const item=questions()[question];state.answers[item.key]=item.invert?input.value==='no':input.value==='yes';error();}));
 }
 function bindChooser(isCurrent){
  const list=isCurrent?currentPhones:available,key=isCurrent?'current':'target';
  const setSelected=id=>{if(state[key]!==id){if(isCurrent)state.answers={};else state.deposit='';}state[key]=id;$('journey-selected').innerHTML=device(byId(id));activateImages(root);error();};
  $('journey-model').addEventListener('change',()=>{const variants=list.filter(p=>p.slug===$('journey-model').value);$('journey-storage').innerHTML='<option value="">Choose storage</option>'+variants.map(p=>`<option value="${esc(p.id)}">${esc(p.storage)}${isCurrent?'':` · ${money(p.price)}`}</option>`).join('');setSelected('');});
  $('journey-storage').addEventListener('change',()=>{setSelected($('journey-storage').value);track('select_storage',{product_id:state[key]});});
  $('journey-search').addEventListener('input',()=>{state.search=$('journey-search').value;const tokens=state.search.toLowerCase().trim().split(/\s+/),models=[...new Map(list.filter(p=>tokens.every(t=>`${p.model} ${p.brand} ${p.storage}`.toLowerCase().includes(t))).map(p=>[p.slug,p])).values()];$('journey-model').innerHTML='<option value="">Choose a phone</option>'+models.map(p=>`<option value="${p.slug}">${esc(p.model)}</option>`).join('');$('journey-storage').innerHTML='<option value="">Choose storage</option>';setSelected('');$('journey-search-status').textContent=models.length?`${models.length} models found`:'No matching phones. Try a shorter name.';});
 }
 $('journey-form').addEventListener('submit',e=>{e.preventDefault();error();
  if(stage==='phone'||stage==='target'){
   const id=mode==='swap'&&stage==='phone'?state.current:state.target;if(!id){error('Choose a phone and storage to continue.');return;}
   if(mode==='swap'&&stage==='phone'){question=0;changeStage('condition');}else changeStage(mode==='easy'?'deposit':'result');return;
  }
  if(stage==='condition'){const item=questions()[question];if(typeof state.answers[item.key]!=='boolean'){error('Choose Yes or No to continue.');return;}if(question<questions().length-1){question++;render();}else{const result=valuation();track('valuation_complete',{product_id:state.current,value:result.manual?null:result.value,manual:result.manual});changeStage('value');}return;}
  if(stage==='value'){changeStage('target');return;}
  if(stage==='deposit'){try{if(state.deposit==='')throw new Error();financePlan({amount:selected().price,deposit:Number(state.deposit),platform:state.platform,duration:state.duration});}catch{error(`Enter a whole-naira deposit between ${money(Math.round(selected().price*DEPOSIT_RATE))} and ${money(selected().price)}.`);return;}changeStage('duration');return;}
  if(stage==='duration')changeStage('result');
 });
 $('journey-back').addEventListener('click',()=>{if(stage==='condition'&&question>0){question--;render();return;}const previous=mode==='easy'?{deposit:'phone',duration:'deposit',result:'duration'}:{condition:'phone',value:'condition',target:'value',result:'target'};changeStage(previous[stage]||'phone');});
 render();
}
