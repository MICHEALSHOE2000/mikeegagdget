// Suggests which catalogue product (and colour) an uploaded photo belongs to. Deterministic: it uses the file name,
// the catalogue's model names, slugs and colour lists, and the photo's dominant colours. It never guesses storage
// from appearance and never publishes anything — every suggestion needs an administrator's approval.
const FUSED={promax:['pro','max'],proxl:['pro','xl'],profold:['pro','fold'],seriesse:['series','se'],ultra2:['ultra','2']};
const STOP=new Set(['img','image','photo','pic','picture','copy','final','new','edited','whatsapp','jpg','jpeg','png','webp','apple','google','samsung','galaxy','the','and','with','gen','generation','inch','in','th','nd','rd','st','a','of','for','iphone','ipad','pixel','watch']);
const FAMILY=['iphone','ipad','pixel','watch','galaxy','macbook','airpods','jbl','playstation'];
const CATEGORY_HINT={watch:'watches',ipad:'ipads',airpods:'airpods',macbook:'macbooks',jbl:'speakers',playstation:'ps5',pencil:'accessories',keyboard:'accessories'};
export const CONFIDENCE={high:80,medium:50};
export const band=score=>score>=CONFIDENCE.high?'high':score>=CONFIDENCE.medium?'medium':'low';

