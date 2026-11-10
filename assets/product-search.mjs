export function normalizeSearch(value='') {
 return value.toLowerCase().replace(/iph?on[e]?|ipone|iphne/g,'iphone').replace(/sams?u?ng|samsun/g,'samsung').replace(/pro\s*max|promax|\bpm\b/g,'pro max').replace(/\b(\d+)\s*(gb|tb)\b/g,'$1$2').replace(/[^a-z0-9]+/g,' ').trim();
}
function near(a,b){if(a===b)return true;if(a.length<4||/\d/.test(a)||Math.abs(a.length-b.length)>1)return false;let prev=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let row=[i];for(let j=1;j<=b.length;j++)row[j]=Math.min(row[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]!==b[j-1]));prev=row;}return prev[b.length]<=1;}
export function matchesProduct(item,query){const hay=normalizeSearch(`${item.model} ${item.brand} ${item.category||''} ${(item.variants||[]).map(v=>v.storage).join(' ')} ${(item.keywords||[]).join(' ')}`),words=hay.split(' ');return normalizeSearch(query).split(' ').filter(Boolean).every(t=>hay.includes(t)||words.some(w=>near(t,w)));}
