// Mikee AI — the deterministic core shared by every channel and every conversation mode.
//  * Catalogue tools: read-only lookups over the Supabase catalogue rows passed in. Prices, variants, images and
//    availability come only from those rows; a variant without a valid price is never shown with one.
//  * Knowledge base: business facts with a status. Only "verified" entries are stated as facts; anything marked
//    "needs_confirmation" is answered with "our team will confirm".
//  * Simulator (MIKEE_AI_MODE=simulation, the default): a rule-based conversation engine that reads free text
//    (Nigerian English and Pidgin included), keeps session context and answers from the tools above. It is not a
//    language model and says so when asked.
// Nothing in this file can change a price, give a discount, approve financing, promise a delivery time or write to
// the database.
import {pricedVariant} from './deals.mjs';
import {searchScore} from './search.mjs';
import {findSwapPhones,parseSwapChecks,checksAnswered,swapQuote,SWAP_MODELS} from './assistant-swap.mjs';

export const WHATSAPP_NUMBER='2347086865133';
export const STORE_ADDRESS='1 Ola Ayeni Street, Off Simbiat Abiola Way, Computer Village, Ikeja, Lagos';
export const CONSENT_VERSION='2026-11-21';
export const MAX_TEXT=500;
export const LEAD_STATUSES=['new','exploring','interested','ready_to_buy','needs_human','converted','closed'];
export const PAYMENT={card:'Card payment (Paystack)',transfer:'Bank transfer',instalments:'Pay Small Small with Credit Direct',pickup:'Reserve and pay at store pickup'};
export const TIMELINE={today:'Today',week:'This week',month:'This month',later:'Later / just browsing'};
const AVAILABILITY={in_stock:'In stock',out_of_stock:'Out of stock',preorder:'Pre-order',backorder:'Backorder'};

export const naira=n=>'₦'+String(Math.round(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g,',');
const clean=s=>String(s??'').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g,' ').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();
export const cleanText=s=>clean(s).slice(0,MAX_TEXT);
const norm=s=>String(s||'').toLowerCase().replace(/wi-?fi/g,'wifi').replace(/[^a-z0-9₦ ]+/g,' ').replace(/\s+/g,' ').trim();
const escRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

// ---------------------------------------------------------------- Catalogue tools
export function buildCatalogue(rows,pages={}){
 const bySlug=new Map();
 for(const row of Array.isArray(rows)?rows:[]){
  if(!row?.product_data?.slug||row.enabled===false||row.product_data.enabled===false)continue;
  const v=pricedVariant(row,!!row.deal_position);
  if(!(Number.isFinite(v.price)&&v.price>0)||v.reviewRequired)continue; // no valid price → not offered with a price
  const slug=v.slug,page=pages[slug]||{};
  const p=bySlug.get(slug)||bySlug.set(slug,{slug,model:clean(v.model||page.model),brand:clean(v.brand||page.brand),category:v.category||page.category||'',route:page.route||'/'+slug,
   image:validImage(page.photos?.[0])||validImage(row.product_data.image),variants:[]}).get(slug);
  p.variants.push({sku:row.sku,storage:clean(String(row.sku).slice(String(row.sku).indexOf('|')+1)),capacity:clean(v.capacity||String(v.storage||'').split(' · ')[0]).replace(/^standard$/i,''),condition:clean(v.condition),
   price:v.price,originalPrice:v.originalPrice,deal:!!v.deal,colors:(v.colors||[]).map(clean).filter(Boolean),stockStatus:v.stockStatus||'',availabilityDate:v.availabilityDate||'',
   connectivity:clean(v.connectivity),activation:clean(row.product_data.activation||v.activation),image:validImage(row.product_data.image)});
 }
 const list=[...bySlug.values()];
 for(const p of list){p.variants.sort((a,b)=>a.price-b.price);p.conditions=[...new Set(p.variants.map(v=>v.condition).filter(c=>c&&c!=='Confirm condition'))];p.from=p.variants[0].price;p.key=modelKey(p.model);}
 return list;
}
// Only images the site itself serves. Never a made-up or external URL.
function validImage(u){return typeof u==='string'&&/^\/images\/[\w./-]+\.(webp|jpe?g|png|avif)$/i.test(u)&&!u.includes('..')?u:null;}
// Product pages that exist on the site but have no priced, enabled variant right now.
export function unpricedProducts(catalogue,pages={}){const priced=new Set(catalogue.map(p=>p.slug));return Object.entries(pages).filter(([s,p])=>!priced.has(s)&&p?.model).map(([slug,p])=>({slug,model:clean(p.model),brand:clean(p.brand),category:p.category||'',route:p.route||'/'+slug,key:modelKey(p.model)}));}
const BRAND_WORDS=/\b(apple|samsung|galaxy|google)\b/g;
function modelKey(model){const full=norm(model).replace(/ wifi only$/,''),short=full.replace(BRAND_WORDS,' ').replace(/\s+/g,' ').trim();
 // Customers rarely say the brand: "15 pro max" is an iPhone, "fold 6" a Galaxy Z Fold. A bare number alone ("13") is too vague.
 const bare=short.replace(/^(iphone|z) /,'');
 return {full,short,bare:bare!==short&&/\d/.test(bare)&&/[a-z]/.test(bare)?bare:'',wifi:/wifi only/i.test(norm(model))};}
const conditionName=c=>c==='Confirm condition'?'condition confirmed on enquiry':c;
const availability=v=>{const a=AVAILABILITY[v.stockStatus];return a?(v.availabilityDate&&/preorder|backorder/.test(v.stockStatus)?`${a} (expected ${v.availabilityDate})`:a):'Availability confirmed on enquiry';};
export const priceText=v=>v.deal&&v.originalPrice>v.price?`${naira(v.price)} (Hot Deal, was ${naira(v.originalPrice)})`:naira(v.price);
const variantMatches=(v,f)=>(!f.condition||f.condition==='any'||v.condition===f.condition)&&(!f.storage||norm(v.capacity).replace(/ /g,'')===f.storage)&&(!f.budgetMax||v.price<=f.budgetMax)&&(!f.budgetMin||v.price>=f.budgetMin)&&(!f.sim||simMatches(v,f.sim))&&(!f.activation||norm(v.activation).includes(norm(f.activation)));
function simMatches(v,sim){const c=norm(v.connectivity);if(sim==='wifi')return c.includes('wifi only')||c==='wifi';if(sim==='esim')return c.includes('esim');if(sim==='physical')return c.includes('physical')||c.includes('dual sim');return true;}
// A product card: everything shown comes from one catalogue variant.
export function card(p,v){return {slug:p.slug,sku:v.sku,name:p.model,image:p.image||v.image||null,condition:conditionName(v.condition),storage:v.capacity||'',sim:v.connectivity||'',price:v.price,priceText:naira(v.price),wasPrice:v.deal&&v.originalPrice>v.price?naira(v.originalPrice):null,deal:!!v.deal,availability:availability(v),url:p.route+'?sku='+encodeURIComponent(v.sku),...(v.stockStatus!=='out_of_stock'&&!v.colors.length?{checkout:'/checkout/?sku='+encodeURIComponent(v.sku)}:{})};}

