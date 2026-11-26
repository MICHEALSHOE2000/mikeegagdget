import storage from './official-storage.json' with {type:'json'};

const activeLabel = text=>/non[- ]active/i.test(text)?'Non-Active':/\bactive\b/i.test(text)?'Active':'';
export function specificationGroup(d) {
 const label=d.storage||'';
 return JSON.stringify([d.slug,d.model,d.condition,d.simType||'',d.simNote||'',d.activation||d.activationStatus||activeLabel(label),
  d.connectivity||'',d.ram||'',d.network||'',d.region||'']);
}
export function planPrices(rows){
 const groups=new Map(),changes=[],issues=[];
 const known=new Set(rows.map(r=>r.sku));
 for(const row of rows){
  const d=row.product_data;
  if(d.retired||d.reviewRequired||!['iphones','wifi-only','pixel','samsung'].includes(d.category)) continue;
  const key=specificationGroup(d);
  if(!groups.has(key)) groups.set(key,[]);
  groups.get(key).push(row);
 }
 for(const group of groups.values()){
  const model=group[0].product_data.model.replace(/ — WiFi Only$/,'').replace('iPhone 17 Air','iPhone Air');
  const tiers=storage.models[model]||[];
  const sizes=[...new Set([...tiers,...group.map(r=>r.product_data.capacity)])];
  let anchor=null;
  for(const capacity of sizes){
   const index=tiers.indexOf(capacity);
   const variants=group.filter(r=>r.product_data.capacity===capacity);
   const explicit=variants.filter(r=>r.price_ngn>0&&!r.product_data.calculation);
   const prices=new Set(explicit.map(r=>r.price_ngn));
   if(prices.size>1){
    issues.push(...variants.map(r=>({sku:r.sku,reason:'Conflicting explicit prices'})));
    anchor=null;continue;
   }
   if(explicit.length)anchor={row:explicit[0],index};
   const price=explicit[0]?.price_ngn??(anchor&&index>=0&&anchor.index>=0?anchor.row.price_ngn+30000*(index-anchor.index):null);
   if(!price){
    issues.push(...variants.filter(r=>!(r.price_ngn>0)).map(r=>({sku:r.sku,reason:index<0?'Verify capacity and reference price':'No lower reference price'})));
    continue;
   }
   if(index<0&&!explicit.length)continue;
   const calculation={kind:explicit.length?'colour':'storage',reference:anchor.row.sku};
   for(const r of variants.filter(r=>r.price_ngn==null))changes.push({sku:r.sku,price,calculation});
   if(!variants.length&&index>=0){
    const d=anchor.row.product_data;
    const label=d.storage.replace(d.capacity,capacity);
    if(label===d.storage)continue;
    const sku=d.slug+'|'+label;
    if(known.has(sku)){issues.push({sku,reason:'Generated SKU already used by a different group'});continue;}
    known.add(sku);
    // A manufacturer's supported tier does not confirm a particular colour or stock.
    const newLabel=[capacity,d.condition,d.connectivity,d.activation||activeLabel(d.storage),d.ram,d.simNote].filter(Boolean).join(' · ');
    const newSku=d.slug+'|'+newLabel;
    if(newSku!==sku&&known.has(newSku)){issues.push({sku:newSku,reason:'Generated SKU collision'});continue;}
    known.add(newSku);
    const product={slug:d.slug,model:d.model,category:d.category,brand:d.brand,ram:d.ram||'',condition:d.condition,
     connectivity:d.connectivity,activation:d.activation||activeLabel(d.storage),simNote:d.simNote||'',simType:d.simType||'',network:d.network||'',region:d.region||'',
     sku:newSku,storage:newLabel,capacity,colors:[],image:'',price,enabled:false,stockStatus:'confirm',calculation};
    changes.push({sku:newSku,price,calculation,product});
   }
  }
 }
 return {changes,issues};
}
