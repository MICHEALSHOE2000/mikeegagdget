// Shared with the free catalogue-only preview. Only verified catalogue rows become offers.
export function understand(messages){
 let device='',budget=0,condition='';
 for(const message of messages){
  if(message.role!=='user')continue;
  const s=message.content.toLowerCase();
  if(/what else|other phones|other options|anything else|any phone/.test(s))device='';
  const model=s.match(/\b(iphone\s*(?:\d{1,2}|xr)(?:\s*(?:pro max|pro|plus|mini|air))?|(?:samsung\s+)?(?:galaxy\s+)?[as]\d{2}(?:\s*(?:ultra|plus|fe))?|pixel\s*\d{1,2}(?:\s*(?:pro xl|pro|a))?)\b/i);
  if(model)device=model[0].replace(/iphone(?=\d)/,'iphone ').trim();
  const amount=s.match(/(?:₦\s*|\b)(\d+(?:,\d{3})*(?:\.\d+)?)\s*(k|m|million|thousand)?\b/gi)||[];
  for(const token of amount){
   const a=token.replace(/[,₦\s]/g,'').match(/^(\d+(?:\.\d+)?)(k|m|million|thousand)?$/);
   if(!a)continue;
   const value=Number(a[1])*({k:1000,thousand:1000,m:1e6,million:1e6}[a[2]]||1);
   if(value>=10000 && value<=1e8)budget=value;
  }
  if(/brand new|brand-new/.test(s))condition='Brand New';
  if(/uk used|second.hand/.test(s))condition='UK Used';
 }
 return {device,budget,condition};
}
export function offers(items,state){
 const tokens=state.device.toLowerCase().match(/[a-z]+|\d+/g)||[];
 return items.filter(v=>{
  if(!state.device && state.budget && !/iphone|pixel (?:[0-9])|samsung (?:galaxy )?[asz]\s*\d/i.test(v.label))return false;
  const words=v.label.toLowerCase().match(/[a-z]+|\d+/g)||[];
  return tokens.every(t=>words.includes(t))&&(!state.condition||v.label.toLowerCase().includes(state.condition.toLowerCase()))&&(!state.budget||v.price<=state.budget)&&v.stock!=='Out of stock';
 }).sort((a,b)=>a.price-b.price).filter((v,i,rows)=>i===rows.findIndex(x=>x.label===v.label)).slice(0,3);
}
export const needsOwner=s=>/negotiab|discount|last price|best price|can you do|fit do|reduce|talk to|speak to|human|complaint|refund|charged twice|payment failed/i.test(s);
export function basicReply(messages,items,available){
 const s=messages.at(-1).content,state=understand(messages);
 const escalate=needsOwner(s);
 let text,rows=[];
 if(escalate)text='Michael can help with that. Shall I pass your message to him?';
 else if(/where|location|address|pick.?up/i.test(s))text='You can pick up at Computer Village, Ikeja. What device would you like to check before you come?';
 else if(/install?ment|small small|credit direct/i.test(s))text='We offer Pay Small Small through Credit Direct. They review the application and confirm the terms. Which device do you have in mind?';
 else if(state.device||state.budget||state.condition){
  rows=offers(items,state);
  text=!available?'I can’t check the catalogue right now. Michael can confirm a price for you.':rows.length?'Here’s what I found. Which one would you like to look at?':'I couldn’t find a verified match for that combination. Want to try another model or budget?';
 }else text='What phone are you looking at, or how much would you like to spend?';
 return {text,rows,escalate:escalate||(!available&&Boolean(state.device||state.budget))};
}
