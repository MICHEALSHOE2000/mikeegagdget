import {readCart,saveCart,addToCart,cartLine,saveColourPref,readColourPrefs,colourPrefNotes} from '../commerce/cart.mjs';
import {showAddedToCart} from './cart-ui.mjs';
import {lgasFor} from '../commerce/nigeria-states-lgas.mjs';
import {EMAIL,PHONE,PICKUP_WINDOW_DAYS,lagosToday,addDays} from '../commerce/checkout-validation.mjs';
import {rateTable,seedRows,quote} from '../commerce/delivery-rates.mjs';
import {BANK_ACCOUNTS,PAYMENT_WHATSAPP} from '../commerce/bank-details.mjs';
import {escape,money,activateImages,optionLabel,stockLabel} from './storefront-ui.mjs';
import {logIssue,whatsappOrderHref} from './client-log.mjs';
const $=id=>document.getElementById(id),query=new URLSearchParams(location.search);
// Taps that arrive before the catalogue has loaded are answered instead of ignored.
let shopReady=false;for(const id of ['gadget-buy','gadget-cart'])$(id)?.addEventListener('click',()=>{if(shopReady)return;const m=$('gadget-message');if(m)m.textContent='Loading the latest price… tap again in a moment.';});
const data=await fetch('/api/shop/catalog',typeof AbortSignal!=='undefined'&&AbortSignal.timeout?{signal:AbortSignal.timeout(8000)}:{}).then(r=>{if(!r.ok)throw Error('Offline catalogue');return r.json().then(rows=>{if(!Array.isArray(rows)||!rows.length)throw Error('Catalogue setup pending');return rows;});}).catch(()=>fetch('/assets/shop-data.json').then(r=>{if(!r.ok)throw Error('Catalogue unavailable');return r.json();})).catch(()=>[]);
shopReady=true;
const find=sku=>data.find(v=>v.sku===sku);
let cart=readCart(localStorage);
const chosenColor=(v,color)=>v.colors.length===1?v.colors[0]:v.colors.includes(color)?color:'';
function add(sku,color='',go=false){const v=find(sku);if(!v)throw Error('Choose a valid product.');if(!(v.price>0)||v.enabled===false||v.reviewRequired)throw Error('This option is not available yet.');if(v.stockStatus==='out_of_stock')throw Error('This option is out of stock.');const wanted=color;color=chosenColor(v,color);if(v.colors.length&&!color)throw Error('Please select a colour on the product page.');if(!v.colors.length)saveColourPref(localStorage,sku,wanted);window.mgTrack?.('add_to_cart',{currency:'NGN',value:v.price,items:[{item_id:sku,item_name:v.model,item_variant:v.storage,price:v.price,quantity:1}]});if(go){location.assign('/checkout/?'+new URLSearchParams({sku,color}));return;}const saved=addToCart(localStorage,{sku,color,quantity:1});cart=saved;render();showAddedToCart({model:v.model,image:v.image,storage:[v.capacity||v.storage,v.connectivity].filter(Boolean).join(' · '),color,condition:v.condition,quantity:cartLine(saved,sku,color)?.quantity||1,price:v.price});}
// ---- Cart and checkout rendering. A line is identified by its exact variant SKU plus colour. ----
const purchasableVariant=v=>!!v&&v.price>0&&v.enabled!==false&&!v.reviewRequired&&v.stockStatus!=='out_of_stock';
const lineDetails=(v,row)=>{const size=optionLabel(v?.capacity||v?.storage||'');return [size,row.color&&!size.includes(row.color)?row.color:(v?.colourNote&&!row.color?'Colour confirmed with you':null),v?.condition,v?.connectivity?(v.simNote?`${v.connectivity} (${v.simNote})`:v.connectivity):null,v?.activation&&v.activation!=='To be confirmed'?v.activation:null].filter(Boolean);};
const productHref=(v,row)=>v?.slug?'/'+v.slug+'/?'+new URLSearchParams({storage:v.storage||'',color:row.color||'',condition:v.condition||''}):'/search/';
function cartRows(editable){return cart.map((row,i)=>{const v=find(row.sku),ok=purchasableVariant(v);
 const media=v?.image?`<img src="${escape(v.image)}" alt="" width="80" height="96" loading="lazy" decoding="async">`:'<span class="mg-line-noimg" aria-hidden="true"></span>';
 const price=ok?(v.deal?`<del>${money(v.originalPrice)}</del> ${money(v.price)} <span class="mg-deal">-10%</span>`:money(v.price)):`<span class="mg-line-warn">${v?.stockStatus==='out_of_stock'?'Out of stock':'Price not available'} — this item can’t be paid for. Remove it or choose another option.</span>`;
 const controls=editable?`<div class="mg-line-controls"><div class="mg-qty" role="group" aria-label="Quantity for ${escape(v?.model||'item')}"><button type="button" data-dec="${i}" aria-label="Decrease quantity"${row.quantity<=1?' disabled':''}>−</button><output aria-live="polite">${row.quantity}</output><button type="button" data-inc="${i}" aria-label="Increase quantity"${row.quantity>=20?' disabled':''}>+</button></div><a class="mg-line-edit" href="${escape(productHref(v,row))}">Change options</a><button type="button" class="mg-line-remove" data-remove="${i}">Remove</button></div>`:`<p class="mg-line-qty">Qty ${row.quantity} × ${ok?money(v.price):'—'}</p>`;
 return `<article class="mg-line${ok?'':' is-unavailable'}"><a class="mg-line-media" href="${escape(productHref(v,row))}" tabindex="-1">${media}</a><div class="mg-line-body"><strong><a href="${escape(productHref(v,row))}">${escape(v?.model||'Product no longer available')}</a></strong><p class="mg-line-meta">${lineDetails(v,row).map(escape).join(' · ')}</p>${ok&&stockLabel(v)?`<p class="mg-line-stock">${escape(stockLabel(v))}</p>`:''}${editable||!ok||v.deal?`<p class="mg-line-price">${price}</p>`:''}${controls}</div>${ok&&row.quantity>1?`<p class="mg-line-total" aria-label="Line total">${money(v.price*row.quantity)}</p>`:''}</article>`;}).join('');}
