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

// Branded "page not found" page (Vercel serves /404.html for unknown addresses). Built from a finished page so it
// has the same header, footer and styles. Not indexed.
{const base=readFileSync('account/index.html','utf8');
 const body='<h1>We couldn’t find that page</h1><p>The link may be old or mistyped. Try searching, or browse our most popular devices.</p><form action="/search/" class="mg-track" role="search"><label>Search devices<input name="q" placeholder="iPhone 15 Pro Max, Samsung S24…"></label><button class="btn btn-primary" type="submit">Search</button></form><p><a class="btn btn-outline" href="/iphones">iPhones</a> <a class="btn btn-outline" href="/samsung-phones">Samsung</a> <a class="btn btn-outline" href="/google-pixel-phones">Google Pixel</a> <a class="btn btn-outline" href="/deals/">Hot Deals</a></p><p>Need help? <a href="https://wa.me/2347086865133">Chat on WhatsApp</a> or visit us at 1 Ola Ayeni Street, Computer Village, Ikeja.</p>';
 const html=base.replace(/<title>[\s\S]*?<\/title>/,'<title>Page not found | Mikee Gadget Plug</title>').replace(/\s*<link rel="canonical"[^>]*>/,'').replace(/<meta name="robots"[^>]*>/,'').replace('</head>','<meta name="robots" content="noindex">\n</head>').replace(/<main id="main"[^>]*>[\s\S]*?<\/main>/,`<main id="main" class="store-section shopping-page">${body}</main>`).replace(/<link rel="preload" as="image" href="\/assets\/hero\/[^>]*>/,'');
 writeFileSync('404.html',html);}
