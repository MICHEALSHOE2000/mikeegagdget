import { choices } from '../commerce/upgrade-core.mjs';
import { offerChoice } from '../commerce/offers.mjs';
const catalog = new Map(choices.filter(p=>p.forSale !== false).map(p=>{ const item=offerChoice(p);return [item.id,item]; }));
export const env = (key) => {const value=process.env[key];if(!value)throw Error('Missing server configuration: '+key);return value;};
export async function db(path,{method='GET',body}={}) {
 const res=await fetch(env('SUPABASE_URL')+'/rest/v1/'+path,{
 method,headers:{apikey:env('SUPABASE_SERVICE_ROLE_KEY'),Authorization:'Bearer '+env('SUPABASE_SERVICE_ROLE_KEY'),'Content-Type':'application/json',Prefer:'return=representation'},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const data=await res.json().catch(()=>null);
 if(!res.ok)throw Error('Database request failed: '+(data?.message||data?.details||res.status));
 return data;
}
export const productById=id=>catalog.get(id);
export async function paystack(path, options={}) {
 const res=await fetch('https://api.paystack.co'+path,{...options,headers:{Authorization:'Bearer '+env('PAYSTACK_SECRET_KEY'),'Content-Type':'application/json',...(options.headers||{})}});
 const body=await res.json();if(!res.ok||!body.status)throw Error('Payment provider request failed');
 return body.data;
}
export async function confirmPayment(reference) {
 const tx=await paystack('/transaction/verify/'+encodeURIComponent(reference));
 if(tx.status!=='success'||tx.currency!=='NGN'||tx.reference!==reference)return 'pending';
 const result=await db('rpc/checkout_confirm',{method:'POST',body:{p_reference:reference,p_paid_kobo:tx.amount}});
 return result;
}
export function sendJson(res,status,data){res.status(status).setHeader('Cache-Control','no-store').json(data);}
