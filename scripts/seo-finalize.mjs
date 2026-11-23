// Last build step: search and AI-search essentials across every generated page. Idempotent.
//  1. One accurate business graph (Organization + WebSite + store) in place of the old LocalBusiness block.
//  2. Alias pages point their canonical at the main page (/swap/ → /phone-swap, Easy Buy aliases → /financing/).
//  3. FAQ, About and Contact pages get matching structured data.
//  4. sitemap.xml lists only indexable, self-canonical, non-redirected pages; robots.txt and llms.txt are written.
import {readdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {SITE,BUSINESS,BUYER_FAQS,organizationGraph,faqLd,ldScript,ROBOTS_TXT,sitemapXml,sitemapUrls} from '../commerce/seo.mjs';

const SKIP=new Set(['node_modules','.git','.vercel','supabase','tests','docs','templates','landing-pages','scripts','commerce','api','assets','images']);
export const ALIASES={'swap':`${SITE}/phone-swap`,'easybuy':`${SITE}/financing/`,'easy-buy':`${SITE}/financing/`};
const LEGACY_GRAPH=/<script type="application\/ld\+json">\s*\{\s*"@context":\s*"https:\/\/schema\.org",\s*"@graph":\s*\[[\s\S]*?#localbusiness[\s\S]*?<\/script>/;
const ORG=/<script type="application\/ld\+json" data-org>[\s\S]*?<\/script>/;
const pageLd={
 faq:()=>faqLd(BUYER_FAQS),
 about:()=>({'@context':'https://schema.org','@type':'AboutPage',url:`${SITE}/about/`,name:'About Mikee Gadget Plug',about:{'@id':`${SITE}/#organization`}}),
 contact:()=>({'@context':'https://schema.org','@type':'ContactPage',url:`${SITE}/contact/`,name:'Contact Mikee Gadget Plug',about:{'@id':`${SITE}/#organization`}}),
};

export function finalizePage(html,path){
 let out=html;
 const org=ldScript(organizationGraph()).replace('<script type="application/ld+json">','<script type="application/ld+json" data-org>');
 if(ORG.test(out))out=out.replace(ORG,()=>org);else if(LEGACY_GRAPH.test(out))out=out.replace(LEGACY_GRAPH,()=>org);
 else if(path===''&&/<\/head>/.test(out))out=out.replace('</head>',org+'\n</head>');
 if(path==='' && !out.includes('data-hero-poster-preload')) {
  const poster=out.match(/<video\b[^>]*\bid="heroVideo"[^>]*\bposter="(\/assets\/hero\/[\w.-]+)"/)?.[1];
  if(poster)out=out.replace('</head>',`<link data-hero-poster-preload rel="preload" as="image" href="${poster}" fetchpriority="high">\n</head>`);
 }
 if(ALIASES[path]){
  out=out.replace(/<link rel="canonical"[^>]*>/,`<link rel="canonical" href="${ALIASES[path]}">`).replace(/<meta property="og:url"[^>]*>/,`<meta property="og:url" content="${ALIASES[path]}">`);
 }
 if(pageLd[path]){const tag=`<script type="application/ld+json" data-page-ld>`;out=out.replace(/<script type="application\/ld\+json" data-page-ld>[\s\S]*?<\/script>\s*/,'');
  out=out.replace('</head>',ldScript(pageLd[path]()).replace('<script type="application/ld+json">',tag)+'\n</head>');}
 // Analytics (GA4 + Microsoft Clarity) on every public page; never on admin pages.
 if(!/^admin(\/|$)/.test(path)&&!out.includes('/assets/site-analytics.js')&&out.includes('</head>'))out=out.replace('</head>','<script src="/assets/site-analytics.js"></script>\n</head>');
 // Pages showing a customer's own details are masked in Clarity recordings.
 if(/^(checkout|checkout\/complete|account|buy)$/.test(path))out=out.replace(/<main(?![^>]*data-clarity-mask)/,'<main data-clarity-mask="true"');
 return out;
}
export const LLMS_TXT=`# Mikee Gadget Plug

> Phone and gadget store in Computer Village, Ikeja, Lagos, Nigeria (MIKEEGADGETS & COMMUNICATIONS LIMITED). Sells UK-used and brand-new iPhones, Samsung Galaxy and Google Pixel phones, iPads, tablets, smartwatches, AirPods and accessories, with delivery across Nigeria. Prices on product pages are live from the store's catalogue, in Nigerian naira.

- Store: ${BUSINESS.street}, ${BUSINESS.locality}, ${BUSINESS.region}. Opens at 10am. Phone/WhatsApp: 0708 686 5133. Email: ${BUSINESS.email}
- All phones have battery health above 85%; every iPhone has working Face ID. 7-day warranty on every device.
- Payment: card (Paystack), bank transfer, Pay Small Small with Credit Direct, or pay at store pickup. iPhones: 50% down payment option in store.

## Shop
- [iPhones](${SITE}/iphones): UK-used and brand-new iPhones with prices
- [Samsung phones](${SITE}/samsung-phones)
- [Google Pixel phones](${SITE}/google-pixel-phones)
- [UK-used iPhones](${SITE}/uk-used-iphones)
- [Hot Deals](${SITE}/deals/)
- [All devices](${SITE}/search/)

## Buying information
- [FAQ](${SITE}/faq/): battery health, Face ID, UK Used vs Brand New, warranty, delivery, payment, swaps
- [About](${SITE}/about/) · [Contact](${SITE}/contact/)
- [Delivery policy](${SITE}/delivery-policy/) · [Warranty](${SITE}/warranty-policy/) · [Returns and refunds](${SITE}/returns-refunds/)
- [Pay Small Small](${SITE}/financing/) · [Phone swap](${SITE}/phone-swap)
`;

async function* walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(e.isDirectory()){if(!SKIP.has(e.name)&&!e.name.startsWith('.'))yield* walk(join(dir,e.name));}else if(e.name==='index.html')yield join(dir,e.name);}}
if(process.argv[1]?.endsWith('seo-finalize.mjs')){
 const pages=[];let changed=0;
 for await(const file of walk('.')){
  const path=file.replace(/\\/g,'/').replace(/^\.\//,'').replace(/\/?index\.html$/,'');
  const html=await readFile(file,'utf8'),next=finalizePage(html,path);
  if(next!==html){await writeFile(file,next);changed++;}
  pages.push({path,canonical:next.match(/<link rel="canonical" href="([^"]+)"/)?.[1],robots:next.match(/<meta name="robots" content="([^"]+)"/)?.[1]});
 }
 const vercel=JSON.parse(await readFile('vercel.json','utf8'));
 const urls=sitemapUrls(pages,{redirectSources:(vercel.redirects||[]).map(r=>r.source)});
 await writeFile('sitemap.xml',sitemapXml(urls));await writeFile('robots.txt',ROBOTS_TXT);await writeFile('llms.txt',LLMS_TXT);
 console.log(`SEO finalize: ${changed} pages updated, ${urls.length} URLs in sitemap.xml`);
}
