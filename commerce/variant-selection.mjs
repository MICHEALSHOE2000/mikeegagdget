export const capacityOf = v => v.capacity || v.storage.split(/\s*·\s*/)[0];
export const colorsOf = v => v.colors || (v.color||'').split('/').map(x=>x.trim()).filter(Boolean);
// sim is only passed when a model offers more than one SIM type; otherwise it is ignored.
// Colour: a variant that lists colours matches only those colours. A variant with no colours (the colour is the
// customer's preference, confirmed for the exact unit) matches any colour shown on the page, but only when no
// variant with the same storage/condition/SIM is sold in specific colours, so a colour never borrows another price.
export function resolveVariant(variants,{capacity,color,condition,sim}) {
 const same=variants.filter(v=>capacityOf(v)===capacity&&(v.condition||condition)===condition&&(sim===undefined||(v.connectivity||'')===sim));
 if(!color)return same.find(v=>colorsOf(v).length===0);
 return same.find(v=>colorsOf(v).includes(color))||(same.some(v=>colorsOf(v).length)?undefined:same.find(v=>colorsOf(v).length===0));
}
// True when the colour is only the customer's preference (the SKU itself has no colour list).
export const colourIsPreference=(v,color)=>!!v&&!!color&&colorsOf(v).length===0;
export const purchasable = v => !!v && v.price>0 && v.enabled!==false && !v.reviewRequired && v.stockStatus!=='out_of_stock';
export const swatchColor = name => {
 const colors={'burgundy':'#682a3b','glacier':'#bed7e6','silver':'#dadbd9','black':'#292b2c','white':'#f5f5ed','cosmic orange':'#d47849','deep blue':'#32445d','mist blue':'#b8cbd7','sage':'#b3bfaa','lavender':'#c5bcdb','teal':'#739c99','ultramarine':'#6676b9','pink':'#e8b9c8','gold':'#d6c4a0','starlight':'#eee7d9','midnight':'#252c36','(product)red':'#bb2036','green':'#789984','blue':'#86a7c3','purple':'#bdb1ce','yellow':'#f0dc91','coral':'#ec8475','graphite':'#60615e','natural titanium':'#b5afa3','desert titanium':'#cdb5a0','black titanium':'#454644','white titanium':'#e0dfd9','blue titanium':'#586578','space black':'#343436','space gray':'#747674','deep purple':'#62566c','pacific blue':'#496a76','sierra blue':'#a1b7c8','alpine green':'#5c7061','midnight green':'#526158','cloud white':'#eeeede','light gold':'#e5d7ae','sky blue':'#c9dce8'};
 return colors[name.toLowerCase()]||'#ccc';
};
