import {escape} from './storefront-ui.mjs';
import {HOME_FEATURED_LIMIT} from '../commerce/deals.mjs';
// Administrator picker for the homepage "Find your next device" products. One entry per product, not per variant.
export function mountHome(root,api,getInventory){
 let slugs=[],revision=0,busy=false;
 root.innerHTML='<h2>Homepage featured products</h2><p>Choose up to '+HOME_FEATURED_LIMIT+' products for “Find your next device”. They appear first, in this order. Leave empty to use the default mix. Changes go live only when published.</p><button type="button" data-reload>Reload published selection</button><label>Search catalogue<input type="search" data-search placeholder="Model or brand"></label><div data-results></div><h3 data-count></h3><div data-selected></div><button type="button" class="btn btn-primary" data-publish>Publish featured products</button><p data-status role="status"></p>';
 const $=s=>root.querySelector(s),status=t=>$('[data-status]').textContent=t;
 function products(){const map=new Map();for(const r of getInventory()){const d=r.product_data||{};if(!d.slug)continue;const p=map.get(d.slug)||{slug:d.slug,model:d.model||d.slug,brand:d.brand||'',image:'',priced:false};if(d.image&&!p.image)p.image=d.image;if(r.enabled&&r.price_ngn>0)p.priced=true;map.set(d.slug,p);}return [...map.values()];}
 const note=p=>[p.brand,p.priced?'':'no price yet',p.image?'':'no photo yet'].filter(Boolean).join(' · ');
 function render(){
  const all=products(),q=$('[data-search]').value.trim().toLowerCase();
  $('[data-count]').textContent=slugs.length+' / '+HOME_FEATURED_LIMIT+' selected';
  $('[data-results]').innerHTML=all.filter(p=>!slugs.includes(p.slug)&&(p.model+' '+p.brand+' '+p.slug).toLowerCase().includes(q)).slice(0,15).map(p=>`<div class="cart-line"><div><strong>${escape(p.model)}</strong><p>${escape(note(p))}</p></div><button type="button" data-add="${escape(p.slug)}" ${busy||slugs.length>=HOME_FEATURED_LIMIT?'disabled':''}>Feature</button></div>`).join('')||'<p>No matching products.</p>';
  $('[data-selected]').innerHTML=slugs.map((slug,i)=>{const p=all.find(x=>x.slug===slug);return `<div class="cart-line"><div><strong>${i+1}. ${escape(p?.model||slug)}</strong><p>${escape(p?note(p):'Not in the catalogue')}</p>${p?.image?`<img src="${escape(p.image)}" alt="${escape(p.model)}" width="90" height="100" style="object-fit:contain">`:''}</div><button type="button" data-up="${i}" aria-label="Move product ${i+1} up" ${i===0||busy?'disabled':''}>↑</button><button type="button" data-down="${i}" aria-label="Move product ${i+1} down" ${i===slugs.length-1||busy?'disabled':''}>↓</button><button type="button" data-remove="${i}" ${busy?'disabled':''}>Remove</button></div>`;}).join('')||'<p>No products selected. The homepage shows the default mix.</p>';
  $('[data-publish]').disabled=busy;
 }
 async function load(){try{const data=await api('/api/admin/deals?kind=home');slugs=[...data.slugs];revision=data.revision;render();status('Published selection loaded.');}catch(e){status(e.message);}}
 $('[data-search]').addEventListener('input',render);
 root.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b||busy)return;
  if(b.hasAttribute('data-reload'))return load();
  if(b.hasAttribute('data-add')&&slugs.length<HOME_FEATURED_LIMIT&&!slugs.includes(b.dataset.add))slugs.push(b.dataset.add);
  if(b.hasAttribute('data-remove'))slugs.splice(Number(b.dataset.remove),1);
  for(const [key,delta]of[['up',-1],['down',1]])if(key in b.dataset){const i=Number(b.dataset[key]),j=i+delta;if(j>=0&&j<slugs.length)[slugs[i],slugs[j]]=[slugs[j],slugs[i]];}
  if(b.hasAttribute('data-publish')){busy=true;render();try{const saved=await api('/api/admin/deals?kind=home',{method:'PUT',body:JSON.stringify({slugs,revision})});revision=saved.revision;status('Featured products published. The homepage now shows this selection.');}catch(err){status(err.message);}finally{busy=false;render();}return;}
  render();status('Unpublished changes. Review and select Publish featured products.');
 });
 return {load,clear(){slugs=[];revision=0;status('');render();}};
}
