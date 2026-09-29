import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readFile} from 'node:fs/promises';
import {readFileSync,statSync} from 'node:fs';
import {choices,financePlan,estimateSwap} from '../commerce/upgrade-core.mjs';
import {offerChoice} from '../commerce/offers.mjs';
let serial=0;
async function setup(path,url){
 const dom=new JSDOM(await readFile(path,'utf8'),{url:`https://mikee.test${url}`,runScripts:'outside-only'});
 for(const key of ['window','document','location','history','sessionStorage','HTMLElement'])globalThis[key]=key==='window'?dom.window:dom.window[key];
 globalThis.matchMedia=()=>({matches:false,addEventListener(){}});dom.window.matchMedia=globalThis.matchMedia;
 dom.window.HTMLElement.prototype.scrollIntoView=function(){};
 globalThis.fetch=async url=>({ok:true,json:async()=>JSON.parse(readFileSync('.'+url,'utf8'))});
 dom.window.eval(await readFile('assets/tiktok-pixel.js','utf8'));
 dom.window.eval(await readFile('assets/landing-page.js','utf8'));
 return dom;
}
const event=(el,type)=>el.dispatchEvent(new window.Event(type,{bubbles:true}));
const value=(id,v,type='change')=>{const el=document.getElementById(id);assert.ok(el,id);el.value=String(v);event(el,type);};
const next=()=>document.getElementById('journey-next').click();
const headline=()=>document.querySelector('#journey-screen h2').textContent;
const message=()=>new URL(document.getElementById('journey-whatsapp').href).searchParams.get('text');
const attributionInMessage=/Campaign reference|Source page:|utm_source|utm_medium|utm_campaign|ttclid|fbclid|gclid/i;
const turn=()=>new Promise(resolve=>setTimeout(resolve,0));
const chooseModel=(search,slug)=>{value('journey-search',search,'input');const button=document.querySelector(`#journey-search-results [data-model-slug="${slug}"]`);assert.ok(button,slug);button.click();};

