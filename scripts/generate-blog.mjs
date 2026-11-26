// Builds /blog/ (the blog home) and every post in commerce/blog-posts.mjs, in the same layout as the existing guides.
// Header and footer are copied from an existing guide so every blog page matches the rest of the site.
// Prices come from commerce/blog-price-snapshot.json at build time and refresh live in the browser (assets/blog-prices.js).
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {POSTS, LEGACY_POSTS} from '../commerce/blog-posts.mjs';
import {groupPrices, priceTablesHtml, fromPrice, naira} from '../commerce/blog-prices.mjs';

const SITE = 'https://www.mikeegadget.com.ng';
const snapshot = JSON.parse(await readFile('commerce/blog-price-snapshot.json', 'utf8'));
const rows = snapshot.rows;
const shell = await readFile('blog/pixel-vs-samsung-camera/index.html', 'utf8');
const header = shell.match(/<header class="site-header"[\s\S]*?<\/header>/)[0];
const footer = shell.match(/<footer class="mg-footer"[\s\S]*?<\/footer>/)[0];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const ld = o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
const longDate = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'});
const wa = text => `https://wa.me/2347086865133?text=${encodeURIComponent(text)}`;

// {{price:slug}} → a live "from ₦…" mention; {{prices}} → the full live price tables.
function fill(html) {
 return html
  .replace(/\{\{price:([a-z0-9-]+)\}\}/g, (_, slug) => {
   const p = fromPrice(rows, slug);
   return `<span data-price-slug="${slug}">${p ? 'from ' + naira(p) : 'price on request'}</span>`;
  })
  .replace('{{prices}}', `<div data-live-prices>${priceTablesHtml(groupPrices(rows))}</div>`)
  .replace('{{pricesDate}}', `<span data-prices-date>${longDate(snapshot.capturedAt)}</span>`);
}