// "google_pixel_10pro_xl.webp" → ['google','pixel','10','pro','xl']
export function tokens(text){
 const base=String(text||'').toLowerCase().replace(/\.[a-z0-9]{2,5}$/,'').replace(/[‐-―]/g,'-');
 const out=[];
 for(let t of base.split(/[^a-z0-9]+/).filter(Boolean)){
  // Split "10pro"→10,pro and "ultra4"→ultra,4, but keep model suffixes (6a, m4, s24) and sizes (256gb) whole.
  const parts=/^\d+(gb|tb|mm)$/.test(t)?[t]:t.split(/(?<=\d)(?=[a-z]{2,})|(?<=[a-z]{2,})(?=\d)/);
  for(const part of parts){
   if(FUSED[part])out.push(...FUSED[part]);else if(/^\d+(st|nd|rd|th)$/.test(part))out.push(part.replace(/\D/g,''));else out.push(part);
  }
 }
 return out;
}
const lev=(a,b)=>{if(Math.abs(a.length-b.length)>1)return 2;const d=Array.from({length:a.length+1},(_,i)=>[i,...Array(b.length).fill(0)]);for(let j=1;j<=b.length;j++)d[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[a.length][b.length];};
const significant=list=>list.filter(t=>!STOP.has(t));
// Storage is taken only from the file name (e.g. "256gb"), never from the picture.
export const storageFromName=name=>{const m=String(name||'').toLowerCase().match(/(\d+)\s*(gb|tb)\b/);return m?m[1]+m[2].toUpperCase():'';};

function scoreProduct(fileTokens,product){
 const slugT=product.slug.split('-');
 if(fileTokens.join('-')===product.slug)return {score:100,reasons:['File name is exactly this product’s page name']};
 const want=significant([...new Set([...tokens(product.model),...tokens(product.slug)])]);
 const have=significant(fileTokens);
 if(!want.length||!have.length)return {score:0,reasons:[]};
 const reasons=[];let hit=0,fuzzy=0;
 for(const w of want){if(have.includes(w))hit++;else if(!/\d/.test(w)&&w.length>2&&have.some(h=>!/\d/.test(h)&&lev(h,w)===1)){fuzzy++;reasons.push(`“${have.find(h=>lev(h,w)===1)}” read as “${w}” (likely typo)`);}}
 // Generation numbers must agree exactly: Pixel 10 is not Pixel 11.
 const nums=want.filter(w=>/^\d+$/.test(w)),fileNums=have.filter(h=>/^\d+$/.test(h));
 if(nums.some(n=>!fileNums.includes(n))||fileNums.some(n=>!nums.includes(n)&&Number(n)<100))return {score:Math.min(30,Math.round(25*(hit+fuzzy)/want.length)),reasons:['Model number differs']};
 const extra=have.filter(h=>!want.includes(h)&&!(want.some(w=>lev(h,w)===1))&&!/^\d+(gb|tb|mm)?$/.test(h)&&!COLOUR_WORDS.has(h));
 let score=Math.round(100*(hit+0.75*fuzzy)/want.length)-extra.length*12;
 const family=FAMILY.find(f=>fileTokens.includes(f));
 if(family&&!product.model.toLowerCase().includes(family==='watch'?'watch':family))score-=40;
 const hint=Object.entries(CATEGORY_HINT).find(([w])=>fileTokens.includes(w))?.[1];
 if(hint&&product.category!==hint&&!(hint==='speakers'&&product.category==='audio'))score-=25;
 reasons.unshift(`Name matches ${hit+fuzzy} of ${want.length} model words${extra.length?`; unexplained words: ${extra.join(', ')}`:''}`);
 return {score:Math.max(0,Math.min(99,score)),reasons};
}
const COLOUR_WORDS=new Set('black white silver gold blue orange pink green purple red yellow grey gray burgundy glacier titanium natural desert midnight starlight lavender teal mint sage coral obsidian porcelain hazel rose lemongrass peony iris jade moonstone indigo frost wintergreen sky cloud light space deep cosmic mist ultramarine graphite'.split(' '));
const rgb=hex=>{const n=parseInt(String(hex).replace('#',''),16);return [n>>16&255,n>>8&255,n&255];};
const dist=(a,b)=>Math.sqrt(2*(a[0]-b[0])**2+4*(a[1]-b[1])**2+3*(a[2]-b[2])**2);

// colours: [{rgb:[r,g,b],share:0..1}] from the browser (largest non-background clusters first)
export function colourSuggestion(name,product,colours,swatch){
 const options=product.colors||[];
 if(!options.length)return {color:'',source:'',note:'This product has no colour list; the photo is used for all variants.'};
 const lower=String(name||'').toLowerCase().replace(/[_-]+/g,' ');
 const named=[...options].sort((a,b)=>b.length-a.length).find(c=>lower.includes(c.toLowerCase()))||options.find(c=>c.toLowerCase().split(' ').some(w=>w.length>3&&lower.split(' ').includes(w)));
 if(named)return {color:named,source:'file name',note:`Colour “${named}” is in the file name`};
 const strong=(colours||[]).filter(c=>c.share>=0.08);
 if(!strong.length)return {color:'',source:'',note:'Colour not detected; choose it or keep the photo generic.'};
 const distinct=strong.filter((c,i)=>strong.slice(0,i).every(o=>dist(o.rgb,c.rgb)>140));
 if(distinct.length>=3)return {color:'',source:'',note:'Several colours appear in this photo, so no single colour is assigned.'};
 const ranked=options.map(c=>({c,d:dist(strong[0].rgb,rgb(swatch(c)))})).sort((a,b)=>a.d-b.d);
 if(ranked[0].d>170)return {color:'',source:'',note:'Photo colour does not clearly match any colour this product comes in.'};
 const close=ranked[1]&&ranked[1].d-ranked[0].d<25;
 return {color:ranked[0].c,source:'image colour',note:`Photo colour is closest to ${ranked[0].c}${close?` (also close to ${ranked[1].c} — please check)`:''}`,uncertain:close};
}

// products: catalogue products [{slug,model,brand,category,colors,variants}]
export function suggestMatch({filename,colours=[]},products,swatch=()=>'#cccccc'){
 const fileTokens=tokens(filename);
 const ranked=products.map(p=>({product:p,...scoreProduct(fileTokens,p)})).filter(r=>r.score>0).sort((a,b)=>b.score-a.score);
 const best=ranked[0];
 if(!best||best.score<35)return {slug:'',model:'',category:'',color:'',storage:'',score:best?.score||0,band:'low',reasons:['No catalogue product matches this file name. It stays in the Unmatched queue for manual matching.'],alternatives:ranked.slice(0,3).map(r=>r.product.slug)};
 let score=best.score;const reasons=[...best.reasons];
 if(ranked[1]&&best.score-ranked[1].score<8){score=Math.min(score,70);reasons.push(`Also similar to ${ranked[1].product.model} — compare before approving`);}
 const colour=colourSuggestion(filename,best.product,colours,swatch);reasons.push(colour.note);
 const storage=storageFromName(filename);
 const storageOk=storage&&best.product.variants?.some(v=>(v.capacity||v.storage).startsWith(storage));
 reasons.push(storage?(storageOk?`Storage ${storage} taken from the file name`:`File name says ${storage}, which this product is not listed in`):'Storage not assigned — a photo cannot show storage, so it is shared by all storage options');
 return {slug:best.product.slug,model:best.product.model,category:best.product.category,color:colour.color,colorSource:colour.source,storage:storageOk?storage:'',score,band:band(score),reasons,alternatives:ranked.slice(1,4).map(r=>r.product.slug)};
}

// Variants an approved photo should be linked to: same product, same colour (or every variant for a generic photo).
export function variantsForPhoto(product,color,storage=''){
 // A colour-specific photo is linked only to variants of that colour, never to variants whose colour is unrecorded.
 return product.variants.filter(v=>(!color||(v.color||'').split('/').map(c=>c.trim()).includes(color))&&(!storage||(v.capacity||v.storage).startsWith(storage))).map(v=>`${product.slug}|${v.storage}`);
}

// 64-bit difference hash (hex) helpers for near-duplicate warnings.
export function hamming(a,b){if(!a||!b||a.length!==b.length)return 64;let d=0;for(let i=0;i<a.length;i++){let x=parseInt(a[i],16)^parseInt(b[i],16);while(x){d+=x&1;x>>=1;}}return d;}
export const NEAR_DUPLICATE=6;
