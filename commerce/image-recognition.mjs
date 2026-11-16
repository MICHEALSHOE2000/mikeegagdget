// Optional image recognition for Smart Image Upload. Runs only on the server and only when ANTHROPIC_API_KEY is set.
// Without a key (or on any error) it returns null and matching carries on from file names and colour alone.
// The answer is treated as a hint: it must name a product already in the catalogue, and it never publishes anything.
export const recognitionConfigured=()=>!!process.env.ANTHROPIC_API_KEY;
export async function recognise(bytes,catalogue,{fetchImpl=fetch,key=process.env.ANTHROPIC_API_KEY,model=process.env.IMAGE_RECOGNITION_MODEL||'claude-haiku-5-5'}={}){
 if(!key||!bytes?.length||!catalogue?.length)return null;
 const list=catalogue.slice(0,400).map(p=>`${p.slug} | ${p.model}${p.colors.length?' | colours: '+p.colors.join(', '):''}`).join('\n');
 const prompt=`You are helping a phone and gadget shop file a product photo. Which ONE product in this list does the photo show? Use only what is visible. If you are not sure, or it is not in the list, leave slug empty. Never guess storage size.\nReply with JSON only: {"slug":"","color":"","sure":false}\n\n${list}`;
 try{
  const r=await fetchImpl('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':key,'anthropic-version':'2023-06-01','content-type':'application/json'},signal:AbortSignal.timeout(8000),
   body:JSON.stringify({model,max_tokens:120,messages:[{role:'user',content:[{type:'image',source:{type:'base64',media_type:'image/webp',data:Buffer.from(bytes).toString('base64')}},{type:'text',text:prompt}]}]})});
  if(!r.ok)return null;
  const text=(await r.json())?.content?.find(c=>c.type==='text')?.text||'',json=JSON.parse(text.slice(text.indexOf('{'),text.lastIndexOf('}')+1));
  const product=catalogue.find(p=>p.slug===json.slug);if(!product)return null;
  return {slug:product.slug,color:product.colors.includes(json.color)?json.color:'',sure:json.sure===true};
 }catch{return null;}
}
