import {authorized} from './manage.mjs';
import {db,paystack,sendJson} from '../_checkout.mjs';
export default async function handler(req,res){
 if(req.method!=='POST')return sendJson(res,405,{error:'Method not allowed'});
 if(!authorized(req))return sendJson(res,401,{error:'Merchant authentication required'});
 try{const orders=await db('supplier_orders?status=eq.awaiting_payment&select=id,paystack_reference&limit=25');let checked=0;
 for(const o of orders){const tx=await paystack('/transaction/verify/'+encodeURIComponent(o.paystack_reference));if(tx.reference===o.paystack_reference&&tx.status==='success'&&tx.currency==='NGN')await db('rpc/supplier_confirm_payment',{method:'POST',body:{p_reference:o.paystack_reference,p_amount_kobo:tx.amount}});checked++;}
 return sendJson(res,200,{checked});}catch(e){console.error(e.message);return sendJson(res,503,{error:'Reconciliation incomplete. Retry safely.'});}
}