function head({title, description, canonical, image, type, extra = ''}) {
 return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="${type}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}${image}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${SITE}${image}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
<link rel="stylesheet" href="/assets/experience.css">
<link rel="stylesheet" href="/assets/footer.css">
${extra}
<!-- TikTok Pixel Code Start --><script src="/assets/tiktok-pixel.js"></script><!-- TikTok Pixel Code End -->
<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><meta name="theme-color" content="#07130f">
</head>`;
}

const tail = `<script src="/assets/landing-page.js" defer></script>
<script type="module" src="/assets/blog-prices.js"></script>
<script src="/assets/assistant-launcher.js" defer></script></body>
</html>
`;

function sidebar(post) {
 const related = POSTS.filter(p => p.slug !== post.slug).slice(0, 4);
 return `<aside class="blog-sidebar">
<h3>Shop this guide</h3>
${post.shop.map(([text, href]) => `<a href="${href}">${esc(text)}</a>`).join('\n')}
<h3>More guides</h3>
${related.map(p => `<a href="/blog/${p.slug}">${esc(p.short || p.title)}</a>`).join('\n')}
<a href="/blog/">All guides →</a>
<h3>Visit or chat</h3>
<p><strong>Mikee Gadget Plug</strong><br>1 Ola Ayeni Street, Off Simbiat Abiola Way, Computer Village, Ikeja, Lagos<br>WhatsApp: 0708 686 5133</p>
</aside>`;
}

function renderPost(post) {
 const url = `${SITE}/blog/${post.slug}`;
 const graph = [
  {'@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.description, image: SITE + post.image,
   datePublished: post.published, dateModified: post.updated, author: {'@type': 'Organization', name: 'Mikee Gadget Plug', url: SITE},
   publisher: {'@type': 'Organization', name: 'Mikee Gadget Plug', url: SITE}, mainEntityOfPage: url},
  {'@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
   {'@type': 'ListItem', position: 1, name: 'Home', item: SITE},
   {'@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog/`},
   {'@type': 'ListItem', position: 3, name: post.short || post.title, item: url}]}
 ];
 if (post.faqs?.length) graph.push({'@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: post.faqs.map(([q, a]) => ({'@type': 'Question', name: q, acceptedAnswer: {'@type': 'Answer', text: a}}))});
 const faqs = post.faqs?.length ? `<h2>Frequently asked questions</h2>\n<div class="blog-faq">${post.faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>` : '';
 const sources = post.sources?.length ? `<h2>Sources</h2>\n<ul>${post.sources.map(([t, h]) => `<li><a href="${h}" rel="noopener" target="_blank">${esc(t)}</a></li>`).join('')}</ul>` : '';
 return `${head({title: `${post.title} | Mikee Gadget Plug`, description: post.description, canonical: url, image: post.image, type: 'article', extra: graph.map(ld).join('\n')})}
<body>
${header}
<main class="blog-page">
<section class="blog-hero">
<nav class="blog-breadcrumb"><a href="/">Home</a><span>/</span><a href="/blog/">Blog</a><span>/</span><span>${esc(post.short || post.title)}</span></nav>
<p class="eyebrow">${esc(post.eyebrow)}</p>
<h1>${esc(post.title)}</h1>
<p class="blog-author">By Mikee Gadget Plug • Updated ${longDate(post.updated)} • ${post.minutes} min read</p>
<img class="main-image" src="${post.image}" alt="${esc(post.imageAlt || post.title)}" loading="eager">
</section>
<section class="blog-layout">
<article class="blog-content">
<div class="answer-box"><h2>Short answer</h2><p>${post.answer}</p></div>
${post.takeaways?.length ? `<div class="takeaways"><h2>Key takeaways</h2><ul>${post.takeaways.map(t => `<li>${t}</li>`).join('')}</ul></div>` : ''}
${fill(post.body)}
${faqs}
<div class="blog-cta"><h2>${esc(post.cta || 'Need help choosing?')}</h2><p>Tell us your budget and what you need the device for. We'll recommend options that are actually in stock and confirm today's price.</p><a class="btn btn-primary" href="${wa(`Hello Mikee Gadget Plug, I read "${post.short || post.title}" and I need help choosing.`)}" target="_blank" rel="noopener">Chat with us on WhatsApp</a></div>
${sources}
</article>
${sidebar(post)}
</section>
</main>
${footer}
${tail}`;
}

function renderIndex() {
 const all = [...POSTS.map(p => ({...p, href: `/blog/${p.slug}`})), ...LEGACY_POSTS];
 const card = p => `<article class="blog-card"><a href="${p.href}"><img src="${p.image}" alt="${esc(p.imageAlt || p.title)}" loading="lazy"></a><div><span class="blog-tag">${esc(p.eyebrow)}</span><h3><a href="${p.href}">${esc(p.title)}</a></h3><p>${esc(p.description)}</p><div class="blog-meta"><span>${p.minutes} min read</span><a href="${p.href}">Read</a></div></div></article>`;
 const url = `${SITE}/blog/`;
 const description = 'Phone prices in Nigeria today, buying guides and honest comparisons from Mikee Gadget Plug, Computer Village, Ikeja. iPhone, Samsung, Pixel, gaming, trading and work setups.';
 const graph = {'@context': 'https://schema.org', '@type': 'Blog', name: 'Mikee Gadget Plug Blog', url, description,
  blogPost: POSTS.map(p => ({'@type': 'BlogPosting', headline: p.title, url: `${SITE}/blog/${p.slug}`, datePublished: p.published, dateModified: p.updated}))};
 return `${head({title: 'Gadget Blog: Phone Prices, Buying Guides & Comparisons | Mikee Gadget Plug', description, canonical: url, image: POSTS[0].image, type: 'website', extra: ld(graph)})}
<body>
${header}
<main class="blog-section">
<nav class="blog-breadcrumb"><a href="/">Home</a><span>/</span><span>Blog</span></nav>
<p class="eyebrow">Mikee Gadget Plug Blog</p>
<h1>Phone prices, buying guides and honest comparisons</h1>
<p class="blog-author">Written from our store in Computer Village, Ikeja, for people buying in Nigeria.</p>
<div class="blog-grid">
${all.map(card).join('\n')}
</div>
</main>
${footer}
${tail}`;
}

for (const post of POSTS) {
 await mkdir(join('blog', post.slug), {recursive: true});
 await writeFile(join('blog', post.slug, 'index.html'), renderPost(post));
}
await writeFile(join('blog', 'index.html'), renderIndex());
console.log(`Blog: ${POSTS.length} posts and /blog/ written (prices snapshot ${snapshot.capturedAt}).`);
