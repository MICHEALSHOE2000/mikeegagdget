// Mikee AI chat window. Loaded only when the visitor opens the chat. All answers come from /api/assistant; this file
// holds no keys, prices or business rules. Everything shown is escaped; links are limited to this site and our
// WhatsApp number.
const API='/api/assistant',KEY='mikee-ai-v2',WA='https://wa.me/2347086865133';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeHref=u=>typeof u==='string'&&((/^\/[\w\-./?=&%]*$/.test(u)&&!u.startsWith('//'))||u.startsWith(WA))?u:'';
const safeImg=u=>typeof u==='string'&&/^\/images\/[\w./-]+\.(webp|jpe?g|png|avif)$/i.test(u)?u:'';
// Plain text with paragraphs, bullet lines and links to our own pages (e.g. /returns-refunds/).
const rich=t=>esc(t).split(/\n{2,}/).map(p=>`<p>${p.replace(/\*\*([^*\n]{1,120})\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>').replace(/(^|[\s(])(\/[a-z0-9-]+\/(?:[a-z0-9-]+\/)?)(?=[\s).,]|$)/g,'$1<a href="$2">$2</a>').replace(/https:\/\/www\.creditdirect\.ng\/know-your-limit/g,'<a href="https://www.creditdirect.ng/know-your-limit" target="_blank" rel="noopener">check your Credit Direct limit</a>')}</p>`).join('');
let ui=null,session=null,lastWhatsapp=WA,pollTimer=null,returnFocus=null,busy=false;
const load=()=>{try{return JSON.parse(sessionStorage.getItem(KEY))||{};}catch{return {};}};
const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify({...session,messages:session.messages.slice(-40)}));}catch{}};

