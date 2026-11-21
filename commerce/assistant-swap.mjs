// Swap valuation for Mikee AI. Uses exactly the same reference prices and deduction rules as the website's swap page
// (commerce/upgrade-core.mjs → estimateSwap), so the chat and the page always give the same estimate.
// iPhones only: there are no Samsung or Pixel swap reference prices yet, so those go to the team.
import {choices,estimateSwap} from './upgrade-core.mjs';

const norm=s=>String(s||'').toLowerCase().replace(/(\d)(pro|max|plus|mini|ultra|air)\b/g,'$1 $2').replace(/(pro)(max)\b/g,'$1 $2').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
const escRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
// One entry per iPhone model with its storages. A storage with no reference price stays listed (so "13 Pro Max" is
// recognised) but gets no estimate. Where a storage has several reference lines (colours, Brand New), the lowest
// UK Used figure is used.
const cap=s=>(String(s).match(/\d+\s?(gb|tb)/i)?.[0]||'').toLowerCase().replace(/\s/g,'');
export const SWAP_MODELS=(()=>{const m=new Map();for(const c of choices){if(c.brand!=='Apple')continue;
 const e=m.get(c.slug)||m.set(c.slug,{slug:c.slug,model:c.model,keys:keysFor(c.model),storages:new Map()}).get(c.slug);
 const k=cap(c.storage);if(!k)continue;const ok=c.swapReferencePrice>0&&!/brand new/i.test(c.storage),prev=e.storages.get(k);
 if(!prev||(ok&&(!(prev.swapReferencePrice>0)||c.swapReferencePrice<prev.swapReferencePrice)))e.storages.set(k,ok?c:prev||{...c,swapReferencePrice:null});}
 return [...m.values()].map(e=>({...e,priced:[...e.storages.values()].some(c=>c.swapReferencePrice>0)}));})();
function keysFor(model){const full=norm(model).replace(/\s*\(?2nd generation\)?/,' 2');const keys=[full];const bare=full.replace(/^iphone /,'');
 // "15 pro max", "xr", "xs max", "se 2" are clear on their own; a bare number ("13") is not.
 if(bare!==full&&(/[a-z]/.test(bare)))keys.push(bare);
 if(/^iphone se/.test(full))keys.push('iphone se','se 2020','se 2');return keys;}
/** iPhones named in the text, with where they appear (longest name wins). */
export function findSwapPhones(text){
 const t=' '+norm(text).replace(/\b(\d+) ?(gb|tb)\b/g,'$1$2')+' ',hits=[];
 for(const m of SWAP_MODELS)for(const k of m.keys){const re=new RegExp(' '+escRe(k)+'(?= )','g');let x;while((x=re.exec(t)))hits.push({m,at:x.index,len:k.length});}
 const keep=hits.filter(a=>!hits.some(b=>b!==a&&b.len>a.len&&b.at<=a.at&&b.at+b.len>=a.at+a.len));
 const seen=new Set();return keep.sort((a,b)=>a.at-b.at).filter(h=>{if(seen.has(h.m.slug))return false;seen.add(h.m.slug);return true;})
  .map(h=>{const after=t.slice(h.at+1+h.len,h.at+1+h.len+14).match(/^ (\d{2,4}(gb|tb)|1tb)/);return {...h.m,at:h.at,storage:after?after[1]:null};});
}
/** Condition answers: true/false for each check the customer mentioned. "none"/"all original" clears them all. */
export function parseSwapChecks(text){
 const t=norm(text),out={};
 const neg=s=>new RegExp(`\\b(no|not|never|without|neva)\\b[^.]{0,20}${s}|${s}[^.]{0,12}\\b(no|not|never)\\b`).test(t);
 if(/\b(none|nothing|all original|everything (is )?original|no issues?|no problem|perfect|clean|neat|never been (opened|repaired|fixed)|original everything|all good|nothing changed|nothing has been changed)\b/.test(t)){Object.assign(out,{screenChanged:false,screenCracked:false,batteryChanged:false,backChanged:false,backCracked:false,faceIdBroken:false});}
 if(/\bscreen\b[^.]{0,20}\b(changed|replaced|not original|fixed|swapped|aftermarket)\b|\b(changed|replaced|new)\b[^.]{0,8}\bscreen\b/.test(t)&&!neg('screen'))out.screenChanged=true;
 if(/\bscreen\b[^.]{0,20}\b(crack|cracked|broken|break|shattered|smashed|scratch)\w*|\b(cracked|broken)\b[^.]{0,8}\bscreen\b/.test(t)&&!neg('crack'))out.screenCracked=true;
 if(/\bbattery\b[^.]{0,20}\b(changed|replaced|not original|service|fixed|swapped)\b|\b(changed|replaced|new)\b[^.]{0,8}\bbattery\b/.test(t)&&!neg('battery'))out.batteryChanged=true;
 if(/\b(back|back glass|back cover|body)\b[^.]{0,20}\b(changed|replaced|not original)\b|\b(changed|replaced)\b[^.]{0,8}\bback\b/.test(t))out.backChanged=true;
 if(/\b(back|back glass|back cover)\b[^.]{0,20}\b(crack|cracked|broken|shattered)\w*|\b(cracked|broken)\b[^.]{0,8}\bback\b/.test(t))out.backCracked=true;
 if(/\bface ?id\b[^.]{0,20}\b(not working|no work|dead|broken|faulty|not|disabled|off)\b|\bno face ?id\b|\bface ?id (no|nor) dey work\b/.test(t))out.faceIdBroken=true;
 else if(/\bface ?id\b[^.]{0,15}\b(working|works|fine|ok|dey work|perfect)\b/.test(t))out.faceIdBroken=false;
 return out;
}
const CHECK_KEYS=['screenChanged','screenCracked','batteryChanged','backChanged','backCracked','faceIdBroken'];
export const checksAnswered=c=>!!c&&(CHECK_KEYS.some(k=>c[k]===true)||CHECK_KEYS.every(k=>c[k]===false)||c.done===true);
/** Swap estimate for a phone, optionally against a target price. Returns null when the phone or storage is unknown. */
export function swapQuote({slug,storage,checks={},targetPrice=null}){
 const m=SWAP_MODELS.find(x=>x.slug===slug);const c=m&&storage&&m.storages.get(storage);if(!c||!(c.swapReferencePrice>0))return null;
 const r=estimateSwap({current:c,target:{price:targetPrice>0?targetPrice:c.swapReferencePrice},...Object.fromEntries(CHECK_KEYS.map(k=>[k,!!checks[k]]))});
 if(r.manual)return null;
 return {model:m.model,storage:c.storage,value:r.value,requiresAssessment:r.requiresAssessment,deductions:r.deductions.filter(d=>d.label!=='Standard used adjustment'),topUp:targetPrice>0?r.topUp:null,surplus:targetPrice>0?r.surplus:null};
}