const total=()=>cart.reduce((sum,row)=>sum+(purchasableVariant(find(row.sku))?find(row.sku).price:0)*row.quantity,0);
const savings=()=>cart.reduce((sum,row)=>{const v=find(row.sku);return sum+(purchasableVariant(v)&&v.deal&&v.originalPrice>v.price?(v.originalPrice-v.price)*row.quantity:0);},0);
const itemCount=()=>cart.reduce((n,row)=>n+row.quantity,0);
const blocked=()=>cart.some(row=>!purchasableVariant(find(row.sku)));
// Delivery line for the summary. On the cart page the fee is not known yet; checkout fills it in.
let deliveryLine=null;
function summaryRows(){const saved=savings(),d=deliveryLine,fee=d?.fee||0;
 const delivery=!d?'<div><dt>Delivery</dt><dd>Calculated at checkout</dd></div>':d.kind==='pending'?`<div><dt>Delivery</dt><dd>${escape(d.text)}</dd></div>`:d.kind==='free'?`<div><dt>${escape(d.label)}</dt><dd>FREE</dd></div>`:`<div><dt>${escape(d.label)}</dt><dd>${money(fee)}</dd></div>`;
 const grand=d?.reserve?`<div><dt>Amount payable online</dt><dd>${money(0)}</dd></div><div class="mg-grand"><dt>Amount due at pickup</dt><dd>${money(total())}</dd></div><p class="mg-fine mg-due-note">₦0 is what you pay online now. You pay ${money(total())} for your gadget at the store.</p>`:`<div class="mg-grand"><dt>Total</dt><dd>${money(total()+fee)}</dd></div>`;
 return `<dl class="mg-totals"><div><dt>Subtotal (${itemCount()} item${itemCount()===1?'':'s'})</dt><dd>${money(total()+saved)}</dd></div>${saved?`<div class="mg-save"><dt>Hot Deal savings</dt><dd>−${money(saved)}</dd></div>`:''}${delivery}${grand}</dl>`;}