test('EasyBuy compares all six live repayments, rejects invalid deposits and recalculates for a new phone',async()=>{
 const id='iphone-12-pro-max|128GB',phone=offerChoice(choices.find(p=>p.id===id));
 const dom=await setup('easybuy/index.html',`/easybuy/?phone=${encodeURIComponent(id)}&condition=UK+Used&color=Choose+with+your+device&utm_source=tiktok&utm_campaign=qa-campaign&ttclid=qa-test`);
 await import(`../assets/journey.js?test=${++serial}`);
 assert.equal(headline(),'How much works for you each month?');assert.equal(document.querySelectorAll('[name="duration"]').length,6);assert.match(document.getElementById('plan-summary').textContent,/iPhone 12 Pro Max/);assert.match(document.getElementById('plan-summary').textContent,/UK Used/);
 assert.equal(document.getElementById('journey-platform').value,'credit');assert.match(document.getElementById('plan-summary').textContent,/7.5%/);assert.match(document.getElementById('plan-summary').textContent,/Processing fee.*₦5,000/);
 value('journey-deposit',0,'input');assert.match(document.getElementById('journey-error').textContent,/whole-naira deposit/);assert.equal(document.getElementById('journey-whatsapp').getAttribute('aria-disabled'),'true');
 value('journey-deposit',financePlan({amount:phone.price}).minimumDeposit,'input');
 for(const duration of [1,2,3,4,5,6]){
  document.querySelector(`[name="duration"][value="${duration}"]`).click();
  const plan=financePlan({amount:phone.price,duration});
  const card=document.querySelector(`[name="duration"][value="${duration}"]`).nextElementSibling;
  assert.ok(card.textContent.includes(plan.payments[0].toLocaleString('en-NG')),`month ${duration} instalment`);
  assert.ok(card.textContent.includes(plan.totalPayable.toLocaleString('en-NG')),`month ${duration} total`);
  assert.match(document.getElementById('plan-summary').textContent,new RegExp(`${duration} month`));
 }
 const plan=financePlan({amount:phone.price,duration:6});assert.ok(message().includes(`Total repayment including deposit and fee: ₦${plan.totalPayable.toLocaleString('en-NG')}`));
 const whatsapp=document.getElementById('journey-whatsapp');assert.match(whatsapp.href,/^https:\/\/wa\.me\/\d+\?text=/);whatsapp.addEventListener('click',event=>event.preventDefault(),{once:true});whatsapp.click();
 assert.doesNotMatch(message(),attributionInMessage);assert.ok(message().endsWith('Please confirm the exact unit, stock, eligibility, due dates, fees and complete terms before payment.'));
 assert.equal(JSON.parse(sessionStorage.getItem('mikee-gadget-plug_ad_attribution')).ttclid,'qa-test');assert.ok(window.dataLayer.some(e=>e.event==='easybuy_calculated'&&e.utm_campaign==='qa-campaign'));assert.ok(window.ttq.some(e=>e[0]==='track'&&e[1]==='AddPaymentInfo'));assert.ok(window.ttq.some(e=>e[0]==='track'&&e[1]==='Contact'));assert.ok(!whatsapp.hidden);
 document.getElementById('journey-back').click();chooseModel('14 pro max','iphone-14-pro-max');value('journey-storage','iphone-14-pro-max|128GB');next();
 const replacement=offerChoice(choices.find(p=>p.id==='iphone-14-pro-max|128GB')),replacementPlan=financePlan({amount:replacement.price,duration:6});
 assert.ok(document.getElementById('plan-summary').textContent.includes(replacement.price.toLocaleString('en-NG')));assert.ok(!document.getElementById('plan-summary').textContent.includes(phone.price.toLocaleString('en-NG')));assert.ok(message().includes(replacementPlan.totalPayable.toLocaleString('en-NG')));
 value('journey-platform','credit');assert.match(message(),/7.5% monthly/);assert.match(document.getElementById('journey-screen').textContent,/credit check and approval/);
 value('journey-platform','noCredit');assert.match(message(),/20% monthly/);
 dom.window.close();
});
test('Swap asks one condition at a time, preserves valuation and sends truthful answers',async()=>{
 const id='iphone-14-pro-max|128GB',target=offerChoice(choices.find(p=>p.id===id));
 const dom=await setup('swap/index.html',`/swap/?target=${encodeURIComponent(id)}&utm_source=tiktok&ttclid=qa-test`);await import(`../assets/journey.js?test=${++serial}`);
 next();assert.match(document.getElementById('journey-error').textContent,/Choose a phone/);
 chooseModel('iphone x','iphone-x');assert.match(document.getElementById('journey-model-summary').textContent,/iPhone X/);value('journey-storage','iphone-x|64GB');next();assert.equal(headline(),'Does Face ID work?');
 next();assert.match(document.getElementById('journey-error').textContent,/Choose Yes or No/);
 for(let i=0;i<6;i++){assert.equal(document.querySelectorAll('[name="answer"]').length,2);document.querySelector(`[name="answer"][value="${i===0?'yes':'no'}"]`).click();next();}
 assert.equal(headline(),'Your estimated phone value.');assert.match(document.getElementById('journey-screen').textContent,/₦84,000/);
 next();assert.equal(headline(),'Your next upgrade.');assert.equal(document.querySelector('[data-journey]').dataset.targetPhone,id);
 const result=estimateSwap({current:choices.find(p=>p.id==='iphone-x|64GB'),target});assert.match(message(),/Does Face ID work\? Yes/);assert.match(message(),/Has the battery been changed\? No/);assert.match(message(),/Is the screen cracked\? No/);assert.ok(message().includes(`Estimated amount to add: ₦${result.topUp.toLocaleString('en-NG')}`));
 const whatsapp=document.getElementById('journey-whatsapp');whatsapp.addEventListener('click',event=>event.preventDefault(),{once:true});whatsapp.click();assert.doesNotMatch(message(),attributionInMessage);assert.ok(message().endsWith('Please confirm the exact unit, stock, condition, inspection and complete terms before payment.'));
 assert.ok(window.dataLayer.some(e=>e.event==='valuation_complete'&&e.value===84000));assert.ok(window.dataLayer.some(e=>e.event==='whatsapp_click'&&e.ttclid==='qa-test'));assert.ok(window.ttq.some(e=>e[0]==='track'&&e[1]==='Contact'));dom.window.close();
});
test('Unknown current-phone reference stays a manual swap quote',async()=>{
 const dom=await setup('swap/index.html','/swap/');await import(`../assets/journey.js?test=${++serial}`);
 chooseModel('14 pro max','iphone-14-pro-max');value('journey-storage','iphone-14-pro-max|128GB');next();
 chooseModel('13 pro max','iphone-13-pro-max');value('journey-storage','iphone-13-pro-max|128GB');next();for(let i=0;i<6;i++){document.querySelector('[name="answer"][value="no"]').click();next();}
 assert.match(headline(),/personal quote/);assert.ok(!document.getElementById('journey-screen').textContent.includes('₦0'));dom.window.close();
});
test('Swap quick search and searchable model picker share current-phone state without touching the target',async()=>{
 const target='iphone-12-pro-max|128GB';
 const dom=await setup('swap/index.html',`/swap/?target=${encodeURIComponent(target)}`);await import(`../assets/journey.js?test=${++serial}`);
 chooseModel('13 pro max','iphone-13-pro-max');assert.equal(document.querySelector('[data-journey]').dataset.currentModel,'iphone-13-pro-max');assert.equal(document.querySelector('[data-journey]').dataset.targetPhone,target);assert.match(document.getElementById('journey-model-summary').textContent,/iPhone 13 Pro Max/);
 const picker=document.getElementById('journey-model-picker');picker.open=true;event(picker,'toggle');value('journey-model-search','15 pro max','input');assert.equal(document.querySelector('#journey-model-results [data-model-slug="iphone-15-pro-max"]'),null);
 value('journey-model-search','12 pro','input');document.querySelector('#journey-model-results [data-model-slug="iphone-12-pro"]').click();
 assert.equal(document.querySelector('[data-journey]').dataset.targetPhone,target);value('journey-storage','iphone-12-pro|128GB');const currentId=document.querySelector('[data-journey]').dataset.currentPhone;
 document.getElementById('journey-back').click();assert.equal(headline(),'What do you want to upgrade to?');
 chooseModel('15 pro max','iphone-15-pro-max');value('journey-storage','iphone-15-pro-max|256GB');next();
 assert.equal(document.querySelector('[data-journey]').dataset.currentPhone,currentId);assert.equal(document.querySelector('[data-journey]').dataset.targetPhone,'iphone-15-pro-max|256GB');dom.window.close();
});
test('Homepage uses the supplied lightweight hero, static motion fallback and truthful location treatment',async()=>{
 const html=await readFile('index.html','utf8'),css=await readFile('assets/classic.css','utf8');
 assert.match(html,/<video[^>]+id="heroVideo"[^>]+muted[^>]+autoplay[^>]+loop[^>]+playsinline/);assert.match(html,/mikee-premium-hero-mobile\.webm/);assert.match(html,/mikee-premium-hero-poster\.webp/);assert.doesNotMatch(html,/trust-pause|shop-concept|Store concept illustration/);assert.match(html,/Computer Village, Ikeja/);assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/aspect-ratio:200\/89/);assert.ok(statSync('assets/hero/mikee-premium-hero-mobile.webm').size<250000);
});
test('Reduced-motion visitors keep the hero poster and do not load or play video',async()=>{
 const dom=new JSDOM(await readFile('index.html','utf8'),{url:'https://mikee.test/',runScripts:'outside-only'});let loads=0,plays=0;
 dom.window.matchMedia=()=>({matches:true,addEventListener(){}});dom.window.HTMLMediaElement.prototype.load=()=>loads++;dom.window.HTMLMediaElement.prototype.play=()=>{plays++;return Promise.resolve();};
 dom.window.document.getElementById('hotDeals').remove();dom.window.eval(await readFile('assets/store-motion.js','utf8'));
 const video=dom.window.document.getElementById('heroVideo');assert.equal(video.getAttribute('poster'),'/assets/hero/mikee-premium-hero-poster.webp');assert.ok([...video.querySelectorAll('source')].every(source=>!source.hasAttribute('src')));assert.equal(loads,0);assert.equal(plays,0);dom.window.close();
});
test('Homepage instant search, empty search and image fallback stay usable',async()=>{
 const dom=await setup('index.html','/');await import(`../assets/storefront.js?test=${++serial}`);
 value('homePhoneSearch','13 pro','input');await turn();assert.match(document.getElementById('searchResults').textContent,/iPhone 13 Pro/);assert.ok(!document.getElementById('searchResults').textContent.includes('iPhone 18'));
 value('homePhoneSearch','zzzz-no-device','input');await turn();assert.match(document.getElementById('searchResults').textContent,/No match/);
 value('homePhoneSearch','Samsung','input');await turn();assert.match(document.getElementById('searchResults').textContent,/Samsung/);assert.match(document.querySelector('#searchResults a').href,/samsung-phones/);
 const img=document.querySelector('.device-media img');event(img,'error');assert.ok(img.closest('.device-media').classList.contains('is-missing'));
 value('searchInput','zzzz-no-device','input');await turn();assert.match(document.getElementById('productGrid').textContent,/No devices match/);document.getElementById('clearEmpty').click();await turn();await turn();assert.ok(document.querySelectorAll('#productGrid .store-phone').length>0);dom.window.close();
});
test('Product storage selection carries its promoted price, condition and colour into all purchase paths',async()=>{
 const dom=await setup('iphone-14-pro-max/index.html','/iphone-14-pro-max?utm_source=meta');await import(`../assets/commerce.js?test=${++serial}`);
 document.querySelector('[data-storage="256GB"]').click();const id='iphone-14-pro-max|256GB',phone=offerChoice(choices.find(p=>p.id===id));
 const buy=document.querySelector('[data-action="buy"]'),easy=document.querySelector('[data-action="easyBuy"]'),swap=document.querySelector('[data-action="swap"]');
 assert.match(buy.href,/wa.me\/2347086865133/);assert.ok(new URL(buy.href).searchParams.get('text').includes(phone.price.toLocaleString('en-NG')));assert.equal(new URL(easy.href).pathname,'/easybuy/');assert.equal(new URL(easy.href).searchParams.get('phone'),id);assert.equal(new URL(swap.href).searchParams.get('target'),id);
 assert.ok(window.dataLayer.some(e=>e.event==='select_storage'&&e.storage==='256GB'&&e.value===phone.price));assert.ok(window.ttq.some(e=>e[0]==='track'&&e[1]==='ViewContent'));assert.ok(window.ttq.some(e=>e[0]==='track'&&e[1]==='CustomizeProduct'));
 assert.equal(document.querySelector('[data-storage="256GB"]').getAttribute('aria-pressed'),'true');assert.match(document.querySelector('[data-storage="256GB"]').textContent,new RegExp(phone.price.toLocaleString('en-NG')));
 buy.addEventListener('click',event=>event.preventDefault(),{once:true});event(buy,'click');assert.doesNotMatch(new URL(buy.href).searchParams.get('text'),attributionInMessage);assert.equal(window.ttq.filter(e=>e[0]==='track'&&e[1]==='Contact').length,1);dom.window.close();
});
test('storage changes carry the chosen Hot Deal price into the Buy flow and standard repayment',async()=>{
 const dom=await setup('buy/index.html','/buy/?phone=iphone-12-pro-max%7C128GB&utm_source=tiktok');globalThis.Option=dom.window.Option;
 await import(`../assets/buy-flow.js?test=${++serial}`);
 document.getElementById('flow-back').click();
 const chip=document.querySelector('[data-buy-storage="iphone-12-pro-max|256GB"]');assert.ok(chip);chip.click();
 const target=offerChoice(choices.find(p=>p.id==='iphone-12-pro-max|256GB'));
 assert.equal(document.getElementById('buy-variant').value,target.id);
 assert.equal(document.querySelector('[data-buy-storage="iphone-12-pro-max|256GB"]').getAttribute('aria-pressed'),'true');
 document.getElementById('flow-next').click();
 document.querySelector('[name="purchase"][value="easy"]').click();document.getElementById('flow-next').click();
 assert.equal(document.querySelector('[name="platform"]:checked').value,'credit');
 assert.match(document.getElementById('order-summary').textContent,new RegExp(target.price.toLocaleString('en-NG')));
 const msg=new URL(document.getElementById('order-whatsapp').href).searchParams.get('text');
 assert.match(msg,new RegExp(target.price.toLocaleString('en-NG')));assert.match(msg,/Interest: 7.5% monthly/);assert.match(msg,/Processing fee: ₦5,000/);assert.doesNotMatch(msg,attributionInMessage);
 assert.ok(window.dataLayer.some(e=>e.event==='select_storage'&&e.value===target.price));dom.window.close();
});
test('interest reminder appears once after financing engagement and leads to the qualification flow',async()=>{
 const dom=await setup('easybuy/index.html','/easybuy/?phone=iphone-12-pro-max%7C128GB');
 await import(`../assets/journey.js?test=${++serial}`);
 const prototype=dom.window.HTMLDialogElement.prototype;
 prototype.showModal=function(){this.open=true;};prototype.close=function(){this.open=false;};
 Object.defineProperty(dom.window,'innerWidth',{configurable:true,value:390});
 await import(`../assets/interest-rescue.js?test=${++serial}`);
 document.getElementById('journey-back').click();const dialog=document.querySelector('.interest-rescue');
 assert.ok(dialog.open);assert.match(dialog.textContent,/credit check and approval are required/);
 assert.equal(dialog.querySelector('[data-check-eligibility]').href,'https://www.creditdirect.ng/know-your-limit');
 dialog.querySelector('[data-rescue-dismiss]').click();assert.equal(dialog.open,false);assert.equal(headline(),'Which phone do you want?');
 assert.equal(sessionStorage.getItem('mikee-interest-reminder-shown'),'1');
 next();document.getElementById('journey-back').click();assert.equal(dialog.open,false);assert.ok(window.dataLayer.some(e=>e.event==='interest_reminder_shown'));dom.window.close();
});
test('General chat and mobile Chat keep the message clean while tracking attribution',async()=>{
 const dom=await setup('index.html','/?utm_source=tiktok&utm_medium=paid&utm_campaign=qa-campaign&ttclid=qa-test&fbclid=fb-test&gclid=g-test');
 dom.window.eval(await readFile('assets/sales.js','utf8'));
 const general=[...document.querySelectorAll('a[href*="wa.me/"]')].find(a=>a.textContent.trim()==='Chat on WhatsApp');
 assert.ok(general);general.addEventListener('click',event=>event.preventDefault(),{once:true});general.click();
 assert.equal(new URL(general.href).searchParams.get('text'),'Hello Mikee Gadget Plug, I need help choosing a device.');
 const mobile=document.querySelector('.mobile-bottom-nav a:last-child');assert.ok(mobile);mobile.addEventListener('click',event=>event.preventDefault(),{once:true});mobile.click();
 assert.doesNotMatch(new URL(mobile.href).searchParams.get('text'),attributionInMessage);
 assert.equal(JSON.parse(sessionStorage.getItem('mikee-gadget-plug_ad_attribution')).ttclid,'qa-test');
 assert.ok(window.dataLayer.some(e=>e.event==='whatsapp_click'&&e.utm_campaign==='qa-campaign'&&e.fbclid==='fb-test'));
 assert.ok(window.ttq.some(e=>e[0]==='track'&&e[1]==='Contact'));dom.window.close();
});
test('Buy Outright order flow sends its selection without attribution',async()=>{
 const dom=await setup('buy/index.html','/buy/?phone=iphone-14-pro-max%7C128GB&utm_source=tiktok&gclid=qa-gclid');
 globalThis.Option=dom.window.Option;await import(`../assets/buy-flow.js?test=${++serial}`);
 document.getElementById('flow-next').click();
 const whatsapp=document.getElementById('order-whatsapp');assert.ok(!whatsapp.hidden);whatsapp.addEventListener('click',event=>event.preventDefault(),{once:true});whatsapp.click();
 const text=new URL(whatsapp.href).searchParams.get('text');assert.match(text,/Purchase: Buy/);assert.match(text,/Payment: Outright/);assert.doesNotMatch(text,attributionInMessage);
 assert.ok(window.dataLayer.some(e=>e.event==='whatsapp_click'&&e.gclid==='qa-gclid'));assert.ok(window.ttq.some(e=>e[0]==='track'&&e[1]==='Contact'));dom.window.close();
});
test('new colour groups cannot send a Burgundy quote at the Glacier/Black price',async()=>{
 const dom=await setup('iphone-18-pro-max/index.html','/iphone-18-pro-max');await import(`../assets/commerce.js?test=${++serial}`);
 document.querySelector('[data-storage="512GB — Burgundy"]').click();
 assert.equal(document.querySelector('[data-color-select]').value,'Burgundy');
 let href=document.querySelector('[data-action="buy"]').href;
 assert.match(new URL(href).searchParams.get('text'),/₦3,150,000/);
 assert.match(new URL(href).searchParams.get('text'),/Preferred colour: Burgundy/);
 document.querySelector('[data-storage="256GB — Glacier / Black"]').click();
 assert.deepEqual([...document.querySelector('[data-color-select]').options].map(o=>o.value),['Glacier','Black']);
 document.querySelector('[data-color-select]').value='Black';event(document.querySelector('[data-color-select]'),'change');
 href=document.querySelector('[data-action="buy"]').href;
 assert.match(new URL(href).searchParams.get('text'),/₦2,780,000/);assert.match(new URL(href).searchParams.get('text'),/Preferred colour: Black/);
 dom.window.close();
});
