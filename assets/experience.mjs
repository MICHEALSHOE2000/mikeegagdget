// Sitewide shopping extras: wishlist hearts, Quick View, customer reviews and the account page.
// Everything here decorates the existing cards and pages; it does not change their structure.
import {readWishlist,toggleWishlist,WISHLIST_KEY} from '../commerce/wishlist.mjs';
import {loadCatalogue} from '../commerce/catalogue-live.mjs';
import {escape,money,media,card,priceText,listable,stockLabel,activateImages,conditionText,optionLabel} from './storefront-ui.mjs';
const HEART='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.500 4.600 13.300a4.700 4.700 0 0 1 6.600-6.700l.8.800.8-.800a4.700 4.700 0 0 1 6.600 6.700Z"/></svg>';
export {loadCatalogue};
let settingsPromise;
const loadSettings=()=>settingsPromise??=fetch('/api/shop/settings').then(r=>r.ok?r.json():{}).catch(()=>({}));
function css(){if(document.querySelector('link[data-mg-experience]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='/assets/experience.css';l.dataset.mgExperience='';document.head.append(l);}

// ---- Wishlist ----
function syncHearts(){const saved=readWishlist(localStorage);document.querySelectorAll('[data-wish]').forEach(b=>{const on=saved.includes(b.dataset.wish);b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',(on?'Remove from':'Save to')+' saved items: '+b.dataset.name);});}
function decorate(root=document){
 root.querySelectorAll('article.store-phone[data-model]:not([data-extras])').forEach(el=>{
  el.dataset.extras='';const slug=el.dataset.model,name=el.querySelector('h3')?.textContent.trim()||'this product';
  const heart=document.createElement('button');heart.type='button';heart.className='mg-wish';heart.dataset.wish=slug;heart.dataset.name=name;heart.innerHTML=HEART;
  const quick=document.createElement('button');quick.type='button';quick.className='mg-quick';quick.dataset.quick=slug;quick.textContent='Quick view';quick.setAttribute('aria-label','Quick view: '+name);
  el.append(heart,quick);});
 syncHearts();
}

// ---- Quick View ----
let sheet,lastFocus;
function closeQuick(){if(!sheet||sheet.hidden)return;sheet.hidden=true;document.documentElement.classList.remove('mg-cart-lock');lastFocus?.focus?.({preventScroll:true});}
async function openQuick(slug){
 lastFocus=document.activeElement;
 if(!sheet){sheet=document.createElement('div');sheet.className='mg-quick-overlay';sheet.hidden=true;sheet.innerHTML='<div class="mg-quick-backdrop" data-close></div><div class="mg-quick-sheet" role="dialog" aria-modal="true" aria-label="Quick view"><button type="button" class="mg-quick-close" data-close aria-label="Close quick view">×</button><div data-body></div></div>';document.body.append(sheet);
  sheet.addEventListener('keydown',e=>{if(e.key==='Escape')closeQuick();if(e.key!=='Tab')return;const f=[...sheet.querySelectorAll('a[href],button:not([disabled])')],first=f[0],last=f.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});}
 const body=sheet.querySelector('[data-body]');body.innerHTML='<p class="mg-quick-note">Loading…</p>';sheet.hidden=false;document.documentElement.classList.add('mg-cart-lock');sheet.querySelector('.mg-quick-close').focus({preventScroll:true});
 let item;try{item=(await loadCatalogue()).find(p=>p.slug===slug);}catch{}
 if(!item){body.innerHTML=`<p class="mg-quick-note">Details could not load. <a href="/${escape(slug)}/">Open the product page</a>.</p>`;return;}
 const variants=item.variants.filter(v=>v.price>0&&v.enabled!==false&&!v.reviewRequired).map(v=>({...v,sku:v.sku||item.slug+'|'+v.storage,colors:Array.isArray(v.colors)?v.colors:(v.color?v.color.split('/').map(c=>c.trim()).filter(Boolean):[])})).sort((a,b)=>a.price-b.price);
 const state={sku:(variants.find(v=>v.stockStatus!=='out_of_stock')||variants[0])?.sku,color:''};
 const draw=()=>{const v=variants.find(x=>x.sku===state.sku),colors=v?.colors||[];if(!colors.includes(state.color))state.color=colors[0]||'';
  const label=stockLabel(v),out=v?.stockStatus==='out_of_stock';
  const href=v?item.route+(item.route.includes('?')?'&':'?')+new URLSearchParams({storage:v.storage,color:state.color,condition:v.condition||''}):item.route;
  body.innerHTML=`<div class="mg-quick-grid"><div class="mg-quick-media">${media(v?.image||item.image,item.model)}</div><div><p class="mg-quick-cond">${escape(v?.condition||conditionText(item))}</p><h2>${escape(item.model)}</h2><p class="mg-quick-price">${v?(v.deal&&v.originalPrice>v.price?`<del>${money(v.originalPrice)}</del> `:'')+money(v.price):escape(priceText(item))}</p>${label?`<p class="mg-stock${out?' is-out':''}">${escape(label)}</p>`:''}
   ${variants.length?`<fieldset><legend>Storage / option</legend><div class="mg-quick-pills">${variants.map(x=>`<button type="button" data-sku="${escape(x.sku)}" aria-pressed="${x.sku===state.sku}">${escape([optionLabel(x.capacity||x.storage),variants.some(y=>y!==x&&(y.capacity||y.storage)===(x.capacity||x.storage))?x.condition:''].filter(Boolean).join(' · '))}<small>${money(x.price)}</small></button>`).join('')}</div></fieldset>`:''}
   ${colors.length?`<fieldset><legend>Colour</legend><div class="mg-quick-pills">${colors.map(c=>`<button type="button" data-color="${escape(c)}" aria-pressed="${c===state.color}">${escape(c)}</button>`).join('')}</div></fieldset>`:''}
   <div class="mg-quick-actions">${v&&!out?'<button type="button" class="mg-quick-add" data-add>Add to Cart</button>':''}<a class="mg-quick-view" href="${escape(href)}">View Product →</a></div></div></div>`;
  activateImages(body);};
 draw();
 body.onclick=async e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.sku){state.sku=b.dataset.sku;draw();}else if(b.dataset.color){state.color=b.dataset.color;draw();}
  else if('add' in b.dataset){const v=variants.find(x=>x.sku===state.sku);if(!v)return;const [{addToCart,cartLine},{showAddedToCart}]=await Promise.all([import('../commerce/cart.mjs'),import('./cart-ui.mjs')]);
   try{const cart=addToCart(localStorage,{sku:v.sku,color:state.color,quantity:1});sheet.hidden=true;showAddedToCart({model:item.model,image:v.image||item.image,storage:optionLabel(v.capacity||v.storage),color:state.color,condition:v.condition,quantity:cartLine(cart,v.sku,state.color)?.quantity||1,price:v.price});}catch{b.textContent='Could not save cart';}}};
}

// ---- Reviews (only real, administrator-published ones; the section stays hidden when there are none) ----
const stars=n=>Number.isInteger(n)&&n>=1&&n<=5?`<span class="mg-stars" role="img" aria-label="${n} out of 5 stars">${'★'.repeat(n)}<span aria-hidden="true">${'☆'.repeat(5-n)}</span></span>`:'';
function reviewCard(r){return `<li class="mg-review">${r.photo?`<img src="${escape(r.photo)}" alt="" width="56" height="56" loading="lazy">`:''}<div>${stars(r.rating)}<blockquote>${escape(r.body)}</blockquote><p class="mg-review-by">${escape(r.name)}${r.verified?' · <span class="mg-verified">Verified purchase</span>':''}${r.date?` · <time datetime="${escape(r.date)}">${escape(new Date(r.date+'T00:00:00').toLocaleDateString('en-NG',{month:'short',year:'numeric'}))}</time>`:''}</p></div></li>`;}
async function reviews(){
 const home=document.querySelector('[data-reviews]'),slug=document.body.dataset.productSlug;
 if(!home&&!slug)return;
 const data=(await loadSettings()).reviews;if(!data)return;
 const items=(data.items||[]).filter(r=>slug?r.productSlug===slug:true).slice(0,slug?4:6);
 if(!items.length&&!data.googleUrl)return;
 const google=data.googleUrl?`<a class="mg-google" href="${escape(data.googleUrl)}" target="_blank" rel="noopener">Read our Google reviews ↗</a>`:'';
 const html=`<div class="store-heading"><div><p class="eyebrow">CUSTOMER REVIEWS</p><h2 id="reviews-title">${slug?'What buyers of this device say':'What our customers say'}</h2></div>${google}</div>${items.length?`<ul class="mg-reviews">${items.map(reviewCard).join('')}</ul>`:''}`;
 if(home){home.innerHTML=html;home.hidden=false;}
 else if(items.length||google){const s=document.createElement('section');s.className='mg-product-reviews';s.setAttribute('aria-labelledby','reviews-title');s.innerHTML=html;(document.querySelector('main')||document.body).append(s);}
}

// ---- Account page: saved items and order tracking ----
async function account(){
 const saved=document.getElementById('saved-items');
 if(saved){const draw=async()=>{const slugs=readWishlist(localStorage);if(!slugs.length){saved.innerHTML='<p class="mg-empty-note">No saved items yet. Tap the heart on any product to save it here.</p><a class="btn btn-primary" href="/search/">Shop products</a>';return;}
   let items=[];try{items=await loadCatalogue();}catch{}
   const found=slugs.map(s=>items.find(p=>p.slug===s)).filter(Boolean).filter(listable);
   saved.innerHTML=found.length?`<div class="product-grid">${found.map(card).join('')}</div>`:'<p class="mg-empty-note">Your saved items are no longer available. <a href="/search/">Browse current devices</a>.</p>';activateImages(saved);decorate(saved);};
  await draw();addEventListener('mikee:wishlist',draw);}
 const form=document.getElementById('track-order');
 if(form)form.addEventListener('submit',async e=>{e.preventDefault();const out=document.getElementById('track-result'),ref=form.elements.reference.value.trim();
  if(!/^MGP2-[a-f0-9]{32}$/.test(ref)){out.textContent='Enter the full order reference from your confirmation page. It starts with MGP2-.';return;}
  out.textContent='Checking…';
  try{const r=await fetch('/api/shop/verify?reference='+encodeURIComponent(ref)),d=await r.json();if(!r.ok)throw Error();
   const words={paid:'Paid',pending:'Awaiting payment',failed:'Payment not successful',cancelled:'Cancelled',manual_review:'Being reviewed by the store',financing_pending:'Pay Small Small not completed',awaiting_merchant_payment:'Awaiting settlement from Credit Direct'};
   out.innerHTML=`<strong>${escape(words[d.status]||'Awaiting payment')}</strong>${d.summary?` · ${escape((d.summary.fulfillmentStatus||'processing').replaceAll('_',' '))} · ${money(d.summary.amountNgn)}<br><a href="/checkout/complete/?reference=${encodeURIComponent(ref)}">View order details</a>`:''}`;
  }catch{out.textContent='We could not find that order. Check the reference, or contact us on WhatsApp.';}});
}

export function initExperience(){
 css();decorate();
 new MutationObserver(list=>{if(list.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('article.store-phone')||n.querySelector?.('article.store-phone')))))decorate();}).observe(document.body,{childList:true,subtree:true});
 document.addEventListener('click',e=>{
  const wish=e.target.closest('[data-wish]');if(wish){e.preventDefault();try{toggleWishlist(localStorage,wish.dataset.wish);}catch{}syncHearts();dispatchEvent(new CustomEvent('mikee:wishlist'));return;}
  const quick=e.target.closest('[data-quick]');if(quick){e.preventDefault();openQuick(quick.dataset.quick);return;}
  if(sheet&&!sheet.hidden&&e.target.closest('.mg-quick-overlay [data-close]'))closeQuick();});
 addEventListener('storage',e=>{if(e.key===WISHLIST_KEY)syncHearts();});
 reviews().catch(()=>{});account().catch(()=>{});
 // Share row on product pages: WhatsApp, X and copy link, using the page's canonical address.
 if(document.body.dataset.productSlug&&!document.querySelector('.mg-share')){const url=document.querySelector('link[rel=canonical]')?.href||location.href.split('?')[0],name=document.body.dataset.productName||document.title;
  const bar=document.createElement('p');bar.className='mg-share';const text=`${name} at Mikee Gadget Plug`;
  bar.innerHTML=`<span>Share:</span> <a href="https://wa.me/?text=${encodeURIComponent(text+' '+url)}" target="_blank" rel="noopener">WhatsApp</a> <a href="https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}" target="_blank" rel="noopener" aria-label="Share on X"><svg viewBox="0 0 24 24" aria-hidden="true" width="14" height="14"><path fill="currentColor" d="M17.8 3h3.1l-6.8 7.8L22 21h-6.3l-4.9-6.4L5.2 21H2.1l7.3-8.3L1.9 3h6.4l4.4 5.9L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z"/></svg> X</a> <button type="button" data-copy-link>Copy link</button>`;
  (document.querySelector('[data-purchase-panel]')||document.querySelector('main'))?.after(bar);
  bar.querySelector('[data-copy-link]').addEventListener('click',async e=>{try{await navigator.clipboard.writeText(url);e.target.textContent='Link copied';}catch{e.target.textContent=url;}});}
}
