import {mountDeals} from './admin-deals.mjs';
import {mountHome} from './admin-home.mjs';
import {stockFields,photoFields,readExtras,addPhoto,bindPhotoControls,mountExtras} from './admin-extras.mjs';
import {mountSmartImages} from './admin-images.mjs';
import {escape,money} from './storefront-ui.mjs';
const $=id=>document.getElementById(id);
// Keep the short-lived access token in memory only. Never log or render it.
const callback=new URLSearchParams(location.hash.slice(1)),callbackQuery=new URLSearchParams(location.search);
let token=callback.get('access_token')||'';
// Supabase reports expired or reused magic links in the hash (implicit flow) or the query string.
const linkError=[callback.get('error_code'),callback.get('error'),callback.get('error_description'),callbackQuery.get('error_code'),callbackQuery.get('error')].filter(Boolean).join(' ');
if(location.hash||location.search)history.replaceState(null,'',location.pathname);
let inventory=[],orders=[];
// Friendly pop-up message at the bottom of the screen.
let toastTimer;
const message=(value,kind='')=>{const t=$('admin-message');t.textContent=value;t.className='adm-toast is-shown'+(kind?' is-'+kind:'');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('is-shown'),7000);};
if(linkError)message(/otp_expired|expired|access_denied|invalid|not found/i.test(linkError)?'This sign-in link has expired or was already used. Enter your email below to get a new link, then open only the newest email.':'Sign-in could not be completed. Request a new link below.','error');
async function api(path,options={}){const r=await fetch(path,{...options,headers:{'Content-Type':'application/json',Authorization:'Bearer '+token,...options.headers}});const result=await r.json();if(!r.ok)throw Error(result.error||'Request failed.');return result;}
const signedIn=on=>{$('admin-signin-wrap').hidden=on;$('admin-tools').hidden=!on;};

