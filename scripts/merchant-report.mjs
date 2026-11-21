// Google Shopping eligibility report, product by product. Reads the live catalogue (Supabase, or a JSON export of
// shop_deal_catalogue() passed as the first argument) and writes docs/merchant-eligibility.csv. Read-only.
import {readFileSync,writeFileSync} from 'node:fs';
import {buildItems,feedStats} from '../commerce/merchant.mjs';
import pages from '../commerce/merchant-products.mjs';
import {seedRows} from '../commerce/delivery-rates.mjs';
async function load(){
 if(process.argv[2])return {rows:JSON.parse(readFileSync(process.argv[2],'utf8')),rates:seedRows()};
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw Error('Pass a JSON export or set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
 const h={apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'};
 const rows=await (await fetch(url+'/rest/v1/rpc/shop_deal_catalogue',{method:'POST',headers:h,body:'{}'})).json();
 const rates=await (await fetch(url+'/rest/v1/shop_delivery_rates?select=fee_ngn,enabled',{headers:h})).json();
 return {rows,rates};
}
const {rows,rates}=await load();const result=buildItems(rows,{pages,rates});const stats=feedStats(result,rows);
const csv=v=>`"${String(v??'').replace(/"/g,'""')}"`;
const lines=[['status','item_id','sku','product','title','availability','condition','price_ngn','reasons_or_warnings'].map(csv).join(',')];
const warn=new Map();for(const w of result.warnings)warn.set(w.id,[...(warn.get(w.id)||[]),w.warning]);
for(const i of result.items)lines.push(['sent',i.id,i.sku,i.slug,i.title,i.availability,i.googleCondition,i.salePrice??i.price,(warn.get(i.id)||[]).join('; ')].map(csv).join(','));
for(const e of result.excluded)lines.push(['excluded',e.id,e.sku,e.slug,e.title,'','','',e.reasons.join('; ')].map(csv).join(','));
writeFileSync('docs/merchant-eligibility.csv',lines.join('\n')+'\n');
const reasons={};for(const e of result.excluded)for(const r of e.reasons)reasons[r]=(reasons[r]||0)+1;
const excludedProducts=new Set(result.excluded.map(e=>e.slug)),sentProducts=new Set(result.items.map(i=>i.slug));
console.log(JSON.stringify({stats,productsSent:sentProducts.size,productsWithNothingSent:[...excludedProducts].filter(s=>!sentProducts.has(s)).length,reasons},null,1));
