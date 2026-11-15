import {activateImages,hotDealsHtml,eligibleDeals,featuredCard} from './storefront-ui.mjs';
export {featuredCard};
const rail=document.getElementById('hotDeals')||document.getElementById('published-deals');
// One retry covers a cold serverless start or a brief network drop before the fallback message is shown.
async function loadDeals(){for(let attempt=0;;attempt++){try{const response=await fetch('/api/shop/deals',{cache:'no-store'});if(!response.ok)throw Error();return await response.json();}catch(e){if(attempt>=1)throw e;await new Promise(r=>setTimeout(r,1500));}}}
// The homepage arrives with deals already in the HTML (server-rendered). The browser only refreshes them, and
// never replaces working cards with an error.
if(rail){const rendered=()=>!!rail.querySelector('[data-deal-sku]');
 try{const rows=eligibleDeals(await loadDeals());const next=rows.map(v=>v.sku+':'+v.price).join('|'),now=[...rail.querySelectorAll('[data-deal-sku]')].map(el=>el.dataset.dealSku+':'+(el.querySelector('.store-price')?.textContent||'').replace(/\D/g,'')).join('|');
  if(next!==now){rail.innerHTML=rows.length?hotDealsHtml(rows):'<p class="empty-deals">No hot deals right now. <a href="/search/">Browse all devices</a>.</p>';activateImages(rail);}
 }catch{if(!rendered())rail.innerHTML='<p class="empty-deals">Today’s deals could not load. Please refresh, or <a href="/search/">browse all devices</a>.</p>';}}
