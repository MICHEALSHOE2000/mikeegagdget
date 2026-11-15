// Add-to-cart confirmation drawer and live cart badges. Shared by product, gadget and cart pages.
import {readCart,cartCount,CART_KEY} from '../commerce/cart.mjs';
import {escape,money} from './storefront-ui.mjs';

const STYLE=`
.mg-cart-dialog{border:0;padding:0;margin:0;max-width:none;max-height:none;width:100%;height:100%;background:transparent;font-family:Inter,system-ui,sans-serif;color:#151819}
.mg-cart-dialog::backdrop{background:rgba(8,18,14,.48);backdrop-filter:blur(2px)}
.mg-cart-dialog[open] .mg-cart-sheet{animation:mg-cart-up .26s cubic-bezier(.2,.8,.2,1)}
.mg-cart-sheet{position:fixed;left:0;right:0;bottom:0;background:#fff;border-radius:22px 22px 0 0;border-top:3px solid #d8b45a;padding:20px 18px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -18px 50px rgba(8,18,14,.22);max-height:88vh;overflow:auto}
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
@media (min-width:760px){.mg-cart-sheet{left:auto;top:0;bottom:0;width:420px;max-height:none;border-radius:22px 0 0 22px;border-top:0;border-left:3px solid #d8b45a;padding:28px 24px}.mg-cart-dialog[open] .mg-cart-sheet{animation-name:mg-cart-in}}
@keyframes mg-cart-up{from{transform:translateY(100%)}to{transform:none}}
@keyframes mg-cart-in{from{transform:translateX(100%)}to{transform:none}}
@media (prefers-reduced-motion:reduce){.mg-cart-dialog[open] .mg-cart-sheet{animation:none}}
.mg-cart-badge{display:inline-grid;place-items:center;min-width:19px;height:19px;padding:0 5px;border-radius:999px;background:#d8b45a;color:#111a14;font:800 11px/1 Inter,system-ui,sans-serif}
.mg-cart-badge[hidden]{display:none}
.mobile-bottom-nav a{position:relative}
.mobile-bottom-nav .mg-cart-badge{position:absolute;top:0;left:calc(50% + 4px)}
.mg-header-cart .mg-cart-badge{position:absolute;top:2px;right:-4px}
.mg-cart-sum a{color:#143b2a;font-weight:700}
.mg-header-cart{position:relative;display:inline-flex;align-items:center;gap:6px;min-height:44px;min-width:44px;justify-content:center;color:inherit;text-decoration:none;font-weight:700}
.mg-header-cart svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.7}
`;

let dialog;
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

function build(){
 ensureStyle();
 dialog=document.createElement('dialog');
 dialog.className='mg-cart-dialog';
 dialog.setAttribute('aria-labelledby','mg-cart-title');
 dialog.innerHTML=`<div class="mg-cart-sheet" role="document"><div class="mg-cart-head"><span class="mg-cart-tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span><h2 id="mg-cart-title">Added to your cart</h2><button type="button" class="mg-cart-close" data-close aria-label="Close">×</button></div><div data-item></div><p class="mg-cart-sum"><span data-count></span><a href="/cart/">View cart</a></p><div class="mg-cart-actions"><button type="button" class="mg-cart-continue" data-close>← Continue Shopping</button><a class="mg-cart-checkout" href="/checkout/">Proceed to Checkout →</a></div><p class="mg-cart-note">Free nationwide delivery · 7-day warranty</p></div>`;
 dialog.addEventListener('click',e=>{if(e.target===dialog||e.target.closest('[data-close]'))close();});
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 document.body.append(dialog);
}
let lastFocus;
function close(){if(!dialog?.open)return;dialog.close();lastFocus?.focus?.({preventScroll:true});}

// item: {model,image,storage,color,condition,quantity,price}
export function showAddedToCart(item){
 if(!dialog)build();
 lastFocus=document.activeElement;
 const details=[item.storage,item.color,item.condition].filter(Boolean).map(escape).join(' · ');
 const qty=Math.max(1,Number(item.quantity)||1);
 dialog.querySelector('[data-item]').innerHTML=`<div class="mg-cart-item">${item.image?`<img src="${escape(item.image)}" alt="" width="76" height="92" decoding="async">`:'<span class="mg-cart-noimg" aria-hidden="true"></span>'}<div><strong>${escape(item.model)}</strong><p class="mg-cart-meta">${details}</p><p class="mg-cart-meta">Quantity in cart: ${qty}</p><p class="mg-cart-price">${money(item.price)}${qty>1?` <span class="mg-cart-meta">each</span>`:''}</p></div></div>`;
 const n=refreshCartBadges();
 dialog.querySelector('[data-count]').innerHTML=`Cart: <b>${n} item${n===1?'':'s'}</b>`;
 if(typeof dialog.showModal==='function'){if(!dialog.open)dialog.showModal();}else dialog.setAttribute('open','');
 dialog.querySelector('.mg-cart-checkout').focus({preventScroll:true});
}
