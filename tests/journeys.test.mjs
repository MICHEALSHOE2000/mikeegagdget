import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {choices,financePlan,estimateSwap} from '../commerce/upgrade-core.mjs';
import {offerChoice} from '../commerce/offers.mjs';
let serial=0;
async function setup(path,url){
 const dom=new JSDOM(await readFile(path,'utf8'),{url:`https://mikee.test${url}`,runScripts:'outside-only'});
 for(const key of ['window','document','location','history','sessionStorage','HTMLElement'])globalThis[key]=key==='window'?dom.window:dom.window[key];
 globalThis.matchMedia=()=>({matches:false,addEventListener(){}});dom.window.matchMedia=globalThis.matchMedia;
 dom.window.HTMLElement.prototype.scrollIntoView=function(){};
 globalThis.fetch=async url=>({ok:true,json:async()=>JSON.parse(readFileSync('.'+url,'utf8'))});
 dom.window.eval(await readFile('assets/landing-page.js','utf8'));
 return dom;
}
const event=(el,type)=>el.dispatchEvent(new window.Event(type,{bubbles:true}));
const value=(id,v,type='change')=>{const el=document.getElementById(id);assert.ok(el,id);el.value=String(v);event(el,type);};
const next=()=>document.getElementById('journey-next').click();
const headline=()=>document.querySelector('#journey-screen h2').textContent;
const message=()=>new URL(document.getElementById('journey-whatsapp').href).searchParams.get('text');
const turn=()=>new Promise(resolve=>setTimeout(resolve,0));

test('EasyBuy progresses independently, rejects invalid deposits and includes the exact quote and attribution',async()=>{
 const id='iphone-14-pro-max|128GB',phone=offerChoice(choices.find(p=>p.id===id));
 const dom=await setup('easybuy/index.html',`/easybuy/?phone=${encodeURIComponent(id)}&utm_source=tiktok&ttclid=qa-test`);
 await import(`../assets/journey.js?test=${++serial}`);
 assert.equal(headline(),'How much will you pay today?');assert.equal(document.querySelector('[name="duration"]'),null);
 value('journey-deposit',0,'input');next();assert.match(document.getElementById('journey-error').textContent,/whole-naira deposit/);assert.equal(headline(),'How much will you pay today?');
 value('journey-deposit',Math.round(phone.price*.4),'input');next();assert.equal(headline(),'How long do you need?');
 document.querySelector('[name="duration"][value="3"]').click();next();assert.equal(headline(),'Your payment plan.');
 const plan=financePlan({amount:phone.price,duration:3});assert.ok(message().includes(`Total repayment including deposit: ₦${plan.totalPayable.toLocaleString('en-NG')}`));assert.match(message(),/utm_source: tiktok/);assert.match(message(),/ttclid: qa-test/);
 assert.ok(window.dataLayer.some(e=>e.event==='easybuy_calculated'));assert.ok(!document.getElementById('journey-whatsapp').hidden);
 document.getElementById('journey-back').click();document.getElementById('journey-back').click();value('journey-platform','noCredit');next();next();assert.match(message(),/20% monthly/);
 dom.window.close();
});
test('Swap asks one condition at a time, preserves valuation and sends truthful answers',async()=>{
 const id='iphone-14-pro-max|128GB',target=offerChoice(choices.find(p=>p.id===id));
 const dom=await setup('swap/index.html',`/swap/?target=${encodeURIComponent(id)}`);await import(`../assets/journey.js?test=${++serial}`);
 next();assert.match(document.getElementById('journey-error').textContent,/Choose a phone/);
 value('journey-model','iphone-x');value('journey-storage','iphone-x|64GB');next();assert.equal(headline(),'Does Face ID work?');
 next();assert.match(document.getElementById('journey-error').textContent,/Choose Yes or No/);
 for(let i=0;i<6;i++){assert.equal(document.querySelectorAll('[name="answer"]').length,2);document.querySelector(`[name="answer"][value="${i===0?'yes':'no'}"]`).click();next();}
 assert.equal(headline(),'Your estimated phone value.');assert.match(document.getElementById('journey-screen').textContent,/₦84,000/);
 next();assert.equal(headline(),'What phone do you want?');assert.equal(document.getElementById('journey-storage').value,id);next();
 const result=estimateSwap({current:choices.find(p=>p.id==='iphone-x|64GB'),target});assert.match(message(),/Does Face ID work\? Yes/);assert.match(message(),/Has the battery been changed\? No/);assert.match(message(),/Is the screen cracked\? No/);assert.ok(message().includes(`Estimated amount to add: ₦${result.topUp.toLocaleString('en-NG')}`));assert.ok(window.dataLayer.some(e=>e.event==='valuation_complete'&&e.value===84000));dom.window.close();
});
test('Unknown current-phone reference stays a manual swap quote',async()=>{
 const dom=await setup('swap/index.html','/swap/');await import(`../assets/journey.js?test=${++serial}`);
 value('journey-model','iphone-13-pro-max');value('journey-storage','iphone-13-pro-max|128GB');next();for(let i=0;i<6;i++){document.querySelector('[name="answer"][value="no"]').click();next();}
 assert.match(headline(),/personal quote/);assert.ok(!document.getElementById('journey-screen').textContent.includes('₦0'));dom.window.close();
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
 assert.ok(window.dataLayer.some(e=>e.event==='select_storage'&&e.storage==='256GB'));dom.window.close();
});
