// Shop by Category: moves one card every 4 seconds from page load and loops forever.
// It keeps moving when customers swipe or use the arrows. The only skipped beat is while a finger or mouse
// button is physically held on the rail, so an automatic step never fights a swipe in progress.
export const CATEGORY_TIMING=Object.freeze({interval:4000});
export function createSchedule(timing=CATEGORY_TIMING,start=0){
 let next=start+timing.interval;
 return {due:now=>now>=next,moved(now){next=now+timing.interval;}};
}
const rail=typeof document==='undefined'?null:document.getElementById('categoryRail');
if(rail&&!rail.dataset.carouselReady){
 rail.dataset.carouselReady='true';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),original=[...rail.children],schedule=createSchedule(CATEGORY_TIMING,performance.now());
 let pressed=false;
 // A duplicate track allows a seamless wrap. Clones are hidden from assistive technology and keyboard focus.
 for(const node of original){const clone=node.cloneNode(true);clone.setAttribute('aria-hidden','true');clone.tabIndex=-1;clone.querySelectorAll('a,button').forEach(el=>el.tabIndex=-1);clone.dataset.carouselClone='true';rail.append(clone);}
 const step=()=>original[1]?original[1].offsetLeft-original[0].offsetLeft:rail.clientWidth;
 const cycle=()=>step()*original.length;
 const move=direction=>{if(direction<0&&rail.scrollLeft<2)rail.scrollTo({left:cycle(),behavior:'instant'});rail.scrollBy({left:direction*step(),behavior:reduced.matches?'instant':'smooth'});};
 let endTimer;rail.addEventListener('scroll',()=>{clearTimeout(endTimer);endTimer=setTimeout(()=>{if(rail.scrollLeft>=cycle()-2)rail.scrollTo({left:rail.scrollLeft-cycle(),behavior:'instant'});},140);},{passive:true});
 rail.addEventListener('pointerdown',()=>{pressed=true;});
 for(const type of ['pointerup','pointercancel'])window.addEventListener(type,()=>{pressed=false;});
 document.querySelectorAll('[data-category-scroll]').forEach(b=>b.addEventListener('click',()=>move(Number(b.dataset.categoryScroll))));
 const timer=setInterval(()=>{const now=performance.now();if(document.hidden||reduced.matches||!schedule.due(now))return;if(pressed){schedule.moved(now);return;}move(1);schedule.moved(now);},250);
 timer.unref?.(); // lets test runners exit; browsers ignore it
 window.addEventListener('pagehide',()=>{clearInterval(timer);clearTimeout(endTimer);},{once:true});
}
