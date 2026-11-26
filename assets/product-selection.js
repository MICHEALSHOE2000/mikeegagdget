import {setProductImage} from './live-product-image.mjs';
import {primarySlug,liveRows} from "../commerce/catalogue-live.mjs";
import {prioritiseColour,capacityOf,colorsOf,purchasable,swatchColor} from '../commerce/variant-selection.mjs';
import {escape,money,activateImages,stockLabel,DEAL_BADGE} from './storefront-ui.mjs';
import {photoFor} from '../commerce/product-photos.mjs';
import {addToCart,cartLine} from '../commerce/cart.mjs';
import {showAddedToCart} from './cart-ui.mjs';
export async function mountProductSelection(product){
 const panel=document.querySelector('[data-purchase-panel]');if(!panel)return;
 let rows;
 try {rows=(await liveRows()).filter(v=>primarySlug(v.slug)===primarySlug(product.slug) && purchasable(v));}
 catch {panel.textContent='Current prices could not be loaded. Refresh to try again.';return;}
 if(!rows.length){panel.textContent='This product is currently unavailable.';return;}
 product={...product,category:rows[0].category,variants:rows,conditions:[...new Set(rows.map(v=>v.condition))]};
 const params=new URLSearchParams(location.search);
 const initial=product.variants.find(v=>v.sku===params.get('sku'))||product.variants.find(v=>v.storage===params.get('storage'))||product.variants.find(v=>v.slug===product.slug)||product.variants[0];
 const optional=v=>['iphones','wifi-only','pixel','samsung'].includes(product.category)&&!prioritiseColour(v);
 let selected=initial;
 let colour=colorsOf(initial).includes(params.get('color'))?params.get('color'):optional(initial)?'':colorsOf(initial)[0]||'';
 const state={};
 const sims=[...new Set(rows.map(v=>v.connectivity||''))],simChoice=sims.length>1;
 const capacities=[...new Set(rows.map(capacityOf))],colors=[...new Set(rows.flatMap(colorsOf))];
 const conditions=product.conditions;
 const activations=[...new Set(rows.map(v=>v.activation||(/non-active/i.test(v.storage)?'Non-Active':/\bactive\b/i.test(v.storage)?'Active':'')))];
 const activation=v=>v.activation||(/non-active/i.test(v.storage)?'Non-Active':/\bactive\b/i.test(v.storage)?'Active':'');
 const fields={capacity:capacityOf,condition:v=>v.condition,sim:v=>v.connectivity||'',activation};
 function choose(field,value){
  const matches=rows.filter(v=>field==='color'?(value?colorsOf(v).includes(value):optional(v)||!colorsOf(v).length):fields[field](v)===value);
  const score=v=>Object.values(fields).filter(read=>read(v)===read(selected)).length*2+Number(colorsOf(v).includes(colour));
  matches.sort((a,b)=>score(b)-score(a)||a.price-b.price||a.sku.localeCompare(b.sku));
  if(!matches.length)return;
  selected=matches[0];
  if(field==='color')colour=value;
  else if(!colour&&!optional(selected)||colour&&!colorsOf(selected).includes(colour))colour=optional(selected)?'':colorsOf(selected)[0]||'';
 }
 panel.innerHTML=`<p class="selection-condition" data-condition-label></p><div class="price-display"><strong data-product-price aria-live="polite"></strong><del data-original-price></del><small data-price-note></small></div><fieldset class="variant-field"><legend>Choose storage</legend><div class="selector-pills">${capacities.map(c=>`<button type="button" data-capacity="${escape(c)}"><span>${escape(c)}</span><small data-capacity-price></small></button>`).join('')}</div></fieldset><fieldset class="variant-field"><legend>Choose color</legend><div class="color-swatches">${colors.map(c=>`<button type="button" class="color-option" data-color="${escape(c)}" aria-label="${escape(c)}"><span class="swatch" style="background:${swatchColor(c)}"></span><span>${escape(c)}</span></button>`).join('')}${rows.some(v=>optional(v)||!colorsOf(v).length)?'<button type="button" class="color-option unknown-color" data-color="">Any Available Colour</button>':''}</div><p data-color-label></p></fieldset><fieldset class="variant-field"><legend>Condition</legend><div class="selector-pills">${conditions.map(c=>`<button type="button" data-condition="${escape(c)}">${escape(c||'Unspecified')}</button>`).join('')}</div></fieldset>${simChoice?`<fieldset class="variant-field"><legend>${['watches','ipads','tablets'].includes(product.category)?'Connectivity':'SIM'}</legend><div class="selector-pills">${sims.map(c=>`<button type="button" data-sim="${escape(c)}">${escape(c||'Unspecified')}</button>`).join('')}</div></fieldset>`:''}${activations.length>1?`<fieldset class="variant-field"><legend>Activation</legend><div class="selector-pills">${activations.map(a=>`<button type="button" data-activation="${escape(a)}">${escape(a||'Unspecified')}</button>`).join('')}</div></fieldset>`:''}<p class="mg-stock"  data-stock hidden></p><p data-variant-label role="status"></p><p data-product-description></p><div class="purchase-actions"><a class="commerce-button commerce-button-primary" data-action="buy">Buy Now</a><a class="commerce-button commerce-button-dark" data-action="easyBuy">Pay Small Small</a><button type="button" class="commerce-button commerce-button-ghost" data-cart>Add to cart</button></div><p data-selection-status role="status"></p><p>Lagos: same-day delivery, subject to confirmation and eligibility. Other states: estimated 24–48 hours, subject to dispatch and destination.</p><p>Pickup: 1 Ola Ayeni Street, Computer Village, Ikeja, Lagos. Warranty: 7 days.</p>${rows.some(v=>v.category==='wifi-only')?'<p class="wifi-notice">WiFi Only device: cellular calls, mobile data and SIM/eSIM may be unavailable. Confirm the exact restrictions and activation status of the individual device before purchase.</p>':''}`;
 const current=()=>selected;
 const allocated=()=>colour||colorsOf(selected)[0]||'';
 function render(){
  Object.assign(state,{capacity:capacityOf(selected),condition:selected.condition,color:colour,sim:selected.connectivity||'',activation:activation(selected)});
  const v=current(),valid=purchasable(v);
  window.MikeeGadgetPlugTracking?.pushEvent('select_storage',{phone_model:product.model,product_name:product.model,storage:state.capacity,device_condition:state.condition,value:v?.price});
  for(const b of panel.querySelectorAll('[data-capacity]')){const selected=b.dataset.capacity===state.capacity;b.setAttribute('aria-pressed',String(selected));const x=rows.filter(v=>capacityOf(v)===b.dataset.capacity).sort((a,b)=>a.price-b.price)[0];b.querySelector('small').textContent=x&&x.price>0?money(x.price):'Unavailable';}
  for(const [key,field] of [['color','color'],['condition','condition'],['sim','sim'],['activation','activation']])for(const b of panel.querySelectorAll(`[data-${key}]`)){b.setAttribute('aria-pressed',String(b.dataset[key]===state[field]));}
  const wifi=panel.querySelector('.wifi-notice');if(wifi)wifi.hidden=selected.category!=='wifi-only';
  panel.querySelector('[data-condition-label]').textContent=state.condition;
  panel.querySelector('[data-color-label]').textContent='Selected color: '+(state.color||'Any Available Colour');
  panel.querySelector('[data-product-price]').textContent=v?(v.reviewRequired?'Not available yet':v.price>0?money(v.price):'Not available yet'):'Combination unavailable';
  panel.querySelector('[data-original-price]').textContent=v?.deal?money(v.originalPrice):'';
  panel.querySelector('[data-price-note]').textContent=valid?(v?.deal?DEAL_BADGE+' Hot Deal · 7-day warranty':'7-day warranty'):v?.stockStatus==='out_of_stock'?'This option is out of stock. Choose another option.':v?.reviewRequired?'This option is not available yet.':v?'Payment is unavailable until this variant has a verified price.':'Choose another combination; your storage has been kept.';
  panel.querySelector('[data-variant-label]').textContent=[product.model,state.capacity,state.color||v?.colourNote,state.condition,v?.connectivity?(v.simNote?`${v.connectivity} (${v.simNote})`:v.connectivity):'',v?.activation?(v.activation==='To be confirmed'?'Activation to be confirmed':v.activation):''].filter(Boolean).join(' · ');
  document.querySelectorAll('[data-action="buy"],[data-action="easyBuy"]').forEach(a=>{a.setAttribute('aria-disabled',String(!valid));if(valid){const q=new URLSearchParams({sku:v.sku,phone:v.sku,color:allocated(),condition:state.condition});a.href=(a.dataset.action==='buy'?'/checkout/?':'/financing/?')+q;}else a.removeAttribute('href');});
  panel.querySelector('[data-cart]').disabled=!valid;
  {const stock=panel.querySelector('[data-stock]'),label=stockLabel(v);stock.hidden=!label;stock.textContent=label;stock.classList.toggle('is-out',v?.stockStatus==='out_of_stock');stock.classList.toggle('is-confirm',v?.stockStatus==='confirm');}
  for(const [key,value] of Object.entries({storage:state.capacity,color:state.color||'Confirm exact unit',condition:state.condition,connectivity:v?.connectivity||'Confirm the exact unit’s SIM and network support'})){const el=document.querySelector('[data-spec-'+key+']');if(el)el.textContent=value;}
  panel.querySelector('[data-product-description]').textContent=v?.description||'';
  {// Never present another colour's photo as the selected colour: say so when the photo is a generic one.
   const main=document.querySelector('[data-main-image]'),holder=main?.closest('.device-media')||main;let note=document.querySelector('[data-photo-note]');
   if(holder&&!note){note=document.createElement('p');note.className='mg-photo-note';note.dataset.photoNote='';holder.after(note);}
   const specific=!!v?.images?.some(p=>p.approved&&p.color&&p.color===state.color),many=colors.length>1;
   if(note){note.hidden=!(state.color&&many&&!specific);note.textContent=`Representative photo — the ${state.color} colour may look different.`;}}
  const image=photoFor(v,state.color);
  setProductImage(document.querySelector('.product-main-image, .product-gallery, .product-detail-art'),image,product.model);
  const url=new URL(location.href);url.searchParams.set('sku',selected.sku);url.searchParams.set('storage',v?.storage||state.capacity);url.searchParams.set('color',state.color);url.searchParams.set('condition',state.condition);if(simChoice)url.searchParams.set('sim',state.sim);history.replaceState(null,'',url);
 }
 panel.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;for(const field of ['capacity','color','condition','sim','activation'])if(field in b.dataset){choose(field,b.dataset[field]);render();}if(b.hasAttribute('data-cart')){const v=current();if(!purchasable(v))return;try{const sku=v.sku,cart=addToCart(localStorage,{sku,color:allocated(),quantity:1});panel.querySelector('[data-selection-status]').textContent='Added to cart.';const img=document.querySelector('[data-main-image]');showAddedToCart({model:product.model,image:v.image||img?.currentSrc||img?.src||'',storage:[state.capacity,v.connectivity].filter(Boolean).join(' · '),color:allocated(),condition:state.condition,quantity:cartLine(cart,sku,allocated())?.quantity||1,price:v.price});}catch{panel.querySelector('[data-selection-status]').textContent='Unable to save cart. Check browser storage.';}}});
 panel.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)||e.target.tagName!=='BUTTON')return;const buttons=[...e.target.parentElement.querySelectorAll('button')];let i=buttons.indexOf(e.target);i=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;e.preventDefault();buttons[i].focus();buttons[i].click();});
 render();
}
