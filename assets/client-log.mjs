// Reports checkout problems so they can be fixed: to the browser console and, through the order endpoint, to the
// Vercel function logs. Only the page, product SKU and a short reason are sent — never names, phone numbers or emails.
const WHATSAPP='2347086865133';
export const whatsappOrderHref=(model,detail='')=>`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hello Mikee Gadget Plug, I want to order the ${[model,detail].filter(Boolean).join(' — ')}. Please help me complete my order.`)}`;
const clean=v=>String(v??'').replace(/[^\w\s.,:;|·()+\-/@#'"]/g,'').slice(0,160);
let sent=0;
export function logIssue(kind,detail={}){
 const entry={kind:clean(kind),path:String(globalThis.location?.pathname||'').slice(0,120),...Object.fromEntries(Object.entries(detail).slice(0,8).map(([k,v])=>[clean(k).slice(0,30),clean(v)]))};
 try{console.error('[Mikee checkout]',entry);}catch{}
 if(sent>=10)return;sent++;
 try{const body=JSON.stringify({action:'client_log',entry});
  const nav=globalThis.navigator;if(nav?.sendBeacon&&nav.sendBeacon('/api/shop/create',new Blob([body],{type:'application/json'})))return;
  globalThis.fetch?.('/api/shop/create',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true})?.catch?.(()=>{});
 }catch{}
}
