import {products} from './catalog.mjs';
export const categories = [
 ['iphones','iPhones','Apple','/images/store/17promax-1-360.webp'],
 ['samsung','Samsung','Samsung','/images/store/samsung.webp'],
 ['pixel','Google Pixel','Google','/images/store/pixel.webp'],
 ['macbooks','MacBooks','Apple','/images/store/macbooks.webp'],
 ['ipads','iPads','Apple','/images/store/ipads.webp'],
 ['watches','Apple Watches','Apple','/images/store/watches.webp'],
 ['airpods','AirPods','Apple','/images/store/airpods.webp'],
 ['ps5','PlayStation 5','Sony','/images/store/ps5.webp'],
 ['games','Games','Sony','/images/store/games.webp'],
 ['accessories','Accessories','Various','/images/store/accessories.webp']
].map(([id,name,brand,image])=>({id,name,brand,image}));
export const shopCategories = categories.slice(3).map(category => ({
 ...category,
 route: `/shop/${category.id}/`
}));
export const storeItems = [
 ...products.map(p=>({slug:p.slug,model:p.model,brand:p.brand,category:p.brand==='Apple'?'iphones':p.brand==='Samsung'?'samsung':'pixel',image:p.images[0] || '',route:p.route,conditions:p.brand==='Apple'?['UK Used','Brand New']:['Confirm condition'],availability:'Confirm stock',easy:p.easyBuyEligible===true,swap:p.swapEligible,variants:p.variants.map(v=>({storage:v.storage,price:v.price}))})),
 ...shopCategories.map(c=>({slug:c.id,model:c.name,brand:c.brand,category:c.id,image:c.image,route:c.route,conditions:['Confirm condition'],availability:'Enquire for options',easy:false,swap:false,variants:[{storage:'Options on request',price:null}]}))
];