function build(){
 const root=document.createElement('div');root.className='mg-ai';root.hidden=true;
 root.innerHTML=`<section class="mg-ai-box" role="dialog" aria-modal="true" aria-labelledby="mg-ai-title" aria-describedby="mg-ai-sub">
 <header class="mg-ai-head"><span class="mg-ai-mark" aria-hidden="true">M</span><div class="mg-ai-titles"><h2 id="mg-ai-title">Mikee AI <span class="mg-ai-demo" hidden title="Rule-based demo mode: answers come from our catalogue and policies, not a language model">Demo mode</span></h2><p id="mg-ai-sub">Your Personal Gadget Shopping Assistant</p></div>
 <button type="button" class="mg-ai-icon" data-new aria-label="Start a new conversation" title="New conversation"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/></svg></button>
 <button type="button" class="mg-ai-icon" data-min aria-label="Minimise chat" title="Minimise"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"/></svg></button>
 <button type="button" class="mg-ai-icon" data-close aria-label="Close chat" title="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></header>
 <div class="mg-ai-log" role="log" aria-live="polite" aria-relevant="additions" tabindex="0" aria-label="Conversation"></div>
 <div class="mg-ai-sugg" aria-label="Suggestions"></div>
 <form class="mg-ai-form" novalidate>
  <label class="mg-ai-consent" hidden><input type="checkbox" name="consent"> <span>You can contact me about this enquiry. <a href="/privacy-policy/" target="_blank" rel="noopener">Privacy</a></span></label>
  <input class="mg-ai-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
  <div class="mg-ai-row"><label class="sr-only" for="mg-ai-text">Message Mikee AI</label><textarea id="mg-ai-text" name="text" rows="1" maxlength="500" placeholder="Ask about a phone, price or swap…" autocomplete="off" enterkeyhint="send"></textarea>
  <button class="mg-ai-send" type="submit" aria-label="Send message"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12 20 4l-6 16-3-7Z"/></svg></button></div>
  <p class="mg-ai-err" role="alert" hidden></p>
 </form>
 <footer class="mg-ai-foot"><p>Mikee AI is a virtual assistant and can make mistakes; prices come from our live catalogue. Chats are kept for 30 days (180 days if you share contact details), then removed. <a href="/privacy-policy/">Privacy</a></p></footer>
</section>`;
 document.body.append(root);
 const q=s=>root.querySelector(s);
 ui={root,box:q('.mg-ai-box'),log:q('.mg-ai-log'),sugg:q('.mg-ai-sugg'),form:q('form'),text:q('textarea'),consentRow:q('.mg-ai-consent'),consent:q('[name=consent]'),hp:q('[name=website]'),err:q('.mg-ai-err'),demo:q('.mg-ai-demo')};
 q('[data-close]').addEventListener('click',()=>hide(false));
 q('[data-min]').addEventListener('click',()=>hide(true));
 q('[data-new]').addEventListener('click',reset);
 root.addEventListener('click',e=>{if(e.target===root)hide(true);});
 ui.form.addEventListener('submit',e=>{e.preventDefault();send(ui.text.value);});
 ui.text.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();send(ui.text.value);}});
 ui.text.addEventListener('input',grow);
 root.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();hide(true);return;}
  if(e.key!=='Tab')return;const f=[...ui.box.querySelectorAll('a[href],button:not([disabled]),textarea,input:not([type=hidden]):not(.mg-ai-hp),[tabindex="0"]')].filter(x=>x.offsetParent!==null);
  if(!f.length)return;const first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 });
 // Keep the input above the on-screen keyboard on phones.
 const vv=window.visualViewport;if(vv){const fit=()=>root.style.setProperty('--mg-ai-vh',vv.height+'px');vv.addEventListener('resize',fit);fit();}
}
function grow(){ui.text.style.height='auto';ui.text.style.height=Math.min(ui.text.scrollHeight,120)+'px';}
function scroll(){ui.log.scrollTop=ui.log.scrollHeight;}
function cardHtml(c){
 const href=safeHref(c.url),img=safeImg(c.image);
 return `<li class="mg-ai-card">${img?`<img src="${esc(img)}" alt="" width="64" height="64" loading="lazy" decoding="async">`:'<span class="mg-ai-noimg" aria-hidden="true"></span>'}<div><strong>${esc(c.name)}</strong><span>${esc([c.storage,c.condition].filter(Boolean).join(' · '))}</span><span class="mg-ai-price">${esc(c.priceText)}${c.wasPrice?` <s>${esc(c.wasPrice)}</s>`:''}</span><span class="mg-ai-avail">${esc(c.availability||'')}</span><span class="mg-ai-actions">${safeHref(c.checkout)?`<a class="mg-ai-buy" href="${esc(safeHref(c.checkout))}">Buy now<span class="sr-only">: ${esc(c.name)} ${esc(c.storage||'')}</span></a>`:''}${href?`<a href="${esc(href)}">${c.checkout?'Details':'View product'}<span class="sr-only">: ${esc(c.name)} ${esc(c.storage||'')}</span></a>`:''}</span></div></li>`;
}
function render(m,{animate=true}={}){
 const el=document.createElement('div');
 el.className='mg-ai-msg'+(m.from==='customer'?' is-me':m.from==='staff'?' is-staff':'')+(animate?' is-new':'');
 const who=m.from==='customer'?'You':m.from==='staff'?'Mikee Gadget Plug team':'Mikee AI';
 el.innerHTML=`${m.from==='staff'?'':`<span class="sr-only">${who}: </span>`}${m.from==='staff'?'<span class="mg-ai-who">Mikee Gadget Plug team</span>':''}${rich(m.text)}${m.cards?.length?`<ul class="mg-ai-cards">${m.cards.map(cardHtml).join('')}</ul><a class="mg-ai-more" href="/search/">Continue shopping</a>`:''}${m.handoff?'<p class="mg-ai-note">A member of our team will reply in this chat.</p>':''}`;
 ui.log.append(el);scroll();
}
function suggestions(list){ui.sugg.innerHTML='';for(const s of (list||[]).slice(0,4)){const b=document.createElement('button');b.type='button';b.className='mg-ai-chip';b.textContent=s;b.addEventListener('click',()=>{send(s);});ui.sugg.append(b);}}
function typing(on){let t=ui.log.querySelector('.mg-ai-typing');if(on&&!t){t=document.createElement('div');t.className='mg-ai-msg mg-ai-typing';t.setAttribute('role','status');t.innerHTML='<span class="sr-only">Mikee AI is typing</span><i></i><i></i><i></i>';ui.log.append(t);scroll();}if(!on&&t)t.remove();}
function error(msg,wa){ui.err.hidden=!msg;ui.err.innerHTML=msg?`${esc(msg)} <a href="${esc(safeHref(wa)||WA)}" target="_blank" rel="noopener">Open WhatsApp</a>`:'';}
async function post(body){
 const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,conversationId:session.conversationId,token:session.token,website:ui.hp.value}),keepalive:body.action==='handoff'});
 const data=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(Error(data.error||'Something went wrong.'),{data});return data;
}
function setMode(mode){ui.demo.hidden=mode!=='simulation';}
function applyReply(rep,{from='assistant'}={}){
 if(rep.whatsapp&&safeHref(rep.whatsapp))lastWhatsapp=rep.whatsapp;
 if(rep.text||rep.cards?.length){const m={from,text:rep.text||'',cards:rep.cards||[],handoff:!!rep.handoff,whatsapp:rep.whatsapp};session.messages.push(m);render(m);}
 suggestions(rep.suggestions);
 ui.consentRow.hidden=!rep.askConsent&&!ui.consent.checked;
 if(rep.handoff||rep.paused){session.watch=true;startPolling();}
}
async function send(raw){
 const text=String(raw||'').trim();if(!text)return;
 if(busy){error('One moment — Mikee is still replying to your last message.');return;}
 if(text.length>500){error('Please keep messages under 500 characters.');return;}
 busy=true;ui.root.classList.add('is-busy');error('');ui.text.value='';grow();suggestions([]);
 const me={from:'customer',text};session.messages.push(me);render(me);typing(true);
 try{
  const data=await post({action:'message',text,consent:ui.consent.checked,page:location.pathname,productSlug:document.body.dataset.productSlug||''});
  if(data.conversationId)session.conversationId=data.conversationId;if(data.token)session.token=data.token;if(data.lastSeq)session.lastSeq=data.lastSeq;
  setMode(data.mode);session.mode=data.mode;typing(false);applyReply(data.reply||{});
 }catch(e){typing(false);error(e.message,e.data?.whatsapp);}
 finally{busy=false;ui.root.classList.remove('is-busy');save();ui.text.focus();}
}
// When the team takes over, their replies appear here.
function startPolling(){
 if(pollTimer||!session.conversationId)return;
 const tick=async()=>{if(document.hidden)return;try{const d=await post({action:'poll',since:session.lastSeq||0});for(const m of d.messages||[]){session.lastSeq=Math.max(session.lastSeq||0,m.n);const msg={from:'staff',text:m.text};session.messages.push(msg);if(!ui.root.hidden)render(msg);else{document.querySelector('.mg-ai-launch')?.setAttribute('data-unread','');}}save();}catch{}};
 pollTimer=setInterval(tick,15000);
}
function stopPolling(){clearInterval(pollTimer);pollTimer=null;}
async function greet(){
 typing(true);
 try{const d=await post({action:'start',productSlug:document.body.dataset.productSlug||''});typing(false);setMode(d.mode);session.mode=d.mode;applyReply(d.reply||{});save();}
 catch(e){typing(false);render({from:'assistant',text:'Hi! I’m Mikee AI. I can’t load right now — please try again in a moment, or chat with our team on WhatsApp.'});error(e.message,e.data?.whatsapp);}
}
function reset(){stopPolling();session={messages:[]};try{sessionStorage.removeItem(KEY);}catch{}ui.log.innerHTML='';ui.consent.checked=false;ui.consentRow.hidden=true;error('');lastWhatsapp=WA;greet();ui.text.focus();}
function hide(minimise){
 ui.root.hidden=true;document.documentElement.classList.remove('mg-ai-open');
 if(!minimise)stopPolling();
 (returnFocus||document.querySelector('.mg-ai-launch'))?.focus();
}
export function openAssistant(launcher){
 returnFocus=launcher||null;launcher?.removeAttribute('data-unread');
 if(!document.querySelector('link[href="/assets/assistant.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='/assets/assistant.css';document.head.append(l);}
 if(!ui){build();session=load();if(!Array.isArray(session.messages))session.messages=[];for(const m of session.messages)render(m,{animate:false});setMode(session.mode);if(!session.messages.length)greet();if(session.watch)startPolling();}
 ui.root.hidden=false;document.documentElement.classList.add('mg-ai-open');scroll();
 setTimeout(()=>ui.text.focus(),30);
}
