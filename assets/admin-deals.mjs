import {escape,money} from './storefront-ui.mjs';
import {dealPrice} from '../commerce/deals.mjs';
export function mountDeals(root,api,getInventory){
 let skus=[],revision=0,busy=false;
 root.innerHTML='<h2>All Deals</h2><p>Select up to nine storage variants (suggested: 3–4 iPhones, 2 Samsung phones, 1 MacBook and 2 Google Pixel phones). Each gets 10% off its catalogue price, rounded to the nearest naira. Changes go live only when published.</p><button type="button" data-reload>Reload published deals</button><label>Search catalogue<input type="search" data-search placeholder="Model, storage or SKU"></label><div data-results></div><h3 data-count></h3><div data-selected></div><button type="button" class="btn btn-primary" data-publish>Publish deals</button><p data-status role="status"></p>';
 const $=s=>root.querySelector(s),status=t=>$('[data-status]').textContent=t;
 const describe=r=>[r.product_data?.model,r.product_data?.capacity||r.product_data?.storage,r.product_data?.condition].filter(Boolean).join(' · ');
 function render(){
  const inventory=getInventory(),q=$('[data-search]').value.trim().toLowerCase();
  $('[data-count]').textContent=skus.length+' / 9 selected';
  $('[data-results]').innerHTML=inventory.filter(r=>r.enabled&&r.price_ngn>0&&!r.product_data?.reviewRequired&&r.product_data?.image&&!skus.includes(r.sku)&&(describe(r)+' '+r.sku).toLowerCase().includes(q)).slice(0,15).map(r=>`<div class="cart-line"><div><strong>${escape(describe(r))}</strong><p>${money(Number(r.price_ngn))} → ${money(dealPrice(Number(r.price_ngn)))}</p></div><button type="button" data-add="${escape(r.sku)}" ${busy||skus.length>=9?'disabled':''}>Add deal</button></div>`).join('')||'<p>No matching available variants with a price and image.</p>';
  $('[data-selected]').innerHTML=skus.map((sku,i)=>{const r=inventory.find(v=>v.sku===sku);return `<div class="cart-line"><div><strong>${i+1}. ${escape(r?describe(r):sku)}</strong><p>${r?.price_ngn>0?`<del>${money(Number(r.price_ngn))}</del> → ${money(dealPrice(Number(r.price_ngn)))} · 10% OFF`:'Price unavailable'}</p>${r?.product_data?.image?`<img src="${escape(r.product_data.image)}" alt="${escape(r.product_data.model)}" width="90" height="100" style="object-fit:contain">`:''}</div><button type="button" data-up="${i}" aria-label="Move deal ${i+1} up" ${i===0||busy?'disabled':''}>↑</button><button type="button" data-down="${i}" aria-label="Move deal ${i+1} down" ${i===skus.length-1||busy?'disabled':''}>↓</button><button type="button" data-remove="${i}" ${busy?'disabled':''}>Remove</button></div>`;}).join('')||'<p>No deals selected. Publishing this will clear All Deals.</p>';
  $('[data-publish]').disabled=busy;
 }
 async function load(){try{const data=await api('/api/admin/deals');skus=[...data.skus];revision=data.revision;render();status('Published deals loaded.');}catch(e){status(e.message);}}
 $('[data-search]').addEventListener('input',render);
 root.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b||busy)return;
  if(b.hasAttribute('data-reload'))return load();
  if(b.hasAttribute('data-add')&&skus.length<9&&!skus.includes(b.dataset.add))skus.push(b.dataset.add);
  if(b.hasAttribute('data-remove'))skus.splice(Number(b.dataset.remove),1);
  for(const [key,delta]of[['up',-1],['down',1]])if(key in b.dataset){const i=Number(b.dataset[key]),j=i+delta;if(j>=0&&j<skus.length)[skus[i],skus[j]]=[skus[j],skus[i]];}
  if(b.hasAttribute('data-publish')){busy=true;render();try{const saved=await api('/api/admin/deals',{method:'PUT',body:JSON.stringify({skus,revision})});revision=saved.revision;status('Deals published. The storefront and new checkouts now use these promotions.');}catch(err){status(err.message);}finally{busy=false;render();}return;}
  render();status('Unpublished changes. Review and select Publish deals.');
 });
 return {load,clear(){skus=[];revision=0;status('');render();}};
}
