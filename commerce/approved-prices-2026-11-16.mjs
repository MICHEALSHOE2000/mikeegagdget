// Owner-approved price list of 16 Nov 2026. This one file drives both the website catalogue (applyApprovedPrices)
// and the database migration (scripts/build-price-migration.mjs), so the page, cart and server checkout agree.
// Rules followed: match existing SKUs first; never invent a price, condition, storage size or colour;
// "Non-Active" means Brand New (not activated); "eSIM only" is not "Wi-Fi Only".
export const PRICE_LIST_DATE='2026-11-16';
const PSIM='Physical SIM + eSIM';

// Existing catalogue SKUs whose price (and stated attributes) change. `before` guards the database update.
export const APPROVED_UPDATES=[
 {sku:'iphone-18-pro-wifi-only|256GB · Burgundy · Brand New',before:null,price:1450000,patch:{simNote:'eSIM locked'},source:'iPhone 18 Pro — Brand New, eSIM Locked / WiFi Only'},
 {sku:'iphone-18-pro-wifi-only|256GB · Glacier · Brand New',before:null,price:1400000,patch:{simNote:'eSIM locked'},source:'iPhone 18 Pro — Brand New, eSIM Locked / WiFi Only'},
 {sku:'iphone-18-pro-wifi-only|256GB · Black · Brand New',before:null,price:1380000,patch:{simNote:'eSIM locked'},source:'iPhone 18 Pro — Brand New, eSIM Locked / WiFi Only'},
 {sku:'iphone-17-air|256GB · Non-Active',before:1070000,price:1080000,patch:{condition:'Brand New',connectivity:'eSIM only',activation:'Non-Active',color:'Sky Blue'},source:'iPhone 17 Air — Brand New, regular eSIM only, Blue',note:'"Blue" recorded as Sky Blue, the only blue iPhone Air finish. Condition corrected from UK Used: the SKU itself says Non-Active.'},
 {sku:'iphone-18-pro|256GB · Burgundy',before:1970000,price:2000000,patch:{connectivity:PSIM,activation:'Non-Active'},source:'iPhone 18 Pro — Brand New, pSIM + eSIM'},
 {sku:'iphone-18-pro-max|256GB · Burgundy',before:2540000,price:2250000,patch:{connectivity:PSIM,activation:'Non-Active'},source:'iPhone 18 Pro Max — Brand New, pSIM + eSIM'},
 {sku:'iphone-18-pro-max|256GB · Black · Brand New',before:null,price:2200000,patch:{connectivity:PSIM,activation:'Non-Active'},source:'iPhone 18 Pro Max — Brand New, pSIM + eSIM'},
 {sku:'iphone-18-pro-max|512GB · Burgundy',before:2690000,price:2700000,patch:{connectivity:PSIM,activation:'Non-Active'},source:'iPhone 18 Pro Max — Brand New, pSIM + eSIM'},
 {sku:'ipad-11th-gen|128GB · Wi‑Fi',before:670000,price:640000,patch:{activation:'Non-Active',color:'Blue/Silver/Pink'},source:'Brand New iPad 11th Generation, 128GB Wi-Fi Only'},
 {sku:'apple-pencil-pro|Standard',before:210000,price:150000,patch:{},source:'Apple Pencil Pro — Brand New'},
];

// New variants on existing product pages (no matching SKU existed). Added, never replacing older variants.
export const APPROVED_NEW_VARIANTS=[
 {slug:'iphone-17-air-wifi-only',variant:{storage:'256GB · Brand New',capacity:'256GB',condition:'Brand New',color:null,connectivity:'Wi-Fi Only',price:800000},note:'Colour not specified: confirmed with the customer.'},
 {slug:'iphone-17-pro',variant:{storage:'256GB · Cosmic Orange · Brand New',capacity:'256GB',condition:'Brand New',color:'Cosmic Orange',connectivity:PSIM,activation:'Non-Active',price:1630000}},
 {slug:'iphone-17-pro',variant:{storage:'512GB · Cosmic Orange · Brand New',capacity:'512GB',condition:'Brand New',color:'Cosmic Orange',connectivity:PSIM,activation:'Non-Active',price:1700000}},
 {slug:'iphone-17-pro',variant:{storage:'512GB · Mixed Colours · Brand New',capacity:'512GB',condition:'Brand New',color:null,connectivity:PSIM,activation:'Non-Active',price:1950000,colourNote:'Mixed colours — available colour confirmed with you before dispatch'},note:'Mixed Colours kept as one variant; colour-specific variants only once actual colours are confirmed.'},
 {slug:'iphone-17-pro-max',variant:{storage:'256GB · Blue/Orange · Brand New',capacity:'256GB',condition:'Brand New',color:'Deep Blue/Cosmic Orange',connectivity:PSIM,activation:'Non-Active',price:1750000}},
 {slug:'iphone-17-pro-max',variant:{storage:'512GB · Cosmic Orange · Brand New',capacity:'512GB',condition:'Brand New',color:'Cosmic Orange',connectivity:PSIM,activation:'Non-Active',price:2060000}},
 {slug:'iphone-17-pro-max',variant:{storage:'512GB · Silver · Brand New',capacity:'512GB',condition:'Brand New',color:'Silver',connectivity:PSIM,activation:'To be confirmed',price:2050000},note:'No verified activation status existed for this variant; shown as "Activation to be confirmed".'},
];

