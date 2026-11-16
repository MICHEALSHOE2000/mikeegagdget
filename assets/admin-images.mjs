// Admin → Products → Smart Image Upload. Photos are converted and fingerprinted in the browser, uploaded to a
// private staging area, matched to catalogue products, and published only when the administrator approves them.
import {escape} from './storefront-ui.mjs';
import {suggestMatch,variantsForPhoto,hamming,NEAR_DUPLICATE,band} from '../commerce/image-match.mjs';
import {swatchColor} from '../commerce/variant-selection.mjs';
import {PHOTO_SOURCES} from '../commerce/product-photos.mjs';
const TYPES={'image/jpeg':'JPG','image/png':'PNG','image/webp':'WebP'},MAX_FILE=25e6;
const BAND={high:'High confidence',medium:'Medium — compare first',low:'Low — match manually'};

// ---- browser-side image work ----
async function sniff(file){const b=new Uint8Array(await file.slice(0,12).arrayBuffer());if(b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)return 'image/jpeg';if(b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47)return 'image/png';if(String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP')return 'image/webp';return '';}
const hex=buf=>[...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,'0')).join('');
const canvasOf=(bitmap,max)=>{const s=Math.min(1,max/Math.max(bitmap.width,bitmap.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(bitmap.width*s));c.height=Math.max(1,Math.round(bitmap.height*s));c.getContext('2d').drawImage(bitmap,0,0,c.width,c.height);return c;};
const toWebp=(canvas,q)=>new Promise((ok,bad)=>canvas.toBlob(b=>b?ok(b):bad(Error('This browser cannot convert images.')),'image/webp',q));
const base64=async blob=>{const bytes=new Uint8Array(await blob.arrayBuffer());let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(s);};
function dhash(bitmap){const c=document.createElement('canvas');c.width=9;c.height=8;const x=c.getContext('2d');x.drawImage(bitmap,0,0,9,8);const d=x.getImageData(0,0,9,8).data,g=i=>d[i*4]*.299+d[i*4+1]*.587+d[i*4+2]*.114;let bits='';for(let y=0;y<8;y++)for(let i=0;i<8;i++)bits+=g(y*9+i)>g(y*9+i+1)?'1':'0';return bits.match(/.{4}/g).map(b=>parseInt(b,2).toString(16)).join('');}
// Dominant colours of the centre of the photo (edges are usually background).
function dominant(bitmap){const c=document.createElement('canvas');c.width=c.height=48;const x=c.getContext('2d');x.drawImage(bitmap,bitmap.width*.2,bitmap.height*.2,bitmap.width*.6,bitmap.height*.6,0,0,48,48);const d=x.getImageData(0,0,48,48).data,buckets=new Map();
 for(let i=0;i<d.length;i+=4){const k=(d[i]>>5)+'.'+(d[i+1]>>5)+'.'+(d[i+2]>>5),b=buckets.get(k)||{n:0,r:0,g:0,b:0};b.n++;b.r+=d[i];b.g+=d[i+1];b.b+=d[i+2];buckets.set(k,b);}
 return [...buckets.values()].sort((a,b)=>b.n-a.n).slice(0,5).map(b=>({rgb:[b.r/b.n,b.g/b.n,b.b/b.n].map(Math.round),share:b.n/2304}));}
export async function prepare(file,products){
 const type=await sniff(file);
 if(!TYPES[type])throw Error('Only JPG, PNG and WebP photos are accepted.');
 if(file.size>MAX_FILE)throw Error('Photo is larger than 25 MB.');
 const bitmap=await createImageBitmap(file).catch(()=>{throw Error('This photo could not be read.');});
 try{
  const sha256=hex(await crypto.subtle.digest('SHA-256',await file.arrayBuffer())),phash=dhash(bitmap),colours=dominant(bitmap);
  let full=await toWebp(canvasOf(bitmap,1600),.86);if(full.size>2.9e6)full=await toWebp(canvasOf(bitmap,1280),.72);
  const thumb=await toWebp(canvasOf(bitmap,360),.78);
  return {name:file.name,sha256,phash,colours,width:bitmap.width,height:bitmap.height,full,thumb,preview:URL.createObjectURL(thumb),suggestion:suggestMatch({filename:file.name,colours},products,swatchColor)};
 }finally{bitmap.close();}
}
// Catalogue products grouped from the live inventory rows (Supabase is the source of truth).
export function productsFrom(inventory){const map=new Map();for(const r of inventory){const d=r.product_data||{};if(!d.slug)continue;const p=map.get(d.slug)||{slug:d.slug,model:d.model||d.slug,brand:d.brand||'',category:d.category||'',colors:[],variants:[],photos:new Set()};
 p.variants.push({storage:d.storage,capacity:d.capacity,color:(d.colors||[]).join('/'),sku:r.sku});for(const c of d.colors||[])if(!p.colors.includes(c))p.colors.push(c);
 for(const ph of Array.isArray(d.images)&&d.images.length?d.images.filter(x=>x.approved):d.image?[{url:d.image,color:''}]:[])p.photos.add(JSON.stringify([ph.url,ph.color||'']));map.set(d.slug,p);}
 return [...map.values()].sort((a,b)=>a.model.localeCompare(b.model));}

export function mountSmartImages(tools,api,getInventory,message){
 const box=document.createElement('section');box.id='admin-smart-images';
 box.innerHTML=`<h2>Products → Smart Image Upload</h2>
<p>Add one photo or hundreds. Photos go to a private review area first — customers never see a photo until you approve it. Suggestions use the file name, the catalogue and the photo’s colours; storage is never guessed from a photo. <strong>Tip:</strong> name files like <code>iphone_18_pro_max_burgundy.jpg</code> for the best matches.</p>
<div class="mg-drop" data-drop tabindex="0" role="button" aria-label="Add photos: drop files here or press Enter to choose">Drag photos here, or <span class="mg-drop-pick">choose photos</span><br><small>JPG, PNG or WebP · up to 25 MB each · from your computer or phone</small><input type="file" data-files multiple accept="image/jpeg,image/png,image/webp" hidden></div>
<div data-queue></div>
<p class="mg-upload-bar"><button type="button" class="btn btn-primary" data-upload hidden>Upload to review</button> <button type="button" data-retry hidden>Retry failed uploads</button> <button type="button" data-clear hidden>Clear list</button> <progress data-progress max="1" value="0" hidden></progress> <span data-upload-status role="status"></span></p>
<h3>Review uploaded photos</h3>
<div class="mg-review-filters"><label>Show<select data-status><option value="staged">Awaiting review</option><option value="unmatched">Unmatched</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label><label>Category<select data-category><option value="">All categories</option></select></label><label>Model<input data-model type="search" placeholder="e.g. Pixel 10"></label><button type="button" data-refresh>Refresh</button></div>
<div class="mg-batch"><label>Photo source (for approval)<select data-source><option value="">Choose…</option>${Object.entries(PHOTO_SOURCES).filter(([k])=>k!=='legacy').map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select></label><label>Permission / licence note<input data-licence maxlength="300" placeholder="e.g. Photographed in store, 16 Nov"></label><button type="button" class="btn btn-primary" data-bulk>Approve selected</button> <button type="button" data-cleanup>Clean up photos rejected 30+ days ago</button></div>
<p data-review-status role="status"></p>
<div class="mg-table-wrap"><table class="mg-review-table"><thead><tr><th><input type="checkbox" data-all aria-label="Select all"></th><th>Uploaded image</th><th>Suggested product</th><th>Colour</th><th>Confidence</th><th>Status</th></tr></thead><tbody data-rows></tbody></table></div>
<datalist id="mg-products"></datalist>
<h3>Missing product images</h3><p><button type="button" data-missing>Show missing images report</button></p><div data-missing-out></div>
<style>
#admin-smart-images .mg-drop{border:2px dashed #9fb3a6;border-radius:14px;padding:26px;text-align:center;background:#f6f9f6;cursor:pointer;margin:12px 0}
#admin-smart-images .mg-drop.is-over{background:#e6f0e8;border-color:#143b2a}
#admin-smart-images .mg-drop-pick{color:#143b2a;font-weight:800;text-decoration:underline}
#admin-smart-images table{width:100%;border-collapse:collapse;font-size:14px}
#admin-smart-images th,#admin-smart-images td{border-bottom:1px solid #e3e6e0;padding:8px;vertical-align:top;text-align:left}
#admin-smart-images img{width:72px;height:72px;object-fit:contain;background:#f1f3ef;border-radius:8px}
#admin-smart-images input[type=checkbox]{width:18px;height:18px;min-height:0;padding:0;margin:0 6px 0 0;vertical-align:middle}#admin-smart-images td label{display:flex;align-items:center;gap:4px;font-weight:600;margin-bottom:8px}
#admin-smart-images .mg-band{display:inline-block;padding:2px 8px;border-radius:999px;font-weight:700;font-size:12px}
#admin-smart-images .mg-band.high{background:#e2f0e5;color:#1f5b33}#admin-smart-images .mg-band.medium{background:#f5e7c2;color:#5c4512}#admin-smart-images .mg-band.low{background:#f6dcd8;color:#8a2a20}
#admin-smart-images .mg-reasons{margin:4px 0 0;padding-left:16px;font-size:12px;color:#4d5650}
#admin-smart-images .mg-warn{color:#8a2a20;font-weight:700;font-size:12px}
#admin-smart-images .mg-table-wrap{overflow-x:auto}
#admin-smart-images .mg-review-filters,#admin-smart-images .mg-batch{display:flex;flex-wrap:wrap;gap:10px;align-items:end;margin:10px 0}
#admin-smart-images button{min-height:40px}
@media(max-width:700px){#admin-smart-images thead{display:none}#admin-smart-images tr{display:grid;grid-template-columns:32px 80px 1fr;gap:6px;border-bottom:1px solid #e3e6e0;padding:8px 0}#admin-smart-images td{border:0;padding:2px}#admin-smart-images td:nth-child(n+3){grid-column:2/-1}}
</style>`;
 tools.append(box);
 const $=s=>box.querySelector(s);let queue=[],rows=[],approvedRows=[];
 const products=()=>productsFrom(getInventory());
 const status=t=>$('[data-review-status]').textContent=t;
 // ---- choosing files ----
 const input=$('[data-files]'),drop=$('[data-drop]');
 drop.addEventListener('click',e=>{if(e.target!==input)input.click();});
 drop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();input.click();}});
 for(const ev of ['dragenter','dragover'])drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('is-over');});
 for(const ev of ['dragleave','drop'])drop.addEventListener(ev,()=>drop.classList.remove('is-over'));
 drop.addEventListener('drop',e=>{e.preventDefault();add([...e.dataTransfer.files]);});
 input.addEventListener('change',()=>{add([...input.files]);input.value='';});
 async function add(files){const list=products();$('[data-upload-status]').textContent=`Preparing ${files.length} photo${files.length===1?'':'s'}…`;
  for(const file of files){const item={id:crypto.randomUUID(),name:file.name,state:'preparing'};queue.push(item);drawQueue();
   try{Object.assign(item,await prepare(file,list),{state:'ready'});
    // Exact duplicates: keep whichever copy has the better-named (better matched) file, skip the other.
    const dup=queue.find(o=>o!==item&&o.sha256===item.sha256&&o.state==='ready');
    if(dup){const [keep,drop]=item.suggestion.score>dup.suggestion.score?[item,dup]:[dup,item];drop.state='skipped';drop.error=`Same photo as ${keep.name}`;}
    if(item.state==='ready'){const near=[...queue.filter(o=>o!==item&&o.phash),...rows,...approvedRows].find(o=>hamming(o.phash,item.phash)<=NEAR_DUPLICATE);if(near)item.warning=`Looks like ${near.name||near.filename}${near.status==='approved'?' (already approved)':''}`;}
   }catch(e){item.state='invalid';item.error=e.message;}drawQueue();}
  $('[data-upload-status]').textContent='';}
 function drawQueue(){const ready=queue.filter(i=>i.state==='ready').length,failed=queue.filter(i=>i.state==='failed').length;
  $('[data-upload]').hidden=!ready;$('[data-upload]').textContent=`Upload ${ready} photo${ready===1?'':'s'} to review`;$('[data-retry]').hidden=!failed;$('[data-clear]').hidden=!queue.length;
  $('[data-queue]').innerHTML=queue.length?`<table><thead><tr><th>Photo</th><th>File</th><th>Suggestion</th><th>State</th><th></th></tr></thead><tbody>${queue.map(i=>`<tr><td>${i.preview?`<img src="${i.preview}" alt="">`:''}</td><td>${escape(i.name)}</td><td>${i.suggestion?`${escape(i.suggestion.model||'Unmatched')} ${i.suggestion.color?'· '+escape(i.suggestion.color):''} <span class="mg-band ${i.suggestion.band}">${i.suggestion.score}%</span>`:''}${i.warning?`<div class="mg-warn">Possible duplicate: ${escape(i.warning)}</div>`:''}</td><td>${{preparing:'Preparing…',ready:'Ready',uploading:'Uploading…',done:'Uploaded ✓',failed:'Failed — '+escape(i.error||''),invalid:'Not accepted — '+escape(i.error||''),skipped:'Skipped — '+escape(i.error||'')}[i.state]}</td><td>${['ready','failed','invalid','skipped'].includes(i.state)?`<button type="button" data-remove="${i.id}" aria-label="Remove ${escape(i.name)}">Remove</button>`:''}</td></tr>`).join('')}</tbody></table>`:'';}
 $('[data-queue]').addEventListener('click',e=>{const id=e.target.dataset.remove;if(!id)return;const i=queue.findIndex(x=>x.id===id);if(i>=0){if(queue[i].preview)URL.revokeObjectURL(queue[i].preview);queue.splice(i,1);}drawQueue();});
 $('[data-clear]').addEventListener('click',()=>{queue.forEach(i=>i.preview&&URL.revokeObjectURL(i.preview));queue=[];drawQueue();});
 // ---- uploading (3 at a time; successful uploads are never sent twice) ----
 async function upload(states){const todo=queue.filter(i=>states.includes(i.state)),bar=$('[data-progress]');if(!todo.length)return;bar.hidden=false;bar.max=todo.length;bar.value=0;let n=0;
  await Promise.all(Array.from({length:3},async()=>{while(n<todo.length){const item=todo[n++];item.state='uploading';drawQueue();
   try{const r=await api('/api/admin/image?kind=stage',{method:'POST',body:JSON.stringify({data:await base64(item.full),thumb:await base64(item.thumb),sha256:item.sha256,phash:item.phash,filename:item.name,width:item.width,height:item.height,suggestion:item.suggestion})});item.state='done';item.serverId=r.id;if(r.duplicate)item.error='already uploaded earlier';}
   catch(e){item.state='failed';item.error=e.message;}bar.value++;drawQueue();}}));
  const done=todo.filter(i=>i.state==='done').length,failed=todo.filter(i=>i.state==='failed').length;
  $('[data-upload-status]').textContent=`${done} uploaded${failed?`, ${failed} failed — use Retry`:''}. Review them below.`;await load();}
 $('[data-upload]').addEventListener('click',()=>upload(['ready']));$('[data-retry]').addEventListener('click',()=>upload(['failed']));
 // ---- review table ----
 function fillFilters(){const list=products(),cats=[...new Set(list.map(p=>p.category).filter(Boolean))].sort(),sel=$('[data-category]'),cur=sel.value;sel.innerHTML='<option value="">All categories</option>'+cats.map(c=>`<option ${c===cur?'selected':''}>${escape(c)}</option>`).join('');$('#mg-products').innerHTML=list.map(p=>`<option value="${escape(p.slug)}">${escape(p.model)}</option>`).join('');}
 const productOf=slug=>products().find(p=>p.slug===slug);
 function draw(){const view=$('[data-status]').value,cat=$('[data-category]').value,model=$('[data-model]').value.toLowerCase();
  const list=(view==='approved'?approvedRows:rows).filter(r=>{const p=productOf(r.assigned_slug||r.suggested_slug);if(view==='unmatched'&&p)return false;if(view==='staged'&&!p)return false;if(cat&&p?.category!==cat)return false;if(model&&!(p?.model||r.filename).toLowerCase().includes(model))return false;return true;});
  $('[data-rows]').innerHTML=list.map(r=>{const p=productOf(r.assigned_slug||r.suggested_slug),b=band(r.confidence),others=[...rows,...approvedRows].filter(o=>o.id!==r.id&&hamming(o.phash,r.phash)<=NEAR_DUPLICATE);
   const colour=p?.colors.length?`<select data-colour="${r.id}"><option value="">Generic — all colours</option>${p.colors.map(c=>`<option ${c===(r.assigned_color||r.suggested_color)?'selected':''}>${escape(c)}</option>`).join('')}</select>`:'<small>No colour options</small>';
   const linked=p?variantsForPhoto(p,r.assigned_color||r.suggested_color||'',r.suggested_storage||''):[];
   return `<tr data-row="${r.id}"><td>${view==='staged'||view==='unmatched'?`<input type="checkbox" data-pick="${r.id}" aria-label="Select ${escape(r.filename)}">`:''}</td><td><a href="${escape(r.full_url||'#')}" target="_blank" rel="noopener"><img src="${escape(r.thumb_url||'')}" alt="${escape(r.filename)}"></a><br><small>${escape(r.filename)}</small></td>
    <td>${view==='approved'?escape(p?.model||r.assigned_slug):`<input data-product="${r.id}" list="mg-products" value="${escape(p?.slug||'')}" placeholder="Search product" aria-label="Product for ${escape(r.filename)}">`}<br><small>${p?escape(p.model)+' · '+escape(p.category)+` · links to ${linked.length} variant${linked.length===1?'':'s'}`:'Not matched yet'}</small></td>
    <td>${view==='approved'?escape(r.assigned_color||'Generic'):colour}</td>
    <td>${r.manual?'<span class="mg-band high">Chosen by you</span><ul class="mg-reasons"><li>Product picked by the administrator; the automatic suggestion was replaced.</li></ul>':`<span class="mg-band ${b}">${r.confidence}% · ${BAND[b]}</span><ul class="mg-reasons">${(r.reasons||[]).map(x=>`<li>${escape(x)}</li>`).join('')}</ul>`}${others.length?`<div class="mg-warn">Possible duplicate of ${escape(others[0].filename)}${others[0].status==='approved'?' (approved)':''}</div>`:''}</td>
    <td>${view==='staged'||view==='unmatched'?`<label><input type="checkbox" data-primary="${r.id}"> Main photo</label><br><button type="button" data-approve="${r.id}" ${p?'':'disabled'}>Approve</button> <button type="button" data-reject="${r.id}">Reject</button>`:escape(r.status)+(r.assigned_skus?.length?`<br><small>${r.assigned_skus.length} variants</small>`:'')}</td></tr>`;}).join('')||`<tr><td colspan="6">No photos here.</td></tr>`;}
 async function load(){try{fillFilters();const [staged,approved,rejected]=await Promise.all(['staged','approved','rejected'].map(s=>api('/api/admin/image?kind=staged&status='+s)));
   rows=$('[data-status]').value==='rejected'?rejected:staged;approvedRows=approved;draw();status(`${staged.length} awaiting review · ${approved.length} approved · ${rejected.length} rejected`);}catch(e){status(e.message);}}
 for(const s of ['[data-status]','[data-category]'])$(s).addEventListener('change',load);
 $('[data-model]').addEventListener('input',draw);$('[data-refresh]').addEventListener('click',load);
 $('[data-all]').addEventListener('change',e=>box.querySelectorAll('[data-pick]').forEach(c=>c.checked=e.target.checked));
 $('[data-rows]').addEventListener('change',async e=>{const id=e.target.dataset.product||e.target.dataset.colour;if(!id)return;const r=rows.find(x=>x.id===id);if(!r)return;
  if(e.target.dataset.product){if(!productOf(e.target.value)){status('Choose a product from the list.');return;}r.suggested_slug=e.target.value;r.suggested_color=null;r.manual=true;}else r.suggested_color=e.target.value||null;
  try{await api('/api/admin/image?kind=staged',{method:'PATCH',body:JSON.stringify({id,slug:r.suggested_slug,color:r.suggested_color})});}catch(err){status(err.message);}draw();});
 async function approveOne(id){const r=rows.find(x=>x.id===id),p=productOf(r?.suggested_slug);if(!p)throw Error('Choose a product first.');
  const source=$('[data-source]').value,licence=$('[data-licence]').value.trim();if(!source||!licence)throw Error('Choose the photo source and write the permission note above, then approve.');
  const color=r.suggested_color||'',skus=variantsForPhoto(p,color,r.suggested_storage||'');
  await api('/api/admin/image?kind=approve',{method:'POST',body:JSON.stringify({id,confirm:true,slug:p.slug,color,skus,primary:box.querySelector(`[data-primary="${id}"]`)?.checked===true,source,licence})});}
 $('[data-rows]').addEventListener('click',async e=>{const a=e.target.dataset.approve,x=e.target.dataset.reject;if(!a&&!x)return;e.target.disabled=true;
  try{if(a){await approveOne(a);status('Approved and published to the product.');}else{await api('/api/admin/image?kind=staged',{method:'PATCH',body:JSON.stringify({id:x,status:'rejected'})});status('Photo rejected. It stays private.');}await load();message?.('Photo review saved.');}catch(err){status(err.message);e.target.disabled=false;}});
 $('[data-bulk]').addEventListener('click',async()=>{const ids=[...box.querySelectorAll('[data-pick]:checked')].map(c=>c.dataset.pick);if(!ids.length){status('Tick the photos to approve.');return;}
  let ok=0;const failed=[];for(const id of ids){try{await approveOne(id);ok++;}catch(err){failed.push(rows.find(r=>r.id===id)?.filename+': '+err.message);}}await load();status(`${ok} approved.${failed.length?' Not approved: '+failed.join('; '):''}`);});
 $('[data-cleanup]').addEventListener('click',async()=>{try{const r=await api('/api/admin/image?kind=cleanup',{method:'POST',body:'{}'});status(`${r.removed} old rejected photo${r.removed===1?'':'s'} removed from the private area.`);}catch(err){status(err.message);}});
 // ---- missing images report ----
 $('[data-missing]').addEventListener('click',()=>{const cat=$('[data-category]').value,model=$('[data-model]').value.toLowerCase(),list=products().filter(p=>(!cat||p.category===cat)&&(!model||p.model.toLowerCase().includes(model)));
  const none=list.filter(p=>!p.photos.size),colourGaps=list.filter(p=>p.colors.length>1&&p.photos.size).map(p=>({p,missing:p.colors.filter(c=>![...p.photos].some(x=>JSON.parse(x)[1]===c))})).filter(x=>x.missing.length);
  const unmatched=rows.filter(r=>!productOf(r.suggested_slug)),dups=rows.filter(r=>[...rows,...approvedRows].some(o=>o.id!==r.id&&hamming(o.phash,r.phash)<=NEAR_DUPLICATE));
  $('[data-missing-out]').innerHTML=`<p>${list.length} products${cat?' in '+escape(cat):''}${model?' matching “'+escape(model)+'”':''} · <strong>${none.length}</strong> with no photo · ${colourGaps.length} missing a colour-specific photo · ${rows.length} awaiting approval · ${unmatched.length} unmatched uploads · ${dups.length} possible duplicates. Broken photo links are checked under “Photo report”.</p>
<details open><summary>No photo at all (${none.length})</summary><ul>${none.map(p=>`<li>${escape(p.model)} <small>${escape(p.category)}</small></li>`).join('')}</ul></details>
<details><summary>Missing colour-specific photos (${colourGaps.length})</summary><ul>${colourGaps.map(x=>`<li>${escape(x.p.model)}: ${x.missing.map(escape).join(', ')}</li>`).join('')}</ul></details>`;});
 return {load};
}
