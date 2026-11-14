// Reuse the approved homepage shell; preserve product content and canonical URLs.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {products,categoryPages} from '../commerce/catalog.mjs';
import {categories,storeItems} from '../commerce/storefront-data.mjs';
import {escape,card} from '../assets/storefront-ui.mjs';
const home=await readFile('index.html','utf8');
const header=home.match(/<header[\s\S]*?<\/header>/)[0].replace(/href="#/g,'href="/#');
const footer=home.match(/<footer[\s\S]*?<\/footer>/)[0].replace(/href="#/g,'href="/#');
const search=await readFile('search/index.html','utf8');
const routes=[...categories.map(c=>({path:c.route,name:c.name,category:c.id})),...categoryPages.filter(c=>!c.swap&&!c.easyBuy).map(c=>({path:c.route,name:c.h1,title:c.title,category:c.brand==='Apple'?'iphones':c.brand==='Samsung'?'samsung':c.brand==='Google'?'pixel':c.contentOnly||'',condition:c.condition||''}))];
for(const r of routes){let page=search.replace('data-page-type="home"',`data-page-type="category" data-category-scope="${r.category}" data-condition-scope="${r.condition||''}"`).replace('<h1 class="catalog-title">Find your next device</h1>',`<h1 class="catalog-title">${escape(r.name)}</h1>${r.category==='wifi-only'?'<p>WiFi Only iPhones: cellular calls, mobile data and SIM/eSIM may be unavailable. Exact limitations depend on the device and must be confirmed before purchase. Prices coming soon.</p>':''}`).replace(/<title>.*?<\/title>/,`<title>${escape(r.name)} | Mikee Gadget Plug</title>`).replace(/<link rel="canonical"[^>]*>/,`<link rel="canonical" href="https://www.mikeegadget.com.ng${r.path.replace(/\/$/,'')}/">`);
page=page.replace('Find your next device in Ikeja, Lagos.','Available devices');
 page=page.replace(/<a[^>]*href="\/iphones"[^>]*>Browse all iPhones[^<]*<\/a>/g,`<a href="${r.path}">Browse all ${escape(r.name)}</a>`);
const original=await readFile(r.path.replace(/^\/|\/$/g,'')+'/index.html','utf8').catch(()=> '');
 page=page.replace(/<title>.*?<\/title>/,`<title>${escape(r.title||r.name+' in Ikeja | Mikee Gadget Plug')}</title>`).replace(/data-landing-page="[^"]*"/,`data-landing-page="${r.path}"`).replace(/<link rel="canonical"[^>]*>/,`<link rel="canonical" href="https://www.mikeegadget.com.ng${r.path}" />`);
 for(const property of ['og:title','og:description','og:url','og:image']){const tag=original.match(new RegExp('<meta property="'+property+'"[^>]*>'))?.[0];if(tag)page=page.replace(new RegExp('<meta property="'+property+'"[^>]*>'),tag);}
 const items=storeItems.filter(p=>(!r.category||p.category===r.category)&&(!r.condition||p.conditions.includes(r.condition)));page=page.replace(/(<div[^>]*id="productGrid"[^>]*>)[\s\S]*?(<\/div>\s*<div class="store-grid-end")/,(_,start,end)=>start+items.slice(0,8).map(card).join('')+end);
 const path=r.path.replace(/^\/|\/$/g,'');await mkdir(path,{recursive:true});await writeFile(path+'/index.html',page);}
for(const path of [...products.map(p=>p.route.replace(/^\/|\/$/g,'')),'swap','phone-swap','deals']){const file=path+'/index.html';let page=await readFile(file,'utf8');page=page.replace(/<header[\s\S]*?<\/header>/,header).replace(/<footer[\s\S]*?<\/footer>/,footer).replace(/<div class="(?:announcement|commerce-topbar)"[\s\S]*?<\/div>/,'').replace('</head>','<link rel="stylesheet" href="/assets/unified.css"></head>').replace('</body>','<script type="module" src="/assets/shared-header.js"></script><script type="module" src="/assets/community.js"></script></body>');await writeFile(file,page);}
for(const path of ['index.html','search/index.html',...routes.map(r=>r.path.replace(/^\/|\/$/g,'')+'/index.html'),'checkout/index.html','cart/index.html']){let page=await readFile(path,'utf8');page=page.replace('</head>','<link rel="stylesheet" href="/assets/unified.css"></head>');await writeFile(path,page);}

{const path='deals/index.html';let page=await readFile(path,'utf8');page=page.replace(/<main[\s\S]*?<\/main>/,'<main class="wrap section"><h1>Hot Deals</h1><p>10% off selected storage variants.</p><div class="product-grid" id="published-deals">Loading current deals…</div></main>').replace('</body>','<script type="module" src="/assets/deals.js"></script></body>');await writeFile(path,page);}
