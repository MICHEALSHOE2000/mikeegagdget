// Recently viewed and compare lists, kept on the customer's own device. Product page names only — no personal data.
export const RECENT_KEY='mikee-recent-v1',COMPARE_KEY='mikee-compare-v1',COMPARE_MAX=3;
const clean=(list,max)=>[...new Set((Array.isArray(list)?list:[]).filter(s=>typeof s==='string'&&/^[a-z0-9-]{1,120}$/.test(s)))].slice(0,max);
export function readList(storage,key){try{return clean(JSON.parse(storage.getItem(key)||'[]'),key===COMPARE_KEY?COMPARE_MAX:12);}catch{return [];}}
export function pushRecent(storage,slug){const next=clean([slug,...readList(storage,RECENT_KEY)],12);storage.setItem(RECENT_KEY,JSON.stringify(next));return next;}
export function toggleCompare(storage,slug){const list=readList(storage,COMPARE_KEY);if(list.includes(slug)){const next=list.filter(s=>s!==slug);storage.setItem(COMPARE_KEY,JSON.stringify(next));return {list:next,on:false};}
 if(list.length>=COMPARE_MAX)return {list,on:false,full:true};const next=clean([...list,slug],COMPARE_MAX);storage.setItem(COMPARE_KEY,JSON.stringify(next));return {list:next,on:true};}
// Side-by-side rows built only from recorded catalogue data. Missing data shows "—", never a guess.
export function compareRows(items,{money,optionLabel=v=>v}){
 const buyable=p=>p.variants.filter(v=>v.price>0&&!v.reviewRequired&&v.enabled!==false);
 const uniq=a=>[...new Set(a.filter(Boolean))];
 const row=(label,fn)=>({label,values:items.map(p=>{const v=fn(p);return v&&String(v).trim()?String(v):'—';})});
 return [
  row('Price from',p=>{const prices=buyable(p).map(v=>v.price);return prices.length?money(Math.min(...prices)):'';}),
  row('Condition',p=>uniq(buyable(p).map(v=>v.condition)).join(' / ')),
  row('Storage',p=>uniq(buyable(p).map(v=>optionLabel(v.capacity||String(v.storage||'').split(' · ')[0]))).join(' · ')),
  row('Prices by storage',p=>uniq(buyable(p).map(v=>`${optionLabel(v.capacity||String(v.storage||'').split(' · ')[0])} ${money(v.price)}`)).join(' · ')),
  row('Colours',p=>uniq(buyable(p).flatMap(v=>String(v.color||'').split('/'))).join(', ')),
  row('SIM / connectivity',p=>uniq(buyable(p).map(v=>v.connectivity||v.simNote)).join(' · ')),
  row('Activation',p=>uniq(buyable(p).map(v=>v.activation||v.activationStatus)).join(' · ')),
  row('Warranty',()=>'7 days'),
 ];
}
