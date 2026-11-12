import {retailInventory} from './retail-inventory.mjs';
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
 return {...current,capacity,colors,condition:input.condition,image,description};
}
