// Last build step. Serves the Inter font from our own domain instead of Google Fonts: one fewer render-blocking
// stylesheet and two fewer connections on every page. The look does not change (same font, same weights).
import {readFileSync,writeFileSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
const FACE=`<link rel="preload" href="/assets/fonts/inter-latin-wght.woff2" as="font" type="font/woff2" crossorigin><style>@font-face{font-family:Inter;font-style:normal;font-weight:100 900;font-display:swap;src:url(/assets/fonts/inter-latin-wght.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}@font-face{font-family:Inter;font-style:normal;font-weight:100 900;font-display:swap;src:url(/assets/fonts/inter-naira-wght.woff2) format("woff2");unicode-range:U+20A6}</style>`;
const GOOGLE=/\s*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*(?:<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\s*)?<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Inter[^"]*" rel="stylesheet">/;
const SKIP=new Set(['node_modules','docs','.git','tests','supabase','scripts']);
let changed=0;
const walk=dir=>{for(const name of readdirSync(dir)){if(SKIP.has(name)||name.startsWith('.'))continue;const p=join(dir,name);if(statSync(p).isDirectory())walk(p);else if(name.endsWith('.html')||name.endsWith('.template')){const html=readFileSync(p,'utf8');if(!GOOGLE.test(html))continue;writeFileSync(p,html.replace(GOOGLE,'\n  '+FACE));changed++;}}};
walk('.');
console.log(`Self-hosted font on ${changed} pages`);
