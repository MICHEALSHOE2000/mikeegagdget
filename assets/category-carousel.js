// Accessible, swipe-friendly category rail. Keep iPhones in view during the initial 90 seconds.
const rail=document.getElementById('categoryRail');
if(rail){
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const original=[...rail.children];
 let hover=false,interacting=false,interactionTimer=null,autoTimer=null;
 const step=()=>original.length>1?Math.max(1,original[1].offsetLeft-original[0].offsetLeft):rail.clientWidth;
 const move=direction=>{
   const end=Math.max(0,rail.scrollWidth-rail.clientWidth);
   if(end<2)return;
   const next=rail.scrollLeft+direction*step();
   const left=direction>0&&next>end+2?0:direction<0&&next<0?end:Math.max(0,Math.min(end,next));
   rail.scrollTo({left,behavior:reduced.matches?'instant':'smooth'});
 };
 const interact=()=>{
   interacting=true;
   clearTimeout(interactionTimer);
   interactionTimer=setTimeout(()=>{interacting=false;},12000);
 };
 document.querySelectorAll('[data-category-scroll]').forEach(button=>{
   button.addEventListener('click',()=>{interact();move(Number(button.dataset.categoryScroll));});
 });
 rail.addEventListener('pointerdown',interact);
 rail.addEventListener('wheel',interact,{passive:true});
 rail.addEventListener('focusin',()=>{interact();hover=true;});
 rail.addEventListener('focusout',()=>{hover=false;});
 rail.addEventListener('mouseenter',()=>{hover=true;});
 rail.addEventListener('mouseleave',()=>{hover=false;});
 const automatic=()=>{
   if(!reduced.matches&&!document.hidden&&!hover&&!interacting)move(1);
   autoTimer=setTimeout(automatic,6000);
 };
 // Do not autoplay at all when the visitor requests reduced motion.
 if(!reduced.matches)autoTimer=setTimeout(automatic,90000);
 const cleanup=()=>{clearTimeout(autoTimer);clearTimeout(interactionTimer);};
 reduced.addEventListener?.('change',()=>{
   clearTimeout(autoTimer);
   if(!reduced.matches)autoTimer=setTimeout(automatic,90000);
 });
 window.addEventListener('pagehide',cleanup,{once:true});
}
