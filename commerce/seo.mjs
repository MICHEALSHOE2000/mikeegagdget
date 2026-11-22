// Search and AI-search helpers: who the business is (structured data), the crawl rules (robots.txt), the sitemap,
// and shared buyer FAQs. Every fact here is verified: from the site's policy pages, checkout, or the owner
// (21–22 Nov 2026). Nothing is guessed: no opening-hours closing time, no ratings, no registration number.
export const SITE='https://www.mikeegadget.com.ng';
export const BUSINESS={
 name:'Mikee Gadget Plug',legalName:'MIKEEGADGETS & COMMUNICATIONS LIMITED',alternateNames:['Mikee Gadget','Mikee Gadgets'],
 phone:'+2347086865133',email:'support@mikeegadget.com.ng',whatsapp:'https://wa.me/2347086865133',
 street:'1 Ola Ayeni Street, Off Simbiat Abiola Way, Computer Village',locality:'Ikeja',region:'Lagos',country:'NG',
 geo:{latitude:6.6018,longitude:3.3515},opens:'10:00',
 logo:`${SITE}/apple-touch-icon.png`,image:`${SITE}/images/store/mikee-shop-1280.webp`,
};
const address={'@type':'PostalAddress',streetAddress:BUSINESS.street,addressLocality:BUSINESS.locality,addressRegion:BUSINESS.region,addressCountry:BUSINESS.country};
/** Organization + WebSite + store graph, used on every page that carried the old LocalBusiness block. */
export function organizationGraph(){
 return {'@context':'https://schema.org','@graph':[
  {'@type':'Organization','@id':`${SITE}/#organization`,name:BUSINESS.name,legalName:BUSINESS.legalName,alternateName:BUSINESS.alternateNames,url:`${SITE}/`,logo:BUSINESS.logo,image:BUSINESS.image,
   email:BUSINESS.email,telephone:BUSINESS.phone,address,sameAs:[BUSINESS.whatsapp],
   contactPoint:[{'@type':'ContactPoint',contactType:'customer service',telephone:BUSINESS.phone,email:BUSINESS.email,areaServed:'NG',availableLanguage:['en']}],
   hasMerchantReturnPolicy:{'@type':'MerchantReturnPolicy',applicableCountry:'NG',returnPolicyCategory:'https://schema.org/MerchantReturnFiniteReturnWindow',merchantReturnDays:7,merchantReturnLink:`${SITE}/returns-refunds/`}},
  {'@type':'WebSite','@id':`${SITE}/#website`,url:`${SITE}/`,name:BUSINESS.name,inLanguage:'en-NG',publisher:{'@id':`${SITE}/#organization`},
   potentialAction:{'@type':'SearchAction',target:{'@type':'EntryPoint',urlTemplate:`${SITE}/search/?q={search_term_string}`},'query-input':'required name=search_term_string'}},
  {'@type':['MobilePhoneStore','ElectronicsStore'],'@id':`${SITE}/#store`,name:BUSINESS.name,parentOrganization:{'@id':`${SITE}/#organization`},url:`${SITE}/`,image:BUSINESS.image,
   telephone:BUSINESS.phone,email:BUSINESS.email,address,geo:{'@type':'GeoCoordinates',...BUSINESS.geo},areaServed:{'@type':'Country',name:'Nigeria'},
   currenciesAccepted:'NGN',paymentAccepted:'Card (Paystack), Bank transfer, Credit Direct instalments, Cash at store pickup',
   hasMap:'https://www.google.com/maps/search/?api=1&query=1%20Ola%20Ayeni%20Street%20Ikeja%20Lagos',
   description:'Phone and gadget store in Computer Village, Ikeja, Lagos selling UK-used and brand-new iPhones, Samsung and Google Pixel phones, iPads, tablets, smartwatches, AirPods and accessories, with delivery across Nigeria.'}]};
}
export const ldScript=obj=>`<script type="application/ld+json">${JSON.stringify(obj).replace(/</g,'\\u003c')}</script>`;
export function itemListLd(name,url,items){return {'@context':'https://schema.org','@type':'ItemList',name,url,numberOfItems:items.length,itemListElement:items.map((it,i)=>({'@type':'ListItem',position:i+1,name:it.name,url:it.url}))};}
export function faqLd(list){return {'@context':'https://schema.org','@type':'FAQPage',mainEntity:list.map(f=>({'@type':'Question',name:f.q,acceptedAnswer:{'@type':'Answer',text:f.a}}))};}

