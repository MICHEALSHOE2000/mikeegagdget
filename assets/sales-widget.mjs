import {conditions,modes,timelines} from '../commerce/sales-assistant.mjs';
const style=document.createElement('link');
style.rel='stylesheet';style.href='/assets/sales-widget.css';document.head.append(style);
const launch=document.createElement('button');
launch.className='sales-launch';launch.textContent='Ask Mikee';document.body.append(launch);
const dialog=document.createElement('dialog');
dialog.className='sales-chat';dialog.setAttribute('aria-labelledby','sales-title');
dialog.innerHTML=`<header><strong id="sales-title">Mikee shopping assistant</strong><button type="button" aria-label="Close assistant">×</button></header>
<form class="sales-search"><label>Which device are you looking for?<input name="query" maxlength="180" placeholder="e.g. How much is iPhone 13 128GB?" required></label><label><input type="checkbox" name="ai"> Allow AI to interpret this device question if needed.</label><button>Find devices</button></form>
<p role="status"></p><section class="sales-results" aria-label="Matching variants"></section>
<form class="sales-details" hidden><strong class="sales-picked"></strong>
<label hidden>Preferred colour<select name="colour"></select></label>
<label>Your budget (₦)<input name="budget" type="number" min="1" max="100000000" required></label>
<label>Preferred condition<select name="condition"></select></label>
<label>How would you like to buy?<select name="mode"></select></label>
<label>When are you buying?<select name="timeline"></select></label>
<label>Your name<input name="name" maxlength="80" autocomplete="given-name" required></label>
<label>Phone or email (optional)<input name="contact" maxlength="100"></label>
<label><input type="checkbox" name="consent"> Save my question, selected device and preferences for Mikee to review for 30 days.</label>
<button>Save enquiry</button></form>
<footer><a target="_blank" rel="noopener noreferrer">Talk to Mikee on WhatsApp ↗</a></footer>`;
document.body.append(dialog);
const el=s=>dialog.querySelector(s);
const search=el('.sales-search'),details=el('.sales-details'),results=el('.sales-results'),status=el('[role=status]'),human=el('footer a');
for(const [key,values] of Object.entries({condition:conditions,mode:modes,timeline:timelines})){
 const field=details.elements[key];field.required=true;field.add(new Option('Choose…',''));
 for(const value of values)field.add(new Option(value,value));
}
let item=null,id=crypto.randomUUID(),revision=0;
const money=n=>'₦'+Number(n).toLocaleString('en-NG');
const describe=v=>v.label+' — '+money(v.price)+' · '+v.stock;
function handoff(){
 const data=new FormData(details);
 const lines=['Hello Mikee Gadget Plug!',search.elements.query.value&&'My question: '+search.elements.query.value,item&&'Selected: '+describe(item)];
 if(item)for(const [key,label] of Object.entries({colour:'Colour',budget:'Budget',condition:'Condition',mode:'Purchase preference',timeline:'Timeline',name:'Name',contact:'Contact'})){
  if(data.get(key))lines.push(label+': '+(key==='budget'?money(data.get(key)):data.get(key)));
 }
 human.href='https://wa.me/2347086865133?text='+encodeURIComponent(lines.filter(Boolean).join('\n'));
}
function resetSelection(){item=null;details.hidden=true;results.replaceChildren();id=crypto.randomUUID();revision++;status.textContent='';handoff();}
search.addEventListener('input',resetSelection);
details.addEventListener('input',()=>{id=crypto.randomUUID();handoff();});
launch.onclick=()=>dialog.showModal();
el('header button').onclick=()=>dialog.close();
handoff();
async function post(body){
 const r=await fetch('/api/shop/catalog?assistant=1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(25000)});
 const data=await r.json();if(!r.ok)throw Error(data.error);return data;
}
search.onsubmit=async e=>{
 e.preventDefault();resetSelection();const current=revision;status.textContent='Checking the catalogue…';
 try{
  const {results:items}=await post({action:'search',query:search.elements.query.value,allowAI:search.elements.ai.checked});
  if(current!==revision)return;
  status.textContent=items.length?'Choose a variant to continue.':'No verified match. Try a shorter model name or ask Mikee.';
  for(const v of items){
   const b=document.createElement('button');b.type='button';b.textContent=describe(v);results.append(b);
   b.onclick=()=>{item=v;const colour=details.elements.colour;colour.replaceChildren(new Option('Any listed colour',''));for(const c of v.colors||[])colour.add(new Option(c,c));colour.parentElement.hidden=!v.colors?.length;id=crypto.randomUUID();results.replaceChildren();el('.sales-picked').textContent=describe(v);details.hidden=false;status.textContent='Tell Mikee what you have in mind.';details.elements.budget.focus();handoff();};
  }
 }catch(err){if(current===revision)status.textContent=err.message||'Try WhatsApp to continue.';}
};
details.onsubmit=async e=>{
 e.preventDefault();
 if(!details.elements.consent.checked){status.textContent='Tick consent to save, or open WhatsApp directly.';return;}
 const data=Object.fromEntries(new FormData(details));const submitted=id;
 try{
  await post({...data,action:'save',consent:true,query:search.elements.query.value,sku:item.sku,quotedPrice:item.price,id,budget:Number(data.budget)});
  if(submitted===id)status.textContent='Enquiry saved. Open WhatsApp below to speak with Mikee.';
 }catch(err){if(submitted===id)status.textContent=err.message||'Could not save. You can still use WhatsApp.';}
};
