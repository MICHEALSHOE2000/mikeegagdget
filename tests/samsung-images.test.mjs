import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {products} from '../commerce/catalog.mjs';
import {storeItems} from '../commerce/storefront-data.mjs';
import {choices} from '../commerce/upgrade-core.mjs';
const manifest=JSON.parse(readFileSync('commerce/samsung-image-sources.json','utf8'));

test('approved Samsung photographs reach every assigned listing and buying choice',()=>{
 for(const source of manifest.sources){
  const images=source.photos.map(photo=>photo.assets['720']);
  assert.ok(images.length>=1 && images.length<=3);
  assert.equal(new Set(images).size,images.length);
  for(const slug of source.listings){
   const product=products.find(p=>p.slug===slug);
   assert.equal(product.model,source.model);
   assert.deepEqual(product.images,images);
   assert.equal(storeItems.find(p=>p.slug===slug).image,images[0]);
   const purchaseChoices=choices.filter(p=>p.slug===slug && p.forSale);
   assert.ok(purchaseChoices.length);
   for(const choice of purchaseChoices)assert.equal(choice.image,images[0]);
  }
 }
});

test('Samsung responsive images and gallery thumbnails are valid local WebP files',()=>{
 for(const source of manifest.sources)for(const photo of source.photos){
  assert.match(photo.sourceImageUrl,/^https:\/\/images\.neostore\.ng\//);
  for(const width of [160,360,720]){
   const path=photo.assets[width];
   assert.ok(existsSync(`.${path}`),path);
   assert.ok(path.endsWith(`-${width}.webp`));
   const bytes=readFileSync(`.${path}`);
   assert.equal(bytes.toString('ascii',0,4),'RIFF');
   assert.equal(bytes.toString('ascii',8,12),'WEBP');
  }
 }
});

test('unverified Samsung models retain placeholders and detail galleries use assigned assets',()=>{
 for(const product of products.filter(p=>p.brand==='Samsung')){
  const source=manifest.sources.find(s=>s.listings.includes(product.slug));
  if(!source){assert.deepEqual(product.images,[]);continue;}
  const page=readFileSync(`${product.slug}/index.html`,'utf8');
  for(const photo of source.photos){
   assert.ok(page.includes(`data-gallery-image="${photo.assets['720']}"`));
   assert.ok(page.includes(`src="${photo.assets['160']}"`));
  }
 }
});
