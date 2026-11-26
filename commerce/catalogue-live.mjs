// Only route metadata is supplied by the build. Prices, variants and images come from inventory.
export const primarySlug=slug=>String(slug).replace(/-(?:wifi-only|uk-used)$/,'');
export function groupCatalogue(rows) {
 const models = new Map();
 for (const row of rows) {
  if (!/^[a-z0-9-]+$/.test(row.slug) || row.enabled === false || row.reviewRequired || !(row.price > 0)) continue;
  const slug=primarySlug(row.slug);
  let model = models.get(slug);
  if (!model) {
   model = {slug, route:'/'+slug, model:row.model.replace(/ — WiFi Only$/,''), category:row.category==='wifi-only'?'iphones':row.category, brand:row.brand,
    image:'', series:row.series || row.model?.match(/^iPhone (\d+)/)?.[1] || '', conditions:[], variants:[]};
   models.set(slug,model);
  }
  if(row.slug===slug&&row.image)model.image=row.image;
  model.image ||= row.image || '';
  if (row.condition && !model.conditions.includes(row.condition)) model.conditions.push(row.condition);
  model.variants.push({...row, color:(row.colors || []).join('/')});
 }
 return [...models.values()];
}
let pending;
export function liveRows() {
 if (!pending) pending = fetch('/api/shop/catalog',{cache:'no-store'}).then(async response=>{
  if (!response.ok) throw Error('Live catalogue unavailable.');
  const rows = await response.json();
  if (!Array.isArray(rows)) throw Error('Invalid catalogue response.');
  return rows;
 }).finally(()=>{pending=undefined;});
 return pending;
}
export async function loadCatalogue() {return groupCatalogue(await liveRows());}
