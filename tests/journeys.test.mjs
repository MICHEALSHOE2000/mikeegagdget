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
const turn=()=>new Promise(resolve=>setTimeout(resolve,0));
const chooseModel=(search,slug)=>{value('journey-search',search,'input');const button=document.querySelector(`#journey-search-results [data-model-slug="${slug}"]`);assert.ok(button,slug);button.click();};

test('EasyBuy compares all six live repayments, rejects invalid deposits and recalculates for a new phone',async()=>{
 const id='iphone-12-pro-max|128GB',phone=offerChoice(choices.find(p=>p.id===id));
 const dom=await setup('easybuy/index.html',`/easybuy/?phone=${encodeURIComponent(id)}&condition=UK+Used&color=Choose+with+your+device&utm_source=tiktok&ttclid=qa-test`);
 await import(`../assets/journey.js?test=${++serial}`);
 assert.equal(headline(),'How much works for you each month?');assert.equal(document.querySelectorAll('[name="duration"]').length,6);assert.match(document.getElementById('plan-summary').textContent,/iPhone 12 Pro Max/);assert.match(document.getElementById('plan-summary').textContent,/UK Used/);
 value('journey-deposit',0,'input');assert.match(document.getElementById('journey-error').textContent,/whole-naira deposit/);assert.equal(document.getElementById('journey-whatsapp').getAttribute('aria-disabled'),'true');
 value('journey-deposit',Math.round(phone.price*.4),'input');
 for(const duration of [1,2,3,4,5,6]){
  document.querySelector(`[name="duration"][value="${duration}"]`).click();
  const plan=financePlan({amount:phone.price,duration});
  const card=document.querySelector(`[name="duration"][value="${duration}"]`).nextElementSibling;
  assert.ok(card.textContent.includes(plan.payments[0].toLocaleString('en-NG')),`month ${duration} instalment`);
  assert.ok(card.textContent.includes(plan.totalPayable.toLocaleString('en-NG')),`month ${duration} total`);
  assert.match(document.getElementById('plan-summary').textContent,new RegExp(`${duration} month`));
 }
 const plan=financePlan({amount:phone.price,duration:6});assert.ok(message().includes(`Total repayment including deposit: ₦${plan.totalPayable.toLocaleString('en-NG')}`));assert.match(message(),/utm_source: tiktok/);assert.match(message(),/ttclid: qa-test/);
 assert.ok(window.dataLayer.some(e=>e.event==='easybuy_calculated'));assert.ok(window.ttq.some(e=>e[0]==='track'&&e[1]==='AddPaymentInfo'));assert.ok(!document.getElementById('journey-whatsapp').hidden);
 document.getElementById('journey-back').click();chooseModel('14 pro max','iphone-14-pro-max');value('journey-storage','iphone-14-pro-max|128GB');next();
 const replacement=offerChoice(choices.find(p=>p.id==='iphone-14-pro-max|128GB')),replacementPlan=financePlan({amount:replacement.price,duration:6});
 assert.ok(document.getElementById('plan-summary').textContent.includes(replacement.price.toLocaleString('en-NG')));assert.ok(!document.getElementById('plan-summary').textContent.includes(phone.price.toLocaleString('en-NG')));assert.ok(message().includes(replacementPlan.totalPayable.toLocaleString('en-NG')));
 value('journey-platform','noCredit');assert.match(message(),/20% monthly/);
 dom.window.close();
});
test('Swap asks one condition at a time, preserves valuation and sends truthful answers',async()=>{
 const id='iphone-14-pro-max|128GB',target=offerChoice(choices.find(p=>p.id===id));
 const dom=await setup('swap/index.html',`/swap/?target=${encodeURIComponent(id)}`);await import(`../assets/journey.js?test=${++serial}`);
 next();assert.match(document.getElementById('journey-error').textContent,/Choose a phone/);
 chooseModel('iphone x','iphone-x');assert.match(document.getElementById('journey-model-summary').textContent,/iPhone X/);value('journey-storage','iphone-x|64GB');next();assert.equal(headline(),'Does Face ID work?');
 next();assert.match(document.getElementById('journey-error').textContent,/Choose Yes or No/);
 for(let i=0;i<6;i++){assert.equal(document.querySelectorAll('[name="answer"]').length,2);document.querySelector(`[name="answer"][value="${i===0?'yes':'no'}"]`).click();next();}
 assert.equal(headline(),'Your estimated phone value.');assert.match(document.getElementById('journey-screen').textContent,/₦84,000/);
 next();assert.equal(headline(),'What do you want to upgrade to?');assert.equal(document.getElementById('journey-storage').value,id);next();
 const result=estimateSwap({current:choices.find(p=>p.id==='iphone-x|64GB'),target});assert.match(message(),/Does Face ID work\? Yes/);assert.match(message(),/Has the battery been changed\? No/);assert.match(message(),/Is the screen cracked\? No/);assert.ok(message().includes(`Estimated amount to add: ₦${result.topUp.toLocaleString('en-NG')}`));assert.ok(window.dataLayer.some(e=>e.event==='valuation_complete'&&e.value===84000));dom.window.close();
});
test('Unknown current-phone reference stays a manual swap quote',async()=>{
 const dom=await setup('swap/index.html','/swap/');await import(`../assets/journey.js?test=${++serial}`);
 chooseModel('13 pro max','iphone-13-pro-max');value('journey-storage','iphone-13-pro-max|128GB');next();for(let i=0;i<6;i++){document.querySelector('[name="answer"][value="no"]').click();next();}
 assert.match(headline(),/personal quote/);assert.ok(!document.getElementById('journey-screen').textContent.includes('₦0'));dom.window.close();
});
test('Swap quick search and searchable model picker share current-phone state without touching the target',async()=>{
 const target='iphone-12-pro-max|128GB';
 const dom=await setup('swap/index.html',`/swap/?target=${encodeURIComponent(target)}`);await import(`../assets/journey.js?test=${++serial}`);
 chooseModel('13 pro max','iphone-13-pro-max');assert.equal(document.querySelector('[data-journey]').dataset.currentModel,'iphone-13-pro-max');assert.equal(document.querySelector('[data-journey]').dataset.targetPhone,target);assert.match(document.getElementById('journey-model-summary').textContent,/iPhone 13 Pro Max/);
 const picker=document.getElementById('journey-model-picker');picker.open=true;event(picker,'toggle');value('journey-model-search','14 pro max','input');document.querySelector('#journey-model-results [data-model-slug="iphone-14-pro-max"]').click();
 assert.equal(document.getElementById('journey-search').value,'iPhone 14 Pro Max');assert.equal(document.querySelector('[data-journey]').dataset.currentModel,'iphone-14-pro-max');assert.equal(document.querySelector('[data-journey]').dataset.targetPhone,target);
 value('journey-storage','iphone-14-pro-max|128GB');const currentId=document.querySelector('[data-journey]').dataset.currentPhone;next();for(let i=0;i<6;i++){document.querySelector('[name="answer"][value="no"]').click();next();}next();
 assert.equal(headline(),'What do you want to upgrade to?');assert.equal(document.querySelector('[data-journey]').dataset.targetPhone,target);assert.equal(document.querySelector('[data-journey]').dataset.currentPhone,currentId);
 const targetPicker=document.getElementById('journey-model-picker');targetPicker.open=true;event(targetPicker,'toggle');value('journey-model-search','15 pro max','input');document.querySelector('#journey-model-results [data-model-slug="iphone-15-pro-max"]').click();value('journey-storage','iphone-15-pro-max|256GB');
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
 assert.ok(window.dataLayer.some(e=>e.event==='select_storage'&&e.storage==='256GB'));assert.ok(window.ttq.some(e=>e[0]==='track'&&e[1]==='ViewContent'));assert.ok(window.ttq.some(e=>e[0]==='track'&&e[1]==='CustomizeProduct'));
 event(buy,'click');assert.equal(window.ttq.filter(e=>e[0]==='track'&&e[1]==='Contact').length,1);dom.window.close();
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
