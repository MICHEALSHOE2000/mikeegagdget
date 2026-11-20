// Approved delivery prices (owner's list, 20 Nov 2026). These seed the shop_delivery_rates table; after that the
// table is the source of truth and prices are edited in Admin → Delivery prices without changing code.
export const LAGOS_LGA_FEES={
 'Agege':5000,'Ajeromi-Ifelodun (Ajegunle)':5000,'Alimosho':5000,'Amuwo-Odofin':5000,'Apapa':10000,'Badagry':10000,'Epe':10000,
 'Eti-Osa':10000,'Ibeju-Lekki':10000,'Ifako-Ijaiye':5000,'Ikeja':10000,'Ikorodu':8000,'Kosofe':8000,'Lagos Island':10000,
 'Lagos Mainland':5000,'Mushin':5000,'Ojo':10000,'Oshodi-Isolo':5000,'Shomolu':5000,'Surulere':5000,
};
// Interstate: sent to a transport park in the named city. The Federal Capital Territory was not on the list,
// so it has no price until one is set in Admin (delivery there is unavailable until then).
export const STATE_PARKS={
 'Abia':['Umuahia',10000],'Adamawa':['Yola',15000],'Akwa Ibom':['Uyo',10000],'Anambra':['Awka',10000],'Bauchi':['Bauchi',12000],
 'Bayelsa':['Yenagoa',12000],'Benue':['Makurdi',12000],'Borno':['Maiduguri',15000],'Cross River':['Calabar',15000],'Delta':['Asaba',10000],
 'Ebonyi':['Abakaliki',12000],'Edo':['Benin City',10000],'Ekiti':['Ado-Ekiti',8000],'Enugu':['Enugu',10000],'Federal Capital Territory':['Abuja',null],
 'Gombe':['Gombe',15000],'Imo':['Owerri',10000],'Jigawa':['Dutse',15000],'Kaduna':['Kaduna',12000],'Kano':['Kano',12000],'Katsina':['Katsina',15000],
 'Kebbi':['Birnin Kebbi',15000],'Kogi':['Lokoja',12000],'Kwara':['Ilorin',10000],'Nasarawa':['Lafia',12000],'Niger':['Minna',12000],
 'Ogun':['Abeokuta',10000],'Ondo':['Akure',10000],'Osun':['Osogbo',8000],'Oyo':['Ibadan',8000],'Plateau':['Jos',12000],
 'Rivers':['Port Harcourt',10000],'Sokoto':['Sokoto',15000],'Taraba':['Jalingo',15000],'Yobe':['Damaturu',15000],'Zamfara':['Gusau',15000],
};
export const DELIVERY_METHODS=['lagos_delivery','interstate_park','store_pickup'];
export const PARK_NOTE='Your order will be sent to a designated transport park in your selected destination. You will be contacted with collection details when your order is ready.';
// Turn rows from the database (or the seed above) into a lookup the checkout can use.
export function rateTable(rows){const lagos={},states={};for(const r of rows||[]){if(!r.enabled||r.fee_ngn==null)continue;if(r.scope==='lagos_lga')lagos[r.area]={fee:Number(r.fee_ngn),label:r.label||r.area};else if(r.scope==='state')states[r.area]={fee:Number(r.fee_ngn),label:r.label||r.area};}return {lagos,states};}
export const seedRows=()=>[...Object.entries(LAGOS_LGA_FEES).map(([area,fee])=>({scope:'lagos_lga',area,label:area,fee_ngn:fee,enabled:true})),...Object.entries(STATE_PARKS).map(([area,[city,fee]])=>({scope:'state',area,label:city,fee_ngn:fee,enabled:fee!=null}))];
// Fee for a checkout choice, or null when delivery there has no price.
export function quote(table,method,state,lga){if(method==='store_pickup')return {fee:0,label:'Pickup at Mikee Gadget Store'};if(method==='lagos_delivery'){if(state!=='Lagos')return null;const r=table.lagos[lga];return r?{fee:r.fee,label:`Delivery: ${lga}`}:null;}if(method==='interstate_park'){if(!state||state==='Lagos')return null;const r=table.states[state];return r?{fee:r.fee,label:`Transport park pickup: ${r.label}, ${state}`}:null;}return null;}
