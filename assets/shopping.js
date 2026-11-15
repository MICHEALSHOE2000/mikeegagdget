import {readCart,saveCart,addToCart,cartLine} from '../commerce/cart.mjs';
import {showAddedToCart} from './cart-ui.mjs';
import {citiesByState} from '../commerce/nigeria.mjs';
import {escape,money,activateImages,optionLabel,stockLabel} from './storefront-ui.mjs';
const $=id=>document.getElementById(id),query=new URLSearchParams(location.search);
const data=await fetch('/api/shop/catalog').then(r=>{if(!r.ok)throw Error('Offline catalogue');return r.json().then(rows=>{if(!Array.isArray(rows)||!rows.length)throw Error('Catalogue setup pending');return rows;});}).catch(()=>fetch('/assets/shop-data.json').then(r=>{if(!r.ok)throw Error('Catalogue unavailable');return r.json();})).catch(()=>[]);
const find=sku=>data.find(v=>v.sku===sku);
let cart=readCart(localStorage);
const chosenColor=(v,color)=>v.colors.length===1?v.colors[0]:v.colors.includes(color)?color:'';
function add(sku,color='',go=false){const v=find(sku);if(!v)throw Error('Choose a valid product.');if(!(v.price>0)||v.enabled===false||v.reviewRequired)throw Error('This option is not available yet.');if(v.stockStatus==='out_of_stock')throw Error('This option is out of stock.');color=chosenColor(v,color);if(v.colors.length&&!color)throw Error('Please select a colour on the product page.');if(go){location.assign('/checkout/?'+new URLSearchParams({sku,color}));return;}const saved=addToCart(localStorage,{sku,color,quantity:1});cart=saved;render();showAddedToCart({model:v.model,image:v.image,storage:[v.capacity||v.storage,v.connectivity].filter(Boolean).join(' · '),color,condition:v.condition,quantity:cartLine(saved,sku,color)?.quantity||1,price:v.price});}
// ---- Cart and checkout rendering. A line is identified by its exact variant SKU plus colour. ----
const purchasableVariant=v=>!!v&&v.price>0&&v.enabled!==false&&!v.reviewRequired&&v.stockStatus!=='out_of_stock';
const lineDetails=(v,row)=>{const size=optionLabel(v?.capacity||v?.storage||'');return [size,row.color&&!size.includes(row.color)?row.color:null,v?.condition,v?.connectivity].filter(Boolean);};
const productHref=(v,row)=>v?.slug?'/'+v.slug+'/?'+new URLSearchParams({storage:v.storage||'',color:row.color||'',condition:v.condition||''}):'/search/';
function cartRows(editable){return cart.map((row,i)=>{const v=find(row.sku),ok=purchasableVariant(v);
 const media=v?.image?`<img src="${escape(v.image)}" alt="" width="80" height="96" loading="lazy" decoding="async">`:'<span class="mg-line-noimg" aria-hidden="true"></span>';
 const price=ok?(v.deal?`<del>${money(v.originalPrice)}</del> ${money(v.price)} <span class="mg-deal">-10%</span>`:money(v.price)):`<span class="mg-line-warn">${v?.stockStatus==='out_of_stock'?'Out of stock':'Price not available'} — this item can’t be paid for. Remove it or choose another option.</span>`;
 const controls=editable?`<div class="mg-line-controls"><div class="mg-qty" role="group" aria-label="Quantity for ${escape(v?.model||'item')}"><button type="button" data-dec="${i}" aria-label="Decrease quantity"${row.quantity<=1?' disabled':''}>−</button><output aria-live="polite">${row.quantity}</output><button type="button" data-inc="${i}" aria-label="Increase quantity"${row.quantity>=20?' disabled':''}>+</button></div><a class="mg-line-edit" href="${escape(productHref(v,row))}">Change options</a><button type="button" class="mg-line-remove" data-remove="${i}">Remove</button></div>`:`<p class="mg-line-qty">Qty ${row.quantity} × ${ok?money(v.price):'—'}</p>`;
 return `<article class="mg-line${ok?'':' is-unavailable'}"><a class="mg-line-media" href="${escape(productHref(v,row))}" tabindex="-1">${media}</a><div class="mg-line-body"><strong><a href="${escape(productHref(v,row))}">${escape(v?.model||'Product no longer available')}</a></strong><p class="mg-line-meta">${lineDetails(v,row).map(escape).join(' · ')}</p>${editable||!ok||v.deal?`<p class="mg-line-price">${price}</p>`:''}${controls}</div>${ok&&row.quantity>1?`<p class="mg-line-total" aria-label="Line total">${money(v.price*row.quantity)}</p>`:''}</article>`;}).join('');}
