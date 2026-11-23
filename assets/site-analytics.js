// Site analytics: Google Analytics 4 (numbers: traffic, sources, funnel, sales) and Microsoft Clarity
// (recordings and heatmaps: where and why people drop). Loads only on the live domain, so previews and
// local builds do not pollute the data; add ?mg_analytics=1 to a preview URL to test it there.
// No personal or contact details are ever sent; checkout and account pages are masked in Clarity.
(function(){
 var GA_ID='G-8FCNHYFK7P', CLARITY_ID='zicu2skehx';
 var w=window, d=document, host=location.hostname, path=location.pathname;
 var live=/(^|\.)mikeegadget\.com\.ng$/.test(host), forced=/[?&]mg_analytics=1\b/.test(location.search);
 if(/^\/admin(\/|$)/.test(path))return; // never track or record the admin area
 // mgTrack works everywhere (a no-op queue off the live site) so other scripts can call it safely.
 w.dataLayer=w.dataLayer||[];
 function gtag(){w.dataLayer.push(arguments);}
 var enabled=live||forced;
 w.mgTrack=function(name,params){
  if(!enabled)return;
  try{
   if(name==='purchase'&&params&&params.transaction_id){var key='mg-ga-purchase-'+params.transaction_id;if(localStorage.getItem(key))return;localStorage.setItem(key,'1');}
  }catch(e){}
  gtag('event',name,params||{});
  if(typeof w.clarity==='function')w.clarity('event',name);
 };
 if(!enabled)return;

 // Google Analytics 4
 gtag('js',new Date());
 gtag('config',GA_ID,{currency:'NGN',send_page_view:true});
 var g=d.createElement('script');g.async=true;g.src='https://www.googletagmanager.com/gtag/js?id='+GA_ID;d.head.appendChild(g);

 // Microsoft Clarity
 (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(w,d,'clarity','script',CLARITY_ID);

 // Product page view (from the page's own Product schema).
 function productSchema(){try{var el=d.querySelector('script[data-product-schema]');return el?JSON.parse(el.textContent):null;}catch(e){return null;}}
 function ready(fn){if(d.readyState!=='loading')fn();else d.addEventListener('DOMContentLoaded',fn);}
 ready(function(){
  var type=d.body?d.body.getAttribute('data-page-type'):'';
  w.clarity('set','page_type',/^\/checkout\/complete/.test(path)?'order_status':/^\/checkout/.test(path)?'checkout':/^\/cart/.test(path)?'cart':d.querySelector('[data-product-schema]')?'product':path==='/'?'home':/^\/shop\/|^\/search/.test(path)?'category':(type||'page'));
  var p=productSchema();
  if(p){var offers=[].concat(p.offers||[]),prices=offers.map(function(o){return Number(o.price)}).filter(function(n){return n>0});
   var min=prices.length?Math.min.apply(Math,prices):undefined;
   w.mgTrack('view_item',{currency:'NGN',value:min,items:[{item_id:p.sku,item_name:p.name,item_brand:p.brand&&p.brand.name,price:min}]});}
  if(/^\/checkout\/?$/.test(path))w.mgTrack('begin_checkout',{currency:'NGN'});
 });

 // Clicks that matter for a Computer Village store: WhatsApp, calls, Pay Small Small, directions.
 d.addEventListener('click',function(e){
  var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!a)return;var href=a.getAttribute('href')||'';
  if(/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href))w.mgTrack('whatsapp_click',{link_text:(a.textContent||'').trim().slice(0,60)});
  else if(/^tel:/.test(href))w.mgTrack('phone_call_click');
  else if(/creditdirect\.ng|^\/financing\/?/.test(href))w.mgTrack('pay_small_small_click');
  else if(/google\.[a-z.]+\/maps|maps\.app\.goo\.gl/.test(href))w.mgTrack('directions_click');
 },true);
})();
