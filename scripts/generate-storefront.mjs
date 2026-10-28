import {retailInventory} from '../commerce/retail-inventory.mjs';
import {buildFamilies} from '../commerce/discovery.mjs';
import {familyCard,selectionPanel} from '../assets/discovery-ui.mjs';
const families=buildFamilies(retailInventory);
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {categories,shopCategories,storeItems} from '../commerce/storefront-data.mjs';
import {card,media,escape,priceText} from '../assets/storefront-ui.mjs';
import {commerceSite as site} from '../commerce/catalog.mjs';
import {featuredDeals} from '../commerce/offers.mjs';
let html=await readFile('templates/home.html.template','utf8');
html=html.replace('{{COLOUR_OPTIONS}}',[...new Set(storeItems.flatMap(item=>item.variants.flatMap(v=>v.color?.split('/').map(c=>c.trim())||[])))].sort().map(c=>`<option>${escape(c)}</option>`).join(''));
const trust=html.match(/<div class="trust-loop">([\s\S]*?)<\/div>/)?.[1]||'';
html=html.replace('{{TRUST_DUPLICATE}}','<div class="trust-loop" aria-hidden="true">'+trust+'</div>');
const categoryHtml=categories.map(c=>`<a class="category-tile" href="${c.route}" data-category="${c.id}">${media(c.image,c.name)}<strong>${c.name}</strong><span aria-hidden="true">Shop ↗</span></a>`).join('');
html=html.replace('{{SERIES_OPTIONS}}',[...new Set(storeItems.map(p=>p.series).filter(Boolean))].map(series=>`<option value="${series}">iPhone ${series}</option>`).join('')).replace('{{CATEGORIES}}',categoryHtml).replace('{{CATEGORY_OPTIONS}}',categories.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')).replace('{{PRODUCTS}}',families.filter(p=>p.variants.some(v=>v.price>0)).slice(0,8).map(familyCard).join('')).replace('{{HOT_DEALS}}',featuredDeals(storeItems).map(card).join('')||'<p class="empty-deals">Current catalogue prices are shown above. Contact Mikee to ask about current offers.</p>');
await writeFile('index.html',html);
await writeFile('assets/discovery-catalog.json',JSON.stringify(families));
await writeFile('assets/store-catalog.json',JSON.stringify(storeItems));
// Dedicated enquiry pages keep category browsing on the site until customers are ready.
for(const c of shopCategories){
 const title=`${c.name} in Ikeja | Mikee Gadget Plug`;
 const description=`Shop ${c.name} at Mikee Gadget Plug in Computer Village, Ikeja. Find a device for work, play and everyday use. Store pickup or delivery across Nigeria.`;
 const url=`${site.baseUrl}${c.route}`;
 const contact=`https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(`Hello Mikee Gadget Plug, I’m interested in ${c.name}. Please send the available models, condition, prices and payment options.`)}`;
 const listings=families.filter(item=>item.category===c.id);
 const listingSection=listings.length?`<section class="store-section category-products"><div class="store-heading"><div><p class="eyebrow">CURRENT CATALOGUE</p><h2>Available ${escape(c.name)}</h2></div><p>Confirm the exact unit, price and availability before payment.</p></div><div class="product-grid">${listings.map(familyCard).join('')}</div></section>`:`<section class="store-section category-products"><div class="store-heading"><div><p class="eyebrow">ASK MIKEE</p><h2>Check current ${escape(c.name)} options</h2></div><p>Message the store for current models, prices and availability.</p></div></section>`;
 const ogImage=c.image||'/images/store/mikee-shop-1280.webp';
 const page=html.replace(/<main id="main">[\s\S]*?<\/main>/,`<main id="main" class="store-section category-detail"><a class="text-link" href="/?category=${c.id}#products">← Back to devices</a><div class="category-detail-grid">${media(c.image,c.name,true)}<div><p class="eyebrow">MIKEE GADGET PLUG</p><h1>${escape(c.name)}</h1><p>Find your next upgrade. Shop in Computer Village or order for delivery.</p><a class="btn btn-primary" href="${contact}">See options on WhatsApp ↗</a><dl><div><dt>Price &amp; stock</dt><dd>Models and prices vary. Check availability before payment.</dd></div><div><dt>Collection</dt><dd>Pickup in Ikeja or delivery across Nigeria</dd></div><div><dt>Payment</dt><dd>Pay outright. EasyBuy is subject to device eligibility and approval.</dd></div></dl><a class="call-link" href="tel:${site.telephoneHref}">Call ${site.telephoneDisplay}</a></div></div>${listingSection}</main>`).replace(/<title>.*?<\/title>/,`<title>${escape(title)}</title>`)
 .replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${escape(description)}">`)
 .replace(/<meta name="keywords"[^>]*>\s*/, '')
 .replace(/<meta property="og:title"[^>]*>/,`<meta property="og:title" content="${escape(title)}">`)
 .replace(/<meta property="og:description"[^>]*>/,`<meta property="og:description" content="${escape(description)}">`)
 .replace(/<meta property="og:url"[^>]*>/,`<meta property="og:url" content="${escape(url)}">`)
 .replace(/<meta property="og:image"[^>]*>/,`<meta property="og:image" content="${escape(site.baseUrl+ogImage)}">`)
 .replace(/<link rel="canonical"[^>]*>/,`<link rel="canonical" href="${escape(url)}" />`)
 .replace('data-landing-page="/" data-page-type="home"',`data-landing-page="${c.route}" data-page-type="category"`).replace(/href="#(products|categories|visit)"/g,'href="/#$1"');
 await mkdir(`shop/${c.id}`,{recursive:true});await writeFile(`shop/${c.id}/index.html`,page);
}
console.log(`Generated storefront, compact catalogue and ${shopCategories.length} gadget category pages.`);

// Full universal search page and non-phone detail pages share the same shell.
const searchMain=html.match(/<section class="store-section filters-section"[\s\S]*?<\/section>/)[0];
await mkdir('search',{recursive:true});
await writeFile('search/index.html',html.replace(/<main id="main">[\s\S]*?<\/main>/,`<main id="main">${searchMain}</main>`).replace(/<title>.*?<\/title>/,'<title>Search all gadgets | Mikee Gadget Plug</title>').replace(/<link rel="canonical"[^>]*>/,`<link rel="canonical" href="${site.baseUrl}/search/">`).replace('data-landing-page="/" data-page-type="home"','data-landing-page="/search/" data-page-type="search"').replace(/href="#(products|categories|visit)"/g,'href="/#$1"'));
for(const family of families.filter(f=>!f.easy)){
 const path=family.route.replace(/^\//,'');await mkdir(path,{recursive:true});
 const main=`<main id="main" class="store-section"><a href="/search/">← All gadgets</a><section class="category-detail-grid">${media(family.image,family.model,true)}<div><h1>${escape(family.model)}</h1>${selectionPanel(family)}</div></section></main>`;
 await writeFile(`${path}/index.html`,html.replace(/<meta property="og:title"[^>]*>/,`<meta property="og:title" content="${escape(family.model)} | Mikee Gadget Plug">`).replace(/<meta property="og:url"[^>]*>/,`<meta property="og:url" content="${site.baseUrl}${family.route}">`).replace(/<meta (name="description"|property="og:description")[^>]*>/g,(_,attribute)=>`<meta ${attribute} content="Explore ${escape(family.model)} configurations and listed prices. Confirm the exact unit with Mikee Gadget Plug.">`).replace(/<main id="main">[\s\S]*?<\/main>/,main).replace(/<title>.*?<\/title>/,`<title>${escape(family.model)} | Mikee Gadget Plug</title>`).replace(/<link rel="canonical"[^>]*>/,`<link rel="canonical" href="${site.baseUrl}${family.route}">`).replace('data-landing-page="/" data-page-type="home"',`data-landing-page="${family.route}" data-page-type="product"`).replace(/href="#(products|categories|visit)"/g,'href="/#$1"'));
}

const sitemap=await readFile('sitemap.xml','utf8');
const newRoutes=families.filter(f=>!f.easy).map(f=>f.route);
await writeFile('sitemap.xml',sitemap.replace('</urlset>',newRoutes.filter(route=>!sitemap.includes(`<loc>${site.baseUrl}${route}</loc>`)).map(route=>`  <url><loc>${site.baseUrl}${route}</loc></url>\n`).join('')+'</urlset>'));
