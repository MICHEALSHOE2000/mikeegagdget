export const env=key=>{const value=process.env[key]||(key==='SHOP_ORIGIN'?process.env.SITE_URL:undefined);if(!value)throw Error('Checkout configuration is incomplete.');return value;};
export async function db(path,{method='GET',body}={}){
 const r=await fetch(env('SUPABASE_URL')+'/rest/v1/'+path,{method,headers:{apikey:env('SUPABASE_SERVICE_ROLE_KEY'),Authorization:'Bearer '+env('SUPABASE_SERVICE_ROLE_KEY'),'Content-Type':'application/json',Prefer:'return=representation'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('Unable to save or retrieve this order. Please try again.');return r.json();
}
export const reply=(res,status,data)=>res.status(status).setHeader('Cache-Control','no-store').json(data);
export function sameOrigin(req){const origin=req.headers.origin;return !!origin&&origin===new URL(env('SHOP_ORIGIN')).origin;}
export async function paystack(path,body){
 const key=env('PAYSTACK_SECRET_KEY');
 if(process.env.SHOP_LIVE_PAYMENTS!=='true'&&!key.startsWith('sk_test_'))throw Error('Test payment configuration is required.');
 const r=await fetch('https://api.paystack.co'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
 const data=await r.json();if(!r.ok||!data.status)throw Error('The payment provider could not complete this request. Please try again.');return data.data;
}
export async function verify(reference){
 const tx=await paystack('/transaction/verify/'+encodeURIComponent(reference));
 if(tx.reference!==reference||tx.currency!=='NGN')throw Error('Payment details do not match.');
 if(tx.status!=='success')return {status:tx.status==='failed'?'failed':tx.status==='abandoned'?'cancelled':'pending'};
 const status=await db('rpc/shop_confirm_payment',{method:'POST',body:{p_reference:reference,p_kobo:tx.amount,p_transaction_id:String(tx.id)}});return {status};
}
