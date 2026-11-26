import {media,activateImages} from './storefront-ui.mjs';
export function setProductImage(container,url,model){
 if(!container)return;
 const before=container.querySelector('.device-media');
 if(!before||before.dataset.liveImage===url)return;
 const template=document.createElement('template');
 template.innerHTML=media(url,model,true);
 const next=template.content.firstElementChild;
 next.dataset.liveImage=url;
 if(next.querySelector('img'))next.querySelector('img').dataset.mainImage='';
 before.replaceWith(next);activateImages(container);
}
