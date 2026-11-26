import {retailInventory} from './retail-inventory.mjs';
import {cleanStock} from './stock.mjs';
import {cleanPhotos,primaryPhoto} from './product-photos.mjs';
import {validGtin} from './merchant.mjs';
export function validateProductEdit(current,input){
 if(!input||typeof input!=='object')throw Error('Product details are required.');
 const original=retailInventory.find(p=>p.slug===current.slug);
 if(!original)throw Error('Unknown model.');
 const conditions=/^iphone-18-/.test(current.slug)?['Brand New','UK Used']:/^iphone-/.test(current.slug)?['UK Used']:['Brand New','UK Used','Open Box','Pre-Owned','Confirm condition'];
 if(!conditions.includes(input.condition))throw Error('This condition is not valid for this model.');
 const colors=Array.isArray(input.colors)?[...new Set(input.colors)]:[];
 if(colors.length>20||colors.some(c=>typeof c!=='string'||c.length>50))throw Error('Invalid colors.');
 if(original.brand==='Apple'&&original.isPhone&&colors.some(c=>!original.colors.includes(c)))throw Error('Choose a verified color for this model.');
 const image=String(input.image||'');
 if(image.length>2000||image&&!(image.startsWith('/images/')||/^https:\/\//.test(image)))throw Error('Use a local image or HTTPS image URL.');
 const description=String(input.description||'');if(description.length>4000)throw Error('Description is too long.');
 const capacity=String(input.capacity||current.capacity||current.storage).trim();if(!capacity||capacity.length>80)throw Error('Invalid storage.');
 const stock='stockStatus' in input?cleanStock(input):{};
 // Changing availability records who confirmed it and when (shown in the Google Shopping report).
 if('stockStatus' in stock&&stock.stockStatus!==(current.stockStatus||''))Object.assign(stock,{availabilitySource:'admin',availabilityConfirmedAt:new Date().toISOString().slice(0,10)});
 // Product identifiers are optional and only saved when valid (taken from the box or the manufacturer).
 const ids={};
 if('gtin' in input){const g=String(input.gtin||'').replace(/\s/g,'');if(g&&!validGtin(g))throw Error('That GTIN/barcode is not valid. Check the digits on the box.');ids.gtin=g;}
 if('mpn' in input){const m=String(input.mpn||'').trim();if(m.length>70||/[<>]/.test(m))throw Error('Invalid MPN.');ids.mpn=m;}
 const photos=cleanPhotos(input.images);
 // With photo records, only an approved photo is ever published as the product image.
 return {...current,colourMode:['auto','priority','optional'].includes(input.colourMode)?input.colourMode:current.colourMode||'auto',capacity,colors,condition:input.condition,image:photos&&photos.length?primaryPhoto(photos):image,description,...stock,...ids,...(photos?{images:photos}:{})};
}
