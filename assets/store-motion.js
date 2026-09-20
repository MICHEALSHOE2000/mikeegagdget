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
const rail=document.getElementById('hotDeals'),pause=document.getElementById('deals-pause');
if(rail&&pause){
 const cards=[...rail.children];
 for(let i=cards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}
 rail.replaceChildren(...cards);
 let stopped=reduced.matches,hover=false,visible=true;
 const update=()=>{pause.setAttribute('aria-pressed',String(stopped));pause.setAttribute('aria-label',stopped?'Resume automatic deals':'Pause automatic deals');pause.textContent=stopped?'▶':'Ⅱ';};
 const move=direction=>{
  const gap=parseFloat(getComputedStyle(rail).columnGap)||0,step=(rail.firstElementChild?.getBoundingClientRect().width||250)+gap;
  const end=rail.scrollWidth-rail.clientWidth;
  let next=rail.scrollLeft+step*direction;
  if(direction>0&&rail.scrollLeft>=end-3)next=0;
  if(direction<0&&rail.scrollLeft<3)next=end;
  rail.scrollTo({left:Math.max(0,Math.min(next,end)),behavior:reduced.matches?'instant':'smooth'});
 };
 pause.addEventListener('click',()=>{stopped=!stopped;update();});
 document.querySelectorAll('[data-deal-direction]').forEach(button=>button.addEventListener('click',()=>{stopped=true;update();move(Number(button.dataset.dealDirection));}));
 rail.addEventListener('mouseenter',()=>hover=true);rail.addEventListener('mouseleave',()=>hover=false);
 rail.addEventListener('pointerdown',()=>{stopped=true;update();});
 rail.addEventListener('focusin',()=>{stopped=true;update();});
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>visible=entries[0].isIntersecting).observe(rail);
 reduced.addEventListener?.('change',()=>{if(reduced.matches){stopped=true;update();}});
 const timer=setInterval(()=>{if(!stopped&&!hover&&visible&&!document.hidden)move(1);},5500);
 window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});update();
}
