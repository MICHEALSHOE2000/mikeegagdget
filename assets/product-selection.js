import {capacityOf,colorsOf,resolveVariant,purchasable,swatchColor,colourIsPreference} from '../commerce/variant-selection.mjs';
import {escape,money,activateImages,stockLabel,DEAL_BADGE} from './storefront-ui.mjs';
import {photoFor} from '../commerce/product-photos.mjs';
import {addToCart,cartLine,saveColourPref} from '../commerce/cart.mjs';
import {showAddedToCart} from './cart-ui.mjs';
import {logIssue,whatsappOrderHref} from './client-log.mjs';
const WA_TEXT='Tap here to order on WhatsApp.';
// Live prices and stock for the exact SKUs on this page (never another SKU's price). Returns true when anything changed.
async function refreshLive(product){
 const ctrl=typeof AbortController==='function'?new AbortController():null;const timer=setTimeout(()=>ctrl?.abort(),8000);
 try{const r=await fetch('/api/shop/catalog',{signal:ctrl?.signal});if(!r.ok)throw Error('catalogue '+r.status);const rows=await r.json();let changed=false;
  for(const v of product.variants){const live=rows.find(x=>x.sku===product.slug+'|'+v.storage);if(live){changed=true;Object.assign(v,{price:live.price,originalPrice:live.originalPrice,deal:live.deal,enabled:live.enabled,capacity:live.capacity||v.capacity,condition:live.condition||v.condition,colors:live.colors,image:live.image,images:live.images,stockStatus:live.stockStatus,stockQty:live.stockQty,connectivity:live.connectivity??v.connectivity,activation:live.activation??v.activation,simNote:live.simNote??v.simNote,colourNote:live.colourNote??v.colourNote,description:live.description});}}
  return changed;}
 catch(e){logIssue('live_catalogue_unavailable',{sku:product.slug,message:e?.name==='AbortError'?'timeout':e?.message});return false;}
 finally{clearTimeout(timer);}
}
export async function mountProductSelection(product){
 const panel=document.querySelector('[data-purchase-panel]');if(!panel)return;
 // The selector works straight away from the prices built into the page; live prices replace them when they arrive,
 // so early taps are never lost while the catalogue loads on a slow connection.
 const live=refreshLive(product);
 const params=new URLSearchParams(location.search);
 const initial=product.variants.find(v=>product.slug+'|'+v.storage===params.get('sku'))||product.variants.find(v=>v.storage===params.get('storage'))||product.variants[0];
 const state={capacity:capacityOf(initial),condition:initial.condition||product.conditions[0],color:colorsOf(initial)[0]||''};
 if(params.has('color'))state.color=params.get('color');
 if(params.has('condition'))state.condition=params.get('condition');
 // SIM choice appears only when this model is sold in more than one SIM configuration.
 let sims,simChoice,capacities,colors,conditions;
 const pick=s=>({...s,sim:simChoice?s.sim:undefined});
 // Every option shown can be bought: the option lists are built from the combinations that resolve to a purchasable
 // variant (if nothing is buyable, all options are shown so the page still describes the phone and Buy Now explains
 // how to order it).
 let combos=[];
 function options(){
  const allSims=[...new Set(product.variants.map(v=>v.connectivity||''))].filter(Boolean);simChoice=allSims.length>1;
  const allCaps=[...new Set(product.variants.map(capacityOf))],allConds=[...new Set(product.variants.map(v=>v.condition||product.conditions[0]))];
  const allColors=[...new Set([...product.colors.filter(c=>!c.startsWith('Ask ')),...product.variants.flatMap(colorsOf)])];
  combos=[];
  for(const capacity of allCaps)for(const condition of allConds)for(const sim of (simChoice?allSims:[undefined]))for(const color of [...allColors,'']){
   if(purchasable(resolveVariant(product.variants,{capacity,condition,sim,color})))combos.push({capacity,condition,sim,color});}
  const pickList=(key,all)=>combos.length?all.filter(x=>combos.some(c=>c[key]===x)):all;
  capacities=pickList('capacity',allCaps);conditions=pickList('condition',allConds);sims=simChoice?pickList('sim',allSims):[];colors=pickList('color',allColors);
 }
 // When a tap makes the combination impossible, keep what was tapped and move the other choices to the closest
 // combination that can be bought (storage first, then condition, SIM and colour).
 function settled(s,keep){
  if(purchasable(resolveVariant(product.variants,pick(s))))return s;
  const weight={capacity:8,condition:4,sim:2,color:1};let best=null,score=-1;
  for(const c of combos){if(keep&&c[keep]!==s[keep])continue;const sc=Object.keys(weight).reduce((n,k)=>n+(c[k]===s[k]?weight[k]:0),0);if(sc>score){score=sc;best={...s,...c,sim:simChoice?c.sim:s.sim};}}
  return best||s;
 }
 function build(){
  options();
  if(simChoice&&!build.done){state.sim=initial.connectivity||'';if(params.has('sim'))state.sim=params.get('sim');}build.done=true;
  Object.assign(state,settled(state));
  panel.innerHTML=`<p class="selection-condition" data-condition-label></p><div class="price-display"><strong data-product-price aria-live="polite"></strong><del data-original-price></del><small data-price-note></small></div><fieldset class="variant-field"><legend>Choose storage</legend><div class="selector-pills">${capacities.map(c=>`<button type="button" data-capacity="${escape(c)}"><span>${escape(c)}</span><small data-capacity-price></small></button>`).join('')}</div></fieldset><fieldset class="variant-field"><legend>Choose color</legend><div class="color-swatches">${colors.map(c=>`<button type="button" class="color-option" data-color="${escape(c)}" aria-label="${escape(c)}"><span class="swatch" style="background:${swatchColor(c)}"></span><span>${escape(c)}</span></button>`).join('')}${(combos.length?combos.some(c=>c.color===''):product.variants.some(v=>!colorsOf(v).length))?'<button type="button" class="color-option unknown-color" data-color="">Color to confirm</button>':''}</div><p data-color-label></p></fieldset><fieldset class="variant-field"><legend>Condition</legend><div class="selector-pills">${conditions.map(c=>`<button type="button" data-condition="${escape(c)}">${escape(c)}</button>`).join('')}</div></fieldset>${simChoice?`<fieldset class="variant-field"><legend>${['watches','ipads','tablets'].includes(product.category)?'Connectivity':'SIM'}</legend><div class="selector-pills">${sims.map(c=>`<button type="button" data-sim="${escape(c)}">${escape(c)}</button>`).join('')}</div></fieldset>`:''}<p class="mg-stock" data-stock hidden></p><p data-variant-label role="status"></p><p data-product-description></p><div class="purchase-actions"><a class="commerce-button commerce-button-primary" data-action="buy">Buy Now</a><a class="commerce-button commerce-button-dark" data-action="easyBuy">Pay Small Small</a><button type="button" class="commerce-button commerce-button-ghost" data-cart>Add to cart</button></div><p data-selection-status role="status"></p><p>Lagos: same-day delivery, subject to confirmation and eligibility. Other states: estimated 24–48 hours, subject to dispatch and destination.</p><p>Pickup: 1 Ola Ayeni Street, Computer Village, Ikeja, Lagos. Warranty: 7 days.</p>${product.slug.endsWith('-wifi-only')?'<p class="wifi-notice">WiFi Only device: cellular calls, mobile data and SIM/eSIM may be unavailable. Confirm the exact restrictions and activation status of the individual device before purchase.</p>':''}`;
  render();
 }
 const current=()=>resolveVariant(product.variants,pick(state));
 const checkoutHref=(action,v)=>(action==='buy'?'/checkout/?':'/financing/?')+new URLSearchParams({sku:product.slug+'|'+v.storage,phone:product.slug+'|'+v.storage,color:state.color,condition:state.condition});
 const say=(text,whatsapp=false)=>{const el=panel.querySelector('[data-selection-status]');if(!el)return;el.classList.toggle('is-problem',!!text);el.innerHTML=escape(text||'').replace(escape(WA_TEXT),`<a href="${escape(whatsappOrderHref(product.model,[state.capacity,state.color,state.condition].filter(Boolean).join(' · ')))}" target="_blank" rel="noopener">${escape(WA_TEXT)}</a>`);if(whatsapp&&!text.includes(WA_TEXT))el.insertAdjacentHTML('beforeend',` <a href="${escape(whatsappOrderHref(product.model,state.capacity))}" target="_blank" rel="noopener">${escape(WA_TEXT)}</a>`);};
 const clearProblem=()=>{panel.querySelectorAll('.variant-field.is-missing').forEach(f=>f.classList.remove('is-missing'));say('');};
 // Why can't this be bought? Highlight the option to change, or offer WhatsApp when nothing online is buyable.
 function explain(action){
  clearProblem();const v=current();
  if(!product.variants.some(purchasable)){say(`The ${product.model} can’t be paid for online right now. ${WA_TEXT}`);logIssue('buy_unavailable',{sku:product.slug,action});return;}
  const fields=[['capacity','Choose storage'],['condition','Choose condition'],['sim','Choose SIM'],['color','Choose colour']];
  const field=fields.find(([k])=>k!=='color'&&!(state[k]&&(k==='capacity'?capacities:k==='condition'?conditions:sims).includes(state[k]))&&(k!=='sim'||simChoice))||(v?null:['color','Choose colour']);
  const target=field?panel.querySelector(`[data-${field[0]}]`)?.closest('.variant-field'):panel.querySelector('.variant-field');
  target?.classList.add('is-missing');target?.scrollIntoView({behavior:'smooth',block:'center'});
  say(field?`Please ${field[1].toLowerCase().replace('choose ','choose a ').replace('a sim','a SIM option')}.`:'This option can’t be bought online yet — please choose another option. '+WA_TEXT);
  logIssue('buy_selection_incomplete',{sku:product.slug,action,capacity:state.capacity,condition:state.condition,color:state.color,sim:state.sim||''});
 }
 function render(){
  const v=current(),valid=purchasable(v);
  window.MikeeGadgetPlugTracking?.pushEvent('select_storage',{phone_model:product.model,product_name:product.model,storage:state.capacity,device_condition:state.condition,value:v?.price});
  for(const b of panel.querySelectorAll('[data-capacity]')){const selected=b.dataset.capacity===state.capacity;b.setAttribute('aria-pressed',String(selected));const x=resolveVariant(product.variants,pick(settled({...state,capacity:b.dataset.capacity},'capacity')));b.querySelector('small').textContent=x&&x.price>0?money(x.price):'Ask us';}
  for(const [key,field] of [['color','color'],['condition','condition'],['sim','sim']])for(const b of panel.querySelectorAll(`[data-${key}]`)){b.setAttribute('aria-pressed',String(b.dataset[key]===state[field]));const match=purchasable(resolveVariant(product.variants,pick({...state,[field]:b.dataset[key]})));b.classList.toggle('is-unavailable',!match);b.title=match?'':'Tap to switch to the available option';}
  // A choice with only one option is already selected: don't style it like something to tap.
  for(const g of panel.querySelectorAll('.selector-pills'))g.classList.toggle('is-only',g.querySelectorAll('button').length===1);
  panel.querySelector('[data-condition-label]').textContent=state.condition;
  panel.querySelector('[data-color-label]').textContent='Selected color: '+(state.color||'To confirm for the exact unit');
  panel.querySelector('[data-product-price]').textContent=v?(v.reviewRequired?'Not available yet':v.price>0?money(v.price):'Not available yet'):'Combination unavailable';
  panel.querySelector('[data-original-price]').textContent=v?.deal?money(v.originalPrice):'';
  panel.querySelector('[data-price-note]').textContent=valid?(v?.deal?DEAL_BADGE+' Hot Deal · 7-day warranty':'7-day warranty'):v?.stockStatus==='out_of_stock'?'This option is out of stock. Choose another option.':v?.reviewRequired?'This option is not available yet.':v?'Payment is unavailable until this variant has a verified price.':'Choose another combination; your storage has been kept.';
  panel.querySelector('[data-variant-label]').textContent=[product.model,state.capacity,state.color||v?.colourNote,state.condition,v?.connectivity?(v.simNote?`${v.connectivity} (${v.simNote})`:v.connectivity):'',v?.activation?(v.activation==='To be confirmed'?'Activation to be confirmed':v.activation):''].filter(Boolean).join(' · ');
  // Buy Now / Pay Small Small keep a working link at all times; a tap on an unbuyable selection is answered by
  // the click handler below (message + highlighted option) instead of doing nothing.
  document.querySelectorAll('[data-action="buy"],[data-action="easyBuy"]').forEach(a=>{a.removeAttribute('aria-disabled');a.classList.toggle('is-unbuyable',!valid);a.href=valid?checkoutHref(a.dataset.action,v):'#'+(a.dataset.action==='buy'?'buy':'pay-small-small');});
  panel.querySelector('[data-cart]').classList.toggle('is-unbuyable',!valid);
  {const stock=panel.querySelector('[data-stock]'),label=stockLabel(v);stock.hidden=!label;stock.textContent=label;stock.classList.toggle('is-out',v?.stockStatus==='out_of_stock');stock.classList.toggle('is-confirm',v?.stockStatus==='confirm');}
  for(const [key,value] of Object.entries({storage:state.capacity,color:state.color||'Confirm exact unit',condition:state.condition,connectivity:v?.connectivity||'Confirm the exact unit’s SIM and network support'})){const el=document.querySelector('[data-spec-'+key+']');if(el)el.textContent=value;}
  panel.querySelector('[data-product-description]').textContent=v?.description||'';
  {// Never present another colour's photo as the selected colour: say so when the photo is a generic one.
   const main=document.querySelector('[data-main-image]'),holder=main?.closest('.device-media')||main;let note=document.querySelector('[data-photo-note]');
   if(holder&&!note){note=document.createElement('p');note.className='mg-photo-note';note.dataset.photoNote='';holder.after(note);}
   const specific=!!v?.images?.some(p=>p.approved&&p.color&&p.color===state.color),many=colors.length>1;
   if(note){note.hidden=!(state.color&&many&&!specific);note.textContent=`Representative photo — the ${state.color} colour may look different.`;}}
  const image=photoFor(v,state.color);if(image){const img=document.querySelector('[data-main-image]');if(img){img.removeAttribute('srcset');img.src=image;img.alt=product.model;activateImages();}}
  const url=new URL(location.href);url.searchParams.set('storage',v?.storage||state.capacity);url.searchParams.set('color',state.color);url.searchParams.set('condition',state.condition);if(simChoice)url.searchParams.set('sim',state.sim);history.replaceState(null,'',url);
 }
 // Buy Now / Pay Small Small: instant feedback (spinner + disabled) on every tap, then checkout or a clear message.
 document.addEventListener('click',e=>{
  const a=e.target.closest('[data-action="buy"],[data-action="easyBuy"]');if(!a)return;e.preventDefault();
  if(a.classList.contains('is-loading'))return;
  try{
   const v=current();
   if(!purchasable(v)){explain(a.dataset.action);return;}
   const href=checkoutHref(a.dataset.action,v);
   document.querySelectorAll('[data-action="buy"],[data-action="easyBuy"]').forEach(x=>x.classList.remove('is-loading'));
   a.classList.add('is-loading');a.setAttribute('aria-busy','true');a.setAttribute('aria-disabled','true');
   if(a.dataset.action==='buy')window.mgTrack?.('buy_now_click',{currency:'NGN',value:v.price,items:[{item_id:product.slug+'|'+v.storage,item_name:product.model,price:v.price}]});
   // If the next page has not opened after 12 seconds, give the button back and say why.
   setTimeout(()=>{if(a.classList.contains('is-loading')&&document.visibilityState==='visible'){reset();say('This is taking longer than usual. Check your connection and tap again. '+WA_TEXT);logIssue('buy_navigation_slow',{sku:product.slug,action:a.dataset.action});}},12000);
   location.assign(href);
  }catch(err){reset();say('Something went wrong. '+WA_TEXT);logIssue('buy_click_error',{sku:product.slug,action:a.dataset.action,message:err?.message});}
 });
 const reset=()=>document.querySelectorAll('[data-action="buy"],[data-action="easyBuy"]').forEach(x=>{x.classList.remove('is-loading');x.removeAttribute('aria-busy');x.removeAttribute('aria-disabled');});
 // Coming back with the browser's Back button restores a page from memory: give the buttons back.
 window.addEventListener('pageshow',reset);
 // Tapping the product name takes visitors to the details and specs.
 const title=document.querySelector('.product-hero-copy h1'),details=document.getElementById('details');
 if(title&&details){title.classList.add('is-jump');title.addEventListener('click',()=>details.scrollIntoView({behavior:'smooth',block:'start'}));}
 panel.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;for(const field of ['capacity','color','condition','sim'])if(field in b.dataset){Object.assign(state,settled({...state,[field]:b.dataset[field]},field));clearProblem();render();}if(b.hasAttribute('data-cart')){const v=current();if(!purchasable(v)){explain('cart');return;}try{const sku=product.slug+'|'+v.storage,cartColor=colourIsPreference(v,state.color)?'':state.color;if(cartColor!==state.color)saveColourPref(localStorage,sku,state.color);const cart=addToCart(localStorage,{sku,color:cartColor,quantity:1});panel.querySelector('[data-selection-status]').textContent='Added to cart.';const img=document.querySelector('[data-main-image]');showAddedToCart({model:product.model,image:v.image||img?.currentSrc||img?.src||'',storage:[state.capacity,v.connectivity].filter(Boolean).join(' · '),color:state.color,condition:state.condition,quantity:cartLine(cart,sku,cartColor)?.quantity||1,price:v.price});}catch(e){logIssue('add_to_cart_failed',{sku:product.slug,message:e?.message});say('Unable to save your cart on this phone. '+WA_TEXT,true);}}});
 panel.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)||e.target.tagName!=='BUTTON')return;const buttons=[...e.target.parentElement.querySelectorAll('button')];let i=buttons.indexOf(e.target);i=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;e.preventDefault();buttons[i].focus();buttons[i].click();});
 build();
 if(await live)build();
}
