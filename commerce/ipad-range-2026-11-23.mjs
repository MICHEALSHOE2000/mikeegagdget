// iPad range added 23 Nov 2026 at the owner's request, priced from the iStore Nigeria iPad collection
// (https://www.istore.com.ng/collections/ipad-range) as listed that day. Owner decisions:
//  - existing iPad 11th Gen and iPad Air 11-inch M4 256GB Wi-Fi keep the store's own prices;
//  - new variants use iStore's sale price, and iStore's "was" price is shown crossed out (compareAtPrice);
//  - everything is in stock; photos are clean placeholders until the owner uploads his own.
// Nothing here was guessed: where iStore did not name the chip, the model name does not name one either.
const WIFI='Wi‑Fi', CELL='Cellular + Wi‑Fi';
const SOURCE='iStore Nigeria iPad range, 23 Nov 2026';
export const IPAD_PLACEHOLDER=slug=>`/images/store/ipad-range/${slug}.svg`;

// [capacity, connectivity, price, wasPrice|null, colour|null]
const v=([capacity,link,price,was=null,color=null])=>({
 storage:[capacity,link===CELL?CELL:WIFI,color].filter(Boolean).join(' · '),
 capacity,connectivity:link===CELL?'Wi-Fi + Cellular':'Wi-Fi',condition:'Brand New',color,price,
 ...(was&&was>price?{compareAtPrice:was}:{}),enabled:true,priceSource:SOURCE
});
const family=(slug,model,line,size,chip,description,rows,colors=[])=>({
 brand:'Apple',model,category:'ipads',condition:'Brand New',slug,isPhone:false,image:IPAD_PLACEHOLDER(slug),
 colors,description,ipadLine:line,ipadSize:size,ipadChip:chip,variants:rows.map(v)
});

export const IPAD_RANGE_PRODUCTS=[
 family('ipad-pro-13-inch','iPad Pro 13-inch','pro','13-inch','', 'Brand New. Standard glass. The biggest iPad display for creative work.',[
  ['256GB',WIFI,1999000,2399000],['256GB',CELL,2199000,2699000],['512GB',CELL,3599000]]),
 family('ipad-pro-11-inch','iPad Pro 11-inch','pro','11-inch','', 'Brand New. Standard glass. Pro performance in a compact size.',[
  ['256GB',WIFI,1949000],['256GB',CELL,2399000],['1TB',CELL,3299000]]),
 family('ipad-air-13-inch-m4','iPad Air 13-inch M4','air','13-inch','M4','Brand New. Apple M4 chip on a 13-inch display.',[
  ['128GB',WIFI,1299000,1499000],['128GB',CELL,1749000,1899000],['256GB',CELL,1899000,1999000]]),
 family('ipad-air-13-inch-m3','iPad Air 13-inch M3','air','13-inch','M3','Brand New. Apple M3 chip on a 13-inch display.',[
  ['128GB',WIFI,999000,1199000],['128GB',CELL,1099000,1299000],['256GB',WIFI,1649000],['256GB',CELL,1249000,1399000],
  ['512GB',CELL,1349000,1499000],['1TB',WIFI,2399000],['1TB',CELL,2799000]]),
 family('ipad-air-13-inch','iPad Air 13-inch','air','13-inch','', 'Brand New. 13-inch iPad Air (ask us for the chip generation of the unit).',[
  ['128GB',WIFI,1349000],['128GB',CELL,999000,1299000],['256GB',WIFI,899000,1199000],['512GB',WIFI,1999000],['512GB',CELL,1099000,1499000]]),
 family('ipad-air-11-inch-m3','iPad Air 11-inch M3','air','11-inch','M3','Brand New. Apple M3 chip in the portable 11-inch size.',[
  ['128GB',CELL,899000,999000],['1TB',WIFI,2099000],['1TB',CELL,2199000]]),
 family('ipad-air-11-inch','iPad Air 11-inch','air','11-inch','', 'Brand New. 11-inch iPad Air (ask us for the chip generation of the unit).',[
  ['128GB',CELL,1399000],['256GB',CELL,1799000],['512GB',CELL,1899000],['1TB',WIFI,1999000]]),
 family('ipad-mini','iPad mini','mini','8.3-inch','A20 Pro','Brand New. The most portable iPad.',[
  ['128GB',WIFI,1349000,null,'Midnight'],['128GB',WIFI,1349000,null,'Starlight'],['128GB',CELL,1649000,null,'Midnight'],['512GB',WIFI,1929000,null,'Midnight']],['Midnight','Starlight']),
 family('ipad-9th-gen','iPad 9th Gen 10.2-inch','ipad','10.2-inch','', 'Brand New. The classic 10.2-inch iPad with Home button.',[
  ['256GB',CELL,899000,999000]]),
];

