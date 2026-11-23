// Writes the additive Supabase migration for the new iPad Air 11-inch M4 variants (23 Nov 2026 iPad range) (INSERT … ON CONFLICT DO NOTHING).
import {writeFile} from 'node:fs/promises';
import {retailInventory} from '../commerce/retail-inventory.mjs';
import {IPAD_RANGE_PRODUCTS,IPAD_RANGE_NEW_VARIANTS} from '../commerce/ipad-range-2026-11-23.mjs';
const fresh=new Set(IPAD_RANGE_PRODUCTS.map(p=>p.slug)),added=new Set(IPAD_RANGE_NEW_VARIANTS.map(n=>`${n.slug}|${n.variant.storage}`));
const rows=retailInventory.flatMap(p=>p.variants.map(v=>({p,v,sku:`${p.slug}|${v.storage}`}))).filter(r=>fresh.has(r.p.slug)||added.has(r.sku));
const q=s=>`'${String(s).replaceAll("'","''")}'`;
const data=({p,v,sku})=>({sku,slug:p.slug,model:p.model,category:'ipads',brand:'Apple',condition:'Brand New',capacity:v.capacity,storage:v.storage,
 price:v.price,...(v.compareAtPrice?{compareAtPrice:v.compareAtPrice}:{}),image:p.image,colors:v.color?[v.color]:[],ram:'',connectivity:v.connectivity,
 enabled:true,reviewRequired:false,stockStatus:'in_stock',availabilitySource:'owner-confirmed',availabilityConfirmedAt:'2026-11-23',priceSource:v.priceSource});
const write=async(file,list,note)=>{const sql=`-- iPad range (23 Nov 2026): ${note}. ${list.length} SKUs priced from iStore Nigeria's sale prices, with the "was" price as compareAtPrice.
-- Additive only: existing SKUs (including iPad Air 11-inch M4 256GB Wi-Fi at ₦1,190,000) are never touched.
-- Rollback: delete from public.checkout_inventory where sku in (…these SKUs…) and product_data->>'priceSource'='iStore Nigeria iPad range, 23 Nov 2026';
insert into public.checkout_inventory(sku,price_ngn,enabled,product_data) values
${list.map(r=>`(${q(r.sku)},${r.v.price},true,${q(JSON.stringify(data(r)))}::jsonb)`).join(',\n')}
on conflict (sku) do nothing;
`;await writeFile(file,sql);console.log(file,list.length,'rows');};
// The new models' rows were applied before merge (20261123100000_ipad_range.sql; unseen on the live site until the pages ship).
// New variants of a live product would show on the live page at once, so these are applied only when the PR is merged.
await write('supabase/migrations/20261123100100_ipad_air_m4_variants.sql',rows.filter(r=>added.has(r.sku)),'New variants of the live iPad Air 11-inch M4 page (apply at merge)');
