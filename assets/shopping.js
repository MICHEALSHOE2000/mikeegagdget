import {readCart,saveCart,addToCart} from '../commerce/cart.mjs';
import {citiesByState} from '../commerce/nigeria.mjs';
import {escape,money,activateImages} from './storefront-ui.mjs';
const $=id=>document.getElementById(id),query=new URLSearchParams(location.search);
const data=await fetch('/api/shop/catalog').then(r=>{if(!r.ok)throw Error('Offline catalogue');return r.json().then(rows=>{if(!Array.isArray(rows)||!rows.length)throw Error('Catalogue setup pending');return rows;});}).catch(()=>fetch('/assets/shop-data.json').then(r=>{if(!r.ok)throw Error('Catalogue unavailable');return r.json();})).catch(()=>[]);
const find=sku=>data.find(v=>v.sku===sku);
let cart=readCart(localStorage);
const chosenColor=(v,color)=>v.colors.length===1?v.colors[0]:v.colors.includes(color)?color:'';
function add(sku,color='',go=false){const v=find(sku);if(!v)throw Error('Choose a valid product.');color=chosenColor(v,color);if(v.colors.length&&!color)throw Error('Please select a colour on the product page.');addToCart(localStorage,{sku,color,quantity:1});if(go)location.assign('/checkout/');}
function cartRows(editable){return cart.map((row,i)=>{const v=find(row.sku);return `<div class="cart-line"><div>${v?.image?`<img src="${escape(v.image)}" alt="${escape(v.model)}">`:""}<strong>${escape(v?.model||'Product unavailable')}</strong><p>${escape([v?.storage,v?.condition,v?.storage?.includes(row.color)?null:row.color,v?.connectivity].filter(Boolean).join(' · '))}</p><p>${v?.price>0?money(v.price):'Price being updated — payment is not available for this variant yet.'}</p></div>${editable?`<label>Qty<input data-quantity="${i}" aria-label="Quantity for ${escape(v?.model)}" type="number" min="1" max="20" step="1" value="${row.quantity}"></label><button type="button" class="btn btn-outline" data-remove="${i}">Remove</button>`:`<span>× ${row.quantity}</span>`}</div>`;}).join('')||'<p>Your cart is empty. <a href="/search/">Find a device</a>.</p>';}
const total=()=>cart.reduce((sum,row)=>sum+(find(row.sku)?.price||0)*row.quantity,0);
function render(){if($('cart-items')){$('cart-items').innerHTML=cartRows(true);$('cart-total').textContent='Subtotal: '+money(total())+' · Delivery: Free';}if($('checkout-items')){$('checkout-items').innerHTML=cartRows(false);$('checkout-total').textContent='Subtotal: '+money(total())+' · Delivery: ₦0 · Total: '+money(total());}}
if(query.has('sku')&&$('checkout-form')){
 try{const v=find(query.get('sku'));if(!v)throw Error('This variant is not in the catalogue.');const color=chosenColor(v,query.get('color'));if(v.colors.length&&!color)throw Error('Choose the colour on the product page before buying.');
 // Buy Now is a dedicated one-item checkout; keep the saved cart unchanged.
 cart=[{sku:v.sku,color,quantity:1}];
 }catch(e){cart=[];$('checkout-error').textContent=e.message;}
}
render();
$('cart-items')?.addEventListener('click',e=>{const button=e.target.closest('[data-remove]');if(button){cart.splice(Number(button.dataset.remove),1);cart=saveCart(localStorage,cart);render();}});
const updateQuantity=e=>{if(e.target.matches('[data-quantity]')){const n=Number(e.target.value);if(!Number.isInteger(n)||n<1||n>20){if(e.type==='change')render();return;}cart[Number(e.target.dataset.quantity)].quantity=n;cart=saveCart(localStorage,cart);if(e.type==='change')render();else $('cart-total').textContent='Subtotal: '+money(total())+' · Delivery: Free';}};
$('cart-items')?.addEventListener('input',updateQuantity);
$('cart-items')?.addEventListener('change',updateQuantity);
const form=$('checkout-form');
if(form){
 const delivery=()=>{const pickup=form.elements.fulfillment.value==='pickup';$('delivery-fields').hidden=pickup;for(const key of ['city','address'])form.elements[key].required=!pickup;};
 form.elements.fulfillment.addEventListener('change',delivery);delivery();
 form.elements.state.addEventListener('change',()=>{form.elements.city.value='';$('cities').replaceChildren(...(citiesByState[form.elements.state.value]||[]).map(city=>new Option(city)));});
 let requestId=crypto.randomUUID(),busy=false;
 form.addEventListener('input',()=>{if(!busy)requestId=crypto.randomUUID();});
 form.addEventListener('submit',async e=>{e.preventDefault();if(busy)return;const button=form.querySelector('[type=submit]'),error=$('checkout-error');error.textContent='';
  if(!cart.length||cart.some(row=>!(find(row.sku)?.price>0))){error.textContent='An item needs an updated price before payment. Your selection remains saved.';return;}
  if(!form.reportValidity())return;
  const details=Object.fromEntries(new FormData(form));busy=true;button.disabled=true;button.textContent='Opening secure payment…';
  try{const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({details,cart})));const fingerprint=[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');const key='mikee-checkout-'+fingerprint;requestId=sessionStorage.getItem(key)||requestId;sessionStorage.setItem(key,requestId);const r=await fetch('/api/shop/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...details,agreed:form.elements.agreed.checked,items:cart,requestId,expectedTotalNgn:total()})});const result=await r.json();if(!r.ok)throw Error(result.error||'Payment could not start.');const url=new URL(result.url,location.origin);if(!(url.hostname==='checkout.paystack.com'&&url.protocol==='https:')&&url.origin!==location.origin)throw Error('Invalid payment destination.');location.assign(url.href);}catch(e){error.textContent=e instanceof SyntaxError?'Checkout is not connected in this preview yet.':e.message;busy=false;button.disabled=false;button.textContent='Pay Securely with Paystack';}
 });
}
if($('payment-status')){
 const reference=query.get('reference')||query.get('trxref')||'';$('order-reference').textContent=reference?'Order reference: '+reference:'';
 const check=async()=>{const button=$('check-payment');button.disabled=true;try{const r=await fetch('/api/shop/verify?reference='+encodeURIComponent(reference));const result=await r.json();if(!r.ok)throw Error(result.error);$('payment-status').textContent=({paid:'Payment confirmed. Thank you! Your order is confirmed.',failed:'Payment failed. You can return to your cart to try again.',cancelled:'Payment was cancelled. Your cart is still available.',manual_review:'Your payment needs review. Please contact us with your order reference.',pending:'Payment is not confirmed yet. If you have paid, check again shortly.'})[result.status]||'Payment is not confirmed yet.';}catch{$('payment-status').textContent='We could not verify payment yet. Please check again or contact us with your order reference.';}finally{button.disabled=false;}};$('check-payment').addEventListener('click',check);await check();
}
if($('gadget-variant')){const update=()=>{const v=find($('gadget-variant').value);$('gadget-price').textContent=v?.price>0?money(v.price):'Price being updated';};$('gadget-variant').addEventListener('change',update);update();for(const [id,go]of[['gadget-buy',true],['gadget-cart',false]])$(id).addEventListener('click',()=>{try{add($('gadget-variant').value,'',go);$('gadget-message').textContent='Added to cart.';}catch(e){$('gadget-message').textContent=e.message;}});}
activateImages();

if($('financing-selection')){const v=find(query.get('sku')||query.get('phone'));if(v)$('financing-selection').innerHTML=`<h2>${escape(v.model)}</h2><p>${escape(v.storage)} · ${escape(v.condition)}</p><p>${v.price>0?money(v.price):'Price being updated'}</p><a class="btn btn-primary" href="/${escape(v.slug)}/?storage=${encodeURIComponent(v.storage)}">View selected device</a>`;}
