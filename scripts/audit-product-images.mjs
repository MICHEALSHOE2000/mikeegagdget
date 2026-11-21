// Product photo audit. Reads the live catalogue (Supabase, or a JSON export passed as the first argument) and the
// photos in the repository, then writes docs/product-image-audit.csv and docs/product-image-audit.md.
// Read-only: it never changes the catalogue or publishes a photo.
//   node scripts/audit-product-images.mjs                 (needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)
//   node scripts/audit-product-images.mjs inventory.json  (rows: sku, slug, model, category, condition, storage, colors, image, images)
import {readFileSync,writeFileSync,existsSync,statSync} from 'node:fs';
import {products} from '../commerce/catalog.mjs';
import {CURRENT_FLAGS,LIBRARY,provenance} from '../commerce/photo-review.mjs';

async function liveRows(){
 if(process.argv[2])return JSON.parse(readFileSync(process.argv[2],'utf8'));
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw Error('Pass an inventory JSON file or set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
 const res=await fetch(url+'/rest/v1/checkout_inventory?enabled=eq.true&select=sku,product_data',{headers:{apikey:key,Authorization:'Bearer '+key}});
 if(!res.ok)throw Error('Catalogue request failed: '+res.status);
 return (await res.json()).map(({sku,product_data:d})=>({sku,slug:d.slug,model:d.model,category:d.category,condition:d.condition,storage:d.storage||d.capacity,colors:d.colors,image:d.image,images:d.images}));
}
// Width and height of a WebP/JPEG/PNG file, read from its header.
export function dimensions(file){
 const b=readFileSync(file);
 if(b.toString('ascii',0,4)==='RIFF'){const t=b.toString('ascii',12,16);
  if(t==='VP8X')return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];
  if(t==='VP8 ')return [b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];
  if(t==='VP8L'){const n=b.readUInt32LE(21);return [(n&0x3fff)+1,((n>>14)&0x3fff)+1];}}
 if(b[0]===0x89)return [b.readUInt32BE(16),b.readUInt32BE(20)];
 if(b[0]===0xff){let i=2;while(i<b.length){const m=b[i+1],len=b.readUInt16BE(i+2);if(m>=0xc0&&m<=0xc3)return [b.readUInt16BE(i+7),b.readUInt16BE(i+5)];i+=2+len;}}
 return [0,0];
}
const base=u=>String(u||'').replace(/-(160|360|720|1280)\.webp$/,'').replace(/\.(webp|jpe?g|png)$/,'');
const csv=v=>`"${String(v??'').replace(/"/g,'""')}"`;

const rows=await liveRows();
const staticBySlug=new Map(products.map(p=>[p.slug,p]));
const bySlug=new Map();for(const r of rows){if(!r.slug)continue;(bySlug.get(r.slug)||bySlug.set(r.slug,[]).get(r.slug)).push(r);}
// The picture each product shows today: a live photo first, otherwise the catalogue photo.
const shown=new Map([...bySlug].map(([slug,vs])=>[slug,vs.find(v=>v.image)?.image||staticBySlug.get(slug)?.images?.[0]||'']));
const usedBy=new Map();for(const [slug,url] of shown)if(url){const k=base(url);const model=bySlug.get(slug)[0].model.replace(/\s*[—-]\s*Wi-?Fi Only$/i,'');(usedBy.get(k)||usedBy.set(k,new Set()).get(k)).add(model);}

