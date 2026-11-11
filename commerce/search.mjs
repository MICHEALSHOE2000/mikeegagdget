// Shared catalogue search: exact models first, aliases and conservative typo support.
export function normalizeSearch(value='') {
  return String(value).toLowerCase().replace(/i[ -]?phone/g,'iphone').replace(/play\s*station\s*5/g,'ps5').replace(/galaxy\s+/g,'').replace(/([0-9])\s+(gb|tb)\b/g,'$1$2').replace(/[^a-z0-9]+/g,' ').trim();
}
function oneEdit(a,b) {
  if(a.length<4||b.length<4||Math.abs(a.length-b.length)>1)return false;
  if(a.length===b.length){const d=[];for(let i=0;i<a.length;i++)if(a[i]!==b[i])d.push(i);return d.length===1||(d.length===2&&d[1]===d[0]+1&&a[d[0]]===b[d[1]]&&a[d[1]]===b[d[0]]);}
  const [short,long]=a.length<b.length?[a,b]:[b,a];let i=0,j=0,skips=0;while(i<short.length&&j<long.length){if(short[i]===long[j]){i++;j++;}else{j++;if(++skips>1)return false;}}return true;
}
export function searchScore(item,query) {
  const term=normalizeSearch(query);if(!term)return 0;
  const model=normalizeSearch(item.model), tokens=term.split(' ');
  const hay=normalizeSearch([item.model,item.brand,item.category,...(item.conditions||[]),...(item.variants||[]).flatMap(v=>[v.storage,v.color,v.connectivity,v.ram])].filter(Boolean).join(' '));
  const words=hay.split(' ');let score=0;
  for(const token of tokens){if(words.includes(token))score+=20;else if(words.some(w=>w.startsWith(token)))score+=10;else if(!/\d/.test(token)&&words.some(w=>oneEdit(token,w)))score+=2;else return -1;}
  if(model===term)score+=200;else if(model.startsWith(term))score+=60;else if(term.startsWith(model+' '))score+=100;
  return score-model.split(' ').length/10;
}
export function searchCatalogue(items,query){return items.map((item,index)=>({item,index,score:searchScore(item,query)})).filter(x=>x.score>=0).sort((a,b)=>b.score-a.score||a.index-b.index).map(x=>x.item);}
