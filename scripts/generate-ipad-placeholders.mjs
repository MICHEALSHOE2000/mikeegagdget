// Clean, original placeholder art for iPads without owner photos (no Apple or retailer imagery).
// Run: node scripts/generate-ipad-placeholders.mjs — output is committed under images/store/ipad-range/.
import {mkdir,writeFile} from 'node:fs/promises';
import {retailInventory} from '../commerce/retail-inventory.mjs';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shape={pro:{w:300,h:420,r:26,b:9},air:{w:300,h:420,r:30,b:13},mini:{w:230,h:350,r:26,b:12},ipad:{w:290,h:410,r:28,b:20}};
const tone={pro:['#0b2a22','#123b30'],air:['#123b30','#1d5443'],mini:['#16332b','#245b4a'],ipad:['#1a2e28','#2b4b40']};
const label={pro:'iPad Pro',air:'iPad Air',mini:'iPad mini',ipad:'iPad'};
const svg=p=>{const base=shape[p.ipadLine],big=p.ipadSize==='13-inch',s=big?{...base,w:base.w+36,h:base.h+46}:base,[a,b]=tone[p.ipadLine],x=360-s.w/2,y=big?96:120;const sub=[p.ipadSize,p.ipadChip].filter(Boolean).join(' · ');
return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 800" width="720" height="800" role="img" aria-label="${esc(p.model)} — photo coming soon">
<defs><radialGradient id="bg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#fbfaf6"/><stop offset="1" stop-color="#ecebe4"/></radialGradient>
<linearGradient id="sc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${b}"/><stop offset=".55" stop-color="${a}"/><stop offset="1" stop-color="#07130f"/></linearGradient>
<linearGradient id="gd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b8913f"/><stop offset=".5" stop-color="#e1bd70"/><stop offset="1" stop-color="#b8913f"/></linearGradient></defs>
<rect width="720" height="800" fill="url(#bg)"/>
<ellipse cx="360" cy="${y+s.h+28}" rx="${s.w*0.62}" ry="16" fill="#151819" opacity=".10"/>
<rect x="${x+26}" y="${y-14}" width="${s.w}" height="${s.h}" rx="${s.r}" fill="#d9d8d1" opacity=".55"/>
<rect x="${x}" y="${y}" width="${s.w}" height="${s.h}" rx="${s.r}" fill="#1b1d1e"/>
<rect x="${x+s.b}" y="${y+s.b}" width="${s.w-2*s.b}" height="${s.h-2*s.b}" rx="${Math.max(6,s.r-s.b)}" fill="url(#sc)"/>
<circle cx="360" cy="${y+s.b/2+1}" r="2.4" fill="#3a3d3f"/>
${p.ipadLine==='ipad'&&p.slug==='ipad-9th-gen'?`<circle cx="360" cy="${y+s.h-s.b/2}" r="7" fill="none" stroke="#3a3d3f" stroke-width="1.6"/>`:''}
<path d="M${x+s.b} ${y+s.h*0.62} C ${x+s.w*0.35} ${y+s.h*0.5}, ${x+s.w*0.7} ${y+s.h*0.78}, ${x+s.w-s.b} ${y+s.h*0.6} L ${x+s.w-s.b} ${y+s.h-s.b-10} Q ${x+s.w-s.b} ${y+s.h-s.b} ${x+s.w-s.b-10} ${y+s.h-s.b} L ${x+s.b+10} ${y+s.h-s.b} Q ${x+s.b} ${y+s.h-s.b} ${x+s.b} ${y+s.h-s.b-10} Z" fill="#e1bd70" opacity=".16"/>
<text x="360" y="${y+s.h*0.42}" text-anchor="middle" font-family="Inter,Helvetica,Arial,sans-serif" font-size="30" font-weight="700" fill="#fff" letter-spacing=".5">${esc(label[p.ipadLine])}</text>
<rect x="${360-28}" y="${y+s.h*0.42+18}" width="56" height="3" rx="1.5" fill="url(#gd)"/>
<text x="360" y="${y+s.h*0.42+52}" text-anchor="middle" font-family="Inter,Helvetica,Arial,sans-serif" font-size="18" fill="#e9e6da" opacity=".85">${esc(sub)}</text>
<text x="360" y="690" text-anchor="middle" font-family="Inter,Helvetica,Arial,sans-serif" font-size="26" font-weight="700" fill="#151819">${esc(p.model)}</text>
<text x="360" y="726" text-anchor="middle" font-family="Inter,Helvetica,Arial,sans-serif" font-size="17" fill="#806322" letter-spacing="2">MIKEE GADGET PLUG · PHOTO COMING SOON</text>
</svg>
`;};
await mkdir('images/store/ipad-range',{recursive:true});
const list=retailInventory.filter(p=>p.ipadLine&&p.image?.startsWith('/images/store/ipad-range/'));
for(const p of list)await writeFile(`images/store/ipad-range/${p.slug}.svg`,svg(p));
console.log(`Wrote ${list.length} iPad placeholders.`);
