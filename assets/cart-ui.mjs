// Add-to-cart confirmation drawer and live cart badges. Shared by product, gadget and cart pages.
import {readCart,saveCart,cartCount,CART_KEY} from '../commerce/cart.mjs';
import {escape,money} from './storefront-ui.mjs';

const STYLE=`
.mg-cart-overlay{position:fixed;inset:0;z-index:1000;font-family:Inter,system-ui,sans-serif;color:#151819}
.mg-cart-overlay[hidden]{display:none}
.mg-cart-backdrop{position:absolute;inset:0;background:rgba(8,18,14,.5)}
.mg-cart-overlay.is-open .mg-cart-sheet{animation:mg-cart-up .26s cubic-bezier(.2,.8,.2,1)}
.mg-cart-sheet{animation:mg-cart-up .26s cubic-bezier(.2,.8,.2,1)}
.mg-cart-sheet{position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column;background:#fff;border-radius:22px 22px 0 0;border-top:3px solid #d8b45a;padding:20px 18px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -18px 50px rgba(8,18,14,.22);max-height:90vh;max-height:90dvh;overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.mg-cart-head{display:flex;align-items:center;gap:12px;margin-bottom:16px}
.mg-cart-tick{flex:none;width:34px;height:34px;border-radius:50%;background:#143b2a;display:grid;place-items:center}
.mg-cart-tick svg{width:18px;height:18px;stroke:#e1bd70;stroke-width:3;fill:none}
.mg-cart-head h2{font-size:1.15rem;margin:0;flex:1;letter-spacing:-.01em}
.mg-cart-close{flex:none;width:44px;height:44px;border-radius:50%;border:1px solid #dfe3dd;background:#fff;font-size:22px;line-height:1;cursor:pointer;color:#151819}
.mg-cart-item{display:grid;grid-template-columns:76px minmax(0,1fr);gap:14px;align-items:center;padding:14px;border:1px solid #e6e9e3;border-radius:16px;background:#fbfbf8}
.mg-cart-item img,.mg-cart-noimg{width:76px;height:92px;object-fit:contain;border-radius:10px;background:#f1f3ef}
.mg-cart-item strong{display:block;font-size:1rem;line-height:1.3;overflow-wrap:anywhere}
.mg-cart-meta{margin:6px 0 0;color:#4d5650;font-size:.9rem;line-height:1.45;overflow-wrap:anywhere}
.mg-cart-price{margin:8px 0 0;font-weight:800;color:#143b2a;font-size:1.05rem}
.mg-cart-sum{display:flex;justify-content:space-between;gap:12px;margin:14px 2px 0;font-size:.92rem;color:#4d5650}
.mg-cart-sum b{color:#151819}
.mg-cart-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}
.mg-cart-actions a,.mg-cart-actions button{min-height:52px;border-radius:12px;font:700 .9rem Inter,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;gap:6px;text-decoration:none;cursor:pointer;padding:0 12px;text-align:center}
.mg-cart-continue{background:#fff;color:#143b2a;border:1.5px solid #143b2a}
.mg-cart-checkout{background:#143b2a;color:#fff;border:1.5px solid #143b2a;box-shadow:inset 0 -2px 0 #d8b45a}
.mg-cart-actions :focus-visible,.mg-cart-close:focus-visible{outline:3px solid #d8b45a;outline-offset:2px}
.mg-cart-note{margin:12px 0 0;text-align:center;font-size:.8rem;color:#6a736c}
@media (max-width:360px){.mg-cart-actions{grid-template-columns:1fr}}
@media (min-width:760px){.mg-cart-sheet{left:auto;top:0;bottom:0;width:420px;max-height:none;border-radius:22px 0 0 22px;border-top:0;border-left:3px solid #d8b45a;padding:28px 24px}.mg-cart-overlay.is-open .mg-cart-sheet{animation-name:mg-cart-in}}
@keyframes mg-cart-up{from{transform:translateY(100%)}to{transform:none}}
@keyframes mg-cart-in{from{transform:translateX(100%)}to{transform:none}}
@media (prefers-reduced-motion:reduce){.mg-cart-overlay.is-open .mg-cart-sheet{animation:none}}
.mg-cart-list{margin:16px 0 0;padding:14px 0 0;border-top:1px solid #e6e9e3}
.mg-cart-list h3{margin:0 0 6px;font-size:.95rem}
.mg-cart-row{display:grid;grid-template-columns:48px minmax(0,1fr) auto;gap:10px;align-items:center;padding:8px 0}
.mg-cart-row img,.mg-cart-row .mg-cart-noimg{width:48px;height:58px;object-fit:contain;border-radius:8px;background:#f1f3ef}
.mg-cart-row b{display:block;font-size:.9rem;line-height:1.3;overflow-wrap:anywhere}
.mg-cart-row small{display:block;color:#4d5650;font-size:.8rem;line-height:1.35;overflow-wrap:anywhere}
.mg-cart-row button{min-width:44px;min-height:44px;border:0;background:none;color:#8a2a20;font:600 .82rem Inter,system-ui,sans-serif;text-decoration:underline;cursor:pointer}
.mg-cart-total{display:flex;justify-content:space-between;margin:10px 0 0;padding-top:12px;border-top:1px solid #e6e9e3;font-weight:800;font-size:1.05rem}
.mg-cart-total span:last-child{color:#143b2a}
.mg-cart-empty{margin:8px 0;color:#4d5650}
html.mg-cart-lock,html.mg-cart-lock body{overflow:hidden}
.mg-cart-actions [hidden],.mg-cart-sheet [hidden]{display:none!important}
.mg-cart-note a{color:#143b2a;font-weight:700}
.mg-cart-badge{display:inline-grid;place-items:center;min-width:19px;height:19px;padding:0 5px;border-radius:999px;background:#d8b45a;color:#111a14;font:800 11px/1 Inter,system-ui,sans-serif}
.mg-cart-badge[hidden]{display:none}
.mobile-bottom-nav a{position:relative}
.mobile-bottom-nav .mg-cart-badge{position:absolute;top:0;left:calc(50% + 4px)}
.mg-header-cart .mg-cart-badge{position:absolute;top:2px;right:-4px}
.mg-cart-sum a{color:#143b2a;font-weight:700}
.mg-header-cart{position:relative;display:inline-flex;align-items:center;gap:6px;min-height:44px;min-width:44px;justify-content:center;color:inherit;text-decoration:none;font-weight:700}
.mg-header-cart svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.7}
`;

