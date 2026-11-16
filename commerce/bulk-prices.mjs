// Bulk price CSV review. Rows are matched by the stable variant ID (SKU); nothing is published until the
// administrator ticks the changes to apply. Spreadsheet apps often change special dashes and spaces, so a SKU that
// differs only in those characters is matched — but only when exactly one catalogue variant fits.
export const CSV_HEADER=['sku','model','price','enabled','updated_at'];
const loose=s=>String(s||'').normalize('NFKC').replace(/[‐-―−]/g,'-').replace(/\s+/g,' ').trim().toLowerCase();
export function reviewPriceCsv(table,inventory){
 const [head,...rows]=table;const h=(head||[]).map(x=>x.trim().toLowerCase());
 const legacy=h.join(',')==='sku,price,enabled,updated_at',current=h.join(',')===CSV_HEADER.join(',');
 if(!legacy&&!current)throw Error('Use the exported CSV: columns sku, model, price, enabled, updated_at.');
 const col=name=>h.indexOf(name),changes=[],problems=[],seen=new Set();let unchanged=0;
 rows.forEach((r,i)=>{const line=i+2,raw=String(r[col('sku')]??'').trim(),value=String(r[col('price')]??'').replace(/[₦,\s]/g,''),enabledText=String(r[col('enabled')]??'').trim().toLowerCase(),stamp=String(r[col('updated_at')]??'').trim();
  if(!raw&&!value)return;
  let row=inventory.find(v=>v.sku===raw),note='';
  if(!row){const hits=inventory.filter(v=>loose(v.sku)===loose(raw));if(hits.length===1){row=hits[0];note='Matched after tidying spaces/dashes';}else{problems.push({line,sku:raw,problem:hits.length>1?'Ambiguous: matches more than one variant':'No variant with this ID'});return;}}
  if(seen.has(row.sku)){problems.push({line,sku:raw,problem:'Listed twice'});return;}seen.add(row.sku);
  const price=value===''?null:Number(value),enabled=enabledText==='true'||enabledText==='yes';
  if(!['true','false','yes','no'].includes(enabledText)){problems.push({line,sku:row.sku,problem:'“enabled” must be true or false'});return;}
  if(price!==null&&(!Number.isSafeInteger(price)||price<=0||price>100000000)){problems.push({line,sku:row.sku,problem:'Price must be a whole naira amount above 0'});return;}
  if(enabled&&price===null){problems.push({line,sku:row.sku,problem:'Cannot be available without a price'});return;}
  if(stamp!==row.updated_at){problems.push({line,sku:row.sku,problem:'Changed since this CSV was exported — export again'});return;}
  if(price===(row.price_ngn??null)&&enabled===row.enabled){unchanged++;return;}
  changes.push({sku:row.sku,model:row.product_data?.model||'',oldPrice:row.price_ngn??null,newPrice:price,oldEnabled:row.enabled,newEnabled:enabled,updatedAt:row.updated_at,note});
 });
 return {changes,problems,unchanged};
}