const total=()=>cart.reduce((sum,row)=>sum+(purchasableVariant(find(row.sku))?find(row.sku).price:0)*row.quantity,0);
const savings=()=>cart.reduce((sum,row)=>{const v=find(row.sku);return sum+(purchasableVariant(v)&&v.deal&&v.originalPrice>v.price?(v.originalPrice-v.price)*row.quantity:0);},0);
const itemCount=()=>cart.reduce((n,row)=>n+row.quantity,0);
const blocked=()=>cart.some(row=>!purchasableVariant(find(row.sku)));
function summaryRows(){const saved=savings();return `<dl class="mg-totals"><div><dt>Subtotal (${itemCount()} item${itemCount()===1?'':'s'})</dt><dd>${money(total()+saved)}</dd></div>${saved?`<div class="mg-save"><dt>Hot Deal savings</dt><dd>−${money(saved)}</dd></div>`:''}<div><dt>Delivery</dt><dd>Free</dd></div><div class="mg-grand"><dt>Total</dt><dd>${money(total())}</dd></div></dl>`;}
function render(){
 if($('cart-items')){
  if(!cart.length){$('cart-items').innerHTML='<div class="mg-empty"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2.2l2.3 11.2h11.1L21 7.5H6.2"/><circle cx="9.5" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/></svg><h2>Your cart is empty</h2><p>Find your next phone, laptop or accessory.</p><a class="btn btn-primary" href="/#products">Shop Products</a></div>';$('cart-summary').hidden=true;return;}
  $('cart-summary').hidden=false;$('cart-items').innerHTML=cartRows(true);
  $('cart-summary').innerHTML=`<h2>Order summary</h2>${summaryRows()}${blocked()?'<p class="mg-line-warn" role="alert">One item is unavailable. Remove it to continue to payment.</p>':''}<a class="btn btn-primary mg-wide" href="/checkout/"${blocked()?' aria-disabled="true" tabindex="-1"':''}>Proceed to Checkout →</a><a class="btn btn-outline mg-wide" href="/#products">← Continue Shopping</a><p class="mg-fine">Free nationwide delivery · 7-day warranty · Secure payment</p>`;
 }
 if($('checkout-items')){
  $('checkout-items').innerHTML=cart.length?cartRows(false):'<p>Your cart is empty. <a href="/#products">Shop products</a>.</p>';
  $('checkout-total').innerHTML=cart.length?summaryRows():'';
 }
}
if(query.has('sku')&&$('checkout-form')){
 // Buy Now puts the exact variant in the saved cart (without doubling it) and checks out the whole cart.
 try{const v=find(query.get('sku'));if(!v)throw Error('This variant is not in the catalogue.');const color=chosenColor(v,query.get('color'));if(v.colors.length&&!color)throw Error('Choose the colour on the product page before buying.');
 if(!purchasableVariant(v))throw Error('This option has no confirmed price yet, so it cannot be paid for. Choose another option.');
 if(!cartLine(cart,v.sku,color))cart=addToCart(localStorage,{sku:v.sku,color,quantity:1});
 }catch(e){$('checkout-error').textContent=e.message;}
 history.replaceState(null,'',location.pathname);
}
render();
$('cart-items')?.addEventListener('click',e=>{const b=e.target.closest('[data-remove],[data-inc],[data-dec]');if(!b)return;
 if(b.dataset.remove!==undefined)cart.splice(Number(b.dataset.remove),1);
 else{const row=cart[Number(b.dataset.inc??b.dataset.dec)];if(!row)return;row.quantity=Math.min(20,Math.max(1,row.quantity+(b.dataset.inc!==undefined?1:-1)));}
 cart=saveCart(localStorage,cart);render();
 const again=b.dataset.inc!==undefined?document.querySelector(`[data-inc="${b.dataset.inc}"]`):b.dataset.dec!==undefined?document.querySelector(`[data-dec="${b.dataset.dec}"]`):null;(again&&!again.disabled?again:document.querySelector('#cart-items button,#cart-summary a'))?.focus({preventScroll:true});});