// ---------- Sections (tabs) ----------
const TABS=['home','orders','products','deals','photos','reviews','settings'];
function openTab(name,{scroll=true}={}){if(!TABS.includes(name))name='home';for(const b of document.querySelectorAll('[data-tab]'))b.classList.toggle('is-active',b.dataset.tab===name);for(const p of document.querySelectorAll('[data-panel]'))p.hidden=p.dataset.panel!==name;try{sessionStorage.setItem('mikee-admin-tab',name);}catch{}if(scroll)scrollTo({top:0,behavior:'smooth'});}
document.querySelector('.adm-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)openTab(b.dataset.tab);});

// ---------- Plain-language labels ----------
const PAY={paid:['Paid','ok'],pending_payment:['Waiting for bank transfer','wait'],awaiting_payment:['Not paid yet','muted'],manual_review:['Needs checking','bad']};
const STEPS=[['processing','Preparing'],['ready_for_pickup','Ready for pickup'],['dispatched','On the way'],['delivered','Delivered'],['cancelled','Cancelled']];
const SUPPLY=[['pending_confirmation','Not yet confirmed'],['confirmed','Confirmed with supplier'],['issue','Problem with supplier']];
const METHOD={bank_transfer:'Bank transfer',paystack:'Paystack (card)',credit_direct:'Pay Small Small (Credit Direct)'};
const stepLabel=v=>(STEPS.find(s=>s[0]===v)||[,v])[1];
const badge=(label,kind)=>`<span class="adm-badge is-${kind}">${escape(label)}</span>`;
const when=d=>{try{return new Date(d).toLocaleString('en-NG',{timeZone:'Africa/Lagos',weekday:'short',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});}catch{return '';}};
const orderNo=ref=>String(ref||'').slice(5,13).toUpperCase();
const waNumber=p=>{const d=String(p||'').replace(/\D/g,'');return /^0\d{10}$/.test(d)?'234'+d.slice(1):/^234\d{10}$/.test(d)?d:'';};
const productName=sku=>{const v=inventory.find(r=>r.sku===sku),d=v?.product_data||{};return d.model?[d.model,d.capacity||d.storage].filter(Boolean).join(' · '):sku;};

// ---------- Orders ----------
const FILTERS=[['needs','Needs attention',o=>isTransfer(o)||isToSend(o)||o.status==='manual_review'],['transfer','Waiting for bank transfer',o=>isTransfer(o)],['tosend','Paid – send out',o=>isToSend(o)],['unpaid','Not paid yet',o=>o.status==='awaiting_payment'],['done','Delivered / cancelled',o=>['delivered','cancelled'].includes(o.fulfillment_status)],['all','All orders',()=>true]];
const isTransfer=o=>o.payment_provider==='bank_transfer'&&o.status==='pending_payment'&&o.fulfillment_status!=='cancelled';
const isToSend=o=>o.status==='paid'&&['processing','ready_for_pickup'].includes(o.fulfillment_status);
let orderFilter='needs';
function renderOrders(){
 const counts=Object.fromEntries(FILTERS.map(([k,,f])=>[k,orders.filter(f).length]));
 $('admin-order-filters').innerHTML=FILTERS.map(([k,l])=>`<button type="button" data-order-filter="${k}" class="${k===orderFilter?'is-active':''}">${l}<b>${counts[k]}</b></button>`).join('');
 const badgeEl=document.querySelector('[data-badge="orders"]');badgeEl.hidden=!counts.needs;badgeEl.textContent=counts.needs;
 const q=$('admin-order-search').value.trim().toLowerCase();const f=FILTERS.find(x=>x[0]===orderFilter)[2];
 const list=orders.filter(f).filter(o=>!q||[o.reference,orderNo(o.reference),o.customer?.firstName,o.customer?.lastName,o.customer?.phone,o.customer?.email].join(' ').toLowerCase().includes(q));
 $('admin-orders').innerHTML=list.map(orderCard).join('')||`<div class="adm-empty"><strong>Nothing here right now.</strong><p>${orderFilter==='needs'?'Well done — no order needs your attention.':'No orders match this filter.'}</p></div>`;
 renderDashboard();
}
function orderCard(o){
 const c=o.customer||{},[payLabel,payKind]=PAY[o.status]||[o.status,'muted'],wa=waNumber(c.phone),pickup=c.fulfillment==='pickup';
 const items=(o.shop_order_items||[]).map(i=>`<li><span>${escape(productName(i.sku))}${i.selected_color?` · ${escape(i.selected_color)}`:''} × ${i.quantity}</span><strong>${money(i.unit_price_ngn*i.quantity)}</strong></li>`).join('');
 const transfer=isTransfer(o);
 return `<article class="adm-order${transfer?' is-transfer':''}"><header><div><p class="adm-order-no">Order ${escape(orderNo(o.reference))}</p><p class="adm-muted">${escape(when(o.created_at))} · ${escape(METHOD[o.payment_provider]||o.payment_provider||'')}</p></div><div class="adm-badges">${badge(payLabel,payKind)}${badge(stepLabel(o.fulfillment_status),o.fulfillment_status==='delivered'?'ok':o.fulfillment_status==='cancelled'?'bad':'info')}</div></header>
 <div class="adm-order-grid"><div><h3>Customer</h3><p class="adm-strong">${escape([c.firstName,c.lastName].filter(Boolean).join(' '))}</p><p class="adm-contact">${c.phone?`<a href="tel:${escape(c.phone)}">📞 ${escape(c.phone)}</a>`:''}${wa?`<a href="https://wa.me/${wa}" target="_blank" rel="noopener">💬 WhatsApp</a>`:''}${c.email?`<a href="mailto:${escape(c.email)}">✉️ Email</a>`:''}</p></div>
 <div><h3>${pickup?'Store pickup':'Deliver to'}</h3><p>${pickup?'Customer will collect in Computer Village':escape([c.address,c.lga||c.city,c.state].filter(Boolean).join(', '))}</p>${c.notes?`<p class="adm-muted">Note: ${escape(c.notes)}</p>`:''}</div></div>
 <ul class="adm-items">${items}</ul><p class="adm-total"><span>Total</span><strong>${money(o.amount_ngn)}</strong></p>
 ${transfer?`<div class="adm-transfer"><p><strong>Waiting for ${money(o.amount_ngn)} by bank transfer.</strong> Check your bank app first. Only when you can see the money, tap the green button.</p><button type="button" class="btn btn-primary adm-big" data-bank-paid="${escape(o.reference)}" data-amount="${escape(money(o.amount_ngn))}" data-name="${escape(c.firstName||'')}">✓ Money received in bank — mark as paid</button></div>`:''}
 <form data-order="${escape(o.reference)}" class="adm-order-form"><label>Delivery step<select name="fulfillment">${STEPS.map(([v,l])=>`<option value="${v}" ${v===o.fulfillment_status?'selected':''}>${l}</option>`).join('')}</select></label><label>Supplier check (private)<select name="supplier">${SUPPLY.map(([v,l])=>`<option value="${v}" ${v===o.supplier_status?'selected':''}>${l}</option>`).join('')}</select></label><button type="submit" class="btn btn-outline">Save</button></form>
 ${o.status==='awaiting_payment'&&o.payment_provider!=='bank_transfer'?`<button type="button" class="adm-ghost adm-small" data-recheck="${escape(o.reference)}">Check if this payment went through</button>`:''}
 <details class="adm-ref"><summary>Full reference</summary><code>${escape(o.reference)}</code></details></article>`;
}
async function loadOrders(){try{orders=await api('/api/admin/manage?kind=orders');renderOrders();}catch(e){message(e.message,'error');}}
$('admin-order-filters').addEventListener('click',e=>{const b=e.target.closest('[data-order-filter]');if(b){orderFilter=b.dataset.orderFilter;renderOrders();}});
$('admin-order-search').addEventListener('input',renderOrders);
$('admin-orders-button').addEventListener('click',async()=>{await loadOrders();message('Orders refreshed.');});
$('admin-orders').addEventListener('submit',async e=>{e.preventDefault();const button=e.target.querySelector('[type=submit]');button.disabled=true;try{await api('/api/admin/order',{method:'PATCH',body:JSON.stringify({reference:e.target.dataset.order,...Object.fromEntries(new FormData(e.target))})});message('Saved ✓ Order '+orderNo(e.target.dataset.order)+' is now “'+stepLabel(e.target.elements.fulfillment.value)+'”.','ok');await loadOrders();}catch(err){message(err.message.replace('Verify payment before fulfilling this order.','This order is not paid yet, so it cannot be marked as sent or delivered.'),'error');}finally{button.disabled=false;}});
$('admin-orders').addEventListener('click',async e=>{const paidBtn=e.target.closest('[data-bank-paid]');if(paidBtn){const ref=paidBtn.dataset.bankPaid;if(!confirm(`Have you checked your bank app and seen ${paidBtn.dataset.amount}${paidBtn.dataset.name?' from '+paidBtn.dataset.name:''} for order ${orderNo(ref)}?\n\nTap OK only if the money is in the account.`))return;paidBtn.disabled=true;try{await api('/api/admin/order',{method:'PATCH',body:JSON.stringify({reference:ref,bankPaid:true})});message('Done ✓ Order '+orderNo(ref)+' is now paid. You can prepare it for delivery.','ok');await loadOrders();}catch(err){message(err.message,'error');paidBtn.disabled=false;}return;}
 const re=e.target.closest('[data-recheck]');if(!re)return;re.disabled=true;try{const r=await api('/api/admin/order',{method:'PATCH',body:JSON.stringify({reference:re.dataset.recheck,recheck:true})});message(r.status==='paid'?'Payment confirmed ✓ The order is now paid.':'Not paid yet. The customer has not finished paying.',r.status==='paid'?'ok':'');await loadOrders();}catch(err){message(err.message,'error');}finally{re.disabled=false;}});

// ---------- Home dashboard ----------
function renderDashboard(){
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'Africa/Lagos'}),todays=orders.filter(o=>new Date(o.created_at).toLocaleDateString('en-CA',{timeZone:'Africa/Lagos'})===today);
 const transfer=orders.filter(isTransfer),tosend=orders.filter(isToSend),noPrice=inventory.filter(v=>v.enabled&&!(v.price_ngn>0)).length,live=inventory.filter(v=>v.enabled&&v.price_ngn>0).length;
 const card=(n,title,sub,kind,go,filter)=>`<button type="button" class="adm-card is-${kind}" data-go="${go}" ${filter?`data-go-filter="${filter}"`:''}><span class="adm-card-n">${n}</span><span class="adm-card-t">${title}</span><span class="adm-card-s">${sub}</span></button>`;
 $('admin-dashboard').innerHTML=card(transfer.length,'Bank transfers to check',transfer.length?money(transfer.reduce((s,o)=>s+Number(o.amount_ngn),0))+' expected':'Nothing waiting','wait','orders','transfer')
  +card(tosend.length,'Paid orders to send out',tosend.length?'Prepare and deliver these':'All sent','ok','orders','tosend')
  +card(todays.length,'New orders today',todays.length?money(todays.reduce((s,o)=>s+Number(o.amount_ngn),0))+' in total':'No orders yet today','info','orders','all')
  +card(live,'Products on sale',noPrice?noPrice+' need a price':'All have prices','muted','products','');
}
document.querySelector('[data-panel="home"]').addEventListener('click',e=>{const c=e.target.closest('[data-go]');if(!c)return;if(c.dataset.goFilter){orderFilter=c.dataset.goFilter;renderOrders();}openTab(c.dataset.go);});
const greet=()=>{const h=Number(new Date().toLocaleString('en-NG',{timeZone:'Africa/Lagos',hour:'numeric',hour12:false}));$('admin-greeting').textContent=h<12?'Good morning':h<17?'Good afternoon':'Good evening';};

