// Gives every page the full Mikee "MG" icon set (tabs, bookmarks, iOS and Android home screens).
import {readdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const ICONS='<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><meta name="theme-color" content="#07130f">';
const SKIP=new Set(['node_modules','.git','.vercel','supabase','tests','docs']);
async function* pages(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(e.isDirectory()){if(!SKIP.has(e.name))yield* pages(join(dir,e.name));}else if(e.name.endsWith('.html'))yield join(dir,e.name);}}
export function applyIcons(html){
 if(!/<head[\s>]/i.test(html))return html;
 let out=html.replace(/[ \t]*<link rel="(?:icon|shortcut icon|apple-touch-icon|manifest)"[^>]*>[ \t]*\r?\n?/gi,'').replace(/[ \t]*<meta name="theme-color"[^>]*>[ \t]*\r?\n?/gi,'');
 return out.replace(/<\/head>/i,ICONS+'\n</head>');
}
let changed=0;
for await(const file of pages('.')){const html=await readFile(file,'utf8'),next=applyIcons(html);if(next!==html){await writeFile(file,next);changed++;}}
console.log('icons applied to',changed,'pages');
