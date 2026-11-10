import {db,productById,sendJson} from '../_checkout.mjs';
export default async function handler(req,res){
 if(req.method!=='POST')return sendJson(res,405,{error:'Method not allowed'});
 try{
 const b=req.body||{},item=productById(b.sku);
 if(!item||!Number.isInteger(b.quantity)||b.quantity<1||b.quantity>20||!['pickup','delivery'].includes(b.fulfillment)||!['buy','finance'].includes(b.method)||!/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(b.request_id||''))return sendJson(res,400,{error:'Choose a valid device, quantity and delivery option.'});
 if(typeof b.name!=='string'||b.name.trim().length<2||b.name.length>100||typeof b.email!=='string'||b.email.length>200||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)||typeof b.phone!=='string'||!/^[+0-9 ()-]{7,20}$/.test(b.phone))return sendJson(res,400,{error:'Enter valid contact details.'});
 if(b.fulfillment==='delivery'&&(typeof b.address!=='string'||b.address.trim().length<10||b.address.length>600))return sendJson(res,400,{error:'Enter your complete delivery address.'});
 const result=await db('rpc/retail_submit_order',{method:'POST',body:{p_request_id:b.request_id,p_sku:b.sku,p_name:b.name.trim(),p_email:b.email.trim().toLowerCase(),p_phone:b.phone.trim(),p_quantity:b.quantity,p_method:b.method,p_fulfillment:b.fulfillment,p_address:b.fulfillment==='delivery'?b.address.trim():null,p_colour:String(b.color||'To confirm').slice(0,100),p_condition:String(b.condition||item.conditions?.join(' / ')||'To confirm').slice(0,100)}});
 return sendJson(res,201,{token:result.token,status:result.status});
 }catch(e){console.error('Order submission failed',e.message);return sendJson(res,503,{error:'Your order could not be saved. Please retry; the same request will not create a duplicate.'});}
}
