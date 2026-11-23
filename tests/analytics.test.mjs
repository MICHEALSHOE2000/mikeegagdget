import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';

const SKIP=new Set(['node_modules','.git','.vercel','supabase','tests','docs','templates','landing-pages','scripts','commerce','api','assets','images']);
async function* pages(dir='.'){for(const e of await readdir(dir,{withFileTypes:true})){if(e.isDirectory()){if(!SKIP.has(e.name)&&!e.name.startsWith('.'))yield* pages(join(dir,e.name));}else if(e.name==='index.html')yield join(dir,e.name);}}

test('GA4 and Clarity load on every public page and never on admin pages', async () => {
 let n=0;
 for await(const file of pages()){
  const html=await readFile(file,'utf8'),admin=/^admin(\/|$)/.test(file.replace(/\\/g,'/'));
  assert.equal(html.includes('/assets/site-analytics.js'),!admin,file);
  if(!admin){assert.ok(html.indexOf('/assets/site-analytics.js')<html.indexOf('</head>'),`${file}: loads in the head`);n++;}
 }
 assert.ok(n>250);
});

test('analytics script: correct IDs, live-domain only, no personal data, admin excluded', async () => {
 const js=await readFile('assets/site-analytics.js','utf8');
 assert.match(js,/G-8FCNHYFK7P/);assert.match(js,/zicu2skehx/);
 assert.match(js,/mikeegadget\\\.com\\\.ng/);assert.match(js,/\^\\\/admin/);
 assert.doesNotMatch(js,/email|phone_number|firstName|address/i);
});

test('customer-detail pages are masked in Clarity and the privacy policy names both tools', async () => {
 for(const p of ['checkout','checkout/complete','account','buy'])assert.match(await readFile(`${p}/index.html`,'utf8'),/<main data-clarity-mask="true"/,p);
 const privacy=await readFile('privacy-policy/index.html','utf8');
 assert.match(privacy,/Google Analytics/);assert.match(privacy,/Microsoft Clarity/);
});

test('shop events: add to cart, payment started and purchase are reported', async () => {
 const js=await readFile('assets/shopping.js','utf8');
 for(const e of ['add_to_cart','add_payment_info','purchase'])assert.match(js,new RegExp(`mgTrack\\?\\.\\('${e}'`));
 assert.doesNotMatch(js.match(/mgTrack\?\.\('purchase'[^;]*;/)[0],/customer|email|phone/);
});
