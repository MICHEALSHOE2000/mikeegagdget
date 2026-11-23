// iPad showcase picker: model → storage → connectivity → colour, with live prices from the store catalogue.
const dataEl=document.getElementById('ipx-data');
if(dataEl){
 const products=JSON.parse(dataEl.textContent);
 const money=n=>'₦'+Number(n).toLocaleString('en-NG');
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
 const swatch={Midnight:'#2e3440',Starlight:'#efe7da','Space Grey':'#5b5e63','Space Gray':'#5b5e63',Silver:'#e3e4e5',Blue:'#9fb7cf',Purple:'#b7a8cf',Pink:'#e9c6cc',Yellow:'#f1dd8a'};
 const capRank=c=>{const n=parseFloat(c)||0;return /TB/i.test(c)?n*1024:n;};
 const uniq=a=>[...new Set(a)];
 const lines=[...document.querySelectorAll('.ipx-line')].map(el=>{
  const state={model:el.querySelector('[data-model].is-on')?.dataset.model,capacity:'',link:'',color:''};
  const model=()=>products.find(p=>p.slug===state.model);
  const pills=(name,values,current,ok,label=v=>v)=>{const box=el.querySelector(`[data-choice="${name}"]`);box.innerHTML=values.map(v=>`<button type="button" class="ipx-pill${name==='color'?' ipx-swatch':''}${v===current?' is-on':''}" data-value="${esc(v)}" aria-pressed="${v===current}"${ok(v)?'':' disabled'}${name==='color'?` style="--sw:${swatch[v]||'#ccc'}" aria-label="${esc(v)}" title="${esc(v)}"`:''}>${name==='color'?'':esc(label(v))}</button>`).join('');};
  const render=()=>{
   const m=model();if(!m)return;const vs=m.variants.filter(v=>v.enabled!==false);if(!vs.length){el.querySelector('[data-price]').textContent='Ask for availability';return;}
   const caps=uniq(vs.map(v=>v.capacity)).sort((a,b)=>capRank(a)-capRank(b));
   if(!caps.includes(state.capacity))state.capacity=caps[0];
   const links=uniq(vs.map(v=>v.link)).sort();
   const linkOk=l=>vs.some(v=>v.capacity===state.capacity&&v.link===l);
   if(!linkOk(state.link))state.link=links.find(linkOk);
   const colours=uniq(vs.filter(v=>v.color).map(v=>v.color));
   const colourOk=c=>vs.some(v=>v.capacity===state.capacity&&v.link===state.link&&v.color===c);
   if(colours.length&&!colourOk(state.color))state.color=colours.find(colourOk)||'';
   if(!colours.length)state.color='';
   pills('capacity',caps,state.capacity,()=>true);
   pills('link',links,state.link,linkOk);
   const wrap=el.querySelector('[data-choice-wrap="color"]');wrap.hidden=!colours.length;
   if(colours.length){pills('color',colours,state.color,colourOk);wrap.querySelector('[data-colour-name]').textContent=state.color?'· '+state.color:'';}
   const v=vs.find(x=>x.capacity===state.capacity&&x.link===state.link&&(!colours.length||x.color===state.color))||vs[0];
   const out=v.stockStatus==='out_of_stock';
   el.querySelector('[data-price]').textContent=money(v.price);
   el.querySelector('[data-was]').innerHTML=v.was>v.price?`<del><span class="sr-only">Was </span>${money(v.was)}</del>`:'';
   el.querySelector('[data-save]').textContent=v.was>v.price?`Save ${money(v.was-v.price)}`:'';
   const stock=el.querySelector('[data-stock]');stock.classList.toggle('is-out',out);stock.innerHTML=`<span aria-hidden="true">●</span> ${out?'Out of stock':'In stock'} · ${esc(v.condition)}`;
   const buy=el.querySelector('[data-buy]');buy.href=`/${m.slug}/?sku=${encodeURIComponent(v.sku)}`;buy.classList.toggle('is-disabled',out);buy.setAttribute('aria-disabled',String(out));
   const photo=el.querySelector('.ipx-photo');if(photo&&m.image&&photo.getAttribute('src')!==m.image){photo.src=m.image;photo.alt=m.model;}
  };
  el.addEventListener('click',e=>{const b=e.target.closest('button.ipx-pill');if(!b||b.disabled)return;
   if(b.dataset.model){state.model=b.dataset.model;el.querySelectorAll('[data-model]').forEach(x=>{x.classList.toggle('is-on',x===b);x.setAttribute('aria-pressed',String(x===b));});}
   else state[b.parentElement.dataset.choice]=b.dataset.value;
   render();});
  render();return render;
 });
 // Live prices and stock from the store catalogue (owner edits in Admin show here without a rebuild).
 fetch('/api/shop/catalog').then(r=>r.ok?r.json():[]).then(rows=>{
  if(!Array.isArray(rows)||!rows.length)return;const bySku=new Map(rows.map(r=>[r.sku,r]));
  for(const p of products)for(const v of p.variants){const r=bySku.get(v.sku);if(!r)continue;
   if(r.enabled===false||!(r.price>0)){v.enabled=false;continue;}
   v.price=r.price;v.was=r.deal&&r.originalPrice>r.price?r.originalPrice:(r.compareAtPrice>r.price?r.compareAtPrice:null);v.stockStatus=r.stockStatus;}
  lines.forEach(render=>render());
 }).catch(()=>{});
}