// New product pages. Where the price list gives no condition, the product is added with its price but kept
// hidden until the owner confirms the condition. Confirmed by the owner on 16 Nov 2026: all of them are UK Used.
// A variant without a price stays unavailable.
const CONFIRMED='UK Used';
const sellable=price=>({enabled:price!=null});
// Watches: size and GPS / GPS + Cellular are separate choices, so each variant records its connectivity.
const watch=(slug,model,variants)=>({brand:'Apple',model,category:'watches',condition:CONFIRMED,slug,isPhone:false,image:'',colors:[],description:'Comes with a charger.',variants:variants.map(([storage,price])=>({storage,capacity:storage.split(' · ')[0],connectivity:/Cellular/.test(storage)?'GPS + Cellular (LTE)':'GPS',price,condition:CONFIRMED,...sellable(price)}))});
const ipad=(n,prices)=>({brand:'Apple',model:`iPad ${n}th Gen`,category:'ipads',condition:'UK Used',slug:`ipad-${n}th-gen`,isPhone:false,image:'',colors:[],description:'UK Used.',variants:[['32GB · Wi‑Fi',prices[0],'Wi-Fi'],['32GB · Wi‑Fi + Cellular (LTE)',prices[1],'Wi-Fi + Cellular']].map(([storage,price,connectivity])=>({storage,capacity:'32GB',condition:'UK Used',connectivity,price}))});
const item=(brand,model,slug,category,price,extra={})=>({brand,model,category,condition:CONFIRMED,slug,isPhone:false,image:'',colors:extra.colors||[],description:extra.description||'',variants:[{storage:extra.storage||'Standard',capacity:extra.storage||'Standard',condition:CONFIRMED,color:extra.color||null,price,...sellable(price)}]});

// iPhone Duo (Apple's first foldable, released 23 Oct 2026): the price list says Brand New, eSIM, Non-Active.
// Colours "White / Black" are Apple's Star White and Night Sky. eSIM only — no physical SIM slot.
const duo=(storage,color,price)=>({storage:`${storage} · ${color}`,capacity:storage,condition:'Brand New',color,connectivity:'eSIM only',activation:'Non-Active',price,enabled:true});
export const APPROVED_NEW_PRODUCTS=[
 {brand:'Apple',model:'iPhone Duo',category:'iphones',condition:'Brand New',slug:'iphone-duo',legacySlug:'iphone-duo',isPhone:true,image:'',colors:['Star White','Night Sky'],description:'Apple’s first foldable iPhone. eSIM only (no physical SIM slot). Brand New, not activated.',variants:[duo('256GB','Star White',3300000),duo('256GB','Night Sky',3300000),duo('512GB','Star White',3700000)]},
 ipad(6,[150000,170000]),ipad(7,[180000,190000]),ipad(8,[200000,210000]),
 watch('apple-watch-se','Apple Watch SE',[['40mm · GPS',160000],['40mm · GPS + Cellular (LTE)',165000],['44mm · GPS + Cellular (LTE)',180000]]),
 watch('apple-watch-series-6','Apple Watch Series 6',[['44mm · GPS',null],['44mm · GPS + Cellular (LTE)',210000]]),
 watch('apple-watch-series-7','Apple Watch Series 7',[['41mm · GPS + Cellular (LTE)',220000],['45mm · GPS + Cellular (LTE)',230000]]),
 item('Green Lion','Green Lion Magic Keyboard Case — iPad Pro 13-inch','green-lion-keyboard-case-ipad-pro-13','accessories',150000,{color:'Black',colors:['Black'],description:'Fits iPad Pro 13-inch only. Check your iPad model before ordering.'}),
 item('Green Lion','Green Lion Magic Keyboard Case — iPad Air 11-inch','green-lion-keyboard-case-ipad-air-11','accessories',150000,{color:'Black',colors:['Black'],description:'Fits iPad Air 11-inch only. Check your iPad model before ordering.'}),
 item('Green Lion','Green Lion Magic Keyboard Case — iPad Pro 11-inch (M4)','green-lion-keyboard-case-ipad-pro-11-m4','accessories',150000,{description:'Fits iPad Pro 11-inch (M4) only. Colour confirmed with you.'}),
 item('Green Lion','Green Lion Magic Keyboard Case — iPad Air 13-inch / iPad Pro 12.9-inch','green-lion-keyboard-case-ipad-air-13-pro-12-9','accessories',150000,{description:'Listed by the supplier for iPad Air 13-inch and iPad Pro 12.9-inch. Confirm the fit for your exact iPad generation before ordering. Colour confirmed with you.'}),
 item('JBL','JBL Tune 530BT','jbl-tune-530bt','audio',70000,{description:'Wireless on-ear headphones.'}),
 item('JBL','JBL Tune 720BT','jbl-tune-720bt','audio',80000,{description:'Wireless over-ear headphones.'}),
 item('JBL','JBL Clip 5','jbl-clip-5','speakers',90000),
 item('JBL','JBL Flip 6','jbl-flip-6','speakers',150000,{description:'Listed by the supplier as "O.B Flip 6".'}),
 item('JBL','JBL Flip 7','jbl-flip-7','speakers',160000),
 item('JBL','JBL Charge 5','jbl-charge-5','speakers',210000),
 item('JBL','JBL Charge 6','jbl-charge-6','speakers',210000),
 item('JBL','JBL Boombox 3','jbl-boombox-3','speakers',580000),
 item('JBL','JBL Xtreme 4','jbl-xtreme-4','speakers',380000),
 item('Harman Kardon','Harman Kardon Onyx Studio 9','harman-kardon-onyx-studio-9','speakers',300000),
];


