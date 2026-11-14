// Shop by Category: holds on the first category (iPhones) after page load, then advances on its own.
// Times are milliseconds since page load (performance.now()), so a re-render never restarts the initial hold.
export const CATEGORY_TIMING=Object.freeze({initialHold:90000,interval:6000,resumeAfter:12000});
export function createSchedule(timing=CATEGORY_TIMING){
 let next=timing.initialHold;
 return {
  due:now=>now>=next,
  moved(now){next=now+timing.interval;},
  // A manual action postpones the next automatic move; it never shortens the initial hold.
  touched(now){next=Math.max(next,now+timing.resumeAfter);},
  resumed(now){next=Math.max(next,now+timing.interval);}
 };
}
const rail=typeof document==='undefined'?null:document.getElementById('categoryRail');
if(rail&&!rail.dataset.carouselReady){
 rail.dataset.carouselReady='true';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),original=[...rail.children],schedule=createSchedule();
 const now=()=>performance.now();
 let hover=false,pressed=false,focused=false;
 // A duplicate track allows a continuous wrap. Clones are not keyboard destinations.
 for(const node of original){const clone=node.cloneNode(true);clone.setAttribute('aria-hidden','true');clone.tabIndex=-1;clone.dataset.carouselClone='true';rail.append(clone);}
 const step=()=>original[1]?original[1].offsetLeft-original[0].offsetLeft:rail.clientWidth;
 const cycle=()=>step()*original.length;
 const move=direction=>{if(direction<0&&rail.scrollLeft<2)rail.scrollTo({left:cycle(),behavior:'instant'});rail.scrollBy({left:direction*step(),behavior:reduced.matches?'instant':'smooth'});};
 const touched=()=>schedule.touched(now());
 let endTimer;rail.addEventListener('scroll',()=>{clearTimeout(endTimer);endTimer=setTimeout(()=>{if(rail.scrollLeft>=cycle()-2)rail.scrollTo({left:rail.scrollLeft-cycle(),behavior:'instant'});},140);},{passive:true});
 rail.addEventListener('pointerdown',()=>{pressed=true;touched();});
 for(const type of ['pointerup','pointercancel'])window.addEventListener(type,()=>{if(pressed){pressed=false;touched();}});
 rail.addEventListener('touchstart',touched,{passive:true});rail.addEventListener('wheel',touched,{passive:true});rail.addEventListener('keydown',touched);
 rail.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')hover=true;});rail.addEventListener('pointerleave',()=>{hover=false;touched();});
 rail.addEventListener('focusin',()=>{focused=true;});rail.addEventListener('focusout',()=>{focused=false;touched();});
 document.querySelectorAll('[data-category-scroll]').forEach(b=>b.addEventListener('click',()=>{touched();move(Number(b.dataset.categoryScroll));}));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule.resumed(now());});
 const timer=setInterval(()=>{if(hover||pressed||focused||document.hidden||reduced.matches||!schedule.due(now()))return;move(1);schedule.moved(now());},1000);
 timer.unref?.();
 window.addEventListener('pagehide',()=>{clearInterval(timer);clearTimeout(endTimer);},{once:true});
}
