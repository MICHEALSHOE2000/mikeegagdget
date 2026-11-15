import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
test('every key page carries the MG icon set exactly once',()=>{
 for(const f of ['index.html','admin/index.html','financing/index.html','iphone-17-pro-max/index.html']){const h=readFileSync(f,'utf8');
  for(const href of ['/favicon.ico','/favicon.svg','/apple-touch-icon.png','/site.webmanifest'])assert.equal(h.split(`href="${href}"`).length-1,1,f+' '+href);}
 for(const f of ['favicon.ico','favicon.svg','apple-touch-icon.png','icon-192.png','icon-512.png','icon-maskable-512.png'])assert.ok(existsSync(f),f);
 const m=JSON.parse(readFileSync('site.webmanifest','utf8'));assert.ok(m.icons.some(i=>i.purpose==='maskable'));
});