function render(){
 if($('cart-items')){
  if(!cart.length){$('cart-items').innerHTML='<div class="mg-empty"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2.2l2.3 11.2h11.1L21 7.5H6.2"/><circle cx="9.5" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/></svg><h2>Your cart is empty</h2><p>Find your next phone, laptop or accessory.</p><a class="btn btn-primary" href="/#products">Shop Products</a></div>';$('cart-summary').hidden=true;return;}
  $('cart-summary').hidden=false;$('cart-items').innerHTML=cartRows(true);
  $('cart-summary').innerHTML=`<h2>Order summary</h2>${summaryRows()}${blocked()?'<p class="mg-line-warn" role="alert">One item is unavailable. Remove it to continue to payment.</p>':''}<a class="btn btn-primary mg-wide" href="/checkout/"${blocked()?' aria-disabled="true" tabindex="-1"':''}>Proceed to Checkout →</a><a class="btn btn-outline mg-wide" href="/#products">← Continue Shopping</a><p class="mg-fine">Free store pickup in Computer Village · 7-day warranty · Secure payment</p>`;
 }
 if($('checkout-items')){
  $('checkout-items').innerHTML=cart.length?cartRows(false):'<p>Your cart is empty. <a href="/#products">Shop products</a>.</p>';
  $('checkout-total').innerHTML=cart.length?summaryRows():'';
 }
}
if(query.has('sku')&&$('checkout-form')){
 // Buy Now puts the exact variant in the saved cart (without doubling it) and checks out the whole cart.
 try{const v=find(query.get('sku'));if(!v)throw Error('This variant is not in the catalogue.');const color=chosenColor(v,query.get('color'));if(!v.colors.length)saveColourPref(localStorage,v.sku,query.get('color')||'');if(v.colors.length&&!color)throw Error('Choose the colour on the product page before buying.');
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
 const el=form.elements,DOMAINS=['gmail.com','yahoo.com','outlook.com','icloud.com','hotmail.com'];
 // Colour wishes for phones sold "colour to confirm" go into the order notes so the team sees them.
 {const lines=colourPrefNotes(cart,readColourPrefs(localStorage),sku=>{const v=find(sku);return v?[v.model,v.capacity||v.storage].filter(Boolean).join(' '):sku;});if(lines.length&&el.notes&&!/Preferred colour/.test(el.notes.value))el.notes.value=[el.notes.value.trim(),...lines].filter(Boolean).join('\n').slice(0,1000);}
 // Email: suggest "@gmail.com" before an "@" is typed, then common domains; any other address can still be typed.
 const suggestBox=$('email-suggest');let suggestions=[];
 const suggest=v=>{v=v.trim();if(!v||/\s/.test(v))return [];const at=v.indexOf('@');if(at<0)return v.length>=3?[v+'@gmail.com']:[];const local=v.slice(0,at),dom=v.slice(at+1).toLowerCase();if(!local||dom.includes('@'))return [];return DOMAINS.filter(d=>d.startsWith(dom)&&d!==dom).map(d=>local+'@'+d);};
 const showSuggest=()=>{suggestions=suggest(el.email.value);suggestBox.hidden=!suggestions.length;suggestBox.innerHTML=suggestions.map((s,i)=>{const at=s.indexOf('@');return `<button type="button" class="mg-suggest-chip${i?'':' is-first'}" data-value="${escape(s)}">${escape(s.slice(0,at+1))}<strong>${escape(s.slice(at+1))}</strong></button>`;}).join('')+(suggestions.length?'<span class="mg-suggest-hint">Tap to use · Tab or → to accept</span>':'');};
 const accept=value=>{el.email.value=value;suggestBox.hidden=true;suggestions=[];el.email.dispatchEvent(new Event('input',{bubbles:true}));check('email');};
 el.email.addEventListener('input',showSuggest);
 el.email.addEventListener('keydown',e=>{if(!suggestions.length||e.shiftKey||e.altKey||e.ctrlKey||e.metaKey)return;const pos=el.email.selectionStart,atEnd=pos==null||pos===el.email.value.length;/* email inputs may report no caret position */if(e.key==='Tab'||(e.key==='ArrowRight'&&atEnd)){e.preventDefault();accept(suggestions[0]);}else if(e.key==='Escape'){suggestBox.hidden=true;suggestions=[];}});
 suggestBox.addEventListener('mousedown',e=>{if(e.target.closest('[data-value]'))e.preventDefault();});
 suggestBox.addEventListener('click',e=>{const b=e.target.closest('[data-value]');if(b){accept(b.dataset.value);el.email.focus();}});
 el.email.addEventListener('blur',()=>setTimeout(()=>{if(document.activeElement?.closest?.('#email-suggest'))return;suggestBox.hidden=true;},150));
 // Phone: digits only, at most 11.
 el.phone.addEventListener('input',()=>{const digits=el.phone.value.replace(/\D/g,'').slice(0,11);if(digits!==el.phone.value)el.phone.value=digits;});
 // State → LGA: the LGA list follows the chosen state and is cleared when the state changes.
 const fillLgas=(keep='')=>{const list=lgasFor(el.state.value);el.lga.replaceChildren(new Option(list.length?'Select LGA / city':'Select state first',''),...list.map(n=>new Option(n,n)));el.lga.disabled=!list.length;el.lga.value=list.includes(keep)?keep:'';};
 el.state.addEventListener('change',()=>{fillLgas();setError('lga','');updateDelivery();});el.lga.addEventListener('change',()=>updateDelivery());
 let busy=false;
 // How the order is received: Lagos home delivery, transport park pickup (other states) or free store pickup.
 let rates=rateTable(seedRows());
 const pickup=()=>el.receive.value==='pickup',reserving=()=>pickup()&&el.pickupChoice.value==='reserve';
 const method=()=>pickup()?'store_pickup':el.state.value==='Lagos'?'lagos_delivery':'interstate_park';
 const currentQuote=()=>method()==='store_pickup'?{fee:0,label:'Store pickup'}:el.state.value?quote(rates,method(),el.state.value,el.lga.value):null;
 const updateDelivery=()=>{const m=method(),q=currentQuote();
  $('delivery-fields').hidden=pickup();$('pickup-options').hidden=!pickup();$('reserve-fields').hidden=!reserving();$('payment-options').hidden=reserving();
  $('street-field').hidden=m!=='lagos_delivery';$('park-fields').hidden=m!=='interstate_park'||!el.state.value;
  $('location-legend').textContent=m==='interstate_park'?'Transport park pickup':'Delivery details';
  const box=$('delivery-quote');
  if(pickup())deliveryLine={kind:'free',label:'Store pickup',fee:0,reserve:reserving()};
  else if(!el.state.value){deliveryLine={kind:'pending',text:'Select your state'};box.textContent='';}
  else if(m==='lagos_delivery'&&!el.lga.value){deliveryLine={kind:'pending',text:'Select your LGA'};box.textContent='';}
  else if(m==='interstate_park'&&!rates.states[el.state.value]){deliveryLine={kind:'pending',text:'Not available yet'};box.textContent='Delivery to this state is not available online yet. Choose store pickup or chat with us on WhatsApp.';box.className='mg-delivery-quote is-warn';}
  else if(q){deliveryLine={kind:'fee',label:m==='lagos_delivery'?`Delivery: ${el.lga.value}`:`Transport park pickup: ${rates.states[el.state.value].label}`,fee:q.fee};box.textContent=(m==='lagos_delivery'?`Delivery to ${el.lga.value}: `:`Transport park pickup in ${rates.states[el.state.value].label}: `)+money(q.fee);box.className='mg-delivery-quote';}
  else{deliveryLine={kind:'pending',text:'Not available yet'};box.textContent='Delivery to this area is not available online yet. Choose store pickup or chat with us on WhatsApp.';box.className='mg-delivery-quote is-warn';}
  if(reserving()){const t=lagosToday();el.pickupDate.min=t;el.pickupDate.max=addDays(t,PICKUP_WINDOW_DAYS);}
  $('checkout-total').innerHTML=cart.length?summaryRows():'';syncButton();};
 // Friendly inline errors, shown on leaving a field and on Place Order.
 const rules={firstName:v=>v.trim()?'':'Enter your first name.',lastName:v=>v.trim()?'':'Enter your last name.',
  email:v=>!v.trim()?'Enter your email address.':EMAIL.test(v.trim().toLowerCase())?'':'Check your email — it should look like name@gmail.com.',
  phone:v=>!v?'Enter your phone number.':v.length!==11?'Phone number must be 11 digits, for example 08012345678.':PHONE.test(v)?'':'Phone number must start with 07, 08 or 09.',
  state:v=>pickup()||v?'':'Select your state.',lga:v=>pickup()||v?'':'Select your LGA.',address:v=>method()!=='lagos_delivery'||v.trim()?'':'Enter your street address for delivery.',
  town:v=>method()!=='interstate_park'||v.trim()?'':'Enter your destination city or town.',park:()=>'',
  pickupDate:v=>!reserving()?'':!v?'Choose your preferred pickup date.':v<lagosToday()||v>addDays(lagosToday(),PICKUP_WINDOW_DAYS)?`Choose a date between today and the next ${PICKUP_WINDOW_DAYS} days.`:'',
  agreed:()=>el.agreed.checked?'':'Please tick to agree to the terms before placing your order.'};
 const setError=(name,msg)=>{const out=$(name+'-error');if(out)out.textContent=msg;const input=el[name];if(input&&input.setAttribute)input.toggleAttribute('aria-invalid',!!msg);};
 const check=name=>{const msg=rules[name](el[name].value||'');setError(name,msg);return !msg;};
 for(const name of Object.keys(rules))el[name].addEventListener(name==='agreed'||name==='state'||name==='lga'?'change':'blur',()=>check(name));
 for(const name of ['email','phone','firstName','lastName','address'])el[name].addEventListener('input',()=>{if($(name+'-error')?.textContent)check(name);});
 // Keep typed details for this visit so "Back to cart" never loses them. Consent is never pre-ticked.
 const DETAILS='mikee-checkout-details';
 try{const saved=JSON.parse(sessionStorage.getItem(DETAILS)||'{}');for(const [k,v]of Object.entries(saved)){const f=el[k];if(f&&f.type!=='checkbox'&&f.type!=='radio'&&k!=='lga'&&typeof v==='string')f.value=v;}fillLgas(saved.lga);}catch{fillLgas();}
 form.addEventListener('input',()=>{try{const data=Object.fromEntries(new FormData(form));delete data.agreed;delete data.paymentMethod;sessionStorage.setItem(DETAILS,JSON.stringify(data));}catch{}});
 $('receive-options').addEventListener('change',()=>{for(const n of ['state','lga','address','town'])setError(n,'');updateDelivery();});$('pickup-options').addEventListener('change',()=>{setError('pickupDate','');updateDelivery();});
 // Payment method: bank transfer is selected by default; Pay Small Small only when Credit Direct is switched on.
 const notes={};
 const payMethod=()=>el.paymentMethod.value,syncNote=()=>{$('payment-note').textContent='';};
 const syncButton=()=>{const b=form.querySelector('[type=submit]');if(!busy)b.textContent=reserving()?'Reserve Now — Pay at Pickup':'Place Order';syncNote();};
 const cdOption=form.querySelector('[data-credit-direct-option]');
 const wanted=query.get('payment');if(wanted==='paystack')form.querySelector('[name=paymentMethod][value=paystack]').checked=true;
 fetch('/api/shop/settings').then(r=>r.ok?r.json():null).catch(()=>null).then(settings=>{rates=rateTable(settings?.deliveryRates||seedRows());updateDelivery();if(settings?.financing?.available){if(wanted==='credit_direct')cdOption.checked=true;}else{cdOption.disabled=true;cdOption.closest('.mg-pay-card').classList.add('is-unavailable');cdOption.closest('.mg-pay-card').querySelector('.mg-pay-desc').textContent='Currently unavailable. Choose bank transfer or Paystack.';if(cdOption.checked)form.querySelector('[name=paymentMethod][value=bank_transfer]').checked=true;}syncNote();});
 $('payment-options').addEventListener('change',syncNote);syncNote();updateDelivery();el.pickupDate.addEventListener('change',()=>check('pickupDate'));
 let requestId=crypto.randomUUID();
 form.addEventListener('input',()=>{if(!busy)requestId=crypto.randomUUID();});
 form.addEventListener('submit',async e=>{e.preventDefault();if(busy)return;const button=form.querySelector('[type=submit]'),error=$('checkout-error');error.textContent='';
  if(!cart.length||cart.some(row=>!(find(row.sku)?.price>0)||find(row.sku)?.enabled===false||find(row.sku)?.reviewRequired)){error.textContent='An item needs an updated price before payment. Your selection remains saved.';return;}
  const bad=Object.keys(rules).filter(name=>!check(name));
  if(bad.length){error.textContent='Please check the highlighted details.';const first=el[bad[0]];first.focus();first.scrollIntoView?.({block:'center',behavior:'smooth'});return;}
  if(!pickup()&&!currentQuote()){error.textContent='Delivery to the selected area is not available online yet. Choose store pickup or chat with us on WhatsApp.';return;}
  const details=Object.fromEntries(new FormData(form));details.email=details.email.trim().toLowerCase();details.deliveryMethod=method();details.fulfillment=pickup()?'pickup':'delivery';if(reserving())details.paymentMethod='pay_at_pickup';delete details.receive;delete details.pickupChoice;
  const expected=total()+(pickup()?0:currentQuote().fee);busy=true;button.disabled=true;button.textContent=reserving()?'Sending reservation…':'Placing order…';
  const done=()=>{busy=false;button.disabled=false;syncButton();};
  try{const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({details,cart,total:expected})));const fingerprint=[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');const key='mikee-checkout-'+fingerprint;requestId=sessionStorage.getItem(key)||requestId;sessionStorage.setItem(key,requestId);
   const r=await fetch('/api/shop/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...details,agreed:el.agreed.checked,items:cart,requestId,expectedTotalNgn:expected})});const result=await r.json();if(!r.ok)throw Error(result.error||'Your order could not be placed.');
   try{sessionStorage.setItem('mikee-paying',JSON.stringify({items:cart}));}catch{}
    window.mgTrack?.('add_payment_info',{currency:'NGN',value:expected,payment_type:result.provider||'paystack'});
   if(result.provider==='reservation'){location.assign(new URL(result.url,location.origin).href);return;}
   if(result.provider==='credit_direct'){const {openCreditDirect}=await import('./credit-direct-checkout.js');await openCreditDirect(result,text=>{error.textContent=text;});done();return;}
   const url=new URL(result.url,location.origin);if(!(url.hostname==='checkout.paystack.com'&&url.protocol==='https:')&&url.origin!==location.origin)throw Error('Invalid payment destination.');location.assign(url.href);
  }catch(e){error.textContent=e instanceof SyntaxError?'Checkout is not connected in this preview yet.':e.message;error.insertAdjacentHTML('beforeend',` <a href="${whatsappOrderHref('items in my cart')}" target="_blank" rel="noopener">Order on WhatsApp instead</a>`);logIssue('checkout_submit_failed',{payment:el.paymentMethod?.value,skus:cart.map(i=>i.sku).join(', '),message:e.message});done();}
 });
}
if($('payment-status')){
 const reference=query.get('reference')||query.get('trxref')||'';$('order-reference').textContent=reference?'Order number: '+reference.slice(5,13).toUpperCase()+' · Reference '+reference:'';
 const titles={reserved:'Reservation Request Received!',pending_payment:'Order placed — please complete your bank transfer',paid:'Thank you — your order is confirmed',failed:'Payment was not successful',cancelled:'Payment was cancelled',manual_review:'Your payment is being reviewed',pending:'Waiting for payment confirmation',financing_pending:'Pay Small Small not completed',awaiting_merchant_payment:'Payment received by Credit Direct'};
 const messages={reserved:'Nothing has been charged. We will check availability and confirm your reservation shortly.',pending_payment:'Your order is saved. We ship it as soon as your transfer reflects in our account.',paid:'We have received your payment. Our team will contact you to arrange delivery or pickup.',failed:'Your order has not been paid. Your cart is still saved — you can try again.',cancelled:'Your order has not been paid. Your cart is still saved — you can try again.',manual_review:'Please contact us with your order reference so we can confirm it.',pending:'If you completed payment, check again in a moment.',financing_pending:'If Credit Direct declined it or you closed the window, return to your cart and pay outright.',awaiting_merchant_payment:'Your order will be confirmed once Credit Direct settles the payment with us.'};
 const clearPaidCart=()=>{try{const paid=JSON.parse(sessionStorage.getItem('mikee-paying')||'null');if(!paid||!Array.isArray(paid.items))return;let saved=readCart(localStorage);for(const item of paid.items){const line=saved.find(r=>r.sku===item.sku&&r.color===item.color);if(line)line.quantity-=item.quantity;}saveCart(localStorage,saved.filter(r=>r.quantity>0));sessionStorage.removeItem('mikee-paying');}catch{}};
 const showSummary=s=>{if(!s)return;const items=s.items.map(i=>`<article class="mg-line"><span class="mg-line-media">${i.image?`<img src="${escape(i.image)}" alt="" width="80" height="96" loading="lazy">`:'<span class="mg-line-noimg" aria-hidden="true"></span>'}</span><div class="mg-line-body"><strong>${escape(i.model)}</strong><p class="mg-line-meta">${[i.storage,i.color,i.condition].filter(Boolean).map(escape).join(' · ')}</p><p class="mg-line-qty">Qty ${i.quantity} × ${money(i.unitPriceNgn)}</p></div><p class="mg-line-total">${money(i.unitPriceNgn*i.quantity)}</p></article>`).join('');
  const where=s.fulfillment==='pickup'?'Paid — awaiting pickup at 1 Ola Ayeni Street, Computer Village, Ikeja, Lagos.':s.deliveryMethod==='interstate_park'?`Transport park pickup: ${escape(s.destination||'your state')}. We will contact you with collection details when your order is ready.`:`Delivery to ${escape(s.destination||'your address')}. We will contact you to arrange delivery.`;
  $('order-summary').innerHTML=`<section class="mg-summary"><h2>Your order</h2>${items}<dl class="mg-totals"><div><dt>${s.fulfillment==='pickup'?'Store pickup':'Delivery'}</dt><dd>${s.deliveryFeeNgn?money(s.deliveryFeeNgn):'FREE'}</dd></div><div class="mg-grand"><dt>Amount paid</dt><dd>${money(s.amountNgn)}</dd></div></dl></section><section class="mg-summary"><h2>${s.fulfillment==='pickup'?'Pickup':'Delivery'}</h2><p>${where}</p><h2>Contact</h2><p>${escape(s.customer.firstName)} · ${escape(s.customer.email)} · ${escape(s.customer.phone)}</p><h2>Order status</h2><p>Paid · ${escape((s.fulfillmentStatus||'processing').replaceAll('_',' '))}</p><p class="mg-fine">Every device includes a 7-day warranty under our <a href="/purchase-policy/">purchase policy</a>.</p></section>`;};
 // Bank transfer: order number, amount, our accounts with Copy buttons, and a WhatsApp confirmation message.
 const orderNo=reference.slice(5,13).toUpperCase();
 const showBank=amount=>{const box=$('bank-transfer');if(!box.hidden)return;const text=`Hello Mikee Gadget Plug, I have sent ${money(amount)} by bank transfer for order ${orderNo} (reference ${reference}). Please confirm my payment.`;
  box.innerHTML=`<h2>Pay by bank transfer</h2><ol class="mg-bank-steps"><li>Copy one of the account numbers below.</li><li>Transfer the exact amount from your bank app.</li><li>Tap <strong>I've sent the money</strong>.</li></ol><dl class="mg-bank-totals"><div><dt>Order number</dt><dd>${escape(orderNo)}</dd></div><div><dt>Amount to pay</dt><dd>${money(amount)}</dd></div></dl>`
   +BANK_ACCOUNTS.map(a=>`<div class="mg-bank-account"><p class="mg-bank-name">${escape(a.bank)}</p><p class="mg-bank-holder">${escape(a.accountName)}</p><p class="mg-bank-number"><span>${escape(a.accountNumber)}</span><button type="button" class="mg-copy" data-copy="${escape(a.accountNumber)}" aria-label="Copy ${escape(a.bank)} account number">Copy</button></p></div>`).join('')
   +`<p class="mg-fine">Please use <strong>${escape(orderNo)}</strong> as the transfer description. Your order will not be shipped until the funds reflect in our account.</p><a class="btn btn-primary mg-sent-money" href="https://wa.me/${PAYMENT_WHATSAPP}?text=${encodeURIComponent(text)}" rel="noopener">I've sent the money</a><p class="mg-fine mg-sent-note">After you transfer, tap the button. It opens WhatsApp with your order details so we can confirm your payment.</p>`;
  box.hidden=false;
  box.addEventListener('click',async e=>{const b=e.target.closest('[data-copy]');if(!b)return;let ok=false;try{await navigator.clipboard.writeText(b.dataset.copy);ok=true;}catch{const t=document.createElement('textarea');t.value=b.dataset.copy;t.setAttribute('readonly','');t.style.position='fixed';t.style.opacity='0';document.body.append(t);t.select();try{ok=document.execCommand('copy');}catch{}t.remove();}b.textContent=ok?'Copied ✓':'Copy failed';setTimeout(()=>{b.textContent='Copy';},2000);});};
 // Reserve Now, Pay at Pickup: reference, amounts, pickup date, then straight to WhatsApp to chat with the store.
 const showReservation=r=>{const box=$('bank-transfer');if(!box.hidden)return;const date=r.pickupDate?new Date(r.pickupDate+'T12:00:00+01:00').toLocaleDateString('en-NG',{weekday:'long',day:'numeric',month:'long'}):'';
  const text=`Hello Mikee Gadget Plug, I just reserved an item. Reservation reference: ${r.reservationRef}. Preferred pickup date: ${date}. Amount due at pickup: ${money(r.amountDueNgn)}.`;const wa=`https://wa.me/${PAYMENT_WHATSAPP}?text=${encodeURIComponent(text)}`;
  box.innerHTML=`<h2>Your reservation</h2><dl class="mg-bank-totals mg-res-totals"><div><dt>Reservation reference</dt><dd>${escape(r.reservationRef||'')}</dd></div><div><dt>Preferred pickup date</dt><dd>${escape(date)}</dd></div><div><dt>Amount payable online</dt><dd>${money(0)}</dd></div><div><dt>Amount due at pickup</dt><dd>${money(r.amountDueNgn)}</dd></div></dl>`
   +`<p class="mg-fine">Pickup: 1 Ola Ayeni Street, Off Simbiat Abiola Way, Computer Village, Ikeja, Lagos.</p><a class="btn btn-primary mg-sent-money" id="reserve-whatsapp" href="${wa}" rel="noopener">Chat with us on WhatsApp</a><p class="mg-fine mg-sent-note" id="reserve-redirect">Opening WhatsApp in <span>5</span> seconds…</p>`;
  box.hidden=false;
  // Only straight after reserving (not when the page is reopened later) do we move on to WhatsApp automatically.
  let fresh=false;try{fresh=sessionStorage.getItem('mikee-reserved')!==reference;sessionStorage.setItem('mikee-reserved',reference);}catch{}
  if(!fresh){$('reserve-redirect').hidden=true;return;}
  let n=5;const tick=setInterval(()=>{n-=1;const span=document.querySelector('#reserve-redirect span');if(span)span.textContent=String(n);if(n<=0){clearInterval(tick);$('reserve-redirect').textContent='Opening WhatsApp…';location.assign(wa);}},1000);};
 const check=async()=>{const button=$('check-payment');button.disabled=true;$('confirm-icon').className='mg-confirm-icon';
  try{const r=await fetch('/api/shop/verify?reference='+encodeURIComponent(reference));const result=await r.json();if(!r.ok)throw Error(result.error);
   $('confirm-title').textContent=titles[result.status]||'Waiting for payment confirmation';$('payment-status').textContent=messages[result.status]||messages.pending;
   $('confirm-icon').classList.add(result.status==='reserved'?'is-reserved':result.status==='paid'?'is-paid':['failed','cancelled'].includes(result.status)?'is-failed':'is-waiting');
   button.hidden=result.status==='paid';if(result.status==='paid'){$('bank-transfer').hidden=true;clearPaidCart();showSummary(result.summary);const s=result.summary;window.mgTrack?.('purchase',{transaction_id:reference,currency:'NGN',value:s?.amountNgn,shipping:s?.deliveryFeeNgn||0,items:(s?.items||[]).map(i=>({item_id:i.sku||i.model,item_name:i.model,item_variant:i.storage,price:i.unitPriceNgn,quantity:i.quantity}))});}
   if(result.status==='reserved'){clearPaidCart();showReservation(result);button.hidden=true;$('order-reference').textContent='';}
   if(result.status==='pending_payment'&&result.paymentMethod==='bank_transfer'){clearPaidCart();showBank(result.amountNgn);button.textContent='Check payment status';}
  }catch{$('confirm-title').textContent='We could not check your payment yet';$('payment-status').textContent='Please check again, or contact us with your order reference.';$('confirm-icon').classList.add('is-waiting');}finally{button.disabled=false;}};
 $('check-payment').addEventListener('click',check);await check();
}
if($('gadget-variant')){if(query.has('sku')&&find(query.get('sku')))$('gadget-variant').value=query.get('sku');const update=()=>{const v=find($('gadget-variant').value);const ok=purchasableVariant(v);$('gadget-price').innerHTML=v?.price>0?(v.deal?'<del>'+money(v.originalPrice)+'</del> '+money(v.price)+' · -10%':v.compareAtPrice>v.price?'<del><span class="sr-only">Was </span>'+money(v.compareAtPrice)+'</del> '+money(v.price)+' <span class="save-badge">Save '+money(v.compareAtPrice-v.price)+'</span>':money(v.price)):'Not available yet';const stock=$('gadget-stock');if(stock){const label=stockLabel(v);stock.textContent=label;stock.className=label?'mg-stock'+(v?.stockStatus==='out_of_stock'?' is-out':''):'';}for(const id of ['gadget-buy','gadget-cart']){$(id).disabled=false;$(id).classList.toggle('is-unbuyable',!ok);}};$('gadget-variant').addEventListener('change',update);update();for(const [id,go]of[['gadget-buy',true],['gadget-cart',false]])$(id).addEventListener('click',()=>{const b=$(id);if(b.classList.contains('is-loading'))return;if(go){b.classList.add('is-loading');b.setAttribute('aria-busy','true');}$('gadget-message').textContent='';try{add($('gadget-variant').value,'',go);if(!go)$('gadget-message').textContent='Added to cart.';else setTimeout(()=>{b.classList.remove('is-loading');b.removeAttribute('aria-busy');},12000);}catch(e){b.classList.remove('is-loading');b.removeAttribute('aria-busy');const v=find($('gadget-variant').value);$('gadget-message').innerHTML=escape(e.message)+` <a href="${escape(whatsappOrderHref(v?.model||document.querySelector('h1')?.textContent||'device',v?.storage||''))}" target="_blank" rel="noopener">Tap here to order on WhatsApp.</a>`;logIssue('gadget_buy_failed',{sku:$('gadget-variant').value,action:go?'buy':'cart',message:e.message});}});addEventListener('pageshow',()=>{$('gadget-buy').classList.remove('is-loading');$('gadget-buy').removeAttribute('aria-busy');});}
activateImages();

// Pay Small Small: Credit Direct only. The instalment button is enabled once the server confirms Credit Direct is configured.
if($('financing-selection')){const sku=query.get('sku')||query.get('phone'),v=find(sku),color=query.get('color')||'';const ready=purchasableVariant(v);
 const waLink=`<a href="${escape(whatsappOrderHref(v?.model||'device',[v?.storage,color].filter(Boolean).join(' · ')+' with Pay Small Small'))}" target="_blank" rel="noopener">Tap here to order on WhatsApp.</a>`;
 if(!v){$('financing-selection').innerHTML=`<p data-financing-message role="alert">Choose a device first: open it in the shop and tap “Pay Small Small”. ${waLink}</p>`;if(sku)logIssue('financing_unknown_sku',{sku});}
 else $('financing-selection').innerHTML=`<h2>${escape(v.model)}</h2><p>${escape(v.storage)} · ${escape(v.condition)}${color?' · '+escape(color):''}</p><p>${ready?money(v.price):'Price coming soon'}</p><p class="checkout-actions"><button type="button" class="btn btn-primary" data-credit-direct>Continue to Credit Direct</button> ${ready?'<button type="button" class="btn" data-outright>Buy outright with Paystack</button>':''} <a href="/${escape(v.slug)}/?storage=${encodeURIComponent(v.storage)}">View device</a></p><p data-financing-message role="alert"></p>`;
 const say=html=>{const el=document.querySelector('[data-financing-message]');if(el)el.innerHTML=html;};
 const busy=(b,on)=>{if(!b)return;b.classList.toggle('is-loading',on);b.setAttribute('aria-busy',String(on));b.disabled=on;};
 document.querySelector('[data-outright]')?.addEventListener('click',e=>{busy(e.currentTarget,true);try{add(v.sku||sku,color,true);}catch(err){busy(e.currentTarget,false);say(escape(err.message)+' '+waLink);logIssue('financing_outright_failed',{sku,message:err.message});}});
 const settings=fetch('/api/shop/settings').then(r=>r.ok?r.json():null).catch(()=>null);
 settings.then(st=>{if(st?.financing?.available)$('financing-status').textContent='Apply for instalments with Credit Direct. Credit Direct decides approval, down payment and repayments.';});
 // The button always answers: it waits for the Credit Direct check, then continues or says why it can't.
 document.querySelector('[data-credit-direct]')?.addEventListener('click',async e=>{const button=e.currentTarget;if(button.classList.contains('is-loading'))return;busy(button,true);say('');
  const st=await settings;
  if(!st?.financing?.available){busy(button,false);say(`Pay Small Small is not available online right now.${ready?' You can buy outright with Paystack, or':''} ${waLink}`);logIssue('financing_unavailable',{sku});return;}
  if(!ready){busy(button,false);say(`This option can’t be paid for online yet. ${waLink}`);logIssue('financing_not_purchasable',{sku});return;}
  try{add(v.sku||sku,color,false);location.assign('/checkout/?payment=credit_direct');setTimeout(()=>busy(button,false),12000);}catch(err){busy(button,false);say(escape(err.message)+' '+waLink);logIssue('financing_add_failed',{sku,message:err.message});}});
}
