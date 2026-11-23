// Premium iPad showcase for /shop/ipads/: lineup tiles, a model / storage / connectivity / colour picker per line,
// "Buy online" and "Shop from store", and a warranty banner. Runs after the shopping pages are generated and
// only adds a section above the existing catalogue grid, which stays as it was.
import {readFile,writeFile} from 'node:fs/promises';
import {retailInventory} from '../commerce/retail-inventory.mjs';
import {commerceSite} from '../commerce/catalog.mjs';

const FILE='shop/ipads/index.html';
const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const money=n=>'₦'+Number(n).toLocaleString('en-NG');
const LINES=[
 {id:'pro',name:'iPad Pro',tag:'The ultimate iPad',copy:'Pro performance, standard glass, in 13-inch and 11-inch.'},
 {id:'air',name:'iPad Air',tag:'Serious power. Light as air.',copy:'M3 and M4 chips in 13-inch and 11-inch sizes.'},
 {id:'mini',name:'iPad mini',tag:'Mega power. Mini sized.',copy:'Everything iPad, in a size that fits one hand.'},
 {id:'ipad',anchor:'ipad-classic',name:'iPad',tag:'Lovable. Drawable. Magical.',copy:'The everyday iPad for school, work and play.'},
];
// A colour is a choice only when the SKU is one colour ("Blue/Silver/Pink" lists what the store may have).
const parts=v=>{const [capacity,link='',color='']=v.storage.split(' · ').map(s=>s.trim());const c=v.color||color||'';return {capacity,link:/cell|lte/i.test(link)?'Wi‑Fi + Cellular':'Wi‑Fi',color:c.includes('/')?'':c};};
const sellable=v=>v.price>0&&v.enabled!==false&&!v.reviewRequired;
const products=retailInventory.filter(p=>p.category==='ipads'&&p.ipadLine).map(p=>({
 slug:p.slug,model:p.model,line:p.ipadLine,size:p.ipadSize,chip:p.ipadChip||'',condition:p.condition,
 image:p.image||'',label:(p.ipadLine==='ipad'?p.model.replace(/^iPad\s*/,''):[p.ipadSize,p.ipadChip].filter(Boolean).join(' '))+(p.condition==='UK Used'?' · UK Used':''),
 variants:p.variants.filter(sellable).map(v=>({sku:`${p.slug}|${v.storage}`,...parts(v),price:v.price,was:v.compareAtPrice>v.price?v.compareAtPrice:null,condition:v.condition||p.condition}))
})).filter(p=>p.variants.length);
const sizeRank=s=>-parseFloat(s)||0;
products.sort((a,b)=>sizeRank(a.size)-sizeRank(b.size)||(b.chip||'').localeCompare(a.chip||'')||(a.condition==='UK Used')-(b.condition==='UK Used')||b.model.localeCompare(a.model,'en',{numeric:true}));
const minPrice=list=>Math.min(...list.flatMap(p=>p.variants.map(v=>v.price)));
// Tiles prefer the owner's own photo; licensed reference shots and placeholders come after.
const lineImage=list=>(list.find(p=>p.image&&/^\/images\/store\/[^/]+-1-720\.webp$/.test(p.image))||list[0]).image;
const img=(src,alt,cls='')=>src?`<img class="${cls}" src="${esc(src)}" alt="${esc(alt)}" width="360" height="400" loading="lazy" decoding="async">`:'';
const storeLink='/contact/';

const tiles=LINES.map(l=>{const list=products.filter(p=>p.line===l.id);if(!list.length)return '';const sizes=[...new Set(list.map(p=>p.size))];
 return `<a class="ipx-tile" href="#${l.anchor||'ipad-'+l.id}">${img(lineImage(list),l.name)}<span class="ipx-tile-name">${esc(l.name)}</span><span class="ipx-tile-sizes">${esc(sizes.join(' · '))}</span><span class="ipx-tile-from">From ${money(minPrice(list))}</span><span class="ipx-tile-cta">Explore <span aria-hidden="true">→</span></span></a>`;}).join('');

