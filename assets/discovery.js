import {searchFamilies,compatibleOffers,dimensions,offerUrl,offerMessage,isAvailable} from '../commerce/discovery.mjs';
import {familyCard} from './discovery-ui.mjs';
import {escape,media,money,activateImages} from './storefront-ui.mjs';
let catalogPromise;
export const loadCatalog=()=>catalogPromise ||= fetch('/assets/discovery-catalog.json').then(r=>{if(!r.ok)throw Error('Catalogue unavailable');return r.json();}).catch(error=>{catalogPromise=null;throw error;});
const option=(label,value)=>{const el=document.createElement('option');el.textContent=label;el.value=value;return el;};
const contact='<a href="https://wa.me/2347086865133?text=Please%20help%20me%20find%20a%20device">Ask Mikee on WhatsApp</a>';
export function bindSearch(input,results){
 if(!input||!results||input.dataset.universalSearch)return;
 input.dataset.universalSearch='true';let version=0;
 input.setAttribute('aria-controls',results.id ||= 'search-'+Math.random().toString(36).slice(2));
 input.setAttribute('aria-expanded','false');
 const clear=document.createElement('button');clear.type='button';clear.className='search-clear';clear.textContent='×';clear.setAttribute('aria-label','Clear search');input.after(clear);
 const close=()=>{++version;results.hidden=true;input.setAttribute('aria-expanded','false');};
 async function run(){const current=++version,query=input.value.trim();if(!query){close();return;}results.hidden=false;input.setAttribute('aria-expanded','true');results.innerHTML='<p>Finding your device…</p>';try{const catalog=await loadCatalog();if(current!==version)return;const found=searchFamilies(catalog,query).slice(0,8);results.innerHTML=found.map(item=>{const v=item.variants[0];return `<a class="instant-phone search-result-link" href="${escape(offerUrl(item,v))}">${media(v.image||item.image,item.model)}<span><strong>${escape(item.model)}</strong><small>${escape(v.storage+' · '+v.condition+' · '+v.sim)}</small><small>${v.price>0?money(v.price):'Confirm price'} · ${escape(v.network)}</small></span></a>`;}).join('')+(found.length?`<a class="search-result-link" href="/search/?q=${encodeURIComponent(query)}">See all matching devices →</a>`:`<p class="search-message">No matching inventory. Try fewer details. ${contact}</p>`);activateImages(results);}catch{results.innerHTML=`<p>Search could not load. ${contact}</p>`;}}
 clear.addEventListener('click',()=>{input.value='';++version;close();input.focus();});
 input.addEventListener('input',run);input.addEventListener('focus',()=>{if(input.value)run();});
 input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();window.MikeeGadgetPlugTracking?.pushEvent('search',{search_term:input.value.trim()});location.href='/search/?q='+encodeURIComponent(input.value.trim());}if(event.key==='ArrowDown'){event.preventDefault();results.querySelector('a')?.focus();}if(event.key==='Escape')close();});
 results.addEventListener('keydown',event=>{const links=[...results.querySelectorAll('a')],index=links.indexOf(document.activeElement);if(event.key==='Escape'){input.focus();close();}if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();const next=index+(event.key==='ArrowDown'?1:-1);if(next<0)input.focus();else links[Math.min(next,links.length-1)]?.focus();}});
 document.addEventListener('click',event=>{if(!results.contains(event.target)&&event.target!==input&&event.target!==clear)close();});
}
export function initDiscovery(){
bindSearch(document.querySelector('#homePhoneSearch'),document.querySelector('#searchResults'));
document.querySelectorAll('[data-catalog-search]').forEach(input=>bindSearch(input,input.closest('[data-search-root],dialog')?.querySelector('[data-catalog-results]')));

const form=document.querySelector('#catalogFilters');
if(form){
 const mapping={searchInput:'q',categoryFilter:'category',brandFilter:'brand',seriesFilter:'series',modelFilter:'model',budgetFilter:'budget',conditionFilter:'condition',storageFilter:'storage',simFilter:'sim',networkFilter:'network',availabilityFilter:'availability',colourFilter:'colour',connectivityFilter:'connectivity'};
 const grid=document.querySelector('#productGrid'),count=document.querySelector('#resultsCount'),more=document.querySelector('#showMore');let catalog,limit=12;
 const fields=()=>Object.fromEntries(Object.entries(mapping).map(([id,key])=>[key,document.getElementById(id)?.value||'']));
 function restore(){const params=new URLSearchParams(location.search);for(const [id,key] of Object.entries(mapping)){const field=document.getElementById(id);if(field)field.value=params.get(key)|| (id==='budgetFilter'?'all':'');}}
 function render(save=true){if(!catalog)return;const values=fields(),items=searchFamilies(catalog,values.q,values);grid.innerHTML=items.length?items.slice(0,limit).map(familyCard).join(''):`<div class="catalog-empty"><h3>No matching devices</h3><p>Try fewer filters or a different budget. ${contact}</p><button type="button" data-clear-filters>Clear filters</button></div>`;count.textContent=`${items.length} matching model${items.length===1?'':'s'} · ${items.reduce((n,i)=>n+i.variants.length,0)} listed offers`;more.hidden=items.length<=limit;activateImages(grid);if(save){const url=new URL(location.href);for(const key of Object.values(mapping)){if(values[key]&&values[key]!=='all')url.searchParams.set(key,values[key]);else url.searchParams.delete(key);}history.replaceState({},'',url);}grid.querySelector('[data-clear-filters]')?.addEventListener('click',()=>form.reset());}
 loadCatalog().then(data=>{catalog=data;for(const [id,key] of Object.entries(mapping)){const field=document.getElementById(id);if(!field||field.tagName!=='SELECT'||['budget','category'].includes(key))continue;const values=[...new Set(data.flatMap(item=>['brand','series','model'].includes(key)?[item[key]]:item.variants.flatMap(v=>key==='colour'?v.colours:[v[key]])))].filter(Boolean).sort();const first=field.options[0];field.replaceChildren(first,...values.map(value=>option(value,value)));if(key==='condition'&&values.some(v=>v.startsWith('Brand New')))field.add(option('All Brand New','Brand New'));}restore();render(false);}).catch(()=>{count.innerHTML=`Could not load filters. ${contact}`;});
 form.addEventListener('input',()=>{limit=12;render();});form.addEventListener('submit',event=>{event.preventDefault();render();});form.addEventListener('reset',()=>setTimeout(()=>{limit=12;render();},0));more.addEventListener('click',()=>{limit+=12;render(false);});window.addEventListener('popstate',()=>{restore();render(false);});
}

const familyData=document.getElementById('discovery-family');
if(familyData){
 const family=JSON.parse(familyData.textContent),panel=document.querySelector('.discovery-selector'),fields=panel.querySelector('[data-option-fields]'),summary=panel.querySelector('[data-offer-summary]'),actions=panel.querySelector('[data-offer-actions]');
 const labels={storage:'Storage',condition:'Condition',sim:'SIM configuration',network:'Network status',colour:'Colour'};
 let selected={},offer,invalid=false;
 function restore(){const q=new URLSearchParams(location.search);offer=family.variants.find(v=>v.id===q.get('offer'))||family.variants.find(v=>v.legacyId===q.get('phone'))||family.variants.find(v=>v.slug===panel.dataset.familySlug&&(!q.get('storage')||v.originalStorage===q.get('storage')))||family.variants[0];invalid=!!q.get('offer')&&!family.variants.some(v=>v.id===q.get('offer'));selected={...offer,colour:offer.colours.includes(q.get('color'))?q.get('color'):offer.colours[0]};render(false);}
 function render(save=true){
  fields.replaceChildren();const prefix={};
  for(const key of dimensions){const matching=compatibleOffers(family.variants,prefix);const values=[...new Set(matching.flatMap(v=>key==='colour'?v.colours:[v[key]]))];if(!values.includes(selected[key]))selected[key]=values[0];const label=document.createElement('label');label.textContent=labels[key];const select=document.createElement('select');select.name=key;select.setAttribute('aria-label',labels[key]);select.replaceChildren(...values.map(value=>option(value,value)));select.value=selected[key];select.disabled=values.length===1;label.append(select);fields.append(label);prefix[key]=selected[key];select.addEventListener('change',()=>{selected[key]=select.value;invalid=false;render();fields.querySelector(`[name="${key}"]`)?.focus();window.MikeeGadgetPlugTracking?.pushEvent('select_storage',{product_id:offer.legacyId,phone_model:offer.model,product_name:offer.model+' '+offer.originalStorage,storage:offer.originalStorage,device_condition:offer.condition,value:offer.price??undefined});});}
  const exact=compatibleOffers(family.variants,selected);offer=exact.find(v=>v.id===offer?.id)||exact[0];
  if(!offer){summary.textContent='This combination is unavailable. Choose another configuration.';actions.replaceChildren();return;}
  const restricted=offer.network==='Network Locked';
  summary.innerHTML=`${invalid?'<p>The linked offer is no longer listed. The available alternative below has not been confirmed as a replacement.</p>':''}<strong>${escape(family.model+' · '+offer.storage)}</strong><strong class="discovery-summary-price">${offer.price>0?money(offer.price):'Confirm price'}</strong><dl>${[['Condition',offer.condition],['SIM',offer.sim],['Network',offer.network],['Colour',selected.colour],['Availability',offer.availability]].map(([k,v])=>`<dt>${k}</dt><dd>${escape(v)}</dd>`).join('')}</dl>${restricted?`<p><strong>Network locked${offer.carrier?' to '+escape(offer.carrier):''}.</strong> ${escape(offer.restrictions||'Other carriers may not work. Confirm supported networks and unlocking requirements before buying.')}</p>`:''}`;
  const whatsapp=method=>`https://wa.me/2347086865133?text=${encodeURIComponent(offerMessage(offer,method,selected.colour))}`;
  const canBuy=isAvailable(offer)&&offer.price>0&&!invalid;
  actions.innerHTML=[['buy','Buy Now',true],['easy','Pay Small Small',family.easy],['swap','Swap to This Phone',family.swap]].filter(([, ,show])=>show).map(([key,label])=>`<a data-buying-path="${key}" data-product-id="${escape(offer.legacyId)}" data-value="${offer.price||''}" href="${escape(canBuy&&family.easy?offerUrl(family,offer,key,selected.colour):whatsapp(label))}">${canBuy?label:'Ask about '+label}</a>`).join('');
  document.querySelectorAll('.mobile-purchase-bar [data-action]').forEach(link=>{const key={buy:'buy',easyBuy:'easy',swap:'swap'}[link.dataset.action];link.href=canBuy?offerUrl(family,offer,key,selected.colour):whatsapp(key);link.dataset.productId=offer.legacyId;link.dataset.value=offer.price||'';});
  const image=document.querySelector('.product-main-image .device-media');if(image&&image.querySelector('img')?.getAttribute('src')!==offer.image){image.outerHTML=media(offer.image,family.model,true);document.querySelector('.product-main-image img')?.setAttribute('data-main-image','');activateImages(document);}
  const lead=document.querySelector('.product-lead');if(lead)lead.textContent=offer.condition+' · '+offer.sim+' · '+offer.network;
  document.querySelector('.product-hero-copy h1')?.replaceChildren(document.createTextNode(family.model));
  if(save){const url=new URL(location.href);url.searchParams.set('offer',offer.id);url.searchParams.set('color',selected.colour);url.searchParams.delete('storage');history.replaceState({},'',url);}
 }
 restore();window.addEventListener('popstate',restore);
}

}