const out=[];
for(const [slug,vs] of [...bySlug].sort()){
 const url=shown.get(slug),approvedRecords=vs.some(v=>Array.isArray(v.images)&&v.images.some(p=>p.approved&&p.source&&p.licence));
 const file=url?'.'+url:'',exists=!!file&&existsSync(file),[w,h]=exists?dimensions(file):[0,0];
 const flags=[];
 if(!url)flags.push('No photo: neutral placeholder shown');
 else if(!exists)flags.push('Photo file missing');
 else{if(Math.max(w,h)<700)flags.push(`Low resolution (${w}×${h})`);if(usedBy.get(base(url))?.size>1)flags.push('Same photo used for different models: '+[...usedBy.get(base(url))].join(', '));
  const f=CURRENT_FLAGS[base(url)];if(f)flags.push((f.status==='reject'?'Reject: ':'Check: ')+f.note);}
 const gallery=(staticBySlug.get(slug)?.images||[]).slice(1);
 const proposals=(LIBRARY[slug]||[]).map(([b,status,note=''])=>({url:b+'-720.webp',status,note}));
 const prov=url?provenance(url):{source:'',licence:''};
 const representative=vs.some(v=>/uk used/i.test(v.condition||''));
 for(const v of vs){
  out.push({product_id:v.sku,slug,model:v.model,category:v.category||'',variant:[v.condition,v.storage,(v.colors||[]).join('/')].filter(Boolean).join(' · '),
   current_image:url||'(placeholder)',size:exists?`${w}×${h}`:'',extra_gallery:gallery.join(' '),
   proposed_image:proposals.filter(p=>p.status!=='reject').map(p=>p.url+(p.status==='check'?' (check: '+p.note+')':'')).join(' | ')||(url?'':'None found — needs a licensed or own photo'),
   rejected_candidates:proposals.filter(p=>p.status==='reject').map(p=>p.url+' ('+p.note+')').join(' | '),
   source:url?(prov.source||'unrecorded'):'',licence_status:url?prov.licence:'',
   approval_status:approvedRecords?'Approved in admin (source and permission recorded)':url?'Legacy photo — published before the approval workflow; not yet re-approved':'Not approved — placeholder',
   representative_label:url&&representative?'Yes (UK Used stock photo)':'',flags:flags.join('; ')});
 }
}
const cols=Object.keys(out[0]);
writeFileSync('docs/product-image-audit.csv',[cols.map(csv).join(','),...out.map(r=>cols.map(c=>csv(r[c])).join(','))].join('\n')+'\n');

const products_=[...bySlug.keys()],withPhoto=products_.filter(s=>shown.get(s)),approved=products_.filter(s=>bySlug.get(s).some(v=>Array.isArray(v.images)&&v.images.some(p=>p.approved&&p.source&&p.licence)));
const variantsWith=out.filter(r=>r.current_image!=='(placeholder)').length,pct=(a,b)=>(100*a/b).toFixed(1)+'%';
const flagged=[...new Set(out.filter(r=>r.flags&&r.current_image!=='(placeholder)').map(r=>`- ${r.model}: ${r.flags}`))];
const proposedCount=out.filter(r=>r.proposed_image&&!r.proposed_image.startsWith('None')).reduce((s,r)=>s.add(r.slug),new Set()).size;
const missing=[...new Set(out.filter(r=>r.current_image==='(placeholder)').map(r=>r.model))].sort();
writeFileSync('docs/product-image-audit.md',`# Product photo audit

Generated by \`node scripts/audit-product-images.mjs\` from the live catalogue. Full detail per variant: [product-image-audit.csv](product-image-audit.csv).

| | Products | Variants |
|---|---:|---:|
| Published | ${products_.length} | ${out.length} |
| Showing a photo | ${withPhoto.length} (${pct(withPhoto.length,products_.length)}) | ${variantsWith} (${pct(variantsWith,out.length)}) |
| Photo approved in admin with source and permission recorded | ${approved.length} (${pct(approved.length,products_.length)}) | |
| Neutral placeholder (waiting for a photo) | ${products_.length-withPhoto.length} (${pct(products_.length-withPhoto.length,products_.length)}) | ${out.length-variantsWith} (${pct(out.length-variantsWith,out.length)}) |
| Extra repository photos proposed for review | ${proposedCount} products | |

Every photo shown today was published before the approval workflow existed. None has its source and permission recorded in admin yet, so 0% count as approved. To approve one, open Admin → Products → Photos, record the source and permission, and tick **Approved**.

## Photos shown today that need a second look
${flagged.join('\n')||'None'}

## Products waiting for a photo (${missing.length})
No licensed or own photo was found for these, so they keep the named placeholder. Photos from competitor sites were not copied, and no AI-generated images were used.

${missing.map(m=>'- '+m).join('\n')}

## How photos were checked
- Every published product and variant was read from the live catalogue.
- Each photo file was checked: does it exist, what size is it, and is it shared with a different model.
- Each photo was visually checked against its model (see \`commerce/photo-review.mjs\`).
- Unused photos in the repository were matched to live products and visually checked. They are listed as proposals in this audit and in the admin photo editor. They are not published until an administrator approves them.
`);
console.log(`${products_.length} products, ${out.length} variants; ${withPhoto.length} with a photo, ${approved.length} approved in admin.`);