function ensureStyle(){if(document.getElementById('mg-cart-style'))return;const s=document.createElement('style');s.id='mg-cart-style';s.textContent=STYLE;document.head.append(s);}

export function refreshCartBadges(){
 let n=0;try{n=cartCount(readCart(localStorage));}catch{}
 for(const el of document.querySelectorAll('[data-cart-count]')){el.textContent=n>99?'99+':String(n);el.hidden=n===0;}
 for(const el of document.querySelectorAll('[data-cart-link]'))el.setAttribute('aria-label',n?`Cart, ${n} item${n===1?'':'s'}`:'Cart, empty');
 return n;
}

export function initCartBadges(){
 ensureStyle();refreshCartBadges();
 addEventListener('mikee:cart',refreshCartBadges);
 addEventListener('storage',e=>{if(e.key===CART_KEY)refreshCartBadges();});
 addEventListener('pageshow',refreshCartBadges);
}

let overlay,lastFocus,catalogPromise;
// Prices for every line come from the same catalogue the shop uses; the server still re-prices at payment.
function catalog(){return catalogPromise??=fetch('/api/shop/catalog').then(r=>r.ok?r.json():Promise.reject()).then(rows=>Array.isArray(rows)&&rows.length?rows:Promise.reject()).catch(()=>fetch('/assets/shop-data.json').then(r=>r.ok?r.json():[])).catch(()=>[]);}
function build(){
 ensureStyle();
 overlay=document.createElement('div');overlay.className='mg-cart-overlay';overlay.hidden=true;
 overlay.innerHTML=`<div class="mg-cart-backdrop" data-close></div><div class="mg-cart-sheet" role="dialog" aria-modal="true" aria-labelledby="mg-cart-title"><div class="mg-cart-head"><span class="mg-cart-tick" aria-hidden="true" data-tick><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span><h2 id="mg-cart-title">Added to your cart</h2><button type="button" class="mg-cart-close" data-close aria-label="Close cart">×</button></div><div data-item></div><div class="mg-cart-list" data-list></div><div class="mg-cart-actions"><button type="button" class="mg-cart-continue" data-close>← Continue Shopping</button><a class="mg-cart-checkout" href="/checkout/">Proceed to Checkout →</a></div><p class="mg-cart-note"><a href="/cart/">View full cart</a> · Free nationwide delivery · 7-day warranty</p></div>`;
 overlay.addEventListener('click',e=>{if(e.target.closest('[data-close]'))return close();const rm=e.target.closest('[data-remove-line]');if(rm){const [sku,color]=JSON.parse(rm.dataset.removeLine);saveCart(localStorage,readCart(localStorage).filter(r=>!(r.sku===sku&&r.color===color)));renderList();}});
 overlay.addEventListener('keydown',e=>{if(e.key==='Escape')return close();if(e.key!=='Tab')return;const f=[...overlay.querySelectorAll('a[href],button:not([disabled])')];if(!f.length)return;const first=f[0],last=f.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
 document.body.append(overlay);
}
async function renderList(){
 const cart=readCart(localStorage),n=refreshCartBadges(),list=overlay.querySelector('[data-list]'),checkout=overlay.querySelector('.mg-cart-checkout');
 checkout.hidden=!n;
 if(!n){list.innerHTML='<p class="mg-cart-empty">Your cart is empty.</p>';return;}
 const rows=await catalog();let total=0,unknown=false;
 const lines=cart.map(row=>{const v=rows.find(x=>x.sku===row.sku);const ok=v&&v.price>0&&v.enabled!==false&&!v.reviewRequired;if(ok)total+=v.price*row.quantity;else unknown=true;
  const size=v?.capacity||v?.storage||'';const meta=[size,row.color&&!size.includes(row.color)?row.color:null,v?.condition].filter(Boolean).map(escape).join(' · ');
  return `<div class="mg-cart-row">${v?.image?`<img src="${escape(v.image)}" alt="" width="48" height="58" loading="lazy">`:'<span class="mg-cart-noimg" aria-hidden="true"></span>'}<div><b>${escape(v?.model||'Item')}</b><small>${meta}</small><small>Qty ${row.quantity} × ${ok?money(v.price):'price to confirm'}</small></div><button type="button" data-remove-line='${escape(JSON.stringify([row.sku,row.color]))}' aria-label="Remove ${escape(v?.model||'item')}">Remove</button></div>`;}).join('');
 list.innerHTML=`<h3>Your cart (${n} item${n===1?'':'s'})</h3>${lines}<p class="mg-cart-total"><span>Subtotal</span><span>${unknown?'—':money(total)}</span></p>`;
}
function open(){overlay.hidden=false;overlay.classList.remove('is-open');void overlay.offsetWidth;overlay.classList.add('is-open');document.documentElement.classList.add('mg-cart-lock');}
function close(){if(!overlay||overlay.hidden)return;overlay.hidden=true;document.documentElement.classList.remove('mg-cart-lock');lastFocus?.focus?.({preventScroll:true});}

// Opens the mini cart. With an item, it confirms what was just added; without one it simply shows the cart.
export function showAddedToCart(item){
 if(!overlay)build();
 lastFocus=document.activeElement;
 const box=overlay.querySelector('[data-item]');
 overlay.querySelector('#mg-cart-title').textContent=item?'Added to your cart':'Your cart';overlay.querySelector('[data-tick]').hidden=!item;
 if(item){const details=[item.storage,item.color,item.condition].filter(Boolean).map(escape).join(' · ');const qty=Math.max(1,Number(item.quantity)||1);
  box.innerHTML=`<div class="mg-cart-item">${item.image?`<img src="${escape(item.image)}" alt="" width="76" height="92" decoding="async">`:'<span class="mg-cart-noimg" aria-hidden="true"></span>'}<div><strong>${escape(item.model)}</strong><p class="mg-cart-meta">${details}</p><p class="mg-cart-meta">Quantity in cart: ${qty}</p><p class="mg-cart-price">${money(item.price)}${qty>1?' <span class="mg-cart-meta">each</span>':''}</p></div></div>`;}
 else box.innerHTML='';
 overlay.querySelector('[data-list]').style.borderTop=item?'':'0';
 open();renderList();
 (item?overlay.querySelector('.mg-cart-checkout'):overlay.querySelector('.mg-cart-close')).focus({preventScroll:true});
}
export const openMiniCart=()=>showAddedToCart(null);
