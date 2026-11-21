// Shared navigation and attribution hooks. No vendor credentials or network calls.
const icons={Home:'<path d="m3 10 9-7 9 7v10h-6v-7H9v7H3Z"/>',Shop:'<path d="M4 7h16l1 14H3L4 7Zm4 0V5a4 4 0 0 1 8 0v2"/>',Categories:'<rect x="3.500" y="3.500" width="7" height="7" rx="1.500"/><rect x="13.500" y="3.500" width="7" height="7" rx="1.500"/><rect x="3.500" y="13.500" width="7" height="7" rx="1.500"/><rect x="13.500" y="13.500" width="7" height="7" rx="1.500"/>',Account:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',Cart:'<path d="M3 4h2.2l2.3 11.2h11.1L21 7.5H6.2"/><circle cx="9.5" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/>',WhatsApp:'<path d="M21 11a9 9 0 0 1-9 9H3l2-5A9 9 0 1 1 21 11Z"/>'};
const nav=document.createElement('nav');nav.className='mobile-bottom-nav';nav.setAttribute('aria-label','Quick navigation');
nav.innerHTML=[['Home','/'],['Shop','/search/'],['Categories','/#categories'],['Cart','/cart/'],['WhatsApp','https://wa.me/2347086865133?text=Hello%20Mikee%2C%20please%20help%20me%20choose%20a%20device.']].map(([name,href])=>`<a href="${href}" ${location.pathname===href?'aria-current="page"':''}><svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg><span>${name}</span>${name==='Cart'?'<span class="mg-cart-badge" data-cart-count hidden></span>':''}</a>`).join('');nav.querySelector('a[href="/cart/"]').setAttribute('data-cart-link','');document.body.append(nav);
// Header cart with live count, placed beside Contact so the existing header layout is kept.
const contact=document.querySelector('.site-header .nav-contact');
if(contact&&!document.querySelector('.mg-header-cart')){const a=document.createElement('a');a.className='mg-header-cart';a.href='/cart/';a.setAttribute('data-cart-link','');a.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+icons.Cart+'</svg><span class="mg-cart-badge" data-cart-count hidden></span>';contact.before(a);
 const account=document.createElement('a');account.className='mg-header-cart mg-header-account';account.href='/account/';account.setAttribute('aria-label','Your account: saved items and order tracking');account.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+icons.Account+'</svg>';a.before(account);}
import('/assets/experience.mjs').then(m=>m.initExperience()).catch(()=>{});
import('/assets/cart-ui.mjs').then(m=>{m.initCartBadges();document.querySelector('.mg-header-cart')?.addEventListener('click',e=>{if(e.metaKey||e.ctrlKey)return;e.preventDefault();m.openMiniCart();});}).catch(()=>{});
const keys=['gclid','wbraid','gbraid','fbclid','ttclid','utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
function attribution(){let saved={};try{saved=JSON.parse(sessionStorage.getItem('mikee-gadget-plug_ad_attribution')||'{}');}catch{}const q=new URLSearchParams(location.search);return Object.fromEntries(keys.map(k=>[k,q.get(k)||saved[k]]).filter(([,v])=>v));}
document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a)return;const url=new URL(a.href,location.href);if(url.origin===location.origin){for(const [k,v]of Object.entries(attribution()))if(!url.searchParams.has(k))url.searchParams.set(k,v);a.href=url.href;}},true);

if (!/^\/(?:checkout|cart|admin|account)(?:\/|$)/.test(location.pathname)) {
  const assistant=document.createElement('script');
  assistant.type='module';assistant.src='/assets/sales-widget.mjs';document.head.append(assistant);
}
