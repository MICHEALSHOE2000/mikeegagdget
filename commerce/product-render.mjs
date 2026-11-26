// Server-side touch-up of a product page (edge middleware): replaces the build-time structured data with live
// Supabase data (price, availability, condition, shipping) and writes the live prices into the visible price
// buttons, so what Google reads matches what the customer sees. Pure string functions; any doubt → unchanged page.
import {productJsonLd} from './merchant.mjs';
// Formatted by hand: the edge runtime may not carry full locale data for Intl.
const money=n=>'₦'+String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,',');
const SCHEMA=/<script type="application\/ld\+json" data-product-schema>[\s\S]*?<\/script>/;
const attr=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const reEsc=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function renderProductPage(html,{slug,items,variants}){
 let out=html;
 const ld=productJsonLd(slug,items);
 if(ld){const tag=`<script type="application/ld+json" data-product-schema>${JSON.stringify(ld).replace(/</g,'\\u003c')}</script>`;
  out=SCHEMA.test(out)?out.replace(SCHEMA,()=>tag):out.replace('</head>',()=>tag+'\n</head>');}
 for(const v of variants){
  if(!(v.price>0))continue;const storage=v.sku.slice(v.sku.indexOf('|')+1);
  // Phone pages: storage buttons carry the price as data and text.
  out=out.replace(new RegExp(`(data-storage="${reEsc(attr(storage))}"\\s*data-price=")\\d+(")`),`$1${v.price}$2`);
  out=out.replace(new RegExp(`(data-storage="${reEsc(attr(storage))}"[^>]*><span class="storage-name">[^<]*</span><span class="storage-price">)[^<]*(</span>)`),`$1${money(v.price)}$2`);
  // Other product pages: the variant list shows "Option — ₦price".
  out=out.replace(new RegExp(`(<option value="${reEsc(attr(v.sku))}">[^<—]*— )₦[\\d,]+(</option>)`),`$1${money(v.price)}$2`);
 }
 // Page data used by the browser when the shopper switches storage: same live prices.
 for(const v of variants){if(!(v.price>0))continue;const storage=v.sku.slice(v.sku.indexOf('|')+1);
  out=out.replace(new RegExp(`(${reEsc(JSON.stringify('storage'))}:${reEsc(JSON.stringify(storage))},"price":)\\d+`),`$1${v.price}`);}
 // Search snippets and buyer FAQs quote the live price, so Google, Bing and AI search read the same number the
 // shopper sees (a Hot Deal changes it without a rebuild).
 const live=variants.filter(v=>v.price>0&&!v.reviewRequired&&v.enabled!==false).sort((a,b)=>a.price-b.price);
 if(live.length){
  const min=live[0],model=(out.match(/data-product-name="([^"]+)"/)||[])[1]||'';
  const fromText=`${live.length>1?'from':'for'} ${money(min.price)}`;
  for(const tag of ['name="description"','property="og:description"','name="twitter:description"'])
   out=out.replace(new RegExp(`(<meta ${reEsc(tag)} content="[^"]*?)\\b(?:for|from) ₦[\\d,]+`),`$1${fromText}`);
  const cap=v=>String(v.capacity||v.sku.slice(v.sku.indexOf('|')+1).split(' · ')[0]).trim();
  const cond=v=>v.condition&&v.condition!=='Confirm condition'?v.condition:'';
  out=out.replace(/Prices for the ([^<"]{1,80}?) are shown on this page for each storage and condition, from our live catalogue\./g,
   (_,m)=>`The ${m} currently ${live.length>1?'starts from':'costs'} ${money(min.price)} (${[cap(min),cond(min)].filter(Boolean).join(', ')}) at Mikee Gadget Plug. Prices for each storage and condition are shown on this page from our live catalogue.`);
  out=out.replace(/Select ([^ <"]{1,20}) on this page to see its current price\./g,(whole,st)=>{const v=live.find(x=>cap(x).toLowerCase()===st.toLowerCase());
   return v&&model?`The ${model} ${st} is ${money(v.price)}${cond(v)?` (${cond(v)})`:''}. Select ${st} on this page to buy it.`:whole;});
 }
 // Headline price = the selected (first) storage button's live price.
 const active=out.match(/class="is-active"\s*data-storage="[^"]*"\s*data-price="(\d+)"/);
 if(active)out=out.replace(/(<strong data-product-price>)[^<]*(<\/strong>)/,`$1${money(Number(active[1]))}$2`);
 return out;
}
