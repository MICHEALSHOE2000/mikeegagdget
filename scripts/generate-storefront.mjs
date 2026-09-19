import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {categories,shopCategories,storeItems} from '../commerce/storefront-data.mjs';
import {card,media,escape} from '../assets/storefront-ui.mjs';
import {productImages} from '../commerce/product-images.mjs';
import {commerceSite as site} from '../commerce/catalog.mjs';
let html=await readFile('templates/home.html.template','utf8');
for(const [token,model] of [['HERO_PRIMARY','iPhone 17 Pro'],['HERO_SECOND','iPhone 17 Pro Max'],['HERO_THIRD','iPhone 16 Pro Max']]) {
 const src=productImages[model].preferred || productImages[model].image;
 html=html.replaceAll(`{{${token}}}`,src).replaceAll(`{{${token}_THUMB}}`,src.replace('-720.webp','-360.webp'));
}
const categoryHtml=categories.map(c=>`<a class="category-tile" href="${c.route}" data-category="${c.id}">${media(c.image,c.name)}<strong>${c.name}</strong><span aria-hidden="true">Shop ↗</span></a>`).join('');
html=html.replace('{{SERIES_OPTIONS}}',[...new Set(storeItems.map(p=>p.series).filter(Boolean))].map(series=>`<option value="${series}">iPhone ${series}</option>`).join('')).replace('{{CATEGORIES}}',categoryHtml).replace('{{CATEGORY_OPTIONS}}',categories.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')).replace('{{PRODUCTS}}',storeItems.slice(0,8).map(card).join(''));
await writeFile('index.html',html);
await writeFile('assets/store-catalog.json',JSON.stringify(storeItems));
// Dedicated enquiry pages keep category browsing on the site until customers are ready.
for(const c of shopCategories){
 const title=`${c.name} in Ikeja | Mikee Gadget Plug`;
 const description=`Shop ${c.name} at Mikee Gadget Plug in Computer Village, Ikeja. Find a device for work, play and everyday use. Store pickup or delivery across Nigeria.`;
 const url=`${site.baseUrl}${c.route}`;
 const contact=`https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(`Hello Mikee Gadget Plug, I’m interested in ${c.name}. Please send the available models, condition, prices and payment options.`)}`;
 const page=html.replace(/<main id="main">[\s\S]*?<\/main>/,`<main id="main" class="store-section category-detail"><a class="text-link" href="/?category=${c.id}#products">← Back to devices</a><div class="category-detail-grid">${media(c.image,c.name,true)}<div><p class="eyebrow">MIKEE GADGET PLUG</p><h1>${escape(c.name)}</h1><p>Find your next upgrade. Shop in Computer Village or order for delivery.</p><dl><div><dt>Price &amp; stock</dt><dd>Models and prices vary. Check availability before payment.</dd></div><div><dt>Collection</dt><dd>Pickup in Ikeja or delivery across Nigeria</dd></div><div><dt>Payment</dt><dd>Pay outright. EasyBuy is subject to device eligibility and approval.</dd></div></dl><a class="btn btn-primary" href="${contact}">See options on WhatsApp ↗</a><a class="call-link" href="tel:${site.telephoneHref}">Call ${site.telephoneDisplay}</a></div></div></main>`).replace(/<title>.*?<\/title>/,`<title>${escape(title)}</title>`)
 .replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${escape(description)}">`)
 .replace(/<meta name="keywords"[^>]*>\s*/, '')
 .replace(/<meta property="og:title"[^>]*>/,`<meta property="og:title" content="${escape(title)}">`)
 .replace(/<meta property="og:description"[^>]*>/,`<meta property="og:description" content="${escape(description)}">`)
 .replace(/<meta property="og:url"[^>]*>/,`<meta property="og:url" content="${escape(url)}">`)
 .replace(/<meta property="og:image"[^>]*>/,`<meta property="og:image" content="${escape(site.baseUrl+c.image)}">`)
 .replace(/<link rel="canonical"[^>]*>/,`<link rel="canonical" href="${escape(url)}" />`)
 .replace('data-landing-page="/" data-page-type="home"',`data-landing-page="${c.route}" data-page-type="category"`).replace(/href="#(products|categories|visit)"/g,'href="/#$1"');
 await mkdir(`shop/${c.id}`,{recursive:true});await writeFile(`shop/${c.id}/index.html`,page);
}
console.log(`Generated storefront, compact catalogue and ${shopCategories.length} gadget category pages.`);