// ---------- Prices & products ----------
const PFILTERS=[['all','All'],['live','On the website'],['hidden','Hidden'],['noprice','Needs a price']];let productFilter='all',shown=40;
function renderInventory(){const query=$('admin-filter').value.toLowerCase();
 const pf={all:()=>true,live:v=>v.enabled&&v.price_ngn>0,hidden:v=>!v.enabled,noprice:v=>!(v.price_ngn>0)}[productFilter];
 $('admin-product-filters').innerHTML=PFILTERS.map(([k,l])=>`<button type="button" data-product-filter="${k}" class="${k===productFilter?'is-active':''}">${l}<b>${inventory.filter({all:()=>true,live:v=>v.enabled&&v.price_ngn>0,hidden:v=>!v.enabled,noprice:v=>!(v.price_ngn>0)}[k]).length}</b></button>`).join('');
 const list=inventory.filter(pf).filter(v=>[v.sku,v.product_data?.model,v.product_data?.brand,v.product_data?.category,v.product_data?.storage].join(' ').toLowerCase().includes(query));
 $('admin-inventory').innerHTML=list.slice(0,shown).map(v=>{const d=v.product_data||{},img=d.image||'';return `<form data-sku="${escape(v.sku)}" class="adm-product${v.enabled?'':' is-hidden'}"><div class="adm-product-head">${img?`<img src="${escape(img)}" alt="" width="56" height="56" loading="lazy">`:'<span class="adm-noimg" aria-hidden="true"></span>'}<div><p class="adm-strong">${escape(d.model||v.sku)}</p><p class="adm-muted">${escape([d.storage||d.capacity,d.condition].filter(Boolean).join(' · '))}</p></div></div>
<div class="adm-product-row"><label class="adm-price">Price<span class="adm-naira"><span aria-hidden="true">₦</span><input name="price" type="number" inputmode="numeric" min="1" max="100000000" step="1" value="${v.price_ngn??''}" placeholder="No price yet"></span></label><label class="adm-switch"><input name="enabled" type="checkbox" ${v.enabled?'checked':''}><span class="adm-switch-ui" aria-hidden="true"></span><span>Show on website</span></label><button type="submit" class="btn btn-primary adm-save">Save</button></div>
<details class="adm-more"><summary>More details (storage, colours, condition, photos, description)</summary><label>Storage<input name="capacity" value="${escape(d.capacity||d.storage||'')}"></label><label>Colours (separate with commas)<input name="colors" value="${escape((d.colors||[]).join(', '))}"></label><label>Condition<select name="condition">${['UK Used','Brand New','Open Box','Pre-Owned','Confirm condition'].map(c=>`<option ${c===d.condition?'selected':''}>${c}</option>`).join('')}</select></label><input name="image" type="hidden" value="${escape(d.image||'')}">
${stockFields(v)}${photoFields(v)}<label>Upload a photo (your own photo, or one you have permission to use)<input name="upload" type="file" accept="image/*"></label><label>Description<textarea name="description">${escape(d.description||'')}</textarea></label><button type="button" class="adm-ghost" data-preview>Preview changes</button><div data-preview-output></div></details></form>`;}).join('')
  +(list.length>shown?`<button type="button" class="adm-ghost adm-more-btn" data-show-more>Show more (${list.length-shown} more)</button>`:'')+(list.length?'':'<div class="adm-empty"><strong>No products found.</strong><p>Try a shorter search, for example “15 pro”.</p></div>');}
