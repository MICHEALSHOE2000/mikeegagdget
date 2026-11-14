// Rotate the display order, never the agreed offer price or purchase destination.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const heroVideo=document.getElementById('heroVideo');
const loadHeroVideo=()=>{
 if(!heroVideo||reduced.matches)return;
 heroVideo.querySelectorAll('source[data-src]').forEach(source=>source.src=source.dataset.src);
 heroVideo.preload='metadata';
 heroVideo.load();
 heroVideo.play().catch(()=>{});
};
loadHeroVideo();
reduced.addEventListener?.('change',()=>{
 if(reduced.matches)heroVideo?.pause();
 else if(heroVideo?.querySelector('source:not([src])'))loadHeroVideo();
 else heroVideo?.play().catch(()=>{});
});
// Keep the carousel controls usable even though the Play/Pause button is removed.
const rail=document.getElementById('hotDeals');
if(rail){
 let hover=false,visible=true,lastManual=0;
 const move=direction=>{
  const gap=parseFloat(getComputedStyle(rail).columnGap)||0;
  const step=(rail.firstElementChild?.getBoundingClientRect().width||250)+gap;
  const end=Math.max(0,rail.scrollWidth-rail.clientWidth);
  if(end<2)return;
  const next=rail.scrollLeft+step*direction;
  rail.scrollTo({left:direction>0&&next>end+2?0:direction<0&&next<0?end:Math.max(0,Math.min(next,end)),behavior:reduced.matches?'instant':'smooth'});
 };
 document.querySelectorAll('[data-deal-direction]').forEach(button=>button.addEventListener('click',()=>{lastManual=Date.now();move(Number(button.dataset.dealDirection));}));
 rail.addEventListener('mouseenter',()=>hover=true);
 rail.addEventListener('mouseleave',()=>hover=false);
 rail.addEventListener('pointerdown',()=>{lastManual=Date.now();});
 rail.addEventListener('focusin',()=>{lastManual=Date.now();});
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>visible=entries[0].isIntersecting).observe(rail);
 const timer=setInterval(()=>{if(!reduced.matches&&!hover&&visible&&!document.hidden&&Date.now()-lastManual>12000)move(1);},5500);
 window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
}
