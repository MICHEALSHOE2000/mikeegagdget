import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,readdirSync,statSync,existsSync} from 'node:fs';
const read=f=>readFileSync(f,'utf8');
test('Paystack review: refund, privacy and terms pages exist, are linked in every footer and at checkout',()=>{
 const refund=read('returns-refunds/index.html'),privacy=read('privacy-policy/index.html'),terms=read('terms/index.html');
 for(const t of [/within <strong>7 days<\/strong>/,/How to request a refund or return/,/5–10 business days/,/Credit Direct/,/change of mind/])assert.match(refund,t);
 for(const t of [/What we collect/,/not<\/strong> your full card/,/Nigeria Data Protection Act 2023/,/TikTok Pixel/,/Your rights/,/How long we keep it/,/Nigeria Data Protection Commission/])assert.match(privacy,t);
 for(const t of [/Who we are/,/Brand New/,/UK Used/,/governed by the laws of the Federal Republic of Nigeria/,/privacy-policy/])assert.match(terms,t);
 assert.match(read('checkout/index.html'),/href="\/terms\/"[^>]*>Terms &amp; Conditions<\/a>, <a href="\/returns-refunds\/"[^>]*>Refund Policy<\/a> and <a href="\/privacy-policy\/"/);
 assert.match(read('sitemap.xml'),/privacy-policy\//);
 const pages=[];const walk=d=>{for(const n of readdirSync(d)){if(n==='node_modules'||n.startsWith('.'))continue;const p=d+'/'+n;if(statSync(p).isDirectory())walk(p);else if(n==='index.html')pages.push(p);}};walk('.');
 const missing=pages.filter(p=>{const h=read(p);return h.includes('href="/returns-refunds/"')&&!h.includes('href="/privacy-policy/"');});
 assert.deepEqual(missing,[]);
});
test('home: "Find your next device" heading and at least 8 devices shown, even with fewer featured',()=>{
 assert.match(read('index.html'),/<h2>Find your next device<\/h2>/);assert.doesNotMatch(read('index.html'),/Find your next device in Ikeja/);
 assert.match(read('assets/storefront.js'),/const count=Math\.max\(limit,lead\.length\)/);
});
test('iPhone: search results open on tap (touchend), ignoring scroll gestures',()=>{
 const js=read('assets/storefront.js');
 assert.match(js,/results\.addEventListener\('touchend'/);assert.match(js,/Math\.hypot\([^)]*\)>10\)tap=null/);assert.match(js,/location\.assign\(a\.href\)/);
});