// Questions Nigerian gadget buyers ask, with the store's verified answers.
export const BUYER_FAQS=[
 {q:'Where is Mikee Gadget Plug located?',a:'Our store is at 1 Ola Ayeni Street, Off Simbiat Abiola Way, Computer Village, Ikeja, Lagos. You can visit to see, test and buy phones in person.'},
 {q:'What time does the store open?',a:'Our Computer Village store opens at 10am.'},
 {q:'Who owns Mikee Gadget Plug?',a:'Mikee Gadget Plug is the trading name of MIKEEGADGETS & COMMUNICATIONS LIMITED, a gadget retailer in Computer Village, Ikeja, Lagos.'},
 {q:'What is the battery health of your UK-used phones?',a:'All our phones have battery health above 85%. You can check the exact reading when you inspect the phone.'},
 {q:'Does Face ID work on your iPhones?',a:'Yes. Every iPhone we sell has working Face ID.'},
 {q:'What is the difference between UK Used and Brand New?',a:'Brand New phones are new and unused. UK Used phones are pre-owned, with battery health above 85% and working Face ID on iPhones. Both come with our 7-day warranty.'},
 {q:'Do your phones come with a warranty?',a:'Yes. Every device comes with a 7-day warranty from the day you receive or collect it. It covers faults present when you got the device.'},
 {q:'Can I return a phone?',a:'Refunds or replacements are for a verified factory defect, a fault present at delivery, or the wrong item, reported within 7 days with the original packaging and accessories. Change of mind after delivery is not refundable.'},
 {q:'Do you deliver outside Lagos?',a:'Yes. We deliver to homes across Lagos (the fee depends on your Local Government Area) and send orders to a transport park in every other state. The exact fee is shown at checkout, and pickup at our store is free.'},
 {q:'How can I pay?',a:'You can pay by card through Paystack, by bank transfer, with Pay Small Small through Credit Direct, or reserve online and pay when you pick up at our store.'},
 {q:'Can I buy a phone and pay small small?',a:'Yes. Check how much you qualify for at https://www.creditdirect.ng/know-your-limit, then choose Pay Small Small at checkout; Credit Direct decides approval and repayments. In our shop, you can also get an iPhone with a 50% down payment.'},
 {q:'Can I swap my old phone for a new one?',a:'Yes. You can get an estimate for your iPhone on our swap page or from Mikee AI on our website. The final value is confirmed when we inspect your phone in store, and you pay the difference.'},
 {q:'Can I inspect a phone before paying?',a:'Yes. If you buy in store or choose pickup, you can inspect and test the device before paying.'},
 {q:'Are prices on the website current?',a:'Yes. Product pages show the current price for each storage and condition, and Hot Deals show the original price crossed out.'},
];

/** robots.txt: everything public is open to search and AI search crawlers; private and transactional paths are not. */
export const ROBOTS_TXT=`# Mikee Gadget Plug — crawl rules
# Search engines and AI search crawlers (Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User and others) may crawl
# every public page. Account, checkout, admin and API paths are private and not useful in search.
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/
Disallow: /cart/
Disallow: /account/
Disallow: /buy/

Sitemap: ${SITE}/sitemap.xml
`;

export function sitemapXml(urls){
 const esc=s=>s.replace(/&/g,'&amp;');
 return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url><loc>${esc(u)}</loc></url>`).join('\n')}\n</urlset>\n`;
}
/** Which built pages belong in the sitemap: indexable, self-canonical, not redirected elsewhere. */
export function sitemapUrls(pages,{redirectSources=[]}={}){
 const redirected=new Set(redirectSources.map(s=>s.replace(/\/+$/,'')||'/'));
 const out=new Set();
 for(const p of pages){
  if(/noindex/i.test(p.robots||''))continue;
  if(!p.canonical||!p.canonical.startsWith(SITE))continue;
  const own=(SITE+'/'+p.path).replace(/\/+$/,''),canon=p.canonical.replace(/\/+$/,'');
  if(canon!==own&&!(p.path===''&&canon===SITE))continue;
  const path=new URL(p.canonical).pathname.replace(/\/+$/,'')||'/';
  if(redirected.has(path))continue;
  out.add(p.canonical);
 }
 return [...out].sort((a,b)=>a===SITE+'/'?-1:b===SITE+'/'?1:a.localeCompare(b));
}
