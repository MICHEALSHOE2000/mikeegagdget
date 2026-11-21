import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/shop/assistant.mjs';
import manage from '../api/admin/manage.mjs';
import {matches,product,classify} from '../commerce/sales-assistant.mjs';
const row={sku:'sku-a',enabled:true,price_ngn:400000,deal_position:1,product_data:{model:'iPhone 13',slug:'iphone-13',capacity:'128GB',condition:'UK Used'}};
const item=product(row);
const data={query:'How much for iPhone 13 128GB?',sku:row.sku,action:'save',id:'b603c603-8911-4424-8cab-409c0df37841',name:'Demo',contact:'',mode:'Store pickup',timeline:'Today',condition:'UK Used',budget:400000,quotedPrice:360000,consent:true};
test('catalogue prices and explicit stock, exact numeric models, score boundaries',()=>{
 assert.equal(item.price,360000);assert.equal(item.stock,'Confirm availability');
 assert.equal(product({...row,enabled:false}),null);
 assert.deepEqual(matches([item],data.query),[item]);assert.deepEqual(matches([item],'iphone 1'),[]);
 assert.deepEqual(classify(data,item),{score:100,tier:'hot'});
 assert.equal(classify({...data,timeline:'Just browsing',condition:'Either',budget:100},item).tier,'browsing');
});
test('server validates origin, immutable facts, consent, throttling, errors and owner access',async()=>{
 process.env.SHOP_ORIGIN='https://example.test';process.env.SUPABASE_URL='https://db.test';process.env.SUPABASE_SERVICE_ROLE_KEY='fixture';
 const previous=global.fetch;let written,quota=true,fail=false;
 global.fetch=async(url,options)=>{
  if(fail)throw Error('offline');
  const result=url.includes('shop_sales_take')?quota:url.includes('shop_deal_catalogue')?[row]:[];
  if(url.includes('shop_sales_leads'))written=JSON.parse(options.body);
  return Response.json(result);
 };
 const call=async(body,origin=process.env.SHOP_ORIGIN,fn=handler)=>{
  const res={status(n){this.code=n;return this;},setHeader(){return this;},json(payload){this.result=payload;}};
  await fn({headers:{origin,'content-type':'application/json'},method:fn===manage?'GET':'POST',body,query:{kind:'sales-leads'}},res);return res;
 };
 try{
  assert.equal((await call(data,'https://other.test')).code,403);
  assert.equal((await call({...data,consent:false})).code,400);
  assert.equal((await call({...data,sku:'unknown'})).code,409);
  assert.equal((await call({...data,price:1,score:0})).code,200);
  assert.equal(written.enquiry.item.price,360000);assert.equal(written.score,100);
  assert.equal((await call(data,undefined,manage)).code,401);
  quota=false;assert.equal((await call(data)).code,429);
  fail=true;assert.equal((await call(data)).code,503);
 }finally{global.fetch=previous;}
});