const detail=l=>{const list=products.filter(p=>p.line===l.id);if(!list.length)return '';const p=list[0],v=p.variants[0];
 return `<article class="ipx-line" id="${l.anchor||'ipad-'+l.id}" data-line="${l.id}"><div class="ipx-media">${img(p.image,p.model,'ipx-photo')}</div><div class="ipx-info">
<p class="ipx-eyebrow">${esc(l.tag)}</p><h2>${esc(l.name)}</h2><p class="ipx-copy">${esc(l.copy)}</p>
<div class="ipx-group" role="radiogroup" aria-label="${esc(l.name)} model">${list.map((m,i)=>`<button type="button" class="ipx-pill${i?'':' is-on'}" data-model="${esc(m.slug)}" aria-pressed="${i?'false':'true'}">${esc(m.label||m.model)}</button>`).join('')}</div>
<p class="ipx-label">Storage</p><div class="ipx-group" data-choice="capacity"></div>
<p class="ipx-label">Connectivity</p><div class="ipx-group" data-choice="link"></div>
<div class="ipx-colours" data-choice-wrap="color" hidden><p class="ipx-label">Colour <span data-colour-name></span></p><div class="ipx-group" data-choice="color"></div></div>
<div class="ipx-buy"><p class="ipx-price" aria-live="polite"><span class="ipx-was" data-was>${v.was?`<del>${money(v.was)}</del>`:''}</span><strong data-price>${money(v.price)}</strong><span class="ipx-save" data-save>${v.was?`Save ${money(v.was-v.price)}`:''}</span></p>
<p class="ipx-stock" data-stock><span aria-hidden="true">●</span> In stock · ${esc(v.condition)}</p>
<div class="ipx-actions"><a class="ipx-btn ipx-btn-primary" data-buy href="/${esc(p.slug)}/?sku=${encodeURIComponent(v.sku)}">Buy online</a><a class="ipx-btn ipx-btn-ghost" href="${storeLink}">Shop from store</a></div>
<p class="ipx-note">Pay with Paystack, bank transfer or Pay Small Small. Pickup at 1 Ola Ayeni Street, Computer Village, or delivery nationwide.</p></div></div></article>`;};

const section=`<section class="ipx" aria-labelledby="ipx-title">
<div class="ipx-hero"><p class="ipx-kicker">APPLE iPAD · BRAND NEW</p><h2 id="ipx-title">iPad. <span>Find the one for you.</span></h2><p>iPad Pro, iPad Air, iPad mini and iPad, ready in Computer Village. Test before you pay, or order online.</p>
<ul class="ipx-trust"><li>Genuine Apple</li><li>7-day warranty</li><li>Test before you pay</li><li>Pay Small Small</li></ul></div>
<nav class="ipx-lineup" aria-label="iPad lineup">${tiles}</nav>
${LINES.map(detail).join('')}
<div class="ipx-warranty"><div><p class="ipx-kicker">PEACE OF MIND</p><h2>Every iPad is covered by our 7-day warranty.</h2><p>Inspect and test your iPad in store before you pay. Questions? Our team will help you choose.</p></div><div class="ipx-actions"><a class="ipx-btn ipx-btn-gold" href="/warranty-policy/">Warranty details</a><a class="ipx-btn ipx-btn-light" href="https://wa.me/${esc(commerceSite.whatsappNumber)}?text=${encodeURIComponent('Hello Mikee Gadget Plug, I need help choosing an iPad.')}" target="_blank" rel="noopener">Chat with us</a></div></div>
<script type="application/json" id="ipx-data">${JSON.stringify(products).replaceAll('<','\\u003c')}</script>
</section>`;

let page=await readFile(FILE,'utf8');
if(page.includes('class="ipx"'))page=page.replace(/<section class="ipx"[\s\S]*?<\/section>\s*(?=<section class="store-section filters-section")/,'');
const at=page.indexOf('<section class="store-section filters-section"');
if(at<0)throw Error('iPad showcase: catalogue grid not found on '+FILE);
page=page.slice(0,at)+section+page.slice(at);
page=page.replace('<h1 class="catalog-title">iPads</h1>','<h1 class="catalog-title">iPads</h1><p class="ipx-intro">Brand New iPad Pro, iPad Air, iPad mini and iPad, with UK Used options. Prices in Naira.</p>');
if(!page.includes('/assets/ipad-showcase.css'))page=page.replace('</head>','<link rel="stylesheet" href="/assets/ipad-showcase.css"></head>').replace('</body>','<script type="module" src="/assets/ipad-showcase.js"></script></body>');
await writeFile(FILE,page);
console.log(`iPad showcase: ${products.length} models in ${LINES.filter(l=>products.some(p=>p.line===l.id)).length} lines.`);
