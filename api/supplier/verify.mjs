import {db,paystack,sendJson} from '../_checkout.mjs';
export async function verifySupplierPayment(reference){
 const tx=await paystack('/transaction/verify/'+encodeURIComponent(reference));
 if(tx.status!=='success'||tx.currency!=='NGN'||tx.reference!==reference)return 'pending';
 return await db('rpc/supplier_confirm_payment',{method:'POST',body:{p_reference:reference,p_amount_kobo:tx.amount}});
}
export default async function handler(req,res){
 if(req.method!=='POST')return sendJson(res,405,{error:'Method not allowed'});
 const reference=String(req.body?.reference||'');
 if(!/^MGS-[a-f0-9]{32}$/.test(reference))return sendJson(res,400,{error:'Invalid reference'});
 try{return sendJson(res,200,{status:await verifySupplierPayment(reference)});}
 catch(e){console.error('Supplier verification failed',e.message);return sendJson(res,503,{error:'Verification unavailable'});}
}
