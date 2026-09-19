import {products} from './catalog.mjs';
import {categoryImages} from './product-images.mjs';
import {newestFirst} from './catalog-order.mjs';
export const categories = [
 ['iphones','iPhones','Apple'],
 ['samsung','Samsung','Samsung'],
 ['pixel','Google Pixel','Google'],
 ['macbooks','MacBooks','Apple'],
 ['ipads','iPads','Apple'],
 ['watches','Apple Watches','Apple'],
 ['airpods','AirPods','Apple'],
 ['ps5','PlayStation 5','Sony'],
 ['games','Games','Sony'],
 ['laptops','Laptops','Various'],
 ['accessories','Accessories','Various']
].map(([id,name,brand])=>({id,name,brand,image:categoryImages[id],route:({iphones:'/iphones',samsung:'/samsung-phones',pixel:'/google-pixel-phones'})[id] || `/shop/${id}/`}));
export const shopCategories = categories.slice(3).map(category => ({
 ...category,
 route: `/shop/${category.id}/`
}));
export const storeItems = [
 ...[...products].sort(newestFirst).map(p=>({slug:p.slug,model:p.model,brand:p.brand,category:p.brand==='Apple'?'iphones':p.brand==='Samsung'?'samsung':'pixel',image:p.images[0] || '',route:p.route,series:p.model.match(/^iPhone (\d+)/)?.[1] || (p.model.startsWith('iPhone X')?'X':p.model.startsWith('iPhone SE')?'SE':''),conditions:p.listingPending?[]:p.conditions,availability:'',easy:p.easyBuyEligible===true,swap:p.swapEligible===true,variants:p.variants.map(v=>({storage:v.storage,price:v.price}))})),
 ...shopCategories.map(c=>({slug:c.id,model:c.name,brand:c.brand,category:c.id,image:c.image,route:c.route,conditions:[],availability:'',easy:false,swap:false,variants:[{storage:'Explore the range',price:null}]}))
];
