// Admin → Mikee AI: the conversation inbox (leads, chats, replies, pause/resume) and the knowledge base editor.
// Everything goes through /api/admin/manage, which checks the administrator's sign-in on every request.
const STATUS={new:'New',exploring:'Exploring',interested:'Interested',ready_to_buy:'Ready to buy',needs_human:'Needs a person',converted:'Converted (paid)',closed:'Closed'};
const KB_STATUS={verified:'Verified — Mikee AI states it',needs_confirmation:'Needs confirmation — Mikee AI says the team will confirm',template:'Reply template'};
export function mountAssistant({api,message,escape,money}){
 const $=id=>document.getElementById(id);
 let rows=[],kb=[];const open=new Set();
 const when=d=>d?new Date(d).toLocaleString('en-NG',{dateStyle:'medium',timeStyle:'short'}):'';
 const patch=body=>api('/api/admin/manage',{method:'PATCH',body:JSON.stringify(body)});
 function badge(){const b=document.querySelector('[data-badge="ai"]');const n=rows.filter(r=>r.needs_attention||r.unread_count>0).length;if(b){b.hidden=!n;b.textContent=n;}}
 function chatHtml(t){return (t||[]).map(m=>`<p class="adm-chat is-${m.from==='customer'?'customer':m.from==='staff'?'staff':'bot'}"><b>${m.from==='customer'?'Customer':m.from==='staff'?'You (team)':'Mikee AI'}:</b> ${escape(m.text).replace(/\n/g,'<br>')}${m.cards?.length?`<br><small>Showed: ${m.cards.map(c=>escape(`${c.name} ${c.priceText}`)).join(' · ')}</small>`:''}<small class="adm-chat-at"> ${escape(when(m.at))}</small></p>`).join('')||'<p class="adm-muted">No messages.</p>';}
 function card(r){
  const wa=r.consent&&r.phone?`https://wa.me/234${r.phone.slice(1)}?text=${encodeURIComponent(`Hello ${r.customer_name||''}, this is Mikee Gadget Plug about your enquiry${r.product_label?' for the '+r.product_label:''}.`)}`:'';
  const prefs=[r.storage_pref,r.condition_pref,r.budget_ngn?'Budget up to '+money(r.budget_ngn):'',r.payment_pref,r.delivery_location?'Location: '+r.delivery_location:'',r.timeline?'When: '+r.timeline:''].filter(Boolean);
  return `<article class="adm-item adm-conv${r.needs_attention?' is-attention':''}" data-conv="${escape(r.id)}"><div class="adm-conv-main">
  <p><span class="adm-tag is-${escape(r.status)}">${escape(STATUS[r.status]||r.status)}</span>${r.needs_attention?`<span class="adm-tag is-human">Needs attention${r.escalation_reason?': '+escape(r.escalation_reason):''}</span>`:''}${r.unread_count>0?`<span class="adm-tag is-unread">${Number(r.unread_count)} unread</span>`:''}${r.ai_paused?'<span class="adm-tag">Mikee AI paused</span>':''}<span class="adm-tag">${r.channel==='whatsapp'?'WhatsApp':'Website'} · ${Number(r.score)||0}/100</span></p>
  <strong>${escape(r.customer_name||'No name given')}</strong> — ${escape(r.product_label||'No device chosen yet')}
  ${prefs.length?`<p class="adm-muted">${escape(prefs.join(' · '))}</p>`:''}
  <p class="adm-muted">Ref ${escape(String(r.id).slice(0,8).toUpperCase())} · last message ${escape(when(r.last_customer_at||r.updated_at))} · ${Number(r.message_count)||0} messages${r.order_reference?' · order '+escape(r.order_reference):''}</p>
  ${r.consent&&(r.phone||r.email)?`<p>${r.phone?`<a href="tel:${escape(r.phone)}">${escape(r.phone)}</a> · <a href="${escape(wa)}" target="_blank" rel="noopener">WhatsApp</a>`:''}${r.email?` · <a href="mailto:${escape(r.email)}">${escape(r.email)}</a>`:''} <small class="adm-muted">(customer agreed to be contacted)</small></p>`:''}
  </div><button type="button" class="btn btn-outline" data-open aria-expanded="${open.has(r.id)}">${open.has(r.id)?'Hide chat':'Open chat'}</button>
  <div class="adm-conv-detail" data-detail ${open.has(r.id)?'':'hidden'}><div class="adm-conv-log" data-log><p class="adm-muted">Loading…</p></div>
   <label class="adm-conv-reply">Reply to the customer${r.channel==='whatsapp'?' (sent on WhatsApp)':' (appears in their chat window)'}<textarea data-reply maxlength="1000" rows="2" placeholder="Type your reply…"></textarea></label>
   <div class="adm-conv-tools"><button type="button" class="btn" data-send>Send reply</button><button type="button" class="btn btn-outline" data-pause>${r.ai_paused?'Resume Mikee AI':'Pause Mikee AI'}</button>${r.needs_attention?'<button type="button" class="btn btn-outline" data-handled>Mark as handled</button>':''}</div>
   <div class="adm-conv-tools"><label>Status <select data-status>${Object.entries(STATUS).map(([k,v])=>`<option value="${k}"${k===r.status?' selected':''}>${v}</option>`).join('')}</select></label><label data-order-wrap ${r.status==='converted'?'':'hidden'}>Paid order reference <input data-order value="${escape(r.order_reference||'')}" maxlength="60"></label><button type="button" class="btn btn-outline" data-save-status>Save status</button></div>
   <label class="adm-conv-notes">Private notes<textarea data-notes maxlength="2000" rows="2">${escape(r.admin_notes||'')}</textarea></label><button type="button" class="btn btn-outline" data-save-notes>Save notes</button>
  </div></article>`;
 }
 function render(){
  const box=$('admin-ai-list');if(!box)return;const st=$('ai-status').value,att=$('ai-attention').checked;
  const list=rows.filter(r=>(!st||(st==='open'?!['converted','closed'].includes(r.status):r.status===st))&&(!att||r.needs_attention||r.unread_count>0));
  box.innerHTML=list.length?list.map(card).join(''):'<p class="adm-muted">No conversations here yet.</p>';
  for(const id of open)loadChat(id);badge();
 }
 async function loadChat(id,{markRead=false}={}){
  const el=document.querySelector(`[data-conv="${CSS.escape(id)}"] [data-log]`);if(!el)return;
  try{const c=await api('/api/admin/manage?kind=conversation&id='+encodeURIComponent(id));el.innerHTML=chatHtml(c?.transcript);el.scrollTop=el.scrollHeight;
   if(markRead){const r=rows.find(x=>x.id===id);if(r?.unread_count>0){await patch({conversationId:id,markRead:true});r.unread_count=0;badge();}}}
  catch(e){el.innerHTML=`<p class="adm-muted">Could not load the chat: ${escape(e.message||'try again')}</p>`;}
 }
 async function load(){try{rows=await api('/api/admin/manage?kind=conversations');render();}catch(e){const box=$('admin-ai-list');if(box)box.innerHTML=`<p class="adm-muted">Conversations could not load: ${escape(e.message||'try again')}</p>`;}}
 function renderKb(){
  const box=$('admin-ai-kb');if(!box)return;
  box.innerHTML=kb.map(k=>`<article class="adm-item adm-kb${k.status==='needs_confirmation'?' is-attention':''}" data-kb="${escape(k.key)}"><label>Title<input data-kb-title value="${escape(k.title)}" maxlength="120"></label>
   <label>Status<select data-kb-status>${Object.entries(KB_STATUS).map(([v,l])=>`<option value="${v}"${v===k.status?' selected':''}>${l}</option>`).join('')}</select></label>
   <label>What Mikee AI may say<textarea data-kb-content rows="3" maxlength="1500" placeholder="Leave empty until you confirm this information.">${escape(k.content)}</textarea></label>
   <p class="adm-muted">${k.source?'Source: '+escape(k.source)+' · ':''}${k.updatedAt?'Edited '+escape(when(k.updatedAt)):'Default text'}</p><button type="button" class="btn btn-outline" data-kb-save>Save</button></article>`).join('');
 }
 async function loadKb(){try{kb=await api('/api/admin/manage?kind=knowledge');renderKb();}catch(e){const box=$('admin-ai-kb');if(box)box.innerHTML=`<p class="adm-muted">The knowledge base could not load: ${escape(e.message||'try again')}</p>`;}}
 const panel=document.querySelector('[data-panel="ai"]');
 panel?.addEventListener('change',e=>{if(e.target.id==='ai-status'||e.target.id==='ai-attention')return render();const s=e.target.closest('[data-status]');if(s){s.closest('[data-conv]').querySelector('[data-order-wrap]').hidden=s.value!=='converted';}});
 panel?.addEventListener('click',async e=>{
  if(e.target.closest('#admin-ai-refresh')){await load();return;}
  const kbEl=e.target.closest('[data-kb]');
  if(kbEl&&e.target.closest('[data-kb-save]')){try{const body={knowledgeKey:kbEl.dataset.kb,title:kbEl.querySelector('[data-kb-title]').value,status:kbEl.querySelector('[data-kb-status]').value,content:kbEl.querySelector('[data-kb-content]').value};await patch(body);const k=kb.find(x=>x.key===body.knowledgeKey);Object.assign(k,{title:body.title,status:body.status,content:body.content,updatedAt:new Date().toISOString()});renderKb();message('Saved. Mikee AI uses this within a minute.');}catch(err){message(err.message||'Could not save.','error');}return;}
  const c=e.target.closest('[data-conv]');if(!c)return;const id=c.dataset.conv,r=rows.find(x=>x.id===id);
  try{
   if(e.target.closest('[data-open]')){if(open.has(id))open.delete(id);else open.add(id);render();if(open.has(id))loadChat(id,{markRead:true});return;}
   if(e.target.closest('[data-send]')){const t=c.querySelector('[data-reply]');if(!t.value.trim())return message('Type a reply first.','error');await patch({conversationId:id,message:t.value});t.value='';r.ai_paused=true;r.unread_count=0;message('Reply sent. Mikee AI is paused for this chat until you resume it.');render();return;}
   if(e.target.closest('[data-pause]')){const to=!r.ai_paused;await patch({conversationId:id,aiPaused:to});r.ai_paused=to;message(to?'Mikee AI paused for this chat.':'Mikee AI will answer this chat again.');render();return;}
   if(e.target.closest('[data-handled]')){await patch({conversationId:id,needsAttention:false});r.needs_attention=false;message('Marked as handled.');render();return;}
   if(e.target.closest('[data-save-status]')){const status=c.querySelector('[data-status]').value,orderReference=c.querySelector('[data-order]').value;await patch({conversationId:id,status,...(status==='converted'?{orderReference}:{})});r.status=status;if(status==='converted')r.order_reference=orderReference;message('Status saved.');render();return;}
   if(e.target.closest('[data-save-notes]')){const notes=c.querySelector('[data-notes]').value;await patch({conversationId:id,notes});r.admin_notes=notes;message('Notes saved.');return;}
  }catch(err){message(err.message||'Could not save.','error');}
 });
 return {load:()=>{load();loadKb();}};
}