$('admin-product-filters').addEventListener('click',e=>{const b=e.target.closest('[data-product-filter]');if(b){productFilter=b.dataset.productFilter;shown=40;renderInventory();}});
$('admin-inventory').addEventListener('click',e=>{if(e.target.matches('[data-show-more]')){shown+=40;renderInventory();}});

const deals=mountDeals($('admin-deals'),api,()=>inventory);
const home=mountHome($('admin-home'),api,()=>inventory);
const smartImages=mountSmartImages($('admin-photos-host'),api,()=>inventory,value=>message(value));
const extras=mountExtras($('admin-advanced-host'),api,()=>inventory,value=>message(value));bindPhotoControls($('admin-inventory'),value=>message(value));
// Put the photo report with the photos, and reviews in their own section.
{const report=$('admin-photo-report'),reviews=$('admin-reviews');if(report){report.classList.add('adm-box');$('admin-photos-host').append(report);}if(reviews){reviews.classList.add('adm-box');$('admin-reviews-host').append(reviews);}}
async function load(){try{inventory=await api('/api/admin/manage?kind=inventory');signedIn(true);renderInventory();greet();await loadOrders();await deals.load();await home.load();const settings=await api('/api/admin/settings');$('admin-settings').elements.communityUrl.value=settings.community_url||'';$('admin-settings').elements.financingNotes.value=settings.financing_notes||'';if($('admin-settings').elements.googleReviewsUrl)$('admin-settings').elements.googleReviewsUrl.value=settings.google_reviews_url||'';extras.load();smartImages.load();}catch(e){token='';signedIn(false);message(e.message,'error');}}
$('admin-signin').addEventListener('submit',async e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;button.textContent='Sending…';try{const result=await api('/api/admin/login',{method:'POST',body:JSON.stringify({email:e.target.elements.email.value})});message(result.message,'ok');}catch(e){message(e.message,'error');}finally{button.disabled=false;button.textContent='Send me a sign-in link';}});
$('admin-filter').addEventListener('input',()=>{shown=40;renderInventory();});
$('admin-inventory').addEventListener('submit',async e=>{e.preventDefault();const form=e.target,row=inventory.find(v=>v.sku===form.dataset.sku);if(!row)return;const button=form.querySelector('[type=submit]');button.disabled=true;button.textContent='Saving…';const price=form.elements.price.value===''?null:Number(form.elements.price.value);try{await api('/api/admin/manage',{method:'PATCH',body:JSON.stringify({sku:row.sku,price,enabled:form.elements.enabled.checked,updatedAt:row.updated_at,productData:editData(form,row)})});inventory=await api('/api/admin/manage?kind=inventory');renderInventory();renderDashboard();message('Saved ✓ '+(row.product_data?.model||row.sku)+(price?' is now '+money(price):'')+(form.elements.enabled.checked?' and showing on the website.':' and hidden from the website.'),'ok');}catch(err){message(err.message,'error');button.disabled=false;button.textContent='Save';}});
$('admin-signout').addEventListener('click',()=>{token='';inventory=[];orders=[];deals.clear();home.clear();$('admin-inventory').replaceChildren();$('admin-orders').replaceChildren();signedIn(false);message('You are signed out.');});
$('admin-settings').addEventListener('submit',async e=>{e.preventDefault();try{await api('/api/admin/settings',{method:'PATCH',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))}).then(r=>message(r.note||'Settings saved ✓','ok'));}catch(e){message(e.message,'error');}});
{let start='home';try{start=sessionStorage.getItem('mikee-admin-tab')||'home';}catch{}openTab(start,{scroll:false});}
if(token)await load();

