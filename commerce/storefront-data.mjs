import {commerceSite} from './catalog.mjs';
import {products as baseProducts} from './catalog.mjs';
import {retailInventory} from './retail-inventory.mjs';
import {categoryImages} from './product-images.mjs';
import {offerProduct} from './offers.mjs';

const products=baseProducts.map(offerProduct);
const categoryOrder=['iphones','samsung','pixel','tablets','laptops','ps5','accessories','macbooks','ipads','watches','airpods','audio','games'];
export const categories = [
 ['iphones','iPhones','Apple'],
 ['samsung','Samsung','Samsung'],
 ['pixel','Google Pixel','Google'],
 ['tablets','Samsung Tablets','Samsung'],
 ['macbooks','MacBooks','Apple'],
 ['ipads','iPads','Apple'],
 ['watches','Smartwatches','Various'],
 ['airpods','AirPods','Apple'],
 ['audio','Audio','Various'],
 ['ps5','PlayStation 5','Sony'],
 ['games','Games','Sony'],
 ['laptops','Laptops','Various'],
 ['accessories','Accessories','Various']
].map(([id,name,brand])=>({id,name,brand,image:categoryImages[id]||'/images/store/mikee-shop-720.webp',route:({iphones:'/iphones',samsung:'/samsung-phones',pixel:'/google-pixel-phones'})[id] || `/shop/${id}/`}));
categories.sort((a,b)=>categoryOrder.indexOf(a.id)-categoryOrder.indexOf(b.id));
export const shopCategories = categories.filter(c=>!['iphones','samsung','pixel'].includes(c.id)).map(category => ({
 ...category,
 route: `/shop/${category.id}/`
}));

const seriesFor = model => model.match(/^iPhone (\d+)/)?.[1] || (model.startsWith('iPhone X')?'X':model.startsWith('iPhone SE')?'SE':'');
const makeVariant = v => ({
 storage:v.storage,
 price:v.price,
 regularPrice:v.regularPrice,
 offerId:v.offerId,
 ram:v.ram,
 color:v.color,
 warranty:v.warranty,
 activationStatus:v.activationStatus
});
const phoneItems = products.map(p=>{
 const entry=retailInventory.find(item=>item.slug===p.slug);
 return {
  slug:p.slug,model:p.model,brand:p.brand,category:entry?.category||({Apple:'iphones',Samsung:'samsung',Google:'pixel'})[p.brand],
  image:p.images[0]||'',route:p.route,series:seriesFor(p.model),conditions:p.conditions,
  availability:p.stockStatus,easy:p.easyBuyEligible===true,swap:p.swapEligible===true,
  variants:p.variants.map(makeVariant)
 };
});
const whatsappFor = item => {
 const variantSummary=item.variants.map(v=>v.storage).join(', ');
 const message=`Hello Mikee Gadget Plug, I’m interested in ${item.model} (${item.condition}). Please confirm current price, availability, variant ${variantSummary}, warranty and delivery options.`;
 return `https://wa.me/${commerceSite.whatsappNumber}?text=${encodeURIComponent(message)}`;
};
const otherItems = retailInventory.filter(item=>!item.isPhone).map(item=>({
 slug:item.slug,model:item.model,brand:item.brand,category:item.category,image:item.image||'',
 route:whatsappFor(item),conditions:[item.condition],availability:'Confirm exact unit and availability',
 easy:false,swap:false,variants:item.variants.map(makeVariant)
}));
export const storeItems = [...phoneItems,...otherItems];
