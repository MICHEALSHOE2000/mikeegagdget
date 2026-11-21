// Server-side rendering touches, at the edge. Any problem falls back to the prebuilt static page; this never blocks
// the site.
// 1. Hot Deals rendered into the homepage and /deals/ HTML, so the deals are in the first response.
// 2. Product pages: live structured data (price, availability, condition, delivery) and live prices in the
//    visible price buttons, read from Supabase — the same data as the Google Merchant Center feed.
import {pricedVariant} from './commerce/deals.mjs';
import {hotDealsHtml} from './assets/storefront-ui.mjs';
import {injectDeals,skuFilter} from './commerce/home-render.mjs';
import {buildItems} from './commerce/merchant.mjs';
import {renderProductPage} from './commerce/product-render.mjs';
import pages from './commerce/merchant-products.mjs';
export const config={matcher:['/','/deals','/deals/','/((?!api/|assets/|images/|commerce/|_vercel/|admin|checkout|cart|account|search|shop/|blog/|financing|phone-swap|deals)[^.]+)']};
const pass=()=>new Response(null,{headers:{'x-middleware-next':'1'}});
const GUARD='x-mg-render';
const byRoute=new Map(Object.entries(pages).map(([slug,p])=>[p.route.replace(/\/+$/,''),slug]));
export default async function middleware(request){
 if(request.method!=='GET'||request.headers.get(GUARD))return pass();
 const path=new URL(request.url).pathname.replace(/\/+$/,'');
 const isDeals=path===''||path==='/deals',slug=isDeals?null:byRoute.get(path);
 if(!isDeals&&!slug)return pass();
 try{
  const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!base||!key)return pass();
  const api=(q)=>fetch(base+'/rest/v1/'+q,{headers:{apikey:key,Authorization:'Bearer '+key},signal:AbortSignal.timeout(2000)}).then(r=>r.ok?r.json():Promise.reject(Error('db')));
  const own=new Headers({[GUARD]:'1'});const cookie=request.headers.get('cookie');if(cookie)own.set('cookie',cookie);
  const pagePromise=fetch(request.url,{headers:own,signal:AbortSignal.timeout(3000)}).catch(()=>null);
  const dealsPromise=api('shop_deal_settings?id=eq.store&select=skus').then(r=>r[0]?.skus||[]);
  if(slug){
   const [rows,rates,skus,page]=await Promise.all([api('checkout_inventory?select=sku,price_ngn,enabled,product_data&enabled=eq.true&product_data->>slug=eq.'+encodeURIComponent(slug)),api('shop_delivery_rates?select=fee_ngn,enabled'),dealsPromise,pagePromise]);
   if(!page||!page.ok||!(page.headers.get('content-type')||'').includes('text/html')||!rows.length)return pass();
   const withDeals=rows.map(r=>({...r,deal_position:skus.includes(r.sku)?skus.indexOf(r.sku)+1:null}));
   const {items}=buildItems(withDeals,{pages,rates});
   const html=renderProductPage(await page.text(),{slug,items,variants:withDeals.map(r=>pricedVariant(r,!!r.deal_position))});
   return new Response(html,{status:200,headers:{'content-type':'text/html; charset=utf-8','cache-control':'public, max-age=0, must-revalidate','x-mg-render':'product'}});
  }
  const skus=await dealsPromise;
  const page=await pagePromise;
  if(!page||!page.ok||!(page.headers.get('content-type')||'').includes('text/html'))return pass();
  let html=await page.text();
  if(skus.length){
   const rows=await api('checkout_inventory?select=sku,price_ngn,enabled,product_data&sku='+encodeURIComponent(skuFilter(skus)));
   const ordered=skus.map(sku=>rows.find(r=>r.sku===sku)).filter(Boolean).map(r=>pricedVariant(r,true));
   html=injectDeals(html,hotDealsHtml(ordered));
  }
  return new Response(html,{status:200,headers:{'content-type':'text/html; charset=utf-8','cache-control':'public, max-age=0, must-revalidate','x-mg-deals':'server'}});
 }catch{return pass();}
}
