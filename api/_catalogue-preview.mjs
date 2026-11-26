// This branch can be reviewed using only the published, read-only shop endpoints.
export const reviewPreview=()=>process.env.VERCEL_ENV==='preview'||(process.env.VERCEL==='1'&&!process.env.VERCEL_ENV)||process.env.MIKEE_CATALOGUE_REVIEW==='1';
export function previewLocked(res){
 return res.status(403).setHeader('Cache-Control','no-store').json({error:'Read-only catalogue preview. Orders, payments and admin changes are disabled.'});
}
export async function publicShop(resource) {
 if(!['catalog','deals','settings'].includes(resource))throw Error('Unknown catalogue resource');
 const response=await fetch('https://www.mikeegadget.com.ng/api/shop/'+resource,{cache:'no-store',signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error('The live catalogue is temporarily unavailable.');
 return response.json();
}
