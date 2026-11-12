import test from 'node:test';import assert from 'node:assert/strict';
import {retailInventory} from '../commerce/retail-inventory.mjs';
import {resolveVariant,purchasable} from '../commerce/variant-selection.mjs';
import {categories} from '../commerce/storefront-data.mjs';
import {validateProductEdit} from '../commerce/admin-catalogue.mjs';
import {parseCsv,csvCell} from '../commerce/csv.mjs';
const p=retailInventory.find(p=>p.slug==='iphone-18-pro-max');
test('color and condition selection never borrows another price',()=>{
 const base={capacity:'512GB',condition:'Brand New',color:'Burgundy'};
 assert.equal(resolveVariant(p.variants,base).price,2690000);
 assert.equal(resolveVariant(p.variants,{...base,color:'Glacier'}).price,2590000);
 assert.equal(purchasable(resolveVariant(p.variants,{...base,condition:'UK Used'})),false);
 assert.equal(purchasable(resolveVariant(p.variants,{...base,capacity:'256GB',color:'Silver'})),false);
 assert.equal(resolveVariant(p.variants,{...base,color:'Blue'}),undefined);
});
test('WiFi SKUs are unique, price-pending and ordered after tablets',()=>{
 const wifi=retailInventory.filter(p=>p.category==='wifi-only');assert.equal(wifi.length,16);
 const normal=new Set(retailInventory.filter(p=>p.category==='iphones').flatMap(p=>p.variants.map(v=>p.slug+'|'+v.storage)));
 for(const p of wifi)for(const v of p.variants){assert.equal(v.price,null);assert.equal(purchasable(v),false);assert.equal(normal.has(p.slug+'|'+v.storage),false);}
 assert.equal(categories[categories.findIndex(c=>c.id==='tablets')+1].id,'wifi-only');
});
test('admin rejects invalid model colors and incorrect old-iPhone conditions',()=>{
 const current={slug:'iphone-17-pro',storage:'256GB · Silver'};
 assert.throws(()=>validateProductEdit(current,{condition:'Brand New'}),/condition/);
 assert.throws(()=>validateProductEdit(current,{condition:'UK Used',colors:['Burgundy']}),/color/);
 assert.throws(()=>validateProductEdit(current,{condition:'UK Used',image:'javascript:alert(1)'}),/HTTPS/);
 assert.equal(validateProductEdit(current,{condition:'UK Used',colors:['Silver'],capacity:'256GB'}).storage,current.storage);
});
test('CSV handles commas, quotes and multiline cells without corrupting SKU keys',()=>{
 const row=['phone|256GB · Silver/Blue','a,b','quote "inside"','line\nbreak'];assert.deepEqual(parseCsv(row.map(csvCell).join(',')),[row]);assert.throws(()=>parseCsv('"unterminated'),/unclosed/);
});
