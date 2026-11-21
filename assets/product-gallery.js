// Product page gallery: thumbnails, swipe, keyboard arrows, and a full-screen viewer with zoom.
// The same layout as before; the main photo keeps its size. Photos come from the page (catalogue photos) and,
// once the live catalogue loads, from photos approved in admin for the selected variant.
const sized=(url,w)=>/-(160|360|720|1280)\.webp$/.test(url)?url.replace(/-(160|360|720|1280)\.webp$/,`-${w}.webp`):url;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
let viewer;

function openViewer(gallery){
 if(!viewer){
  viewer=document.createElement('dialog');viewer.className='mg-lightbox';viewer.setAttribute('aria-label','Product photos');
  viewer.innerHTML=`<div class="mg-lightbox-stage" data-stage><img alt="" data-full draggable="false"></div><p class="mg-lightbox-count" data-count aria-live="polite"></p><button type="button" class="mg-lightbox-close" data-close aria-label="Close photos">×</button><button type="button" class="mg-lightbox-nav is-prev" data-step="-1" aria-label="Previous photo">‹</button><button type="button" class="mg-lightbox-nav is-next" data-step="1" aria-label="Next photo">›</button><p class="mg-lightbox-hint">Double-tap or pinch to zoom</p>`;
  document.body.append(viewer);
  viewer.addEventListener('click',e=>{const b=e.target.closest('button');if(b?.dataset.close!==undefined||e.target===viewer)viewer.close();else if(b?.dataset.step)viewer.gallery?.step(Number(b.dataset.step),true);});
  viewer.addEventListener('keydown',e=>{if(e.key==='ArrowRight')viewer.gallery?.step(1,true);else if(e.key==='ArrowLeft')viewer.gallery?.step(-1,true);});
  const stage=viewer.querySelector('[data-stage]'),img=viewer.querySelector('[data-full]');let zoom=1,x=0,y=0,start=null,lastTap=0;
  const apply=()=>{img.style.transform=`translate(${x}px,${y}px) scale(${zoom})`;stage.classList.toggle('is-zoomed',zoom>1);};
  viewer.resetZoom=()=>{zoom=1;x=0;y=0;apply();};
  const toggle=(cx,cy)=>{if(zoom>1){viewer.resetZoom();return;}const r=img.getBoundingClientRect();zoom=2.5;x=(r.left+r.width/2-cx)*1.5;y=(r.top+r.height/2-cy)*1.5;apply();};
  stage.addEventListener('dblclick',e=>toggle(e.clientX,e.clientY));
  stage.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){const now=Date.now();if(now-lastTap<300){toggle(e.clientX,e.clientY);lastTap=0;return;}lastTap=now;}start={px:e.clientX,py:e.clientY,x,y};stage.setPointerCapture?.(e.pointerId);});
  stage.addEventListener('pointermove',e=>{if(!start||zoom===1)return;x=start.x+e.clientX-start.px;y=start.y+e.clientY-start.py;apply();});
  stage.addEventListener('pointerup',e=>{if(start&&zoom===1){const dx=e.clientX-start.px;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(e.clientY-start.py))viewer.gallery?.step(dx<0?1:-1,true);}start=null;});
  viewer.addEventListener('close',()=>{viewer.resetZoom();viewer.gallery?.focusMain();});
 }
 viewer.gallery=gallery;gallery.renderViewer();
 if(!viewer.open)viewer.showModal();
}

export function mountGallery(root){
 if(!root||root.dataset.galleryReady)return null;root.dataset.galleryReady='1';
 const main=root.querySelector('[data-main-image]'),frame=root.querySelector('.product-main-image'),thumbs=root.querySelector('.product-thumbnails');
 if(!main||!frame)return null;
 const label=main.alt||'Product';
 let images=[...root.querySelectorAll('[data-gallery-image]')].map(b=>b.dataset.galleryImage);if(!images.length)images=[main.currentSrc||main.src];
 let index=0;
 main.draggable=false;frame.tabIndex=0;frame.setAttribute('role','button');frame.setAttribute('aria-label',`Open ${label} photos full screen`);
 const mark=()=>{thumbs?.querySelectorAll('[data-gallery-image]').forEach((b,j)=>{b.classList.toggle('is-active',j===index);b.setAttribute('aria-current',j===index?'true':'false');});
  frame.dataset.count=images.length>1?`${index+1} / ${images.length}`:'';};
 const show=i=>{index=(i+images.length)%images.length;const url=images[index];
  if(main.getAttribute('src')!==url){main.closest('.device-media')?.classList.add('is-loading');main.srcset=/-720\.webp$/.test(url)?`${sized(url,360)} 360w, ${url} 720w`:'';main.src=url;}
  mark();};
 const api={
  step(d,inViewer){show(index+d);if(inViewer)api.renderViewer();},
  renderViewer(){if(!viewer)return;const img=viewer.querySelector('[data-full]');viewer.resetZoom?.();img.src=images[index];img.alt=`${label} — photo ${index+1} of ${images.length}`;viewer.querySelector('[data-count]').textContent=images.length>1?`${index+1} / ${images.length}`:'';viewer.querySelectorAll('[data-step]').forEach(b=>b.hidden=images.length<2);},
  focusMain(){frame.focus({preventScroll:true});},
  // Replace the photo list (e.g. photos approved in admin for this variant) and show `active` if given.
  set(list,active){const clean=[...new Set((list||[]).filter(u=>typeof u==='string'&&u))];if(!clean.length)return;images=clean;
   if(thumbs){thumbs.innerHTML=images.length>1?images.map((u,i)=>`<button type="button" data-gallery-image="${esc(u)}" aria-label="Show ${esc(label)} photo ${i+1}"><img src="${esc(sized(u,160))}" alt="" width="80" height="80" loading="lazy" decoding="async"></button>`).join(''):'';thumbs.hidden=images.length<2;}
   show(Math.max(0,images.indexOf(active)));},
  get images(){return images;}
 };
 thumbs?.addEventListener('click',e=>{const b=e.target.closest('[data-gallery-image]');if(!b)return;show([...thumbs.querySelectorAll('[data-gallery-image]')].indexOf(b));});
 if(thumbs&&images.length<2)thumbs.hidden=true;
 // Swipe on the main photo; tap opens the full-screen viewer.
 let sx=null,sy=0,moved=false;
 frame.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY;moved=false;});
 frame.addEventListener('pointermove',e=>{if(sx!==null&&Math.abs(e.clientX-sx)>10)moved=true;});
 frame.addEventListener('pointercancel',()=>{sx=null;});
 frame.addEventListener('dragstart',e=>e.preventDefault());
 frame.addEventListener('pointerup',e=>{if(sx===null)return;const dx=e.clientX-sx,dy=e.clientY-sy;sx=null;
  if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)&&images.length>1)show(index+(dx<0?1:-1));else if(!moved)openViewer(api);});
 frame.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openViewer(api);}else if(e.key==='ArrowRight')show(index+1);else if(e.key==='ArrowLeft')show(index-1);});
 mark();
 root.mgGallery=api;
 return api;
}