// New variants on existing products. The existing variants and their prices are not touched.
export const IPAD_RANGE_NEW_VARIANTS=[
 ['ipad-air-8th-gen-11-inch-m4',['128GB',WIFI,1249000,1349000]],
 ['ipad-air-8th-gen-11-inch-m4',['128GB',CELL,1499000,1599000]],
 ['ipad-air-8th-gen-11-inch-m4',['256GB',CELL,1849000]],
 ['ipad-air-8th-gen-11-inch-m4',['512GB',CELL,1899000,1999000]],
].map(([slug,row])=>({slug,variant:v(row)}));

// Lineup metadata for the premium /shop/ipads/ page, for products that existed before.
export const IPAD_EXISTING_LINEUP={
 'ipad-air-8th-gen-11-inch-m4':{ipadLine:'air',ipadSize:'11-inch',ipadChip:'M4'},
 'ipad-11th-gen':{ipadLine:'ipad',ipadSize:'11-inch',ipadChip:''},
 'ipad-8th-gen':{ipadLine:'ipad',ipadSize:'10.2-inch',ipadChip:''},
 'ipad-7th-gen':{ipadLine:'ipad',ipadSize:'10.2-inch',ipadChip:''},
 'ipad-6th-gen':{ipadLine:'ipad',ipadSize:'9.7-inch',ipadChip:''},
};

// For the owner to confirm. Where iStore listed one variant twice at different prices, the higher price is used.
export const IPAD_RANGE_FLAGS=[
 {item:'iPad Air 13-inch 512GB Wi-Fi',reason:'iStore lists it twice: ₦999,000 (was ₦1,299,000) and ₦1,999,000. Listed at ₦1,999,000.'},
 {item:'iPad Pro 11-inch 256GB Wi-Fi + Cellular',reason:'iStore lists it twice: ₦2,199,000 (was ₦2,399,000) and ₦2,399,000 (Standard Glass). Listed at ₦2,399,000.'},
 {item:'iPad Air 11-inch and iPad Air 13-inch',reason:'iStore does not name the chip for these, and their prices differ from the M3 and M4 models. Listed without a chip name.'},
 {item:'iPad mini',reason:'iStore names the A20 Pro chip only on the 128GB Wi-Fi units; the other mini variants are assumed to be the same model.'},
 {item:'iPad 11th Gen and iPad Air 11-inch M4 256GB Wi-Fi',reason:'Kept at the store’s own prices, as instructed (iStore: ₦799,000 / ₦1,199,000 / ₦1,599,000).'},
];

export function applyIpadRange(items){
 const out=items.map(p=>({...p,variants:p.variants.map(x=>({...x}))}));
 for(const {slug,variant} of IPAD_RANGE_NEW_VARIANTS){
  const p=out.find(x=>x.slug===slug);if(!p)throw Error('No product for new iPad variant: '+slug);
  if(!p.variants.some(x=>x.storage===variant.storage))p.variants.push({...variant});
 }
 // Existing iPads without a photo get the same clean placeholder (held back from Merchant Center feeds).
 for(const [slug,meta] of Object.entries(IPAD_EXISTING_LINEUP)){const p=out.find(x=>x.slug===slug);if(p){Object.assign(p,meta);if(!p.image)p.image=IPAD_PLACEHOLDER(slug);}}
 const at=out.findIndex(p=>p.category==='ipads');
 const fresh=IPAD_RANGE_PRODUCTS.filter(np=>!out.some(p=>p.slug===np.slug)).map(np=>structuredClone(np));
 out.splice(at>=0?at:out.length,0,...fresh);
 return out;
}