function editData(form,row){return {...row.product_data,capacity:form.elements.capacity.value,condition:form.elements.condition.value,colors:form.elements.colors.value.split(',').map(s=>s.trim()).filter(Boolean),image:form.elements.image.value,description:form.elements.description.value,...readExtras(form)};}
$('admin-inventory').addEventListener('click',e=>{if(!e.target.hasAttribute('data-preview'))return;const form=e.target.closest('form'),row=inventory.find(v=>v.sku===form.dataset.sku),p=editData(form,row);form.querySelector('[data-preview-output]').innerHTML=`<article><strong>${escape(p.model)}</strong><p>${escape([p.capacity,p.condition,...p.colors].join(' · '))}</p><p>${form.elements.price.value?money(Number(form.elements.price.value)):'Price coming soon'}</p><p>${escape(p.description)}</p><small>Not published yet. Review these changes, then select Publish changes.</small></article>`;});
$('admin-inventory').addEventListener('change',async e=>{if(e.target.name!=='upload'||!e.target.files[0])return;try{const file=e.target.files[0];if(file.size>12000000)throw Error('Choose an image below 12 MB.');const bitmap=await createImageBitmap(file),scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const data=canvas.toDataURL('image/webp',0.86).split(',')[1];const r=await api('/api/admin/image',{method:'POST',body:JSON.stringify({data})});addPhoto(e.target.form,r.url,'own');message('Photo uploaded for review. Add the permission note, tick Approved, then Publish changes.');}catch(err){message(err.message);}});
const bulk=document.createElement('section');bulk.innerHTML='<p>1. Export · 2. Edit prices in a spreadsheet (keep the sku and updated_at columns) · 3. Import · 4. Tick the changes to apply · 5. Publish. A file with the previous prices downloads automatically so you can undo.</p><button type="button" data-export>Export CSV</button> <label>Import edited CSV<input type="file" accept=".csv,text/csv" data-import></label><p data-bulk-status role="status"></p><div data-bulk-review></div><button type="button" class="btn btn-primary" data-publish-bulk hidden>Publish ticked changes</button>';
{const adv=document.createElement('details');adv.className='adm-box adm-advanced';adv.innerHTML='<summary>Advanced: change many prices at once with a spreadsheet</summary>';adv.append(bulk);$('admin-inventory').after(adv);}let review={changes:[],problems:[]};
const {csvCell,parseCsv}=await import('../commerce/csv.mjs');
const {reviewPriceCsv,CSV_HEADER}=await import('../commerce/bulk-prices.mjs');
const download=(name,rows)=>{const url=URL.createObjectURL(new Blob([rows.map(r=>r.map(csvCell).join(',')).join('\r\n')],{type:'text/csv'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
const naira=v=>v===null||v===undefined?'—':money(v);
bulk.querySelector('[data-export]').addEventListener('click',()=>download('mikee-prices.csv',[CSV_HEADER,...inventory.map(v=>[v.sku,v.product_data?.model||'',v.price_ngn??'',v.enabled,v.updated_at])]));
bulk.querySelector('[data-import]').addEventListener('change',async e=>{const out=bulk.querySelector('[data-bulk-review]'),publish=bulk.querySelector('[data-publish-bulk]');publish.hidden=true;out.innerHTML='';
 try{const file=e.target.files[0];if(!file)return;if(file.size>1000000)throw Error('CSV must be under 1 MB.');review=reviewPriceCsv(parseCsv(await file.text()),inventory);
  bulk.querySelector('[data-bulk-status]').textContent=`${review.changes.length} changes found · ${review.unchanged} unchanged · ${review.problems.length} need attention. Nothing has been published.`;
  out.innerHTML=(review.changes.length?`<table><thead><tr><th><input type="checkbox" data-bulk-all checked aria-label="Select all changes"></th><th>Product</th><th>Before</th><th>After</th></tr></thead><tbody>${review.changes.map((c,i)=>`<tr><td><input type="checkbox" data-bulk-pick="${i}" checked aria-label="Apply ${escape(c.sku)}"></td><td>${escape(c.model)}<br><small>${escape(c.sku)}${c.note?' · '+escape(c.note):''}</small></td><td>${naira(c.oldPrice)}${c.oldEnabled?'':' · hidden'}</td><td><strong>${naira(c.newPrice)}</strong>${c.newEnabled?'':' · hidden'}${c.oldPrice&&c.newPrice&&Math.abs(c.newPrice-c.oldPrice)/c.oldPrice>0.3?' <span style="color:#8a2a20;font-weight:700">large change — check</span>':''}</td></tr>`).join('')}</tbody></table>`:'')
   +(review.problems.length?`<details open><summary>Rows not imported (${review.problems.length})</summary><ul>${review.problems.map(p=>`<li>Line ${p.line}: ${escape(p.sku)} — ${escape(p.problem)}</li>`).join('')}</ul></details>`:'');
  publish.hidden=!review.changes.length;}catch(err){review={changes:[],problems:[]};bulk.querySelector('[data-bulk-status]').textContent=err.message;}});
bulk.addEventListener('change',e=>{if(e.target.matches('[data-bulk-all]'))bulk.querySelectorAll('[data-bulk-pick]').forEach(c=>c.checked=e.target.checked);});
bulk.querySelector('[data-publish-bulk]').addEventListener('click',async e=>{const picked=[...bulk.querySelectorAll('[data-bulk-pick]:checked')].map(c=>review.changes[Number(c.dataset.bulkPick)]);if(!picked.length){bulk.querySelector('[data-bulk-status]').textContent='Tick at least one change.';return;}
 e.target.disabled=true;const undo=[CSV_HEADER];let done=0;
 try{for(const c of picked){const saved=await api('/api/admin/manage',{method:'PATCH',body:JSON.stringify({sku:c.sku,price:c.newPrice,enabled:c.newEnabled,updatedAt:c.updatedAt})});undo.push([c.sku,c.model,c.oldPrice??'',c.oldEnabled,saved?.updated_at||'']);done++;}
  bulk.querySelector('[data-bulk-status]').textContent=done+' prices published. Every change is recorded in the audit log.';}
 catch(err){bulk.querySelector('[data-bulk-status]').textContent=done+' saved; stopped at the next row: '+err.message+' Export a fresh CSV before retrying.';}
 finally{if(done)download('mikee-prices-undo-'+new Date().toISOString().slice(0,16).replace(/[:T]/g,'-')+'.csv',undo);review={changes:[],problems:[]};bulk.querySelector('[data-bulk-review]').innerHTML='';e.target.hidden=true;e.target.disabled=false;await load();}});
