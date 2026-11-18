// Final build step: sitewide stylesheet, product-page trust strip, and search/social metadata that matches the
// catalogue. Idempotent: running it twice changes nothing.
import {readdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {retailInventory} from '../commerce/retail-inventory.mjs';
import {escape,money} from '../assets/storefront-ui.mjs';
const SITE='https://www.mikeegadget.com.ng';
const SKIP=new Set(['node_modules','.git','.vercel','supabase','tests','docs','templates','landing-pages']);
const NOINDEX=new Set(['cart','checkout','checkout/complete','account','buy','admin','admin/deals']);
const TRUST='<ul class="mg-trust" aria-label="Why shop with Mikee Gadget Plug"><li>7-day warranty</li><li>Test before you pay — in store or on pickup</li><li>Free nationwide delivery</li><li>Same-day Lagos delivery where possible</li><li>Secure Paystack payment</li><li>Pay Small Small with Credit Direct</li><li><a href="/#visit">Visit our store — Computer Village, Ikeja</a></li></ul>';
const CSS='<link rel="stylesheet" href="/assets/experience.css">';
import {SITE_FOOTER,FOOTER_CSS} from '../commerce/site-footer.mjs';
const bySlug=new Map(retailInventory.map(p=>[p.slug,p]));
const CONDITION={'Brand New':'https://schema.org/NewCondition','UK Used':'https://schema.org/UsedCondition','Pre-Owned':'https://schema.org/UsedCondition'};
const priced=p=>p.variants.filter(v=>v.price>0&&v.enabled!==false&&!v.reviewRequired);
const conditionsOf=p=>[...new Set(priced(p).map(v=>v.condition||p.condition).filter(c=>c&&c!=='Confirm condition'))];
const setMeta=(html,attr,name,content)=>{const tag=`<meta ${attr}="${name}" content="${escape(content)}">`,re=new RegExp(`<meta ${attr}="${name}"[^>]*>`);return re.test(html)?html.replace(re,tag):html.replace('</head>',tag+'\n</head>');};
export function productMeta(p){
 const list=priced(p),conds=conditionsOf(p),from=list.length?Math.min(...list.map(v=>v.price)):null;
 const cond=conds.length?conds.join(' & ')+' ':'';
 const title=`${p.model} ${from?'Price in Nigeria':'in Nigeria'} — ${cond.trim()||'Mikee Gadget Plug'}${cond.trim()?' | Mikee Gadget Plug':''}`;
 const storages=[...new Set(list.map(v=>v.capacity||v.storage.split(' · ')[0]))].slice(0,4).join(', ');
 const description=from?`${cond}${p.model}${storages?` (${storages})`:''} ${list.length>1?'from':'for'} ${money(from)} at Mikee Gadget Plug, Computer Village, Ikeja. 7-day warranty, free nationwide delivery, pay with Paystack or Pay Small Small.`:`${p.model} at Mikee Gadget Plug, Computer Village, Ikeja. Ask the store for current availability. 7-day warranty and nationwide delivery.`;
 return {title,description};
}
// Offers only for variants with an approved price; availability is stated only when the store has confirmed it.
export function productSchema(p,url,image){
 const offers=priced(p).map(v=>({'@type':'Offer',name:`${p.model} ${v.storage}`,priceCurrency:'NGN',price:v.price,url:`${url}?storage=${encodeURIComponent(v.storage)}`,...(CONDITION[v.condition||p.condition]?{itemCondition:CONDITION[v.condition||p.condition]}:{}),...(v.stockStatus==='in_stock'?{availability:'https://schema.org/InStock'}:v.stockStatus==='out_of_stock'?{availability:'https://schema.org/OutOfStock'}:{}),seller:{'@type':'Organization',name:'Mikee Gadget Plug'}}));
 return {'@context':'https://schema.org','@type':'Product',name:p.model,brand:{'@type':'Brand',name:p.brand},description:productMeta(p).description,sku:p.slug,url,...(image?{image:[image]}:{}),...(offers.length?{offers}:{})};
}
export function applyExperience(html,file){
 if(!/<head[\s>]/i.test(html))return html;
 let out=html;
 if(!out.includes('/assets/experience.css'))out=out.replace('</head>',CSS+'\n</head>');
 // Every page gets the same professional footer.
 if(/<footer[\s>]/.test(out)){out=out.replace(/<footer[\s\S]*?<\/footer>/,()=>SITE_FOOTER).replace(/<footer(?! class="mg-footer")[\s\S]*?<\/footer>/g,'');if(!out.includes('/assets/footer.css'))out=out.replace('</head>',FOOTER_CSS+'\n</head>');}
 const path=file.replace(/\\/g,'/').replace(/^\.\//,'').replace(/\/?index\.html$/,'');
 if(NOINDEX.has(path)&&!/<meta name="robots"/.test(out))out=out.replace('</head>','<meta name="robots" content="noindex,follow">\n</head>');
 const product=bySlug.get(path);
 if(product){
  const url=`${SITE}/${product.slug}${product.isPhone?'':'/'}`,{title,description}=productMeta(product);
  const image=product.image?(product.image.startsWith('http')?product.image:SITE+product.image):'';
  out=out.replace(/<title>[\s\S]*?<\/title>/,`<title>${escape(title)}</title>`);
  out=setMeta(out,'name','description',description);out=setMeta(out,'property','og:title',title);out=setMeta(out,'property','og:description',description);out=setMeta(out,'property','og:url',url);out=setMeta(out,'property','og:type','product');
  if(image)out=setMeta(out,'property','og:image',image);
  if(!/<link rel="canonical"/.test(out))out=out.replace('</head>',`<link rel="canonical" href="${url}">\n</head>`);
  const schema='<script type="application/ld+json" data-product-schema>'+JSON.stringify(productSchema(product,url,image)).replace(/</g,'\\u003c')+'</script>';
  out=out.replace(/\s*<script type="application\/ld\+json" data-product-schema>[\s\S]*?<\/script>/g,'').replace(/\s*<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"Product"[\s\S]*?<\/script>/g,'');
  out=out.replace('</head>',schema+'\n</head>');
  if(!out.includes('class="mg-trust"')&&!out.includes('why-mikee-gadget-plug-bar'))out=out.replace('</header>','</header>'+TRUST);
 }else{
  // Shell-derived pages inherit the homepage's social tags; make them describe the page itself.
  const title=out.match(/<title>([\s\S]*?)<\/title>/)?.[1],canonical=out.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if(path&&title&&/<meta property="og:title" content="UK Used iPhones in Ikeja \| Mikee Gadget Plug">/.test(out))out=out.replace(/<meta property="og:title"[^>]*>/,`<meta property="og:title" content="${title}">`);
  if(path&&canonical&&/<meta property="og:url" content="https:\/\/www\.mikeegadget\.com\.ng\/">/.test(out))out=out.replace(/<meta property="og:url"[^>]*>/,`<meta property="og:url" content="${canonical}">`);
 }
 // X (Twitter) cards mirror the page's own Open Graph tags, so a shared link shows the same title, text and image.
 {const og=k=>out.match(new RegExp(`<meta property="og:${k}" content="([^"]*)"`))?.[1];out=out.replace(/\s*<meta name="twitter:[a-z:]+"[^>]*>/g,'');
  const title=og('title'),desc=og('description')||out.match(/<meta name="description" content="([^"]*)"/)?.[1],img=og('image');
  if(title)out=out.replace('</head>',`<meta name="twitter:card" content="${img?'summary_large_image':'summary'}"><meta name="twitter:title" content="${title}">${desc?`<meta name="twitter:description" content="${desc}">`:''}${img?`<meta name="twitter:image" content="${img}"><meta name="twitter:image:alt" content="${title}">`:''}\n</head>`);}
 return out;
}
async function* pages(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(e.isDirectory()){if(!SKIP.has(e.name))yield* pages(join(dir,e.name));}else if(e.name==='index.html')yield join(dir,e.name);}}
if(process.argv[1]?.endsWith('apply-experience.mjs')){let changed=0;for await(const file of pages('.')){const html=await readFile(file,'utf8'),next=applyExperience(html,file);if(next!==html){await writeFile(file,next);changed++;}}console.log('experience applied to',changed,'pages');}
