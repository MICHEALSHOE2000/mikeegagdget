// Renders Hot Deals into the homepage and /deals/ HTML on the server, so the deals are in the first response
// (and visible without JavaScript). Any problem falls back to the prebuilt static page; this never blocks the site.
import {pricedVariant} from './commerce/deals.mjs';
import {hotDealsHtml} from './assets/storefront-ui.mjs';
import {injectDeals,skuFilter} from './commerce/home-render.mjs';
export const config={matcher:['/','/deals','/deals/']};
const pass=()=>new Response(null,{headers:{'x-middleware-next':'1'}});
const GUARD='x-mg-render';
export default async function middleware(request){
 if(request.method!=='GET'||request.headers.get(GUARD))return pass();
 try{
  const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!base||!key)return pass();
  const api=(path)=>fetch(base+'/rest/v1/'+path,{headers:{apikey:key,Authorization:'Bearer '+key},signal:AbortSignal.timeout(2000)}).then(r=>r.ok?r.json():Promise.reject(Error('db')));
  const own=new Headers({[GUARD]:'1'});const cookie=request.headers.get('cookie');if(cookie)own.set('cookie',cookie);
  const pagePromise=fetch(request.url,{headers:own,signal:AbortSignal.timeout(3000)}).catch(()=>null);
  const skus=(await api('shop_deal_settings?id=eq.store&select=skus'))[0]?.skus||[];
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
