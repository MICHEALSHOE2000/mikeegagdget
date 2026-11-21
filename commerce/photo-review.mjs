// Visual review of the product photos already in the repository (21 Nov 2026). This is a review record, not an
// approval: nothing here is published automatically. Photos are approved one by one in Admin → Products → Photos,
// with their source and permission recorded.
//
// status: 'ok'     looked right for the model in a visual check
//         'check'  usable only after the owner confirms (unclear model, render, or devices in cases)
//         'reject' must not be used for this product (wrong or mixed model, concept render, duplicate of another model)

// Where each group of repository photos came from, as far as the repository records it.
export function provenance(url){
 if(url.startsWith('/images/store/samsung/'))return {source:'supplier',licence:'Neostore photo — reuse permission confirmed by the owner on 12 Oct 2026 (no written licence on file)'};
 if(url.startsWith('/images/catalog/'))return {source:'manufacturer',licence:'Apple support-site image — reuse permission not confirmed'};
 if(/\/iphone-duo-/.test(url))return {source:'manufacturer',licence:'Apple image supplied by the owner — reuse permission not confirmed'};
 return {source:'',licence:'Existing site photo — source not recorded; owner to confirm it is our own or a supplier photo'};
}

// Photos currently shown on the site that need a second look.
export const CURRENT_FLAGS={
 '/images/store/16promax-1':{status:'check',note:'Stylised render, not a photo of a real unit; replace with a real photo'},
 '/images/store/18pro-1':{status:'check',note:'Devices shown inside coloured cases; confirm they are iPhone 18 Pro'},
 '/images/store/18promax-1':{status:'check',note:'Devices shown inside coloured cases; confirm they are iPhone 18 Pro Max'},
 '/images/store/pixel-11-pro-xl-1':{status:'check',note:'Colours and camera bar look like a different Pixel model; confirm before keeping'},
 '/images/store/13-1':{status:'check',note:'Tightly cropped corner of the phone; a full-device photo would be clearer'},
 '/images/store/apple-watch-ultra-4-1':{status:'check',note:'Apple product render; reuse permission not confirmed'},
 '/images/store/ipad-air-8th-gen-11-inch-m4-1':{status:'check',note:'Apple product render; reuse permission not confirmed'},
 '/images/store/iphone-duo-1':{status:'check',note:'Apple image supplied by the owner; reuse permission not confirmed'},
 '/images/catalog/iphone-12':{status:'check',note:'Apple support-site line-up image; reuse permission not confirmed'},
 '/images/catalog/iphone-15-plus':{status:'check',note:'Apple support-site line-up image; reuse permission not confirmed'},
 '/images/catalog/iphone-8':{status:'check',note:'Apple support-site line-up image; reuse permission not confirmed'},
 '/images/catalog/iphone-xr':{status:'check',note:'Apple support-site line-up image; reuse permission not confirmed'},
};

// Unused repository photos reviewed as extra gallery photos for a live product.
export const LIBRARY={
 'iphone-11':[['/images/store/11-2','ok'],['/images/store/11-3','ok']],
 'iphone-11-pro':[['/images/store/11pro-2','reject','Mixed models in one photo'],['/images/store/11pro-3','check','Side view only; model cannot be confirmed']],
 'iphone-12':[['/images/store/12','ok'],['/images/store/12-2','ok'],['/images/store/12-3','ok']],
 'iphone-12-pro':[['/images/store/12pro-2','ok'],['/images/store/12pro-3','ok']],
 'iphone-12-pro-max':[['/images/store/12promax-2','ok'],['/images/store/12promax-3','check','Busy group photo; confirm all units are 12 Pro Max']],
 'iphone-13':[['/images/store/13-2','ok'],['/images/store/13-3','ok']],
 'iphone-14-pro':[['/images/store/14pro-2','ok'],['/images/store/14pro-3','ok']],
 'iphone-14-pro-max':[['/images/store/14promax-2','ok'],['/images/store/14promax-3','check','Busy group photo; confirm all units are 14 Pro Max']],
 'iphone-15':[['/images/store/15-2','ok'],['/images/store/15-3','ok']],
 'iphone-15-pro':[['/images/store/15pro-2','ok'],['/images/store/15pro-3','ok']],
 'iphone-15-pro-max':[['/images/store/15promax-2','reject','Includes a deep-purple iPhone 14 Pro'],['/images/store/15promax-3','ok']],
 'iphone-16':[['/images/store/16-2','check','Same photo as the iPhone 16 Plus file; confirm which model it shows'],['/images/store/16-3','ok']],
 'iphone-16-plus':[['/images/store/16plus-3','check','Same photo as the iPhone 16 file; confirm which model it shows']],
 'iphone-16-pro-max':[['/images/store/16promax-2','ok'],['/images/store/16promax-3','reject','Marketing render, not a real photo']],
 'iphone-17':[['/images/store/17-2','ok'],['/images/store/17-3','ok']],
 'iphone-17-air':[['/images/store/17air-2','ok'],['/images/store/17air-3','reject','Concept render with "17 AIR" artwork']],
 'iphone-17-air-wifi-only':[['/images/store/17air-2','ok']],
 'iphone-17-pro':[['/images/store/17pro-2','ok'],['/images/store/17pro-3','ok']],
 'iphone-17-pro-max':[['/images/store/17promax-2','ok']],
};
const SIZE='-720.webp';
// Photos an administrator may add for review on a product (never the rejected ones).
export const suggestionsFor=slug=>(LIBRARY[slug]||[]).filter(([,status])=>status!=='reject').map(([base,status,note=''])=>({url:base+SIZE,status,note,...provenance(base)}));
