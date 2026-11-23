// Catalogue data-quality report for the store owner. Reads the catalogue; changes nothing.
// Usage: node scripts/audit-catalogue.mjs  → docs/catalogue-audit.csv (+ summary on screen)
import {writeFile,mkdir,access} from 'node:fs/promises';
import {retailInventory} from '../commerce/retail-inventory.mjs';
import {csvCell} from '../commerce/csv.mjs';
const rows=[],add=(p,problem,existing,proposed,confidence,action)=>rows.push([p.slug,p.model,problem,existing,proposed,confidence,action]);
const BRAND_CATEGORIES={Apple:['iphones','ipads','watches','accessories','airpods','wifi-only','macbooks','laptops'],Samsung:['samsung','tablets','watches','audio','airpods','accessories'],Google:['pixel','watches','audio','airpods','accessories'],Sony:['ps5','games','audio','airpods','accessories']};
const needsStorage=p=>['iphones','samsung','pixel','ipads','tablets','wifi-only'].includes(p.category);
const exists=async f=>access(f).then(()=>true,()=>false);
const imageUsers=new Map();
let variants=0,missingPrice=0,invalid=0,missingImage=0;
for(const p of retailInventory){
 if(p.image?.startsWith('/images/store/ipad-range/')){missingImage++;add(p,'Placeholder art, no product photo yet',p.image,'Upload an approved photo in Admin → Product details → Photos','High','Manual: add photo');}
 if(!p.image){missingImage++;add(p,'No product photo','','Upload an approved photo in Admin → Product details → Photos','High','Manual: add photo');}
 else{if(p.image.startsWith('/')&&!await exists('.'+p.image))add(p,'Photo file is missing from the site',p.image,'Replace the photo','High','Manual: replace photo');imageUsers.set(p.image,[...(imageUsers.get(p.image)||[]),p]);}
 if(BRAND_CATEGORIES[p.brand]&&!BRAND_CATEGORIES[p.brand].includes(p.category))add(p,'Brand and category do not match',`${p.brand} / ${p.category}`,'','Medium','Manual: confirm category');
 if(!p.variants.some(v=>v.price>0))add(p,'No variant has a price (hidden from the shop)','','Add a price in Admin, or leave hidden','High','Manual: add price');
 const seen=new Map();
 for(const v of p.variants){variants++;
  const cond=v.condition||p.condition,size=String(v.capacity||v.storage.split(' · ')[0]).trim(),label=v.storage;
  if(!(v.price>0)){missingPrice++;add(p,'Variant has no price (cannot be bought)',label,'Add the approved selling price','High','Manual: add price');}
  if(/^(19|20)\d{2}$/.test(size)){invalid++;add(p,'A year is stored where the storage/option belongs',label,'Shown to customers as the standard model; rename the option (e.g. case size) in Admin','High','Display corrected in code; confirm the real option');}
  else if(needsStorage(p)&&!/^\d+(GB|TB)$/i.test(size)){invalid++;add(p,'Storage is not a standard size',label,'','Medium','Manual: confirm storage');}
  if(cond==='Confirm condition'){invalid++;add(p,'Condition not set',label,'Set Brand New, UK Used or Open Box','High','Manual: choose condition');}
  if(v.reviewRequired){invalid++;add(p,'Variant flagged for catalogue review'+(v.reviewNote?': '+v.reviewNote:''),label,'','Medium','Manual: review then enable');}
  if(/^iphone-(?!18)/.test(p.slug)&&cond==='Brand New')add(p,'Brand New on a model sold as UK Used',label,'UK Used','Medium','Manual: confirm condition');
  if(v.connectivity&&!['Wi-Fi Only','eSIM only','Physical SIM + eSIM','Dual SIM','Wi‑Fi','Wi-Fi + Cellular'].includes(v.connectivity))add(p,'Unusual connectivity value',v.connectivity,'','Low','Manual: confirm');
  const key=[size,cond,v.color||'',v.connectivity||'',v.ram||''].join('|');
  if(seen.has(key)){invalid++;add(p,'Duplicate variant',`${seen.get(key)} and ${label}`,'Keep one','Medium','Manual: disable one');}else seen.set(key,label);
 }
}
let wrongImage=0;
for(const [image,users] of imageUsers){const models=[...new Set(users.map(p=>p.model.replace(/ — WiFi Only$/,'')))];if(models.length>1){wrongImage+=users.length;for(const p of users)add(p,'Same photo is used for different models',image,`Shared with: ${models.filter(m=>m!==p.model).slice(0,4).join(', ')}`,'Medium','Manual: confirm the photo shows this exact model');}}
await mkdir('docs',{recursive:true});
await writeFile('docs/catalogue-audit.csv',[['Product ID','Product name','Problem','Existing value','Proposed correction','Confidence','Manual action required'],...rows].map(r=>r.map(csvCell).join(',')).join('\r\n')+'\r\n');
const summary={products:retailInventory.length,variants,variantsWithoutPrice:missingPrice,invalidVariants:invalid,productsWithoutPhoto:missingImage,productsSharingAPhoto:wrongImage,reportRows:rows.length};
await writeFile('docs/catalogue-audit-summary.json',JSON.stringify(summary,null,2)+'\n');
console.log(summary);
