// Google Merchant Center: one place that turns the Supabase catalogue into Google Shopping items. The product feed,
// the product-page structured data and the admin "Google Shopping" report all use these functions, so price,
// availability, condition and photos are always the same everywhere. Runs in Node and at the edge (no Node APIs).
import {pricedVariant} from './deals.mjs';

export const SITE='https://www.mikeegadget.com.ng';
export const FEED_PATH='/google-merchant-feed.xml';
export const STORE_NAME='Mikee Gadget Plug';

// Availability values the administrator can choose (stored in product_data.stockStatus, the existing field).
export const AVAILABILITY={
 in_stock:{feed:'in_stock',schema:'https://schema.org/InStock',label:'In stock'},
 out_of_stock:{feed:'out_of_stock',schema:'https://schema.org/OutOfStock',label:'Out of stock'},
 preorder:{feed:'preorder',schema:'https://schema.org/PreOrder',label:'Pre-order'},
 backorder:{feed:'backorder',schema:'https://schema.org/BackOrder',label:'Backorder'},
};
// Pre-orders and backorders must say when the item will be available (Google requires availability_date).
export const NEEDS_DATE=new Set(['preorder','backorder']);

// Website condition → Google condition. Anything else is not sent until the condition is confirmed.
export function googleCondition(condition=''){
 const c=String(condition).toLowerCase();
 if(/^brand new$|^new$/.test(c))return 'new';
 if(/uk used|^used$|open box|pre-?owned/.test(c))return 'used';
 if(/refurb/.test(c))return 'refurbished';
 return null;
}
const SCHEMA_CONDITION={new:'https://schema.org/NewCondition',used:'https://schema.org/UsedCondition',refurbished:'https://schema.org/RefurbishedCondition'};

// Google product taxonomy IDs (only where the category is unambiguous; otherwise Google classifies the item).
const GOOGLE_CATEGORY={iphones:'267','wifi-only':'267',samsung:'267',pixel:'267',ipads:'4745',tablets:'4745',watches:'201',airpods:'543626',audio:'543626',speakers:'249'};
const PRODUCT_TYPE={iphones:'Phones > iPhones','wifi-only':'Phones > iPhones (Wi-Fi only)',samsung:'Phones > Samsung',pixel:'Phones > Google Pixel',ipads:'Tablets > iPads',tablets:'Tablets > Samsung tablets',watches:'Smartwatches',airpods:'Audio > Earphones',audio:'Audio > Headphones and earphones',speakers:'Audio > Speakers',accessories:'Accessories'};

