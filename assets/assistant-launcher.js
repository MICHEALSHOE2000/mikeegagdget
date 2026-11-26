// Mikee AI launcher. Tiny on purpose: the chat code and styles load only when a visitor opens it, so pages stay as
// fast as before. Never opens by itself. Hidden on checkout, cart and admin so it can't cover checkout controls.
(()=>{
 if(document.querySelector('.mg-ai-launch')||/^\/(checkout|cart|admin)(\/|$)/.test(location.pathname))return;
 const css=document.createElement('style');
 css.textContent='.mg-ai-launch{position:fixed;right:16px;bottom:calc(20px + env(safe-area-inset-bottom));z-index:95;display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:0 16px 0 12px;border:1px solid #e1bd70;border-radius:999px;background:#0d3b2a;color:#fff;font:700 14px/1 Inter,system-ui,sans-serif;box-shadow:0 10px 26px #07130f40;cursor:pointer}.mg-ai-launch svg{width:22px;height:22px;fill:none;stroke:#e1bd70;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.mg-ai-launch:focus-visible{outline:3px solid #e1bd70;outline-offset:3px}.mg-ai-launch[data-unread]::after{content:"";position:absolute;top:6px;right:8px;width:10px;height:10px;border-radius:50%;background:#e1bd70;box-shadow:0 0 0 2px #0d3b2a}@media(max-width:760px){.mg-ai-launch{bottom:calc(80px + env(safe-area-inset-bottom));right:12px;min-height:46px;padding:0 14px 0 11px}body[data-page-type="product"] .mg-ai-launch{bottom:calc(140px + env(safe-area-inset-bottom))}}@media print{.mg-ai-launch{display:none}}.mg-ai-launch.is-aside{opacity:0;pointer-events:none}.mg-ai-l-dot{width:8px;height:8px;border-radius:50%;background:#3ddc84;box-shadow:0 0 0 2px #0d3b2a;margin:0 -2px 0 -4px;order:2}.mg-ai-launch svg{order:1}.mg-ai-launch span:last-child{order:3}';
 document.head.append(css);
 const b=document.createElement('button');b.type='button';b.className='mg-ai-launch';b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-label','Chat with Mikee AI — ask about prices, swaps and delivery');b.title='Chat with us: prices, swaps, delivery';
 b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4Z"/><path d="M8 9.5h8M8 12.5h5"/></svg><span class="mg-ai-l-dot" aria-hidden="true"></span><span>Chat</span>';
 const t=b.lastChild;b.addEventListener('click',()=>{if(b.ariaBusy==='true')return;b.ariaBusy='true';t.textContent='Opening…';import('/assets/assistant.js').then(m=>m.openAssistant(b)).catch(()=>{location.href='https://wa.me/2347086865133';}).finally(()=>{b.ariaBusy=null;t.textContent='Chat';});});
 document.body.append(b);
 // Step aside while buy buttons are on screen.
 if(window.IntersectionObserver){const on=new Set(),io=new IntersectionObserver(es=>{for(const e of es)e.isIntersecting?on.add(e.target):on.delete(e.target);b.classList.toggle('is-aside',[...on].some(t=>t.isConnected));}),w=new WeakSet(),scan=()=>{for(const t of document.querySelectorAll('.purchase-actions,#gadget-buy,.checkout-actions'))if(!w.has(t)){w.add(t);io.observe(t);}};
  scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});}
})();