/** Find the products named in a message, longest model name first ("iphone 13 pro max" beats "iphone 13"). */
export function namedProducts(catalogue,text,{unpriced=[]}={}){
 const t=' '+norm(text).replace(/\b(\d+) ?(gb|tb)\b/g,'')+' ',wifi=/wifi only|no sim|without sim/.test(t),found=[];
 for(const p of [...catalogue,...unpriced]){
  for(const k of [p.key.full,p.key.short,p.key.bare].filter(Boolean)){if(k.length<3||!/\d|[a-z]{4,}/.test(k))continue;const m=t.match(new RegExp(' '+escRe(k)+'(?= )(?! (pro|max|plus|mini|ultra|air|fe|lite|edge|fold|flip) )'));if(m){found.push({p,len:k.length,at:m.index,priced:!!p.variants,wifi:p.key.wifi});break;}}
 }
 // drop names contained in a longer match at the same place ("iPhone 13" inside "iPhone 13 Pro Max")
 const keep=found.filter(a=>!found.some(b=>b!==a&&b.len>a.len&&b.at<=a.at&&b.at+b.len>=a.at+a.len&&b.wifi===a.wifi));
 const byPlace=new Map();for(const f of keep.sort((a,b)=>a.at-b.at)){const prev=byPlace.get(f.p.key.full);if(!prev||(prev.wifi!==wifi&&f.wifi===wifi)||(!prev.priced&&f.priced))byPlace.set(f.p.key.full,f);}
 return [...byPlace.values()].map(f=>f.p);
}
const CATEGORY_WORDS={iphones:/\biphones?\b/,samsung:/\bsamsung|galaxy\b/,pixel:/\bpixels?\b|\bgoogle phone/,ipads:/\bipads?\b/,tablets:/\btablets?\b|\btabs?\b/,watches:/\bwatch(es)?\b|smart ?watch/,airpods:/\bairpods?\b/,audio:/\bearbuds?|headphones?|buds\b/,speakers:/\bspeakers?\b/,accessories:/\baccessor|keyboard|pencil|mouse\b/,ps5:/\bps ?5|playstation\b/};
export function categoryFromText(text){const t=norm(text);return Object.entries(CATEGORY_WORDS).filter(([,re])=>re.test(t)).map(([k])=>k);}

/**
 * Read-only catalogue search (the tool both the simulator and the OpenAI provider use).
 * filters: {query, category, brand, budgetMax, budgetMin, condition, storage, sim, activation, limit}. Returns cards.
 */
export function searchCatalogue(catalogue,f={}){
 const limit=Math.min(Math.max(Number(f.limit)||4,1),6);
 const storage=f.storage?norm(f.storage).replace(/ /g,''):null,filters={...f,storage};
 let products=catalogue;
 if(f.query){const named=namedProducts(catalogue,f.query);products=named.length?named:catalogue.map(p=>({p,s:searchScore(p,productQuery(f.query))})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).map(x=>x.p);}
 if(f.category){const cats=[].concat(f.category);products=products.filter(p=>cats.includes(p.category)||(cats.includes('tablets')&&p.category==='ipads')||(cats.includes('audio')&&p.category==='airpods'));}
 if(f.brand){const b=norm(f.brand);products=products.filter(p=>norm(p.brand).includes(b)||norm(p.model).includes(b));}
 if(f.budgetMax&&!f.query){const best=p=>Math.max(...p.variants.filter(v=>variantMatches(v,filters)).map(v=>v.price),0);const sorted=products.filter(p=>best(p)>0).sort((a,b)=>best(b)-best(a));const seen=new Map();products=sorted.map(p=>{const n=seen.get(p.brand)||0;seen.set(p.brand,n+1);return {p,n};}).sort((a,b)=>a.n-b.n).map(x=>x.p);}
 const cards=[];
 for(const p of products){const vs=p.variants.filter(v=>variantMatches(v,filters));if(!vs.length)continue;
  if(f.query&&products.length<=2)for(const v of vs.slice(0,limit))cards.push(card(p,v));else cards.push(card(p,f.budgetMax?vs[vs.length-1]:vs[0]));
  if(cards.length>=limit)break;}
 return cards.slice(0,limit);
}
const FILLER=new Set('it that this these those them am one ones i im want wanna need looking look for a an the to buy get how much is are price prices of do you have got please pls any one some cost costs what whats which me show tell about with in on can sell selling available latest phone phones device my budget under below above around naira abeg una dey wetin be na e oga'.split(' '));
export const productQuery=t=>norm(String(t).replace(/\b\d+ ?(gb|tb)\b/gi,' ').replace(/\b(uk ?used|brand ?new|used|new|esim|wifi only|wi-?fi only)\b/gi,' ').replace(/(under|below|above|around|less than)\s*\S+/gi,' ').replace(/\b\d+(\.\d+)?\s*(k|m|million|thousand)\b/gi,' ')).split(' ').filter(w=>w&&!FILLER.has(w)).join(' ');

