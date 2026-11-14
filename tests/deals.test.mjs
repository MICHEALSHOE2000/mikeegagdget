import test from 'node:test';
import assert from 'node:assert/strict';
import {dealPrice,validateDeals,pricedVariant} from '../commerce/deals.mjs';
import handler from '../api/admin/deals.mjs';
import {JSDOM} from 'jsdom';
import {mountDeals} from '../assets/admin-deals.mjs';
test('fixed discount rounds whole naira half up without changing catalogue data',()=>{
 for(const [price,expected]of[[800000,720000],[105,95],[101,91],[100000000,90000000]])assert.equal(dealPrice(price),expected);
 for(const price of [null,0,-1,NaN,1.5,100000001])assert.throws(()=>dealPrice(price));
 const row={sku:'phone|256GB',price_ngn:800000,enabled:true,product_data:{model:'Phone'}};
 assert.equal(pricedVariant(row,true).price,720000);assert.equal(row.price_ngn,800000);
 assert.equal(pricedVariant(row,false).price,800000);
 assert.equal(pricedVariant({...row,enabled:false},true).deal,false);
 assert.equal(pricedVariant({...row,product_data:{reviewRequired:true}},true).price,800000);
});
test('publication accepts empty or nine unique variants and rejects forged input',()=>{
 assert.deepEqual(validateDeals({revision:0,skus:[]}),{revision:0,skus:[]});
 assert.equal(validateDeals({revision:1,skus:['a','b','c','d','e','f','g','h','i']}).skus.length,9);
 for(const body of [{revision:0,skus:['a','a']},{revision:0,skus:['a','b','c','d','e','f','g','h','i','j']},{revision:-1,skus:[]},{revision:0,skus:[null]}])assert.throws(()=>validateDeals(body));
});
test('deals endpoint rejects unauthenticated reads and writes',async()=>{
 for(const method of ['GET','PUT']){const res={status(n){this.code=n;return this;},setHeader(){return this;},json(body){this.body=body;return this;}};await handler({method,headers:{}},res);assert.equal(res.code,401);}
});
test('editor previews, reorders, removes and publishes exact SKU selections',async()=>{
 const dom=new JSDOM('<section id="editor"></section>');const root=dom.window.document.getElementById('editor');
 const inventory=['a','b','c','d','e','f'].map(sku=>({sku,price_ngn:800000,enabled:true,product_data:{model:sku,capacity:'256GB',image:'/phone.webp'}}));
 let published;const api=async(path,options)=>{if(options){published=JSON.parse(options.body);return {...published,revision:2};}return {skus:['a','b'],revision:1};};
 const editor=mountDeals(root,api,()=>inventory);await editor.load();
 assert.match(root.textContent,/720,000/);root.querySelector('[data-down="0"]').click();root.querySelector('[data-add="c"]').click();root.querySelector('[data-remove="1"]').click();root.querySelector('[data-publish]').click();await new Promise(r=>setTimeout(r,0));
 assert.deepEqual(published,{skus:['b','c'],revision:1});assert.match(root.textContent,/Deals published/);dom.window.close();
});
