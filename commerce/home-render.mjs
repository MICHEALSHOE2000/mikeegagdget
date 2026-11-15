// Server-side insertion of Hot Deals into a prebuilt page. Pure string work so it runs at the edge and in tests.
export const DEALS_OPEN='<!--hot-deals-->',DEALS_CLOSE='<!--/hot-deals-->';
export function injectDeals(html,cards){
 const a=html.indexOf(DEALS_OPEN),b=html.indexOf(DEALS_CLOSE);
 if(a<0||b<a||!cards)return html;
 return html.slice(0,a+DEALS_OPEN.length)+cards+html.slice(b);
}
// PostgREST "in" filter for SKUs, which contain spaces, slashes and middle dots.
export const skuFilter=skus=>'in.('+skus.map(s=>'"'+String(s).replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"').join(',')+')';
