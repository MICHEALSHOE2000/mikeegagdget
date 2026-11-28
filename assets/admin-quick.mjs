// Admin → Quick Update. The owner types (or speaks) changes like a WhatsApp message; the server proposes changes;
// nothing is saved until the owner taps Apply. Applied changes go through /api/admin/manage one at a time (sign-in,
// stale-edit protection and the audit log all apply) and can be undone in one tap.
import {escape,money} from './storefront-ui.mjs';

const EXAMPLES=['iPhone 13 256GB 430k','S23 Ultra sold out','iPhone 13 128 380k, 256 420k','15 Pro Max 512 back in stock 1.05m'];
const price=v=>v==null?'No price':money(v);

export function mountQuick(host,{api,message,reload}){
 if(!host)return {};
 host.innerHTML=`<div class="adm-box adm-q-box">
  <label class="adm-q-label" for="adm-q-text">Type your changes, one per line</label>
  <textarea id="adm-q-text" class="adm-q-text" rows="5" maxlength="4000" placeholder="e.g. iPhone 13 256GB 430k&#10;S23 Ultra sold out&#10;A15 now 210k"></textarea>
  <div class="adm-q-examples"><span>Try:</span>${EXAMPLES.map(x=>`<button type="button" class="adm-q-chip" data-q-example="${escape(x)}">${escape(x)}</button>`).join('')}</div>
  <div class="adm-q-actions"><button type="button" class="btn btn-primary adm-big" data-q-read>Check my changes</button><button type="button" class="btn btn-outline adm-q-mic" data-q-mic hidden aria-pressed="false">🎤 Speak</button></div>
  <p class="adm-muted adm-q-hint">Write it your way: “650k”, “1.2m”, “uk used”, “sold out”, “back in stock”. You don't need to write “iPhone” or “Samsung”. Nothing changes on the website until you tap <strong>Apply</strong>.</p>
 </div>
 <div data-q-results></div>`;
 const box=host.querySelector('#adm-q-text'),out=host.querySelector('[data-q-results]');
 let items=[],lastApplied=[];

 function card(it,i){
  const ch=(it.changes||[]).map((c,j)=>{
   const status=c.newEnabled!==c.oldEnabled?(c.newEnabled?'<span class="adm-q-tag is-ok">Will show on website</span>':'<span class="adm-q-tag is-off">Will be hidden (sold out)</span>'):(c.hidden?'<span class="adm-q-tag">Hidden on website</span>':'');
   const disabled=c.blocked||c.same;
   return `<label class="adm-q-change${c.warn.length?' is-warn':''}${disabled?' is-disabled':''}"><input type="checkbox" data-q-pick="${i}:${j}"${c.pick?' checked':''}${disabled?' disabled':''}>
    <span class="adm-q-body"><span class="adm-q-name">${escape(c.label)}</span>
    <span class="adm-q-price">${c.newPrice!==c.oldPrice?`${escape(price(c.oldPrice))} → <strong>${escape(price(c.newPrice))}</strong>`:escape(price(c.oldPrice))} ${status}</span>
    ${c.same?'<span class="adm-q-note">Already like this</span>':''}${c.warn.map(w=>`<span class="adm-q-warn">⚠ ${escape(w)}</span>`).join('')}</span></label>`;}).join('');
  return `<article class="adm-q-item${it.problem?' is-problem':''}"><p class="adm-q-said">“${escape(it.text)}”${it.ai?' <span class="adm-q-tag">read by AI</span>':''}</p>
   ${it.problem?`<p class="adm-q-problem">${escape(it.problem)}</p>`:''}${it.question?`<p class="adm-q-ask">${escape(it.question)} <button type="button" class="adm-q-chip" data-q-all="${i}">Tick all</button></p>`:''}
   ${(it.notes||[]).map(n=>`<p class="adm-q-note">${escape(n)}</p>`).join('')}${ch}</article>`;
 }
 const picked=()=>items.flatMap(it=>(it.changes||[]).filter(c=>c.pick&&!c.blocked&&!c.same));
 function render(){
  const n=picked().length,problems=items.filter(i=>i.problem).length;
  out.innerHTML=items.length?`<h2 class="adm-q-h">Check these changes</h2>${items.map(card).join('')}
   <div class="adm-q-bar"><p>${n?`<strong>${n} change${n>1?'s':''}</strong> ticked`:'Tick the changes you want'}${problems?` · ${problems} line${problems>1?'s':''} need${problems>1?'':'s'} fixing`:''}</p>
   <button type="button" class="btn btn-primary adm-big" data-q-apply${n?'':' disabled'}>Apply ${n||''} change${n===1?'':'s'}</button><button type="button" class="adm-ghost" data-q-clear>Start again</button></div>`:'';
 }
 function renderDone(done,failed){
  out.innerHTML=`<div class="adm-box adm-q-done"><h2>✓ ${done.length} change${done.length===1?' is':'s are'} live on the website</h2>
   <ul>${done.map(d=>`<li>${escape(d.label)}: ${d.newEnabled?escape(price(d.newPrice)):'hidden (sold out)'}</li>`).join('')}</ul>
   ${failed?`<p class="adm-q-problem">${escape(failed)}</p>`:''}
   ${done.length?'<button type="button" class="btn btn-outline adm-big" data-q-undo>Undo these changes</button>':''}<button type="button" class="adm-ghost" data-q-clear>Make more changes</button></div>`;
 }

 async function read(){
  const text=box.value.trim();if(!text)return message('Type at least one change first.','error');
  const b=host.querySelector('[data-q-read]');b.disabled=true;b.textContent='Reading…';
  try{const r=await api('/api/admin/manage',{method:'POST',body:JSON.stringify({action:'quick-update',text})});items=r.items||[];render();out.scrollIntoView({behavior:'smooth',block:'start'});}
  catch(e){message(e.message||'Could not read your message.','error');}
  finally{b.disabled=false;b.textContent='Check my changes';}
 }
 async function apply(){
  const list=picked();if(!list.length)return;
  const big=list.filter(c=>c.warn.length);if(big.length&&!confirm(`${big.length} change${big.length>1?'s are':' is'} marked ⚠. Apply anyway?`))return;
  const b=out.querySelector('[data-q-apply]');b.disabled=true;b.textContent='Saving…';
  const done=[];let failed='';
  for(const c of list){
   try{const saved=await api('/api/admin/manage',{method:'PATCH',body:JSON.stringify({sku:c.sku,price:c.newPrice,enabled:c.newEnabled,updatedAt:c.updatedAt})});done.push({...c,savedAt:saved?.updated_at});}
   catch(e){failed=`Stopped at ${c.label}: ${e.message||'could not save'}. The changes above it were saved. Tap “Make more changes” and send the rest again.`;break;}
  }
  lastApplied=done;items=[];renderDone(done,failed);if(done.length){message(`${done.length} change${done.length>1?'s':''} saved.`);reload?.();}
 }
 async function undo(){
  const b=out.querySelector('[data-q-undo]');b.disabled=true;b.textContent='Undoing…';let n=0;
  for(const c of [...lastApplied].reverse()){
   try{await api('/api/admin/manage',{method:'PATCH',body:JSON.stringify({sku:c.sku,price:c.oldPrice,enabled:c.oldEnabled,updatedAt:c.savedAt})});n++;}
   catch(e){message(`Undid ${n}; ${c.label} was changed again since, so it was left as it is now.`,'error');}
  }
  lastApplied=[];out.innerHTML=`<div class="adm-box adm-q-done"><h2>↩ ${n} change${n===1?'':'s'} undone</h2><button type="button" class="adm-ghost" data-q-clear>Make more changes</button></div>`;reload?.();
 }

 host.addEventListener('click',e=>{
  const ex=e.target.closest('[data-q-example]');if(ex){box.value=(box.value.trim()?box.value.trim()+'\n':'')+ex.dataset.qExample;box.focus();return;}
  const all=e.target.closest('[data-q-all]');if(all){for(const c of items[Number(all.dataset.qAll)]?.changes||[])if(!c.blocked&&!c.same)c.pick=true;render();return;}
  if(e.target.closest('[data-q-read]'))return read();
  if(e.target.closest('[data-q-apply]'))return apply();
  if(e.target.closest('[data-q-undo]'))return undo();
  if(e.target.closest('[data-q-clear]')){items=[];out.innerHTML='';box.focus();}
 });
 host.addEventListener('change',e=>{const p=e.target.closest('[data-q-pick]');if(!p)return;const [i,j]=p.dataset.qPick.split(':').map(Number);const c=items[i]?.changes?.[j];if(c){c.pick=p.checked;render();}});

 // Speak instead of typing, where the browser supports it (Chrome on Android does).
 const Speech=globalThis.SpeechRecognition||globalThis.webkitSpeechRecognition,mic=host.querySelector('[data-q-mic]');
 if(Speech&&mic){mic.hidden=false;let rec=null;
  mic.addEventListener('click',()=>{
   if(rec){rec.stop();return;}
   rec=new Speech();rec.lang='en-NG';rec.interimResults=false;
   rec.onresult=ev=>{const said=[...ev.results].map(r=>r[0].transcript).join(' ').trim();if(said)box.value=(box.value.trim()?box.value.trim()+'\n':'')+said;};
   rec.onend=()=>{rec=null;mic.textContent='🎤 Speak';mic.setAttribute('aria-pressed','false');};
   rec.onerror=()=>message('Could not hear that. Try again or type it.','error');
   mic.textContent='■ Stop';mic.setAttribute('aria-pressed','true');rec.start();
  });}
 return {};
}