// Photos supplied by the owner on 16 Nov 2026 (images/store/<slug>-1-{160,360,720}.webp).
// IMEI stickers on the Pixel 6a photo were blurred before publishing.
export const OWNER_PHOTOS=['pixel-11-pro-xl','ipad-air-8th-gen-11-inch-m4','apple-watch-ultra-4','pixel-10-pro-fold','pixel-10-pro-xl','pixel-10-pro','pixel-10','pixel-9-pro-fold','pixel-6a','pixel-6','iphone-duo'];
export const ownerPhoto=slug=>`/images/store/${slug}-1-720.webp`;

// Prices that could not be applied, with the reason. Nothing here was guessed.
export const UNRESOLVED=[
 {item:'iPad 11th Gen 256GB Wi-Fi + Cellular (Silver)',reason:'Price “pending confirmation” in the list. The existing price (₦1,090,000) was left unchanged.'},
 {item:'Apple Watch Series 6 44mm GPS',reason:'Price pending. Listed without a price, so it cannot be bought.'},
];

const sameSku=(p,v,sku)=>`${p.slug}|${v.storage}`===sku;
export function applyApprovedPrices(items){
 const out=items.map(p=>({...p,variants:p.variants.map(v=>({...v}))}));
 for(const u of APPROVED_UPDATES){
  const p=out.find(x=>x.variants.some(v=>sameSku(x,v,u.sku)));if(!p)throw Error('Approved price has no matching SKU: '+u.sku);
  const v=p.variants.find(x=>sameSku(p,x,u.sku));Object.assign(v,u.patch,{price:u.price,enabled:true,reviewRequired:false,reviewNote:''});
 }
 for(const n of APPROVED_NEW_VARIANTS){
  const p=out.find(x=>x.slug===n.slug);if(!p)throw Error('No product for new variant: '+n.slug);
  if(!p.variants.some(v=>v.storage===n.variant.storage))p.variants.push({...n.variant,enabled:true});
 }
 for(const p of out){const extra=p.variants.flatMap(v=>(v.color||'').split('/').map(c=>c.trim()).filter(Boolean));if(extra.length)p.colors=[...new Set([...(p.colors||[]),...extra])];}
 // A new iPhone is listed first among iPhones (newest model); everything else is appended.
 for(const np of APPROVED_NEW_PRODUCTS)if(!out.some(p=>p.slug===np.slug)){const at=np.category==='iphones'?out.findIndex(p=>p.category==='iphones'):-1;if(at>=0)out.splice(at,0,structuredClone(np));else out.push(structuredClone(np));}
 for(const slug of OWNER_PHOTOS){const p=out.find(x=>x.slug===slug);if(!p)throw Error('No product for photo: '+slug);p.image=ownerPhoto(slug);}
 return out;
}
