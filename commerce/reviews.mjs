// Customer testimonials. Only what an administrator entered from a real customer is stored; nothing is generated.
const text=(v,max)=>String(v??'').trim().slice(0,max);
export function validateReview(input){
 if(!input||typeof input!=='object')throw Error('Review details are required.');
 const display_name=text(input.displayName,80),body=text(input.body,1200);
 if(!display_name||!body)throw Error('Enter the customer’s display name and their review.');
 const rating=input.rating===''||input.rating===null||input.rating===undefined?null:Number(input.rating);
 if(rating!==null&&(!Number.isInteger(rating)||rating<1||rating>5))throw Error('Rating must be 1 to 5, or left empty.');
 const review_date=text(input.reviewDate,10)||null;if(review_date&&!/^\d{4}-\d{2}-\d{2}$/.test(review_date))throw Error('Use a valid review date.');
 const product_slug=text(input.productSlug,120)||null;if(product_slug&&!/^[a-z0-9-]+$/.test(product_slug))throw Error('Use the product’s page name, for example iphone-15-pro.');
 const photo_url=text(input.photoUrl,2000)||null;if(photo_url&&!/^https:\/\//.test(photo_url)&&!photo_url.startsWith('/images/'))throw Error('Use an HTTPS photo address.');
 const photo_consent=input.photoConsent===true||input.photoConsent==='on';
 if(photo_url&&!photo_consent)throw Error('Confirm the customer gave permission before adding their photo.');
 const order_reference=text(input.orderReference,40)||null;if(order_reference&&!/^MGP2-[a-f0-9]{32}$/.test(order_reference))throw Error('Order reference must look like MGP2-… (copy it from Orders).');
 const evidence=text(input.evidence,500);
 if(!evidence&&!order_reference)throw Error('Add where this review came from (for example “WhatsApp chat, 3 Nov”) or the order reference.');
 return {display_name,body,rating,review_date,product_slug,photo_url,photo_consent,evidence,order_reference,published:input.published===true||input.published==='on'};
}
// What customers may see. Evidence and order references never leave the server; "verified" is true only for a paid order.
export function publicReview(row,paidReferences=new Set()){
 return {name:row.display_name,body:row.body,rating:row.rating??null,date:row.review_date||null,productSlug:row.product_slug||null,photo:row.photo_consent&&row.photo_url?row.photo_url:null,verified:!!row.order_reference&&paidReferences.has(row.order_reference)};
}
export function validGoogleReviewsUrl(value){
 const url=text(value,500);if(!url)return '';
 let u;try{u=new URL(url);}catch{throw Error('Enter the full Google reviews link.');}
 const host=u.hostname.replace(/^www\./,'');
 if(u.protocol!=='https:'||!(['g.page','maps.app.goo.gl','goo.gl','search.google.com'].includes(host)||/^(maps\.)?google\.[a-z.]+$/.test(host)))throw Error('Use your Google Business reviews link (google.com, g.page or maps.app.goo.gl).');
 return u.href;
}