// ---------------------------------------------------------------- Reading the customer's words
export function parseBudget(text){
 const t=String(text).toLowerCase().replace(/(\d),(\d{3})/g,'$1$2').replace(/(\d),(\d{3})/g,'$1$2');
 if(/\b(flexib\w*|any budget|no budget)\b/.test(t))return {flexible:true};
 const nums=[...t.matchAll(/(₦|ngn|n)?\s*(\d+(?:\.\d+)?)\s*(k|m|million|thousand|mil)?(?![\da-z])/g)].map(m=>{let n=Number(m[2]);const u=m[3];n=u==='k'||u==='thousand'?n*1e3:u&&/^m/.test(u)?n*1e6:n;return {n:Math.round(n),strong:!!(u||m[1])};}).filter(x=>x.strong||x.n>=10000).filter(x=>x.n>=10000&&x.n<=50000000);
 if(!nums.length)return null;
 if(nums.length>=2&&/\b(between|from|to|-|and)\b/.test(t))return {min:Math.min(nums[0].n,nums[1].n),max:Math.max(nums[0].n,nums[1].n)};
 return /\b(above|over|more than|at least|from)\b/.test(t)?{min:nums[0].n}:{max:nums[0].n};
}
export const parseStorage=t=>{const m=norm(t).match(/\b(\d{2,4}|[12]) ?(gb|tb)\b/);return m?m[1]+m[2]:null;};
export const parsePhone=t=>{const m=String(t).replace(/[\s()-]/g,'').match(/(?:\+?234|0)[789][01]\d{8}/);if(!m)return null;const d=m[0].replace(/^\+?234/,'0');return /^0[789][01]\d{8}$/.test(d)?d:null;};
export const parseEmail=t=>{const m=String(t).match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);return m&&m[0].length<=120?m[0].toLowerCase():null;};
export const parseName=t=>{const m=clean(t).match(/\b(?:my name is|i am called|call me|na me be|name:)\s+([\p{L}][\p{L}' -]{1,40})/iu);if(!m)return null;const n=m[1].trim().split(/\s+/).slice(0,3).join(' ');return /^[\p{L}][\p{L}' -]{1,40}$/u.test(n)&&!/\b(looking|buying|interested|here)\b/i.test(n)?n.replace(/\b\p{L}/gu,c=>c.toUpperCase()):null;};
const pick=(text,map)=>{const t=norm(text);return Object.entries(map).find(([,re])=>re.test(t))?.[0]||null;};
export const parseCondition=t=>pick(t,{'UK Used':/\buk ?used\b|\bused\b|\bfairly used\b|\bpre ?owned\b|\blondon used\b|\btokunbo\b/,'Brand New':/\bbrand ?new\b|\bnew one\b|\bsealed\b|\bboxed\b/,'Open Box':/\bopen ?box\b/});
export const parseSim=t=>pick(t,{wifi:/\bwifi only\b|\bno sim\b|\bwithout sim\b/,esim:/\besim\b/,physical:/\bphysical sim\b|\bdual sim\b|\bsim card\b|\bnormal sim\b/});
export const parsePayment=t=>pick(t,{instalments:/small small|instal|credit direct|monthly|spread|\bloan\b/,pickup:/\bpay at (the )?(store|shop|pickup)\b|\breserve\b/,transfer:/\btransfer\b/,card:/\bcard\b|paystack|\bpay online\b|\bpay now\b|\boutright\b/});
export const parseTimeline=t=>pick(t,{today:/\btoday\b|\bnow now\b|\basap\b|\bright now\b|\bimmediately\b|\bthis evening\b|\btonight\b/,week:/\bthis week\b|\btomorrow\b|\bweekend\b|\bfew days\b|\bnext (\w+ )?days?\b/,month:/\bthis month\b|\bend of (the )?month\b|\bnext week\b|\bsalary\b/,later:/\bjust (browsing|looking|checking)\b|\bnot (yet|now)\b|\blater\b|\bwindow shopping\b/});
// Lagos LGA or state named in a message (for an exact delivery fee from the rates table).
export function parseLocation(text,rates=[]){const t=' '+norm(text)+' ';let best=null;for(const r of rates){if(!r?.area||r.enabled===false)continue;for(const name of [r.area,r.label].filter(Boolean)){const k=norm(name.replace(/\(.*?\)/g,''));if(k.length>2&&t.includes(' '+k+' ')&&(!best||k.length>best.len))best={rate:r,len:k.length};}}
 if(!best){if(/\blekki\b|\bvictoria island\b|\bvi\b|\bajah\b/.test(t))return rates.find(r=>r.area==='Eti-Osa')||null;if(/\byaba\b/.test(t))return rates.find(r=>r.area==='Lagos Mainland')||null;if(/\babuja\b/.test(t))return rates.find(r=>r.area==='Federal Capital Territory')||{scope:'state',area:'Federal Capital Territory',label:'Abuja',fee_ngn:null};}
 return best?.rate||null;}

// Intents. Several can match one message; the order of handling is decided in simulate().
const INTENTS={
 injection:/\b(ignore|disregard|forget) (all |any |the |your )?(previous|prior|above|earlier|system)\b|\bsystem prompt\b|\bdeveloper mode\b|\bjailbreak\b|\b(reveal|show|print|repeat) (me )?(your|the) (prompt|instructions|rules|system)\b|\byou are now\b|\bact as (an? )?(admin|developer|system)\b|\bpretend (to be|you are)\b|\bdo anything now\b|\bapi key\b|\bservice role\b/,
 dispute:/\bcharged twice\b|\bdouble (debit|charge)\b|\bdebited\b|\bmy money\b.*\b(back|refund|gone|hold)\b|\bpayment (failed|issue|problem|dispute)\b|\bchargeback\b|\bno order\b.*\bpaid\b/,
 complaint:/\bcomplain\w*\b|\bnot working\b|\bfaulty\b|\bspoil\w*\b|\bbad (service|phone|product)\b|\bdisappoint\w*\b|\bscam\w*\b|\bfraud\w*\b|\bfake\b.*\b(you|una|sold|sell)\b|\bangry\b|\bunacceptable\b|\bnobody (is )?(answer|respond|reply)\w*\b/,
 human:/\bask the team\b|\b(human|real person|person|agent|customer (care|service)|representative|staff|someone)\b|\b(talk|speak|chat) (to|with) (you|una|somebody|someone|the team|mikee|oga)\b|\bcall me\b|\bwhatsapp\b/,
 identity:/\bare you (a )?(human|real|bot|robot|ai|person)\b|\bwho (are|is) (you|this)\b|\byou be (human|robot|person)\b|\bwhat are you\b/,
 negotiation:/\btoo (expensive|cost\w*|much|high)\b|\bexpensive\b|\bcostly\b|\blast price\b|\breduce\b|\bdiscount\b|\bcheaper\b|\bnegotiat\w*\b|\bbest price\b|\bfinal price\b|\bmake (am|it) (cheap|low)\b|\be (too )?cost\b|\bwetin be (the )?last\b|\bcome down\b|\bslash\b|\bprice (is |dey )?(high|much)\b/,
 greeting:/^(hi+|hello+|hey+|good (morning|afternoon|evening|day)|how far|howdy|yo|sup|hola|bawo|kedu|sannu|morning|evening|afternoon)\b|\bhow (are|una) (you|dey)\b|\bwetin dey\b/,
 thanks:/\b(thanks?|thank you|thank u|tnx|thx|e se|nagode|daalu|i appreciate)\b/,
 bye:/\b(bye|goodbye|see you|later then|ok bye)\b/,
 compare_condition:/\b(uk used|used)\b.*\b(brand new|new)\b|\b(brand new|new)\b.*\b(uk used|used)\b|\bdifference between (uk used|used|new)\b|\bwhat is uk used\b|\bwetin be uk used\b|\bis (uk )?used (good|ok|fine|reliable)\b/,
 compare:/\bvs\.?\b|\bversus\b|\bcompare\b|\bcomparison\b|\bor\b.*\bwhich (one )?(is )?better\b|\bwhich (one )?(is )?better\b|\bdifference between\b|\bbetter than\b/,
 delivery:/\bdeliver\w*\b|\bshipping\b|\bship\b|\bdispatch\w*\b|\bsend (it )?to\b|\bwaybill\b|\bpark\b|\blogistics\b|\bdelivery fee\b|\bhow (long|many days)\b/,
 warranty:/\bwarrant\w*\b|\bguarantee\w*\b/,
 returns:/\breturn\w*\b|\brefund\w*\b|\bexchange it\b|\bchange it if\b/,
 instalments:/\bsmall small\b|\binstal\w*\b|\bcredit direct\b|\bmonthly\b|\bpay (bit|part|half)\b|\bspread (the )?(payment|cost)\b|\bloan\b|\bfinanc\w*\b/,
 payment:/\b(how|ways?|methods?|can i) (do i |to )?pay\b|\bpayment (method|option)s?\b|\bpaystack\b|\btransfer\b|\bcard\b|\bpay on delivery\b|\bcash\b|\baccount (number|details)\b/,
 pickup:/\bpick ?up\b|\bcollect\b|\bcome (to|and) (the )?(shop|store)\b|\breserve\b|\bvisit (the )?(store|shop)\b/,
 location:/\bwhere (is|are) (your|the) (shop|store|office)\b|\baddress\b|\blocation\b|\bwhere una dey\b|\bwhere (are|is) you\b|\bwhere (you|una) (dey|stay|located)\b/,
 hours:/\b(open|opening|closing|close) (time|hours?|today|on sunday|on saturday)\b|\bwhat time (do|does|una) (you )?(open|close)\b|\bworking hours\b|\bopen on (sunday|saturday|weekends?)\b|\bare you open\b/,
 swap:/\bswap\w*\b|\btrade ?in\b|\bupgrade\b|\bexchange my\b|\bsell my (phone|old)\b/,
 authenticity:/\boriginal\b|\bgenuine\b|\bauthentic\b|\bfake\b|\brefurb\w*\b|\bicloud\b|\bclone\b|\breal (one|phone)\b|\bbattery health\b|\binspect\w*\b|\btest (it|the phone)\b|\bcheck (it|the phone) before\b/,
 price:/\bhow much\b|\bprice\w*\b|\bcost\b|\bhw much\b|\bwetin be (the )?price\b|\bhow e be\b|\brate\b/,
 availability:/\b(in stock|available|availability|do you have|una get|you get|you have|do you sell|una sell|is there)\b/,
 budget:/\bbudget\b|\b(i get|i have|i fit pay|i can afford|my money (na|is))\b|\bunder\b|\bbelow\b|\bless than\b|\bnot more than\b|\bwithin\b|\bmaximum\b/,
 recommend:/\brecommend\w*\b|\bsuggest\w*\b|\bwhich (phone|one|device) (should|go|fit|will)\b|\bbest (phone|camera|option|one)\b|\bgood (phone|camera)\b|\bwhat (phone|device) (should|can|fit)\b|\badvise\b/,
 checkout:/\b(i want to|let me|ready to|i wan|i go) (buy|order) (it|am|now|today)\b|\bready to (buy|pay)\b|\bhow (do|can) i (buy|order)\b|\bplace (an |my )?order\b|\badd to cart\b|\bcheckout\b/,
 humor:/😂|🤣|😅|😆|😹|\blo+l\b|\blmao\b|\bhaha\w*\b|\bhehe\w*\b|\bjoke\b/,
};
const PIDGIN=/\b(abeg|wetin|dey|una|oga|abi|sef|wahala|comot|e don|how far|na im|no vex|wan|fit|sha|jare|biko|shey|ehn|ehen|o jare)\b/;
export function detectIntents(text){const raw=String(text||''),t=norm(raw),out=[];for(const [k,re] of Object.entries(INTENTS))if(re.test(k==='humor'?raw.toLowerCase():t))out.push(k);return out;}

// ---------------------------------------------------------------- Knowledge base
// Edit in Admin → Mikee AI → Knowledge base. These defaults come only from the site's own policy pages, checkout and
// the owner's instructions; anything not found there is "needs_confirmation" and is never stated as fact.
export const KNOWLEDGE=[
 {key:'company',title:'About Mikee Gadget Plug',status:'verified',source:'Terms page',content:'Mikee Gadget Plug (MIKEEGADGETS & COMMUNICATIONS LIMITED) is a gadget store in Computer Village, Ikeja, Lagos. We sell phones, tablets, smartwatches, earbuds and headphones, speakers, accessories and gaming.'},
 {key:'location',title:'Store location',status:'verified',source:'Policy pages',content:`Our store is at ${STORE_ADDRESS}.`},
 {key:'hours',title:'Opening hours',status:'needs_confirmation',source:'',content:''},
 {key:'categories',title:'Product categories',status:'verified',source:'Catalogue',content:'iPhones, Samsung Galaxy phones, Google Pixel phones, iPads and tablets, Apple Watch and other smartwatches, AirPods and earbuds, headphones, speakers, accessories and PlayStation 5.'},
 {key:'delivery',title:'Delivery',status:'verified',source:'Delivery policy',content:'Lagos home delivery: the fee depends on your Local Government Area. Other states: we send the order to a transport park in your state, for a fee. Pickup at our store is free. You see the exact fee at checkout before you pay. Delivery time depends on your location and the carrier, so we don’t promise a time in chat; the team confirms it after payment.'},
 {key:'pickup',title:'Store pickup',status:'verified',source:'Delivery policy',content:'Pickup at our Computer Village store is free. You can also reserve for pickup and pay at the store: we confirm the item is available first, then hold it until the pickup deadline we give you (24 hours by default). You can inspect and test the device before you pay.'},
 {key:'warranty',title:'Warranty',status:'verified',source:'Warranty policy',content:'Every device comes with a 7-day warranty from the day you receive or collect it. It covers faults that were present when you got the device; we repair or replace it, or refund you in full if neither is possible. It does not cover drops, liquid damage, misuse or repairs by anyone else.'},
 {key:'returns',title:'Returns and refunds',status:'verified',source:'Refund policy',content:'Refunds or replacements are for a verified factory defect, a fault present at delivery, or the wrong item, reported within 7 days with the original packaging and accessories. Change of mind after delivery is not refundable. Approved refunds take 5–10 business days. Details: /returns-refunds/'},
 {key:'conditions',title:'UK Used vs Brand New',status:'verified',source:'Terms and warranty pages',content:'Brand New devices are new and unused. UK Used devices are pre-owned. Both come with our 7-day warranty, but the original manufacturer’s warranty usually does not extend to used devices. The cosmetic grade and battery health of a specific UK Used unit are confirmed by our team before you buy, and you can inspect it in store.'},
 {key:'payment',title:'Payment methods',status:'verified',source:'Checkout',content:'At checkout you can pay by card (Paystack), by bank transfer (your order is confirmed once we see the money), with Pay Small Small through Credit Direct, or reserve and pay at the store when you pick up. There is no pay-on-delivery option in the checkout.'},
 {key:'paystack',title:'Paystack',status:'verified',source:'Checkout',content:'Card payments are processed securely by Paystack at checkout. We never ask for your card details in chat.'},
 {key:'bank_transfer',title:'Bank transfer',status:'verified',source:'Checkout',content:'Choose bank transfer at checkout. Your order is confirmed once our team sees the money in our account. Only pay into the account shown at checkout.'},
 {key:'credit_direct',title:'Pay Small Small (Credit Direct)',status:'verified',source:'Checkout and financing page',content:'Pay Small Small is through Credit Direct. You choose it at checkout and apply with Credit Direct. Credit Direct decides approval, the down payment and the monthly repayments, so I can’t promise approval or quote repayments in chat.'},
 {key:'credit_direct_criteria',title:'Credit Direct approval criteria',status:'needs_confirmation',source:'',content:''},
 {key:'swap',title:'Swap and upgrade',status:'verified',source:'Swap page',content:'You can swap your current iPhone towards an upgrade. Mikee AI gives an estimate from our swap price list (the same one used on /swap/); the final value is confirmed when we inspect the phone in store. Samsung and Google Pixel swaps are quoted by the team.'},
 {key:'swap_values',title:'Swap valuation rules',status:'verified',source:'Swap page (commerce/pricing.mjs)',content:'iPhone swap values come from the swap price list. Deductions: screen changed or cracked 10%, battery changed 5%, back glass changed or cracked 5%. Face ID problems need a technician to assess. Final value is subject to physical inspection.'},
 {key:'support',title:'Customer support',status:'verified',source:'Policy pages',content:'WhatsApp or call 0708 686 5133, or email support@mikeegadget.com.ng.'},
 {key:'inspection',title:'Inspection and authenticity',status:'verified',source:'Warranty policy',content:'If you buy in store or collect your order, you can inspect and test the device before paying. Delivered orders are paid online first, so check the device as soon as it arrives and contact us straight away if anything is wrong. The 7-day warranty applies either way.'},
 {key:'authenticity_checks',title:'Device checks (iCloud, activation, originality)',status:'needs_confirmation',source:'',content:''},
 {key:'negotiation',title:'Prices and discounts',status:'verified',source:'Owner’s rules',content:'Website prices are the store’s approved prices, and Hot Deals already show their discount. Mikee AI cannot change a price or offer a discount; any special pricing request goes to the team, who decide.'},
 {key:'discount_rules',title:'Discount thresholds',status:'needs_confirmation',source:'',content:''},
 {key:'objections',title:'Price objection replies',status:'template',source:'Owner to review',content:'I understand — it’s a big purchase.|I hear you, prices for good phones are no joke.|Fair point. Let’s find something that fits your pocket.'},
];
export function knowledgeMap(rows=[]){const m=new Map(KNOWLEDGE.map(k=>[k.key,{...k}]));for(const r of Array.isArray(rows)?rows:[]){if(!r?.key||!m.has(r.key))continue;const st=['verified','needs_confirmation','template'].includes(r.status)?r.status:m.get(r.key).status;m.set(r.key,{...m.get(r.key),title:clean(r.title||m.get(r.key).title).slice(0,120),content:clean(r.content||'').slice(0,1500),status:st,updatedAt:r.updated_at||null});}return m;}
/** The tool for policy lookups: returns the fact only when verified. */
export function knowledgeFact(kb,key){const k=kb.get(key);if(!k)return null;if(k.status==='verified'&&k.content)return {key,title:k.title,content:k.content,verified:true};return {key,title:k.title,content:'',verified:false};}

// ---------------------------------------------------------------- Leads
export function leadStatus(s){
 if(s.wantsHuman)return 'needs_human';
 if(s.product&&(s.timeline==='today'||s.timeline==='week'||s.checkout)&&(s.payment||s.checkout))return 'ready_to_buy';
 if((s.product||s.swap?.quote)&&(s.budget||s.storage||s.condition||s.payment||s.location||s.timeline||s.swap?.quote))return 'interested';
 if(s.product||s.budget||s.category||(s.turns||0)>1)return 'exploring';
 return 'new';
}
export function scoreLead(s){let n=0;if(s.product)n+=25;if(s.sku||s.storage)n+=10;if(s.budget)n+=10;if(s.condition)n+=5;if(s.payment)n+=10;if(s.location)n+=5;n+=({today:25,week:18,month:8,later:0})[s.timeline]||0;if(s.checkout)n+=10;if(s.swap?.quote)n+=10;if(s.phone||s.email)n+=8;if(s.wantsHuman)n+=4;return Math.min(100,n);}
export function leadSummary(s,catalogue=[]){
 const p=catalogue.find(x=>x.slug===s.product);
 const lines=['Hello Mikee Gadget Plug, I’d like help with this enquiry:'];
 if(p)lines.push(`• Device: ${p.model}${s.storage?` ${s.storage.toUpperCase()}`:''}${s.condition?` (${s.condition})`:''}`);
 if(s.swap?.quote)lines.push(`• Swap: ${s.swap.quote.model} ${s.swap.quote.storage} — estimated ${naira(s.swap.quote.value)}${s.swap.quote.topUp!=null?`, top-up about ${naira(s.swap.quote.topUp)}`:''}`);
 if(s.budget)lines.push(`• Budget: up to ${naira(s.budget)}`);
 if(s.payment)lines.push(`• Payment: ${PAYMENT[s.payment]}`);
 if(s.location)lines.push(`• Location: ${s.location}`);
 if(s.timeline)lines.push(`• When: ${TIMELINE[s.timeline]}`);
 if(s.name)lines.push(`• Name: ${s.name}`);
 if(s.ref)lines.push(`• Chat reference: ${s.ref}`);
 return lines.join('\n');
}
export const whatsappUrl=(s,catalogue)=>`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(leadSummary(s||{},catalogue))}`;

// ---------------------------------------------------------------- Simulator
const CONSENT_ASK='I see contact details in your message. To keep them so our team can contact you about this enquiry, tick “You can contact me about this enquiry” below and send them again. Otherwise I won’t store them.';
export function initialState(){return {turns:0,ref:''};}
const vary=(s,list)=>list[(s.turns||0)%list.length];
const listOf=cards=>cards.map(c=>`• ${c.name}${c.storage?` ${c.storage}`:''}${c.condition?` (${c.condition})`:''}: ${c.priceText}${c.wasPrice?` — Hot Deal, was ${c.wasPrice}`:''}`).join('\n');
function deliveryAnswer(s,kb,rates,text){
 const fact=knowledgeFact(kb,'delivery'),loc=parseLocation(text,rates)||(s.locationRate?rates.find(r=>r.area===s.locationRate):null);
 if(loc){s.location=loc.label&&loc.scope==='state'?`${loc.area} (${loc.label} park)`:loc.area;s.locationRate=loc.area;
  if(loc.fee_ngn==null||loc.enabled===false)return `Delivery to ${loc.area} doesn’t have a price set yet, so I can’t quote it. Our team can check for you.`;
  return loc.scope==='lagos_lga'?`Home delivery to ${loc.area} is ${naira(loc.fee_ngn)}. You’ll see the same fee at checkout before you pay. Delivery time depends on the carrier, and the team confirms it after payment. Pickup at our store is free.`
   :`For ${loc.area}, we send your order to the transport park in ${loc.label} for ${naira(loc.fee_ngn)}, and the team contacts you with collection details. The fee shows at checkout before you pay. Pickup at our Lagos store is free.`;}
 return fact?.content?fact.content+' Tell me your area or state and I’ll give you the exact fee.':'';
}
function kbAnswer(kb,key,{prefix=''}={}){const f=knowledgeFact(kb,key);if(!f)return '';if(f.verified)return prefix+f.content;return `I don’t have confirmed information about ${f.title.toLowerCase()} yet, so I won’t guess. Our team can tell you — tap “Talk to a person” and they’ll reply.`;}
function nextQuestion(s,catalogue){
 const p=catalogue.find(x=>x.slug===s.product);
 if(!s.product&&!s.category)return ['product','Which device are you looking for?'];
 if(p&&!s.storage&&new Set(p.variants.map(v=>v.capacity)).size>1)return ['storage','Which storage would you like?'];
 if(p&&!s.condition&&p.conditions.length>1)return ['condition',`Do you prefer ${p.conditions.join(' or ')}?`];
 if(!s.budget&&!p)return ['budget','What’s your budget?'];
 if(!s.payment)return ['payment','How would you like to pay — card, bank transfer, Pay Small Small with Credit Direct, or pay at pickup?'];
 if(!s.location&&s.payment!=='pickup')return ['location','Where should we deliver to? Tell me your area in Lagos or your state — or you can pick up at our store.'];
 if(!s.timeline)return ['timeline','When are you hoping to buy?'];
 return null;
}
// ---- Swap conversation: current iPhone → storage → condition → target → estimate and top-up ----
const CHECK_QUESTION='Has anything been changed or damaged on it — screen changed or cracked, battery changed, back glass changed or cracked, or Face ID not working? Or is everything original?';
const CHECK_CHIPS=['Everything original','Battery changed','Screen changed','Screen cracked','Back glass cracked','Face ID not working'];
const TARGET_CUE=/\b(to|for|into|want|wan|need|buy|upgrade to|get me|collect)\s*(the |a |an |una )?$/;
const CURRENT_CUE=/\b(have|get|got|my|using|use|current|currently|dey use|i get|na|own)\s*(an |a |the |my )?$/;
function swapTurn(s,text,t,ctx,intents){
 const {catalogue}=ctx,sw={checks:{},...(s.swap||{})};sw.checks={...(sw.checks||{})};
 const phones=findSwapPhones(text),named=ctx.named||namedProducts(catalogue,text),out=[];let cards=[],suggestions=[],asked=null;
 const posOf=p=>{for(const k of [p.key.full,p.key.short,p.key.bare].filter(Boolean)){const i=t.indexOf(k);if(i>=0)return i;}return -1;};
 const nonApple=named.find(p=>p.variants&&['samsung','pixel'].includes(p.category)&&posOf(p)>=0&&CURRENT_CUE.test(' '+t.slice(Math.max(0,posOf(p)-30),posOf(p)).replace(/\b(samsung|galaxy|google|pixel)\b/g,'').replace(/\s+/g,' ').trimEnd()+' '));
 const brandM=!nonApple&&!sw.current&&t.match(/\b(have|get|got|my|using|use|swap|trade|exchange)\b[^.]{0,12}?\b(samsung|galaxy|pixel|google|tecno|infinix|itel|redmi|xiaomi|oppo|vivo|nokia|huawei|motorola|oneplus)\b/);
 const brandBeforeTo=brandM&&(()=>{const to=t.search(/\b(to|for|into)\b/);return to<0||brandM.index<to;})();
 if(brandBeforeTo){s.swap=sw;const b=brandM[2]==='galaxy'?'Samsung':brandM[2]==='google'?'Google Pixel':brandM[2].replace(/^./,c=>c.toUpperCase());out.push(`I can only price iPhone swaps in chat — our team values ${b} phones themselves. Tap “Talk to a person” and they’ll give you a quote right here.`);return {out,cards,suggestions:['Talk to a person'],asked};}
 if(nonApple&&!sw.current){s.swap=sw;out.push(`I can’t price a ${nonApple.model} swap in chat yet — our team values Samsung and Google Pixel swaps themselves. Tap “Talk to a person” and they’ll give you a quote here.`);return {out,cards,suggestions:['Talk to a person'],asked};}
 // Which phone is theirs and which do they want?
 let current=null,target=null;
 for(const ph of phones){const before=' '+t.slice(Math.max(0,ph.at-26),ph.at);
  if(TARGET_CUE.test(before)&&(sw.current||phones.length>1))target=target||ph;else if(CURRENT_CUE.test(before)||(!sw.current&&!current))current=current||ph;else target=target||ph;}
 if(current&&(!sw.current||current.slug!==sw.current.slug)){sw.current={slug:current.slug,model:current.model,storage:current.storage||null,priced:current.priced};sw.quote=null;}
 else if(current&&current.storage&&sw.current)sw.current.storage=current.storage;
 const st=parseStorage(text);if(sw.current&&!sw.current.storage&&st&&!target)sw.current.storage=st;
 // A second phone named after "to/for/into" is the one they want; a name inside their own phone's words is not.
 const cut=current?(()=>{const m=t.slice(current.at).match(/\b(to|for|into)\b/);return m?current.at+m.index:Infinity;})():-1;
 const tProduct=target?catalogue.find(p=>p.slug===target.slug):named.find(p=>p.variants&&p.slug!==sw.current?.slug&&(!current||posOf(p)>cut));
 if(tProduct){sw.target=tProduct.slug;s.product=tProduct.slug;s.category=tProduct.category;sw.quote=null;}
 else if(target&&!catalogue.some(p=>p.slug===target.slug))out.push(`We don’t have the ${target.model} with a confirmed price right now, so I can’t work out the top-up for it. I can still value your phone.`);
 Object.assign(sw.checks,parseSwapChecks(text));
 if(/^(everything original|all original)$/i.test(text.trim()))sw.checks.done=true;
 s.swap=sw;

 if(!sw.current){out.push('Happy to help with a swap! Which iPhone do you have now, and what storage? For example “iPhone 12 Pro 128GB”.');return {out,cards,suggestions,asked:'swap_current'};}
 const m=SWAP_MODELS.find(x=>x.slug===sw.current.slug),storages=[...m.storages.entries()].filter(([,c])=>c.swapReferencePrice>0).map(([k])=>k);
 if(!m.priced||(sw.current.storage&&!storages.includes(sw.current.storage)&&m.storages.has(sw.current.storage))){out.push(`I don’t have a swap price for the ${m.model}${sw.current.storage?` ${sw.current.storage.toUpperCase()}`:''} in our list, so the team will value it for you. Tap “Talk to a person” and they’ll reply here.`);suggestions=['Talk to a person'];return {out,cards,suggestions,asked};}
 if(!sw.current.storage||!m.storages.has(sw.current.storage)){if(storages.length===1)sw.current.storage=storages[0];else{out.push(`What storage is your ${m.model}? ${storages.map(x=>x.toUpperCase()).join(', ')}?`);return {out,cards,suggestions:storages.map(x=>x.toUpperCase()),asked:'swap_storage'};}}
 if(!checksAnswered(sw.checks)){out.push(`Got it — ${m.model} ${sw.current.storage.toUpperCase()}. ${CHECK_QUESTION}`);return {out,cards,suggestions:CHECK_CHIPS,asked:'swap_checks'};}
 const tp=catalogue.find(p=>p.slug===sw.target);
 const tv=tp?(tp.variants.filter(v=>(!s.storage||norm(v.capacity).replace(/ /g,'')===s.storage)&&(!s.condition||v.condition===s.condition)&&v.stockStatus!=='out_of_stock')[0]||tp.variants[0]):null;
 const q=swapQuote({slug:sw.current.slug,storage:sw.current.storage,checks:sw.checks,targetPrice:tv?.price});
 if(!q){out.push('I couldn’t work out an estimate for that phone, so the team will value it for you.');suggestions=['Talk to a person'];return {out,cards,suggestions,asked};}
 const issues=q.deductions.map(d=>`${d.label.toLowerCase()} (−${d.percent}%)`);
 if(q.requiresAssessment){sw.quote=null;out.push(`Because Face ID isn’t working, our technician needs to check the ${q.model} before we can put a value on it. Bring it to the store or tap “Talk to a person” and the team will guide you.`);suggestions=['Talk to a person'];return {out,cards,suggestions,asked};}
 sw.quote={model:q.model,storage:q.storage,value:q.value,topUp:q.topUp,target:tp?`${tp.model} ${tv.capacity}`.trim():null};
 out.push(`Your ${q.model} ${q.storage}${issues.length?` with ${issues.join(', ')}`:' in good original condition'} is worth about ${naira(q.value)} in a swap.`);
 if(tp){cards=[card(tp,tv)];
  out.push(q.topUp>0?`The ${tp.model}${tv.capacity?` ${tv.capacity}`:''} (${conditionName(tv.condition)}) is ${priceText(tv)}, so you’d add about ${naira(q.topUp)}.`:`The ${tp.model}${tv.capacity?` ${tv.capacity}`:''} is ${priceText(tv)}, so your phone covers it — the team will confirm any balance.`);
  out.push('This is an estimate from our swap price list; the final value is confirmed when we inspect your phone in store. You can pay the top-up by card, transfer or Pay Small Small with Credit Direct.');
  suggestions=['Book the swap','Show other phones','Pay Small Small'];
 }else{out.push('That’s an estimate from our swap price list; the final value is confirmed when we inspect your phone in store. Which phone would you like to swap into? I’ll tell you how much you’d add.');asked='swap_target';suggestions=['iPhone 15 Pro Max','iPhone 16 Pro Max','iPhone 13'];}
 return {out,cards,suggestions,asked};
}

/**
 * One customer message in simulation mode.
 * ctx = {catalogue, unpriced, kb (knowledgeMap), rates}. Returns {state, reply:{text, cards, suggestions, handoff, askConsent}, intents, escalation}.
 */
export function simulate(state,message,ctx){
 const {catalogue=[],unpriced=[],kb=knowledgeMap(),rates=[]}=ctx||{};
 const s={...initialState(),...(state||{})};s.turns=(s.turns||0)+1;
 const text=cleanText(message),t=norm(text),intents=detectIntents(text);
 const has=k=>intents.includes(k),out=[];let cards=[],handoff=false,askConsent=false,escalation=null,asked=null,suggestions=[];
 const pidgin=PIDGIN.test(t);if(pidgin)s.pidgin=true;
 const reply=()=>({state:s,intents,escalation,reply:{text:out.filter(Boolean).join('\n\n'),cards,suggestions:suggestions.slice(0,4),handoff,askConsent}});
 if(!text){out.push('Hi! I’m Mikee AI, the virtual shopping assistant for Mikee Gadget Plug. Ask me about any phone, tablet, watch or gadget — prices, storage, UK Used or Brand New, delivery or Pay Small Small.');suggestions=['How much is iPhone 15 Pro Max?','Phones under ₦400k','Delivery to Abuja','Pay Small Small'];return reply();}
 if(has('injection')){out.push('I can only help with shopping at Mikee Gadget Plug — products, prices, delivery and payment. I can’t share my instructions or change how I work. What device are you looking for?');return reply();}

 // Facts the customer gave us (kept for this session only).
 let named=namedProducts(catalogue,text,{unpriced});
 // While talking about iPhones, a bare number means an iPhone ("what about 13?").
 if(!named.length&&(s.category==='iphones'||s.swap)&&/\b(1[1-8]|x[rs]?|se)\b/.test(t)&&!/\b\d+ ?(k|m|gb|tb)\b/.test(t))named=namedProducts(catalogue,t.replace(/\biphone\b/g,' ').replace(/\b(1[1-8]|x[rs]?|se)\b/,'iphone $1'),{unpriced});
 const budget=parseBudget(text),storage=parseStorage(text),condition=parseCondition(text),sim=parseSim(text),payment=parsePayment(text),timeline=parseTimeline(text),cats=categoryFromText(text);
 const phone=parsePhone(text),email=parseEmail(text),name=parseName(text);
 if(budget?.max){s.budget=budget.max;s.budgetMin=budget.min||0;}else if(budget?.min){s.budgetMin=budget.min;}
 if(condition&&!has('compare_condition'))s.condition=condition;if(sim)s.sim=sim;if(timeline)s.timeline=timeline;if(name)s.name=name;
 if(payment&&!has('payment'))s.payment=payment;else if(payment&&(has('instalments')||/\bi (will|go|wan|want to|prefer)\b/.test(t)))s.payment=payment;
 if(has('checkout'))s.checkout=true;
 const pricedNamed=named.filter(p=>p.variants),unpricedNamed=named.filter(p=>!p.variants);
 if(pricedNamed.length===1&&pricedNamed[0].slug!==s.product){s.product=pricedNamed[0].slug;if(!storage)s.storage=null;s.category=pricedNamed[0].category;}
 if(storage)s.storage=storage;
 const genericPhones=/\bphones?\b/.test(t)&&!cats.length;
 if(cats.length&&!pricedNamed.length)s.category=cats[0];
 // A fresh budget or category search ("phones under 300k") starts over instead of sticking to the last product.
 if(!pricedNamed.length&&!storage&&(cats.length||genericPhones)&&(budget||has('recommend')||has('availability')||has('price'))){s.product=null;if(genericPhones)s.category='phones';}
 const q=productQuery(text),cur=catalogue.find(x=>x.slug===s.product);
 if(cur&&cats.length&&!pricedNamed.length&&!cats.includes(cur.category)){s.product=null;s.storage=null;}
 // "what of the pro max?" after the iPhone 12 Pro → iPhone 12 Pro Max
 if(cur&&!named.length&&q&&s.product&&q.split(' ').every(w=>/^(pro|max|plus|mini|ultra|fe|air|fold|flip|se|lite|edge|classic|xl|a|e)$/.test(w))){const base=cur.model.split(' ');const i=base.findIndex(w=>/\d/.test(w));const fam=namedProducts(catalogue,base.slice(0,i+1).join(' ')+' '+q).filter(p=>p.variants);if(fam.length===1&&fam[0].slug!==cur.slug){s.product=fam[0].slug;s.storage=storage||null;named.push(fam[0]);pricedNamed.push(fam[0]);}}
 const aboutCurrent=cur&&q&&q.split(' ').every(w=>cur.key.full.split(' ').includes(w));
 const modelish=/\b\d{1,2}\s?(pro|max|plus|ultra|mini|fe|lite|edge)\b|\b[a-z]\d{1,3}\s?(ultra|plus|fe|5g)?\b/.test(t)&&t.split(' ').length<=6;
 const unknownAsk=!named.length&&!cats.length&&!genericPhones&&!aboutCurrent&&(has('price')||has('availability')||(modelish&&!budget&&!storage&&!s.swap))&&/[a-z]{3,}|\d/.test(q)&&!['delivery','warranty','swap','payment','instalments','pickup','location','hours','returns','authenticity'].some(has);
 if(phone||email){if(s.consent){if(phone)s.phone=phone;if(email)s.email=email;}else{askConsent=true;s.pendingContact=true;}}
 const product=catalogue.find(x=>x.slug===s.product);
 const filters={condition:s.condition,storage:s.storage,sim:s.sim};
 if(has('humor')&&!has('complaint')&&!has('dispute'))out.push(vary(s,['😄 I hear you!','Haha, you sef! 😄','😂 Fair enough.']));

 // 1. Serious matters go to the team, in a plain professional tone.
 if(has('dispute')){handoff=true;s.wantsHuman=true;escalation='payment_dispute';out.push('I’m sorry about this — payment problems need a real person. I’ve flagged this chat for our team. Please type your order or payment reference here so they can check it. Duplicate or failed charges are refunded in full once confirmed (see /returns-refunds/).');return reply();}
 const midSwap=s.swap&&!s.swap.quote&&['swap_current','swap_storage','swap_checks','swap_target'].includes(s.lastAsked);
 if(has('complaint')&&!midSwap){handoff=true;s.wantsHuman=true;escalation='complaint';out.push('I’m sorry you’ve had this experience. I’ve flagged this chat for our team so a person can help directly. If it’s about a device you bought, please have your order reference ready.'+(knowledgeFact(kb,'warranty')?.verified?' Faults present at delivery are covered by our 7-day warranty.':''));return reply();}
 if(has('human')&&!has('identity')&&!has('delivery')){handoff=true;s.wantsHuman=true;escalation='requested';out.push('No problem — I’ve let our team know you’d like a person. They’ll reply right here in this chat — keep this window open, or leave your phone number if you’d like a call back.');if(askConsent){out.push(CONSENT_ASK);s.pendingContact=false;}return reply();}
 if(has('identity')){out.push('I’m Mikee AI, a virtual shopping assistant — not a human. I answer from Mikee Gadget Plug’s live catalogue and store policies, and I can connect you to a person on our team at any time.');}

 // 2a. Swaps (estimate from the swap price list).
 if(/^book the swap$/i.test(text.trim())&&s.swap?.quote){handoff=true;s.wantsHuman=true;escalation='requested';out.push('Great — I’ve passed your swap details to our team. They’ll reply here to confirm the estimate and arrange the inspection at our Computer Village store. Leave your phone number if you’d like them to call you.');return reply();}
 const swapActive=s.swap&&!s.swap.quote&&['swap_current','swap_storage','swap_checks','swap_target'].includes(s.lastAsked);
 const swapFollow=s.swap?.current&&s.swap.quote&&pricedNamed.length&&(s.lastAsked==='swap_target'||/\b(top ?up|add|balance|instead|what about|what of|how about)\b/.test(t)||t.split(' ').length<=4);
 if(has('swap')||swapActive||swapFollow||(s.swap?.current&&findSwapPhones(text).length&&/\b(swap|upgrade|to|for|into)\b/.test(t))){
  const r=swapTurn(s,text,t,{catalogue,named},intents);out.push(...r.out);cards=r.cards;suggestions=r.suggestions;asked=r.asked;s.lastAsked=asked||null;return reply();
 }
 // 2. Price objections: acknowledge, show facts, look for something cheaper, offer the team. Never a discount.
 if(has('negotiation')){
  const tmpl=(kb.get('objections')?.content||'').split('|').map(x=>x.trim()).filter(Boolean);
  if(!has('humor'))out.push(s.pidgin?vary(s,['I understand, no wahala.','I hear you o.','E get why — good phones no cheap.']):(tmpl.length?vary(s,tmpl):'I understand.'));
  const ref=product?product.variants.filter(v=>variantMatches(v,filters))[0]||product.variants[0]:null;
  if(ref?.deal)out.push(`The ${product.model} is already on Hot Deal at ${naira(ref.price)} (was ${naira(ref.originalPrice)}).`);
  if(!s.budget){out.push(`What budget are you working with? I’ll look for the best option within it${product?` — another storage, condition or a similar model to the ${product.model}`:''}.`);asked='budget';}
  else{
   const cheaper=searchCatalogue(catalogue,{category:product?.category||s.category,budgetMax:s.budget,condition:s.condition&&s.condition!=='any'?s.condition:undefined,limit:4}).filter(c=>!ref||c.price<ref.price);
   if(cheaper.length){cards=cheaper;out.push(`Within ${naira(s.budget)}, these are good options:\n${listOf(cheaper)}`);}
   else out.push(`I couldn’t find a ${product?.category==='iphones'?'similar iPhone':'similar device'} within ${naira(s.budget)} in our catalogue right now.`);
  }
  out.push('Pay Small Small with Credit Direct can also spread the cost (Credit Direct decides approval). I can’t change prices or give discounts, but if you’d like the team to review the price for you, tap “Ask the team about price”.');
  suggestions=['Ask the team about price','Show cheaper options','Pay Small Small'];
  escalation='price_review_offered';
  return reply();
 }

 // 3. Comparisons.
 if(has('compare_condition')){
  out.push(kbAnswer(kb,'conditions'));
  if(product){const byCond=product.conditions.map(c=>{const v=product.variants.find(x=>x.condition===c&&(!s.storage||norm(x.capacity).replace(/ /g,'')===s.storage));return v?`• ${c}: from ${naira(v.price)}${s.storage?` (${v.capacity})`:''}`:'';}).filter(Boolean);
   if(byCond.length>1)out.push(`For the ${product.model}:\n${byCond.join('\n')}`);else if(byCond.length)out.push(`We currently have the ${product.model} as ${product.conditions[0]} only.`);else out.push(`For the ${product.model}, the condition of each unit is confirmed on enquiry — our team can tell you exactly what’s available.`);}
  if(!product)out.push('Which model are you considering? I’ll show you the UK Used and Brand New prices side by side.');
  return reply();
 }
 if(has('compare')&&pricedNamed.length===1&&unpricedNamed.length){const u=unpricedNamed[0],pp=pricedNamed[0];cards=[card(pp,pp.variants[0])];out.push(`I can only compare what has a confirmed price. The ${pp.model} is from ${naira(pp.variants[0].price)}. The ${u.model} is on our website but has no confirmed price right now — our team can check it for you.`);suggestions=['Talk to a person'];return reply();}
 if(has('compare')&&pricedNamed.length===1&&!unpricedNamed.length)out.push(`I could only find the ${pricedNamed[0].model} in our catalogue — the other model isn’t listed right now, so I can’t compare prices.`);
 if((has('compare')||/\b(or|and|abi)\b|,/.test(t)||pricedNamed.length>=2)&&pricedNamed.length>=2){
  const [a,b]=pricedNamed;const row=p=>{const vs=p.variants;return `• ${p.model}: from ${naira(vs[0].price)} · storage ${[...new Set(vs.map(v=>v.capacity))].join(', ')} · ${p.conditions.join(' / ')||'condition on enquiry'}${vs.some(v=>v.connectivity)?` · ${[...new Set(vs.map(v=>v.connectivity).filter(Boolean))].join(', ')}`:''}`;};
  out.push(`Here’s how they compare in our catalogue:\n${row(a)}\n${row(b)}`);
  cards=[card(a,a.variants[0]),card(b,b.variants[0])];
  out.push('I can compare price, storage, condition and SIM options from our catalogue. For detailed specs like camera or battery life, our team can advise. What matters most to you — budget, camera, battery or storage?');
  s.product=null;s.compared=[a.slug,b.slug];
  return reply();
 }

 // 4. Store policies (one or two per reply).
 const topics=[];
 if(has('delivery'))topics.push(deliveryAnswer(s,kb,rates,text));
 if(has('instalments'))topics.push(kbAnswer(kb,'credit_direct'));
 else if(has('payment'))topics.push(kbAnswer(kb,'payment'));
 if(has('warranty'))topics.push(kbAnswer(kb,'warranty'));
 if(has('returns')&&!has('warranty'))topics.push(kbAnswer(kb,'returns'));
 if(has('pickup')&&!has('delivery'))topics.push(kbAnswer(kb,'pickup'));
 if(has('location')&&!has('pickup'))topics.push(kbAnswer(kb,'location')+(knowledgeFact(kb,'inspection')?.verified?' You can inspect the device in store before paying.':''));
 if(has('hours'))topics.push(kbAnswer(kb,'hours'));
 if(has('swap'))topics.push(kbAnswer(kb,'swap'));
 if(has('authenticity'))topics.push(kbAnswer(kb,'inspection'),/\bicloud|activation|original|genuine|fake|clone\b/.test(t)?kbAnswer(kb,'authenticity_checks'):'');
 if(!has('delivery')&&parseLocation(text,rates)&&(s.product||s.payment))topics.push(deliveryAnswer(s,kb,rates,text));
 const policy=topics.filter(Boolean).slice(0,2);out.push(...policy);

 // 5. Products.
 const wantsProduct=unknownAsk||pricedNamed.length||unpricedNamed.length||has('price')||has('availability')||has('recommend')||has('budget')||storage||cats.length||(condition&&s.product);
 if(unknownAsk){
  out.push(`I couldn’t find “${q}” in our current catalogue, so I can’t give a price for it. Try the exact model name (for example “iPhone 15 Pro Max” or “Samsung S24 Ultra”), or ask the team — they can check with our suppliers.`);suggestions=['Talk to a person','Show me iPhones','Phones under ₦400k'];
 }else if(unpricedNamed.length&&!pricedNamed.length){
  const u=unpricedNamed[0];out.push(`We list the ${u.model} on our website, but I don’t have a confirmed price for it right now, so I won’t guess. Our team can check the price and availability for you.`);suggestions=['Talk to a person'];
 }else if(product&&(pricedNamed.length||storage||(condition&&!policy.length)||sim||has('price')||has('availability')||(budget&&!policy.length))){
  const vs=product.variants.filter(v=>variantMatches(v,filters));
  if(vs.length){cards=vs.slice(0,4).map(v=>card(product,v));
   out.push(`${vary(s,['Here’s what we have','Sure — here are the options','Good choice'])} for the ${product.model}${s.storage?` ${s.storage.toUpperCase()}`:''}${s.condition?` (${s.condition})`:''}:\n${listOf(cards)}${vs.length>4?`\n…and ${vs.length-4} more on the product page.`:''}`);
   if(vs.some(v=>v.stockStatus&&v.stockStatus!=='in_stock'))out.push('Availability is shown for each option; the team confirms the exact unit before you pay.');
   if(s.budget&&vs[0].price>s.budget){const alt=searchCatalogue(catalogue,{category:product.category,budgetMax:s.budget,limit:3});out.push(`That’s above your ${naira(s.budget)} budget.${alt.length?` Within budget:\n${listOf(alt)}`:''}`);if(alt.length)cards=[...cards.slice(0,2),...alt.slice(0,2)];}
  }else{
   const avail=[...new Set(product.variants.filter(v=>!s.condition||v.condition===s.condition).map(v=>v.capacity))].filter(Boolean);
   const what=[s.storage&&s.storage.toUpperCase(),s.condition,s.sim==='wifi'?'Wi-Fi only':s.sim==='esim'?'eSIM':''].filter(Boolean).join(' ');
   out.push(`We don’t have the ${product.model}${what?` in ${what}`:''} in our catalogue right now.${avail.length?` Available${s.condition?` as ${s.condition}`:''}: ${avail.join(', ')}.`:product.conditions.length?` Available as: ${product.conditions.join(', ')}.`:''}`);
   if(s.condition&&!product.conditions.includes(s.condition))s.condition=null;
   if(s.storage&&!avail.includes(s.storage.toUpperCase()))s.storage=null;
   cards=product.variants.slice(0,3).map(v=>card(product,v));
  }
 }else if(!product&&(s.budget||cats.length||has('recommend'))&&wantsProduct){
  const found=searchCatalogue(catalogue,{category:s.category==='phones'?['iphones','samsung','pixel']:s.category||undefined,budgetMax:s.budget,budgetMin:s.budgetMin||undefined,condition:s.condition&&s.condition!=='any'?s.condition:undefined,sim:s.sim,limit:4});
  if(found.length){cards=found;out.push(`${s.budget?`Within ${naira(s.budget)}`:'From our catalogue'}${s.category?`, here are some ${categoryLabel(s.category)}`:', here are some options'}:\n${listOf(found)}`);}
  else out.push(`I couldn’t find ${s.category?categoryLabel(s.category):'a device'} ${s.budget?`within ${naira(s.budget)}`:''} in our catalogue right now.${s.budget?' Pay Small Small with Credit Direct could help spread the cost, or the team can check new arrivals.':''}`);
 }else if(wantsProduct&&!policy.length&&!product){
  const q=productQuery(text);
  out.push(q?`I couldn’t find “${q}” in our current catalogue. Try the model name (for example “iPhone 15 Pro Max” or “Samsung S24 Ultra”), or ask the team and they’ll check with our suppliers.`:'Which device are you looking for? Tell me the model, or your budget and I’ll suggest options.');
  if(q)suggestions=['Talk to a person'];
 }

 if((phone||email)&&s.consent&&!out.length)out.push(`Thank you${s.name?`, ${s.name}`:''}! Our team may contact you on ${[s.phone,s.email].filter(Boolean).join(' or ')} about this enquiry only. They’ll reply here too.`);
 // 6. Small talk and everything else.
 if(!out.length||(out.length===1&&has('humor'))){
  if(has('greeting'))out.push(s.pidgin?'How far! I’m Mikee AI, the virtual assistant for Mikee Gadget Plug. Wetin you dey find today — phone, tablet, watch?':`${vary(s,['Hi','Hello','Hi there'])}! I’m Mikee AI, the virtual shopping assistant for Mikee Gadget Plug in Computer Village. What are you looking for today?`);
  else if(has('thanks'))out.push(s.pidgin?'You’re welcome! Anything else, just ask.':'You’re welcome! Anything else I can help with?');
  else if(has('bye'))out.push('Thanks for chatting with Mikee Gadget Plug. Come back anytime!');
  else if(has('checkout')&&product)out.push(`You can buy the ${product.model} from its product page: choose the option and tap Buy now. At checkout you pick delivery or pickup and how to pay.`);
  else if(timeline||payment||budget||storage||condition||s.location!==state?.location||name){
   const got=[timeline&&`buying ${TIMELINE[timeline].toLowerCase()}`,payment&&s.payment&&PAYMENT[s.payment],budget?.max&&`budget up to ${naira(budget.max)}`,storage&&storage.toUpperCase(),condition&&condition].filter(Boolean);
   out.push(name?'':`${s.pidgin?'Noted o':'Noted'}${got.length?` — ${got.join(', ')}`:''}.`);
   const nq=nextQuestion(s,catalogue);if(nq){out.push(nq[1]);asked=nq[0];}
   else if(s.product){const p=catalogue.find(x=>x.slug===s.product);out.push(`That’s everything I need. Tap “Buy now” on the phone above to check out, or ask me to get the team to confirm the exact unit for you.`);cards=p.variants.filter(v=>variantMatches(v,{condition:s.condition,storage:s.storage})).slice(0,2).map(v=>card(p,v));suggestions=['Talk to a person'];}
  }
  else{out.push('I’m not sure I can help with that — I’m a shopping assistant for Mikee Gadget Plug, so I can answer questions about our products, prices, delivery, payment, warranty and swaps. For anything else, our team can help.');suggestions=['Talk to a person','Phones under ₦400k'];}
 }
 if(askConsent){out.push(CONSENT_ASK);s.pendingContact=false;}
 if(name&&!askConsent)out.push(`Nice to meet you, ${name}!`);
 // One natural follow-up question when it helps.
 if(!handoff&&!asked&&(cards.length||(policy.length&&!s.product&&!s.category))&&!has('bye')){const nq=nextQuestion(s,catalogue);if(nq&&nq[0]!==s.lastAsked){out.push(nq[1]);asked=nq[0];}}
 s.lastAsked=asked||null;
 if(cards.length&&product&&!suggestions.length)suggestions=['UK Used or Brand New?','Pay Small Small','Delivery fee'];
 return reply();
}
const categoryLabel=c=>({iphones:'iPhones',samsung:'Samsung phones',pixel:'Google Pixel phones',ipads:'iPads',tablets:'tablets',watches:'smartwatches',airpods:'AirPods',audio:'earbuds and headphones',speakers:'speakers',accessories:'accessories',ps5:'PlayStation 5 items'})[c]||'devices';
