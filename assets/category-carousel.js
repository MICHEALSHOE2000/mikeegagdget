const rail=document.getElementById('categoryRail');
if(rail){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),original=[...rail.children];
 let paused=reduced.matches,hover=false;
 const controls=document.createElement('div');controls.className='category-progress';
 controls.innerHTML='<button type="button" aria-label="Pause automatic categories">Pause</button><progress aria-label="Category position" max="'+original.length+'" value="1"></progress>';
 rail.after(controls);const toggle=controls.querySelector('button'),progress=controls.querySelector('progress');
 // A duplicate track allows a continuous wrap. Clones are not keyboard destinations.
 for(const node of original){const clone=node.cloneNode(true);clone.setAttribute('aria-hidden','true');clone.tabIndex=-1;clone.dataset.carouselClone='true';rail.append(clone);}
 const step=()=>original[1]?original[1].offsetLeft-original[0].offsetLeft:rail.clientWidth;
 const cycle=()=>step()*original.length;
 const update=()=>{toggle.textContent=paused?'Play':'Pause';toggle.setAttribute('aria-label',(paused?'Resume':'Pause')+' automatic categories');toggle.setAttribute('aria-pressed',String(paused));};
 const stop=()=>{paused=true;update();};
 const move=direction=>{if(direction<0&&rail.scrollLeft<2)rail.scrollTo({left:cycle(),behavior:'instant'});rail.scrollBy({left:direction*step(),behavior:reduced.matches?'instant':'smooth'});};
 let endTimer;rail.addEventListener('scroll',()=>{progress.value=Math.round(rail.scrollLeft/step())%original.length+1;clearTimeout(endTimer);endTimer=setTimeout(()=>{if(rail.scrollLeft>=cycle()-2)rail.scrollTo({left:rail.scrollLeft-cycle(),behavior:'instant'});},140);});
 toggle.addEventListener('click',()=>{paused=!paused;update();});
 rail.addEventListener('pointerdown',stop);rail.addEventListener('focusin',stop);rail.addEventListener('wheel',stop,{passive:true});rail.addEventListener('mouseenter',()=>hover=true);rail.addEventListener('mouseleave',()=>hover=false);
 document.querySelectorAll('[data-category-scroll]').forEach(b=>b.addEventListener('click',()=>{stop();move(Number(b.dataset.categoryScroll));}));
 reduced.addEventListener('change',()=>{if(reduced.matches)stop();});
 const timer=setInterval(()=>{if(!paused&&!hover&&!document.hidden&&!reduced.matches)move(1);},3500);
 timer.unref?.();
 window.addEventListener('pagehide',()=>{clearInterval(timer);clearTimeout(endTimer);},{once:true});update();
}
