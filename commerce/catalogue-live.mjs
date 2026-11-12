export function mergeLiveCatalogue(items,rows){
 if(!Array.isArray(rows))return items;
 return items.map(item=>{
  const current=rows.filter(v=>v.slug===item.slug);if(!current.length)return item;
  return {...item,image:current.find(v=>v.image)?.image||item.image,conditions:[...new Set(current.map(v=>v.condition))],variants:current.map(v=>({...v,color:(v.colors||[]).join('/')}))};
 });
}