$('cart-summary')?.addEventListener('click',e=>{if(e.target.closest('[aria-disabled="true"]'))e.preventDefault();});
addEventListener('mikee:cart',()=>{if($('cart-items')){cart=readCart(localStorage);render();}});

const form=$('checkout-form');
if(form){
 const delivery=()=>{const pickup=form.elements.fulfillment.value==='pickup';$('delivery-fields').hidden=pickup;for(const key of ['city','address'])form.elements[key].required=!pickup;};
 // Keep typed details for this visit so "Back to cart" never loses them. Consent is never pre-ticked.
 const DETAILS='mikee-checkout-details';
 try{const saved=JSON.parse(sessionStorage.getItem(DETAILS)||'{}');for(const [k,v]of Object.entries(saved)){const el=form.elements[k];if(el&&el.type!=='checkbox'&&typeof v==='string')el.value=v;}}catch{}
 form.addEventListener('input',()=>{try{const data=Object.fromEntries(new FormData(form));delete data.agreed;delete data.paymentMethod;sessionStorage.setItem(DETAILS,JSON.stringify(data));}catch{}});
 form.elements.fulfillment.addEventListener('change',delivery);delivery();
 form.elements.state.addEventListener('change',()=>{form.elements.city.value='';$('cities').replaceChildren(...(citiesByState[form.elements.state.value]||[]).map(city=>new Option(city)));});
 let requestId=crypto.randomUUID(),busy=false;
 const payLabel=()=>form.elements.paymentMethod?.value==='credit_direct'?'Continue with Pay Small Small':'Pay Securely with Paystack';
 // The instalment option appears only when the server reports Credit Direct as enabled and configured.
 fetch('/api/shop/settings').then(r=>r.ok?r.json():null).then(settings=>{if(!settings?.financing?.available||form.elements.paymentMethod)return;const box=document.createElement('fieldset');box.className='payment-methods';box.innerHTML='<legend>How would you like to pay?</legend><label><input type="radio" name="paymentMethod" value="paystack" checked> Buy outright — pay in full with Paystack</label><label><input type="radio" name="paymentMethod" value="credit_direct"> Pay Small Small — instalments with Credit Direct, subject to their approval</label>';const submit=form.querySelector('[type=submit]');submit.before(box);if(query.get('payment')==='credit_direct')box.querySelector('[value=credit_direct]').checked=true;submit.textContent=payLabel();box.addEventListener('change',()=>{submit.textContent=payLabel();});}).catch(()=>{});
 form.addEventListener('input',()=>{if(!busy)requestId=crypto.randomUUID();});
 form.addEventListener('submit',async e=>{e.preventDefault();if(busy)return;const button=form.querySelector('[type=submit]'),error=$('checkout-error');error.textContent='';
  if(!cart.length||cart.some(row=>!(find(row.sku)?.price>0)||find(row.sku)?.enabled===false||find(row.sku)?.reviewRequired)){error.textContent='An item needs an updated price before payment. Your selection remains saved.';return;}
  if(!form.reportValidity())return;
  const details=Object.fromEntries(new FormData(form));busy=true;button.disabled=true;button.textContent='Opening secure payment…';
  try{const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({details,cart,total:total()})));const fingerprint=[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');const key='mikee-checkout-'+fingerprint;requestId=sessionStorage.getItem(key)||requestId;sessionStorage.setItem(key,requestId);const r=await fetch('/api/shop/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...details,agreed:form.elements.agreed.checked,items:cart,requestId,expectedTotalNgn:total()})});const result=await r.json();if(!r.ok)throw Error(result.error||'Payment could not start.');try{sessionStorage.setItem('mikee-paying',JSON.stringify({items:cart}));}catch{}if(result.provider==='credit_direct'){const {openCreditDirect}=await import('./credit-direct-checkout.js');await openCreditDirect(result,text=>{error.textContent=text;});busy=false;button.disabled=false;button.textContent=payLabel();return;}const url=new URL(result.url,location.origin);if(!(url.hostname==='checkout.paystack.com'&&url.protocol==='https:')&&url.origin!==location.origin)throw Error('Invalid payment destination.');location.assign(url.href);}catch(e){error.textContent=e instanceof SyntaxError?'Checkout is not connected in this preview yet.':e.message;busy=false;button.disabled=false;button.textContent=payLabel();}
 });
}
if($('payment-status')){
 const reference=query.get('reference')||query.get('trxref')||'';$('order-reference').textContent=reference?'Order number: '+reference.slice(5,13).toUpperCase()+' · Reference '+reference:'';
 const titles={paid:'Thank you — your order is confirmed',failed:'Payment was not successful',cancelled:'Payment was cancelled',manual_review:'Your payment is being reviewed',pending:'Waiting for payment confirmation',financing_pending:'Pay Small Small not completed',awaiting_merchant_payment:'Payment received by Credit Direct'};
 const messages={paid:'We have received your payment. Our team will contact you to arrange delivery or pickup.',failed:'Your order has not been paid. Your cart is still saved — you can try again.',cancelled:'Your order has not been paid. Your cart is still saved — you can try again.',manual_review:'Please contact us with your order reference so we can confirm it.',pending:'If you completed payment, check again in a moment.',financing_pending:'If Credit Direct declined it or you closed the window, return to your cart and pay outright.',awaiting_merchant_payment:'Your order will be confirmed once Credit Direct settles the payment with us.'};
 const clearPaidCart=()=>{try{const paid=JSON.parse(sessionStorage.getItem('mikee-paying')||'null');if(!paid||!Array.isArray(paid.items))return;let saved=readCart(localStorage);for(const item of paid.items){const line=saved.find(r=>r.sku===item.sku&&r.color===item.color);if(line)line.quantity-=item.quantity;}saveCart(localStorage,saved.filter(r=>r.quantity>0));sessionStorage.removeItem('mikee-paying');}catch{}};
 const showSummary=s=>{if(!s)return;const items=s.items.map(i=>`<article class="mg-line"><span class="mg-line-media">${i.image?`<img src="${escape(i.image)}" alt="" width="80" height="96" loading="lazy">`:'<span class="mg-line-noimg" aria-hidden="true"></span>'}</span><div class="mg-line-body"><strong>${escape(i.model)}</strong><p class="mg-line-meta">${[i.storage,i.color,i.condition].filter(Boolean).map(escape).join(' · ')}</p><p class="mg-line-qty">Qty ${i.quantity} × ${money(i.unitPriceNgn)}</p></div><p class="mg-line-total">${money(i.unitPriceNgn*i.quantity)}</p></article>`).join('');
  const where=s.fulfillment==='pickup'?'Store pickup — 1 Ola Ayeni Street, Computer Village, Ikeja, Lagos. We will call you when it is ready.':`Free delivery to ${escape(s.destination||'your address')}. Same-day in Lagos where feasible; 24–48-hour target for other states, subject to dispatch and carrier confirmation.`;
  $('order-summary').innerHTML=`<section class="mg-summary"><h2>Your order</h2>${items}<dl class="mg-totals"><div><dt>Delivery</dt><dd>${s.deliveryFeeNgn?money(s.deliveryFeeNgn):'Free'}</dd></div><div class="mg-grand"><dt>Amount paid</dt><dd>${money(s.amountNgn)}</dd></div></dl></section><section class="mg-summary"><h2>${s.fulfillment==='pickup'?'Pickup':'Delivery'}</h2><p>${where}</p><h2>Contact</h2><p>${escape(s.customer.firstName)} · ${escape(s.customer.email)} · ${escape(s.customer.phone)}</p><h2>Order status</h2><p>Paid · ${escape((s.fulfillmentStatus||'processing').replaceAll('_',' '))}</p><p class="mg-fine">Every device includes a 7-day warranty under our <a href="/purchase-policy/">purchase policy</a>.</p></section>`;};
 const check=async()=>{const button=$('check-payment');button.disabled=true;$('confirm-icon').className='mg-confirm-icon';
  try{const r=await fetch('/api/shop/verify?reference='+encodeURIComponent(reference));const result=await r.json();if(!r.ok)throw Error(result.error);
   $('confirm-title').textContent=titles[result.status]||'Waiting for payment confirmation';$('payment-status').textContent=messages[result.status]||messages.pending;
   $('confirm-icon').classList.add(result.status==='paid'?'is-paid':['failed','cancelled'].includes(result.status)?'is-failed':'is-waiting');
   button.hidden=result.status==='paid';if(result.status==='paid'){clearPaidCart();showSummary(result.summary);}
  }catch{$('confirm-title').textContent='We could not check your payment yet';$('payment-status').textContent='Please check again, or contact us with your order reference.';$('confirm-icon').classList.add('is-waiting');}finally{button.disabled=false;}};
 $('check-payment').addEventListener('click',check);await check();
}
if($('gadget-variant')){if(query.has('sku')&&find(query.get('sku')))$('gadget-variant').value=query.get('sku');const update=()=>{const v=find($('gadget-variant').value);const ok=purchasableVariant(v);$('gadget-price').innerHTML=v?.price>0?(v.deal?'<del>'+money(v.originalPrice)+'</del> '+money(v.price)+' · -10%':money(v.price)):'Not available yet';const stock=$('gadget-stock');if(stock){const label=stockLabel(v);stock.textContent=label;stock.className=label?'mg-stock'+(v?.stockStatus==='out_of_stock'?' is-out':''):'';}for(const id of ['gadget-buy','gadget-cart'])$(id).disabled=!ok;};$('gadget-variant').addEventListener('change',update);update();for(const [id,go]of[['gadget-buy',true],['gadget-cart',false]])$(id).addEventListener('click',()=>{try{add($('gadget-variant').value,'',go);$('gadget-message').textContent='Added to cart.';}catch(e){$('gadget-message').textContent=e.message;}});}
activateImages();

