// Administrator-confirmed availability, stored on each variant's catalogue record (product_data.stockStatus / stockQty).
// Nothing here invents stock: a variant with no record simply has no stock label.
export const STOCK_STATES=['','in_stock','out_of_stock','confirm'];
export function cleanStock(input){
 const status=STOCK_STATES.includes(input?.stockStatus)?input.stockStatus:'';
 const raw=input?.stockQty;const qty=status==='in_stock'&&raw!==''&&raw!==null&&raw!==undefined&&Number.isInteger(Number(raw))&&Number(raw)>=0&&Number(raw)<=9999?Number(raw):null;
 // A counted quantity of zero is, by definition, out of stock.
 return qty===0?{stockStatus:'out_of_stock',stockQty:null}:{stockStatus:status,stockQty:qty};
}
// Returns a customer-readable reason when an order cannot be fulfilled from confirmed stock, otherwise ''.
export function stockProblem(items,rows){
 const need=new Map();for(const i of items)need.set(i.sku,(need.get(i.sku)||0)+i.quantity);
 for(const [sku,quantity]of need){const d=rows.find(r=>r.sku===sku)?.product_data;if(!d)continue;const name=[d.model,d.capacity||d.storage].filter(Boolean).join(' ');
  if(d.stockStatus==='out_of_stock')return `${name} is out of stock. Remove it from your cart to continue.`;
  if(d.stockStatus==='in_stock'&&Number.isInteger(d.stockQty)&&quantity>d.stockQty)return `Only ${d.stockQty} of ${name} ${d.stockQty===1?'is':'are'} available. Reduce the quantity to continue.`;}
 return '';
}
