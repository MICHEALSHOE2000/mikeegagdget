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
 if(ld&&SCHEMA.test(out))out=out.replace(SCHEMA,`<script type="application/ld+json" data-product-schema>${JSON.stringify(ld).replace(/</g,'\\u003c')}</script>`);
 for(const v of variants){
  if(!(v.price>0))continue;const storage=v.sku.slice(v.sku.indexOf('|')+1);
  // Phone pages: storage buttons carry the price as data and text.
  out=out.replace(new RegExp(`(data-storage="${reEsc(attr(storage))}"\\s*data-price=")\\d+(")`),`$1${v.price}$2`);
  out=out.replace(new RegExp(`(data-storage="${reEsc(attr(storage))}"[^>]*><span class="storage-name">[^<]*</span><span class="storage-price">)[^<]*(</span>)`),`$1${money(v.price)}$2`);
  // Other product pages: the variant list shows "Option — ₦price".
  out=out.replace(new RegExp(`(<option value="${reEsc(attr(v.sku))}">[^<—]*— )₦[\\d,]+(</option>)`),`$1${money(v.price)}$2`);
 }
 // Headline price = the selected (first) storage button's live price.
 const active=out.match(/class="is-active"\s*data-storage="[^"]*"\s*data-price="(\d+)"/);
 if(active)out=out.replace(/(<strong data-product-price>)[^<]*(<\/strong>)/,`$1${money(Number(active[1]))}$2`);
 return out;
}
