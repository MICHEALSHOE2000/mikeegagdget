import {products as baseProducts} from './catalog.mjs';
import {offerProduct,isComplete} from './offers.mjs';
const products=baseProducts.map(offerProduct);
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
categories.sort((a,b)=>['iphones','samsung','pixel','laptops','ps5','accessories','macbooks','ipads','watches','airpods','games'].indexOf(a.id)-['iphones','samsung','pixel','laptops','ps5','accessories','macbooks','ipads','watches','airpods','games'].indexOf(b.id));
export const shopCategories = categories.filter(c=>!['iphones','samsung','pixel'].includes(c.id)).map(category => ({
 ...category,
 route: `/shop/${category.id}/`
}));
export const storeItems = [
 ...[...products].filter(isComplete).sort(newestFirst).map(p=>({slug:p.slug,model:p.model,brand:p.brand,category:p.brand==='Apple'?'iphones':p.brand==='Samsung'?'samsung':'pixel',image:p.images[0] || '',route:p.route,series:p.model.match(/^iPhone (\d+)/)?.[1] || (p.model.startsWith('iPhone X')?'X':p.model.startsWith('iPhone SE')?'SE':''),conditions:p.listingPending?[]:p.conditions,availability:'',easy:p.easyBuyEligible===true,swap:p.swapEligible===true,variants:p.variants.filter(v=>v.price>0).map(v=>({storage:v.storage,price:v.price,regularPrice:v.regularPrice,offerId:v.offerId}))})),
 ...shopCategories.map(c=>({slug:c.id,model:c.name,brand:c.brand,category:c.id,image:c.image,route:c.route,conditions:[],availability:'',easy:false,swap:false,variants:[{storage:'Explore the range',price:null}]}))
];