// Photos shown on the site that should not go to Google until the owner approves them in admin with their source
// and permission (wrong-model risk, devices hidden in cases, or manufacturer images without confirmed permission).
export const IMAGE_HOLDS={
 '/images/store/pixel-11-pro-xl-1':'Photo may show a different Pixel model',
 '/images/store/18pro-1':'Phones are shown inside cases',
 '/images/store/18promax-1':'Phones are shown inside cases',
 '/images/store/apple-watch-ultra-4-1':'Apple product image; permission to reuse not confirmed',
 '/images/store/ipad-air-8th-gen-11-inch-m4-1':'Apple product image; permission to reuse not confirmed',
 '/images/store/iphone-duo-1':'Apple product image; permission to reuse not confirmed',
 '/images/catalog/iphone-12':'Apple support-site image; permission to reuse not confirmed',
 '/images/catalog/iphone-15-plus':'Apple support-site image; permission to reuse not confirmed',
 '/images/catalog/iphone-8':'Apple support-site image; permission to reuse not confirmed',
 '/images/catalog/iphone-xr':'Apple support-site image; permission to reuse not confirmed',
};
const baseOf=u=>String(u||'').replace(/-(160|360|720|1280)\.webp$/,'').replace(/\.(webp|jpe?g|png)$/,'');
// Placeholder artwork (e.g. the iPad range) is never sent as a product photo.
export const holdReason=url=>IMAGE_HOLDS[baseOf(url)]||(/\/images\/store\/ipad-range\/|\.svg$/.test(String(url||''))?'Placeholder artwork, not a product photo':/\/images\/store\/ipad\//.test(String(url||''))?'Apple product image; permission to reuse not confirmed':'');
const absolute=u=>!u?'':/^https:\/\//.test(u)?u:u.startsWith('/')?SITE+u:'';
const larger=u=>/-720\.webp$/.test(u)?u:u; // 720px photos are the largest generated size

// GTIN check digit (GTIN-8/12/13/14). Identifiers are only sent when recorded and valid; never guessed.
export function validGtin(value){const d=String(value||'').replace(/\s/g,'');if(!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(d))return false;const digits=[...d].map(Number),check=digits.pop();const sum=digits.reverse().reduce((s,n,i)=>s+n*(i%2===0?3:1),0);return (10-sum%10)%10===check;}

// Stable item ID per variant and colour (FNV-1a, 2×32 bit). Stays the same as long as the SKU and colour do.
function fnv(str,seed){let h=seed>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h.toString(16).padStart(8,'0');}
export const itemId=(sku,colour='')=>'MG-'+fnv(sku+'#'+colour,2166136261)+fnv(colour+'#'+sku,374761393);

const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const capacityOf=v=>clean(v.capacity||String(v.storage||'').split(' · ')[0]);
const conditionLabel=c=>clean(c)||'';

// Highest delivery fee charged to any destination in Nigeria (from the delivery price table). Google cannot show
// Lagos LGA prices, so one country-wide amount is sent that never understates what a customer pays.
export function shippingCeiling(rates){const fees=(Array.isArray(rates)?rates:[]).filter(r=>r&&r.enabled!==false&&Number.isFinite(Number(r.fee_ngn))&&r.fee_ngn!==null).map(r=>Number(r.fee_ngn));return fees.length?Math.max(...fees):null;}

/**
 * Turns catalogue rows (from shop_deal_catalogue) into Google items.
 * @returns {{items:Array,excluded:Array,warnings:Array}} items are eligible; excluded explain why not.
 */
export function buildItems(rows,{pages,rates}={}){
 const ceiling=shippingCeiling(rates);const items=[],excluded=[],warnings=[];
 for(const row of Array.isArray(rows)?rows:[]){
  if(!row||!row.product_data?.slug||row.enabled===false)continue;
  const v=pricedVariant(row,!!row.deal_position),page=pages?.[v.slug],reasons=[];
  const condition=googleCondition(v.condition),status=String(v.stockStatus||''),avail=AVAILABILITY[status];
  if(!(v.originalPrice>0))reasons.push('No valid price');
  if(v.reviewRequired)reasons.push('Marked for review in admin');
  if(!page)reasons.push('No product page on the website');
  else if(page.skus?.length&&!page.skus.includes(row.sku))reasons.push('This variant is not on the product page yet (rebuild the site)');
  if(!condition)reasons.push(`Condition not confirmed (“${conditionLabel(v.condition)||'blank'}”)`);
  if(!avail)reasons.push(status==='confirm'?'Availability marked “to be confirmed”':'Availability not set');
  else if(NEEDS_DATE.has(status)&&!/^\d{4}-\d{2}-\d{2}$/.test(v.availabilityDate||''))reasons.push(`${avail.label} needs an expected availability date`);
  if(!clean(v.brand||page?.brand))reasons.push('No brand');
  if(ceiling===null)reasons.push('No delivery prices configured');
  // Photos: approved in admin (with source and permission) first, otherwise the photo the website shows.
  const approved=(Array.isArray(v.images)?v.images:[]).filter(p=>p&&p.approved&&p.source&&p.licence&&p.url);
  const legacy=[...new Set([v.image,...(page?.photos||[])].filter(Boolean))];
  const colours=(Array.isArray(v.colors)?v.colors:[]).map(clean).filter(Boolean);
  const variants=colours.length?colours:[''];
  for(const colour of variants){
   const own=[...approved.filter(p=>colour&&clean(p.color).toLowerCase()===colour.toLowerCase()),...approved.filter(p=>!clean(p.color))].map(p=>p.url);
   const site=legacy.filter(u=>!holdReason(u));
   const photos=[...new Set(own.length?own:approved.length?[]:site)].map(larger);
   const itemReasons=[...reasons];
   if(!photos.length){const held=legacy.map(holdReason).find(Boolean);itemReasons.push(approved.length&&colour?`No approved photo for ${colour}`:held?`Photo needs approval in admin: ${held}`:'No product photo');}
   const brand=clean(v.brand||page?.brand),model=clean(v.model||page?.model),cap=capacityOf(v);
   const name=model.toLowerCase().startsWith(brand.toLowerCase())?model:`${brand} ${model}`;
   const title=clean(`${name} ${cap}${colour?' '+colour:''} – ${conditionLabel(v.condition)}`).slice(0,150);
   const id=itemId(row.sku,colour);
   const entry={id,sku:row.sku,slug:v.slug,model,brand,colour,title,condition:conditionLabel(v.condition),category:v.category||page?.category||''};
   if(itemReasons.length){excluded.push({...entry,reasons:itemReasons});continue;}
   const url=`${SITE}${page.route}?sku=${encodeURIComponent(row.sku)}${colour?`&color=${encodeURIComponent(colour)}`:''}`;
   const details=[['Storage',cap],['SIM',clean(v.connectivity)],['Activation',/to be confirmed/i.test(v.activation||'')?'':clean(v.activation)],['Network note',clean(v.simNote)],['RAM',clean(v.ram)]].filter(([,x])=>x);
   const description=clean([`${conditionLabel(v.condition)} ${name}${cap?`, ${cap}`:''}${colour?`, ${colour}`:''}.`,
    v.connectivity?`SIM: ${clean(v.connectivity)}.`:'',details.find(d=>d[0]==='Activation')?`Activation: ${clean(v.activation)}.`:'',v.simNote?`${clean(v.simNote)}.`:'',v.colourNote?`${clean(v.colourNote)}.`:'',
    'Includes a 7-day warranty.',`Sold by ${STORE_NAME}, Computer Village, Ikeja, Lagos.`,'Pay online, by bank transfer, or in instalments with Credit Direct (subject to approval).'].join(' ')).slice(0,5000);
   const gtin=validGtin(v.gtin)?String(v.gtin).replace(/\s/g,''):'',mpn=clean(v.mpn).slice(0,70);
   if(v.gtin&&!gtin)warnings.push({id,sku:row.sku,title,warning:'Recorded GTIN is not valid and was not sent'});
   if(condition==='new'&&!gtin)warnings.push({id,sku:row.sku,title,warning:'New product without a GTIN: Google may limit how often it shows'});
   if(approved.length===0)warnings.push({id,sku:row.sku,title,warning:'Photo is a website photo not yet approved in admin with its source and permission'});
   items.push({...entry,url,description,googleCondition:condition,availability:avail.feed,availabilitySchema:avail.schema,availabilityLabel:avail.label,
    availabilityDate:NEEDS_DATE.has(status)?v.availabilityDate:'',price:v.originalPrice,salePrice:v.deal&&v.price<v.originalPrice?v.price:null,
    image:absolute(photos[0]),additionalImages:photos.slice(1,11).map(absolute),gtin,mpn,size:cap,itemGroupId:v.slug,
    googleCategory:GOOGLE_CATEGORY[v.category]||'',productType:PRODUCT_TYPE[v.category]||'',details,shippingPrice:ceiling});
  }
 }
 // Variant groups: one group per product and condition. Google needs variants in a group to differ by colour or
 // size, so storage is sent as size; if two items would still look identical, that group is sent ungrouped.
 const groups=new Map();for(const i of items){const k=i.slug+'|'+i.googleCondition;(groups.get(k)||groups.set(k,[]).get(k)).push(i);}
 for(const [key,list] of groups){
  const signature=i=>(i.size||'')+'|'+(i.colour||'').toLowerCase(),unique=new Set(list.map(signature)).size===list.length;
  for(const i of list)i.itemGroupId=list.length>1&&unique?key.replace('|','-'):'';
 }
 return {items,excluded,warnings};
}

// Google asks for delivery times in shipping details. Left empty until the owner confirms real handling and
// transit days (see the delivery policy draft note); nothing is guessed.
export const DELIVERY_TIME=null;

const xml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'})[c]).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');
const naira=n=>`${Number(n).toFixed(2)} NGN`;
const lagosDate=d=>`${d}T00:00+01:00`;
export function feedXml(items,{generatedAt=new Date().toISOString()}={}){
 const tag=(name,value)=>value===''||value===null||value===undefined?'':`<g:${name}>${xml(value)}</g:${name}>`;
 const body=items.map(i=>`<item>${tag('id',i.id)}<title>${xml(i.title)}</title><description>${xml(i.description)}</description><link>${xml(i.url)}</link>${tag('image_link',i.image)}${i.additionalImages.map(u=>tag('additional_image_link',u)).join('')}${tag('availability',i.availability)}${i.availabilityDate?tag('availability_date',lagosDate(i.availabilityDate)):''}${tag('price',naira(i.price))}${i.salePrice?tag('sale_price',naira(i.salePrice)):''}${tag('brand',i.brand)}${tag('condition',i.googleCondition)}${tag('gtin',i.gtin)}${tag('mpn',i.mpn)}${tag('google_product_category',i.googleCategory)}${tag('product_type',i.productType)}${tag('color',i.colour)}${tag('size',i.itemGroupId?i.size:'')}${tag('item_group_id',i.itemGroupId)}${i.details.map(([n,v])=>`<g:product_detail><g:attribute_name>${xml(n)}</g:attribute_name><g:attribute_value>${xml(v)}</g:attribute_value></g:product_detail>`).join('')}${tag('custom_label_0',i.condition)}${tag('custom_label_1',i.category)}${i.shippingPrice!==null?`<g:shipping><g:country>NG</g:country><g:service>Delivery</g:service><g:price>${naira(i.shippingPrice)}</g:price></g:shipping>`:''}</item>`).join('\n');
 return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n<channel>\n<title>${xml(STORE_NAME)}</title>\n<link>${SITE}/</link>\n<description>${xml(`${STORE_NAME} product feed — generated ${generatedAt}`)}</description>\n${body}\n</channel>\n</rss>\n`;
}

// Structured data for one product page, built from the same eligible items as the feed.
// Follows Google's merchant-listing rules: every variant has an image; a ProductGroup has a description and
// says what its variants differ by (storage as "size", colour only when every variant names one). Variants
// with no colour are left out of a colour group rather than given a made-up colour.
export function productJsonLd(slug,items){
 const all=items.filter(i=>i.slug===slug&&i.image);if(!all.length)return null;const first=all[0];
 const page=first.url.split('?')[0];
 const groupName=first.model.toLowerCase().startsWith(first.brand.toLowerCase())?first.model:`${first.brand} ${first.model}`;
 const coloured=all.filter(i=>i.colour),colours=new Set(coloured.map(i=>i.colour));
 const byColour=colours.size>1;const list=byColour?coloured:all;
 const bySize=new Set(list.map(i=>i.size).filter(Boolean)).size>1;
 const offer=i=>({'@type':'Offer',url:i.url,priceCurrency:'NGN',price:i.salePrice??i.price,availability:i.availabilitySchema,itemCondition:SCHEMA_CONDITION[i.googleCondition],
  seller:{'@type':'Organization',name:STORE_NAME},
  ...(i.shippingPrice!==null?{shippingDetails:{'@type':'OfferShippingDetails',shippingRate:{'@type':'MonetaryAmount',value:i.shippingPrice,currency:'NGN'},shippingDestination:{'@type':'DefinedRegion',addressCountry:'NG'},...(DELIVERY_TIME?{deliveryTime:DELIVERY_TIME}:{})}}:{})});
 const product=i=>({'@type':'Product',sku:i.id,name:i.title,image:[i.image,...i.additionalImages],description:i.description,...(i.colour?{color:i.colour}:{}),...(i.size?{size:i.size}:{}),...(i.gtin?{gtin:i.gtin}:{}),...(i.mpn?{mpn:i.mpn}:{}),
  brand:{'@type':'Brand',name:i.brand},itemCondition:SCHEMA_CONDITION[i.googleCondition],offers:offer(i)});
 if(list.length===1)return {'@context':'https://schema.org',...product(list[0]),url:page};
 const conditions=[...new Set(list.map(i=>i.googleCondition==='new'?'Brand New':'UK Used'))].join(' and ');
 const variesBy=[...(bySize?['https://schema.org/size']:[]),...(byColour?['https://schema.org/color']:[])];
 return {'@context':'https://schema.org','@type':'ProductGroup',name:groupName,productGroupID:slug,url:page,brand:{'@type':'Brand',name:first.brand},
  description:`${groupName} (${conditions}) at ${STORE_NAME}, Computer Village, Ikeja, Lagos. Prices in Naira, 7-day warranty, delivery across Nigeria or free store pickup.`,
  image:first.image,...(variesBy.length?{variesBy}:{}),hasVariant:list.map(product)};
}

// Summary numbers for the admin "Google Shopping" section.
export function feedStats({items,excluded,warnings},rows){
 const live=(Array.isArray(rows)?rows:[]).filter(r=>r&&r.enabled!==false&&r.product_data?.slug),rowsCount=Array.isArray(rows)?live.length:Number(rows)||0;
 const inStockVariants=live.filter(r=>r.product_data.stockStatus==='in_stock').length;
 const count=(list,re)=>list.filter(e=>e.reasons.some(r=>re.test(r))).length;
 const variantsIn=new Set(items.map(i=>i.sku)),products=new Set(items.map(i=>i.slug));
 return {catalogueVariants:rowsCount,inStockVariants,inStockItems:items.filter(i=>i.availability==='in_stock').length,eligibleItems:items.length,eligibleVariants:variantsIn.size,eligibleProducts:products.size,
  excludedItems:excluded.length,excludedVariants:new Set(excluded.filter(e=>!variantsIn.has(e.sku)).map(e=>e.sku)).size,
  missingImage:count(excluded,/photo/i),missingPrice:count(excluded,/price/i),missingRequired:count(excluded,/condition|availability|brand|product page|variant is not|date|delivery/i),warnings:warnings.length};
}
