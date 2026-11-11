for(const section of document.querySelectorAll('[data-community]')){
 fetch('/api/shop/settings').then(r=>r.json()).then(settings=>{if(!settings.communityUrl)return;const u=new URL(settings.communityUrl);if(u.protocol!=='https:'||u.hostname!=='chat.whatsapp.com')return;const a=document.createElement('a');a.className='btn btn-primary';a.textContent='Join Group';a.href=u.href;a.rel='noopener';section.querySelector('button').replaceWith(a);section.querySelector('[data-community-note]').textContent='Get new arrivals and gadget deals in our community.';}).catch(()=>{});
}
