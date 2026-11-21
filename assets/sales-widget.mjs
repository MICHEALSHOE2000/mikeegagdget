import {basicReply} from '../commerce/shop-conversation.mjs';
const link=document.createElement('link');link.rel='stylesheet';link.href='/assets/sales-widget.css';document.head.append(link);
const launch=document.createElement('button');launch.className='sales-launch';launch.textContent='Ask Mikee';document.body.append(launch);
const dialog=document.createElement('dialog');dialog.className='sales-chat';dialog.setAttribute('aria-labelledby','mikee-title');
dialog.innerHTML=`<header><strong id="mikee-title">Chat with Mikee</strong><button aria-label="Close chat">×</button></header>
<small>AI shopping assistant · Your messages may be processed by AI.</small>
<section class="sales-thread" role="log" aria-live="polite"></section>
<form class="sales-compose"><input aria-label="Message Mikee" maxlength="420" placeholder="Ask about a phone…" required><button>Send</button></form>
<p class="sales-mode" role="status"></p>
<button type="button" class="sales-human">Ask Michael to reply</button>
<form class="sales-share" hidden><label>Where can Michael reply?<input required maxlength="100" placeholder="Phone number or email"></label><small>Share your contact and this chat with Michael for up to 30 days.</small><button>Share chat and request a reply</button></form>
<footer><a target="_blank" rel="noopener noreferrer">Continue on WhatsApp ↗</a></footer>`;
document.body.append(dialog);
const el=s=>dialog.querySelector(s),thread=el('.sales-thread'),form=el('.sales-compose'),input=form.querySelector('input'),share=el('.sales-share'),status=el('.sales-mode');
const messages=[];let id=crypto.randomUUID();
function bubble(text,who){const p=document.createElement('p');p.className='bubble-'+who;p.textContent=text;thread.append(p);thread.scrollTop=thread.scrollHeight;}
function handoffLink(){el('footer a').href='https://wa.me/2347086865133?text='+encodeURIComponent(['Hello Michael, I came from the website.',...messages.slice(-8).map(m=>(m.role==='user'?'Me: ':'Mikee: ')+m.content)].join('\n'));}
bubble('Welcome! I’m Mikee, Michael’s AI shopping assistant. What phone do you have in mind? You can also tell me your budget.','assistant');handoffLink();
launch.onclick=()=>{dialog.showModal();input.focus();};el('header button').onclick=()=>dialog.close();
async function post(body){
 const r=await fetch('/api/shop/catalog?assistant=1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(28000)});
 if(!r.ok){const err=Error();err.status=r.status;throw err;}return r.json();
}
async function catalogue(messages){
 try{
  const r=await fetch('/api/shop/catalog',{signal:AbortSignal.timeout(6000)});if(!r.ok)throw Error();
  const data=await r.json();
  const items=data.filter(v=>v.model&&v.enabled&&!v.reviewRequired&&Number.isSafeInteger(v.price)&&v.price>0).map(v=>({label:[v.model,v.capacity||v.storage,v.color,v.condition,v.connectivity,v.activation].filter(Boolean).join(' · '),price:v.price,stock:v.stockStatus==='out_of_stock'||v.stockQty===0?'Out of stock':v.stockStatus==='in_stock'?'In stock':'Confirm availability'}));
  return basicReply(messages,items,true);
 }catch{return basicReply(messages,[],false);}
}
form.onsubmit=async e=>{
 e.preventDefault();const text=input.value.trim();if(!text||input.disabled)return;
 messages.push({role:'user',content:text});bubble(text,'user');handoffLink();input.value='';input.disabled=true;form.querySelector('button').disabled=true;status.textContent='Mikee is replying…';
 try{
  let result;
  try{result=await post({action:'chat',messages:messages.slice(-16)});}catch(error){
   if(error.status===429){status.textContent='Chat limit reached. You can continue on WhatsApp.';return;}
   result=await catalogue(messages.slice(-16));
  }
  const cards=(result.rows||[]).map(v=>v.label+' — ₦'+v.price.toLocaleString('en-NG')+' · '+v.stock);
  const reply=[result.text,...cards].join('\n');messages.push({role:'assistant',content:reply.slice(0,650)});bubble(reply,'assistant');handoffLink();
  status.textContent=result.mode==='ai'?'':'Catalogue mode · Free-form AI replies are currently offline.';
  if(result.escalate)share.hidden=false;
 }finally{input.disabled=false;form.querySelector('button').disabled=false;input.focus();}
};
el('.sales-human').onclick=()=>{share.hidden=false;share.querySelector('input').focus();};
share.onsubmit=async e=>{
 e.preventDefault();const button=share.querySelector('button');if(button.disabled)return;button.disabled=true;
 let history=messages.slice(-15);if(history.at(-1)?.role!=='user')history.push({role:'user',content:'Please ask Michael to reply.'});
 try{
  const result=await post({action:'handoff',messages:history,id,contact:share.querySelector('input').value,consent:true});
  bubble(result.text,'assistant');share.hidden=true;status.textContent='Request saved.';
 }catch{status.textContent='Couldn’t confirm your request. WhatsApp below opens with your conversation.';button.disabled=false;}
};
