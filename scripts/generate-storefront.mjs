import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {categories,storeItems} from '../commerce/storefront-data.mjs';
import {card,media,escape} from '../assets/storefront-ui.mjs';
import {commerceSite as site} from '../commerce/catalog.mjs';
let html=await readFile('templates/home.html.template','utf8');
const categoryHtml=categories.map(c=>`<a class="category-tile" href="/?category=${c.id}#products" data-category="${c.id}">${media(c.image,c.name)}<strong>${c.name}</strong><span aria-hidden="true">↗</span></a>`).join('');
html=html.replace('{{CATEGORIES}}',categoryHtml).replace('{{CATEGORY_OPTIONS}}',categories.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')).replace('{{PRODUCTS}}',storeItems.slice(0,8).map(card).join(''));
await writeFile('index.html',html);
await writeFile('assets/store-catalog.json',JSON.stringify(storeItems));
// Dedicated enquiry pages keep category browsing on the site until customers are ready.
for(const c of categories.slice(3)){
 const contact=`https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(`Hello Mikee Gadget Plug, I’m interested in ${c.name}. Please send the available models, condition, prices and payment options.`)}`;
 const page=html.replace(/<main id="main">[\s\S]*?<\/main>/,`<main id="main" class="store-section category-detail"><a class="text-link" href="/?category=${c.id}#products">← Back to devices</a><div class="category-detail-grid">${media(c.image,c.name,true)}<div><p class="eyebrow">MIKEE GADGET PLUG</p><h1>${escape(c.name)}</h1><p>Choose your model, condition and budget. We’ll send you the current options.</p><dl><div><dt>Price &amp; stock</dt><dd>Confirm current options</dd></div><div><dt>Collection</dt><dd>Pickup in Ikeja or delivery across Nigeria</dd></div><div><dt>Payment</dt><dd>Pay outright. Ask about EasyBuy eligibility.</dd></div></dl><a class="btn btn-primary" href="${contact}">See options on WhatsApp ↗</a><a class="call-link" href="tel:${site.telephoneHref}">Call ${site.telephoneDisplay}</a></div></div></main>`).replace(/<title>.*?<\/title>/,`<title>${c.name} | Mikee Gadget Plug</title>`).replace('href="https://www.mikeegagdget.vercel.app/" />',`href="${site.baseUrl}/shop/${c.id}/" />`).replace(/href="#(products|categories|visit)"/g,'href="/#$1"');
 await mkdir(`shop/${c.id}`,{recursive:true});await writeFile(`shop/${c.id}/index.html`,page);
}
console.log('Generated storefront, compact catalogue and 7 gadget category pages.');