// Pay Small Small: Credit Direct only. The instalment button is enabled once the server confirms Credit Direct is configured.
if($('financing-selection')){const sku=query.get('sku')||query.get('phone'),v=find(sku),color=query.get('color')||'';const ready=v&&v.price>0&&v.enabled!==false&&!v.reviewRequired;
 if(v)$('financing-selection').innerHTML=`<h2>${escape(v.model)}</h2><p>${escape(v.storage)} · ${escape(v.condition)}</p><p>${ready?money(v.price):'Price coming soon'}</p><p class="checkout-actions"><button type="button" class="btn btn-primary" data-credit-direct disabled>Continue to Credit Direct</button> ${ready?'<button type="button" class="btn" data-outright>Buy outright with Paystack</button>':''} <a href="/${escape(v.slug)}/?storage=${encodeURIComponent(v.storage)}">View device</a></p><p data-financing-message role="alert"></p>`;
 const say=t=>{const el=document.querySelector('[data-financing-message]');if(el)el.textContent=t;};
 document.querySelector('[data-outright]')?.addEventListener('click',()=>{try{add(v.sku||sku,color,true);}catch(e){say(e.message);}});
 fetch('/api/shop/settings').then(r=>r.ok?r.json():null).catch(()=>null).then(settings=>{const button=document.querySelector('[data-credit-direct]');if(!settings?.financing?.available)return;$('financing-status').textContent='Apply for instalments with Credit Direct. Credit Direct decides approval, down payment and repayments.';if(!button||!ready)return;button.disabled=false;button.addEventListener('click',()=>{try{add(v.sku||sku,color,false);location.assign('/checkout/?payment=credit_direct');}catch(e){say(e.message);}});});}
