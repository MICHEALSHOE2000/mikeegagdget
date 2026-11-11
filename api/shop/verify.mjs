import {reply,verify} from '../_shop.mjs';
export default async function handler(req,res){
 if(req.method!=='GET')return reply(res,405,{error:'Method not allowed'});
 const reference=String(req.query?.reference||'');
 if(!/^MGP2-[a-f0-9]{32}$/.test(reference))return reply(res,400,{error:'Invalid order reference.'});
 try{return reply(res,200,{reference,...await verify(reference)});}catch(e){return reply(res,503,{error:e.message});}
}
