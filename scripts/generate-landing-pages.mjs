import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { landingPages, pageByRoute, site } from "../landing-pages/config.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const escapeJson = (value) => JSON.stringify(value).replaceAll("<", "\\u003c");
const cleanGeneratedOutput = (value) => value.replace(/[ \t]+$/gm, "");

const whatsappHref = (page) => {
  const source = `Source page: ${page.adGroupId} — ${page.adGroupName}.`;
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(`${page.whatsappMessage}\n\n${source}`)}`;
};

const breadcrumbs = (page) => {
  const section = page.route.split("/").filter(Boolean)[0];
  const sectionLabel = {
    "easy-buy": "Easy Buy",
    iphone: "iPhone",
    samsung: "Samsung",
    deals: "Deals"
  }[section] || "Phones";
  const sectionHref = {
    "easy-buy": "/easy-buy/",
    iphone: "/iphone-shop-ikeja-lagos",
    samsung: "/samsung-shop-ikeja-lagos",
    deals: "/#deals"
  }[section] || "/";

  return [
    { label: "Home", href: "/" },
    { label: sectionLabel, href: sectionHref },
    { label: page.adGroupName, href: page.route }
  ];
};

const breadcrumbSchema = (page) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: breadcrumbs(page).map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.label,
    item: `${site.baseUrl}${item.href}`
  }))
});

const faqSchema = (page) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: page.faqs.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer
    }
  }))
});

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "Store",
  "@id": `${site.baseUrl}/#store`,
  name: site.displayName,
  url: site.baseUrl,
  telephone: site.telephoneHref,
  address: {
    "@type": "PostalAddress",
    streetAddress: "1 Ola Ayeni Street, Off Simbiat Abiola Way",
    addressLocality: "Ikeja",
    addressRegion: "Lagos",
    addressCountry: "NG"
  },
  areaServed: "Nigeria"
};

const renderHeader = (page) => `
  <aside class="intent-topbar" aria-label="FORMEX store highlights">
    <span>FORMEX Communication</span>
    <span>Physical store in Ikeja</span>
    <span>Delivery in Lagos and across Nigeria</span>
  </aside>
  <header class="intent-header">
    <nav class="intent-nav" aria-label="Main navigation">
      <a class="intent-brand" href="/" aria-label="FORMEX Communication home">
        <span class="intent-brand-mark" aria-hidden="true"></span>
        <span><strong>FORMEX</strong><small>Communication</small></span>
      </a>
      <button class="intent-menu-button" type="button" aria-expanded="false" aria-controls="intent-menu">
        <span class="sr-only">Open navigation</span><span></span><span></span>
      </button>
      <div class="intent-menu" id="intent-menu">
        <a href="/used-iphones-lagos">UK-used iPhones</a>
        <a href="/iphone-shop-ikeja-lagos">iPhone shop</a>
        <a href="/samsung-shop-ikeja-lagos">Samsung shop</a>
        <a href="/easy-buy/iphone">Easy Buy</a>
        <a href="/phone-shop-ikeja">Visit store</a>
        <a class="intent-nav-cta" data-track="whatsapp" href="${whatsappHref(page)}" target="_blank" rel="noopener">WhatsApp</a>
      </div>
    </nav>
  </header>`;

const renderBreadcrumbs = (page) => `
  <nav class="intent-breadcrumbs" aria-label="Breadcrumb">
    <ol>
      ${breadcrumbs(page).map((item, index, items) => `
        <li>${index === items.length - 1
          ? `<span aria-current="page">${escapeHtml(item.label)}</span>`
          : `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`}</li>`).join("")}
    </ol>
  </nav>`;

const renderHero = (page, localHeroImage) => `
  <section class="intent-hero">
    <div class="intent-hero-copy">
      <p class="intent-eyebrow">${escapeHtml(page.eyebrow)}</p>
      <h1>${escapeHtml(page.h1)}</h1>
      <p class="intent-lead">${escapeHtml(page.heroText)}</p>
      <div class="intent-hero-actions">
        <a class="intent-button intent-button-primary" data-track="whatsapp" data-primary-action="${escapeHtml(page.conversionEventName)}" ${page.pageType === "easy-buy" ? 'data-easy-buy="true"' : ""} href="${whatsappHref(page)}" target="_blank" rel="noopener">${escapeHtml(page.primaryCta)}</a>
        <a class="intent-button intent-button-secondary" ${page.secondaryCta.href.startsWith("tel:") ? 'data-track="call"' : ""} href="${escapeHtml(page.secondaryCta.href)}">${escapeHtml(page.secondaryCta.label)}</a>
      </div>
      <ul class="intent-hero-facts" aria-label="Purchase information">
        <li><span>Price</span><strong>Request today’s price</strong></li>
        <li><span>Pickup</span><strong>Ikeja, Lagos</strong></li>
        <li><span>Delivery</span><strong>Lagos or across Nigeria</strong></li>
      </ul>
    </div>
    <div class="intent-hero-media">
      <div class="intent-image-frame">
        <img src="${escapeHtml(localHeroImage)}" width="1200" height="900" alt="${escapeHtml(page.heroAlt)}" fetchpriority="high">
      </div>
      <div class="intent-availability">
        <span>What to confirm</span>
        <strong>${escapeHtml(page.badge)}</strong>
        <small>Price and availability confirmed by FORMEX</small>
      </div>
    </div>
  </section>`;

const renderOfferInformation = (page) => `
  <section class="intent-section" aria-labelledby="offer-information">
    <div class="intent-section-heading">
      <p class="intent-eyebrow">Product and offer information</p>
      <h2 id="offer-information">${escapeHtml(page.infoTitle)}</h2>
      <p>${escapeHtml(page.infoText)}</p>
    </div>
    <div class="intent-info-grid">
      ${page.cards.map((card) => `
        <article class="intent-info-card">
          <span>${escapeHtml(card.kicker)}</span>
          <h3>${escapeHtml(card.title)}</h3>
          <p>${escapeHtml(card.text)}</p>
          <a data-track="whatsapp" data-select-phone="${page.pageType === "series" ? "true" : "false"}" href="${whatsappHref(page)}" target="_blank" rel="noopener">Ask FORMEX <span aria-hidden="true">→</span></a>
        </article>`).join("")}
    </div>
  </section>`;

const renderBuyerDecision = (page) => `
  <section class="intent-section intent-decision" aria-labelledby="buyer-decision">
    <div>
      <p class="intent-eyebrow">Buyer decision guide</p>
      <h2 id="buyer-decision">${escapeHtml(page.buyerTitle)}</h2>
      <p>Use these checks to get a precise answer and avoid comparing offers that describe different devices or payment terms.</p>
      <a class="intent-text-link" data-track="whatsapp" href="${whatsappHref(page)}" target="_blank" rel="noopener">Send your exact request <span aria-hidden="true">→</span></a>
    </div>
    <ol class="intent-checklist">
      ${page.buyerItems.map((item, index) => `
        <li><span>${String(index + 1).padStart(2, "0")}</span><p>${escapeHtml(item)}</p></li>`).join("")}
    </ol>
  </section>`;

const renderTrust = (page) => `
  <section class="intent-section intent-store" id="store" aria-labelledby="store-details">
    <div class="intent-store-card">
      <p class="intent-eyebrow">FORMEX store details</p>
      <h2 id="store-details">Speak with the store or visit in Ikeja</h2>
      <address>${escapeHtml(site.address)}</address>
      <div class="intent-contact-grid">
        <a data-track="call" href="tel:${site.telephoneHref}">
          <span>Call</span><strong>${site.telephoneDisplay}</strong>
        </a>
        <a data-track="whatsapp" href="${whatsappHref(page)}" target="_blank" rel="noopener">
          <span>WhatsApp</span><strong>Model-specific enquiry</strong>
        </a>
        <a data-track="directions" href="${site.directionsUrl}" target="_blank" rel="noopener">
          <span>Directions</span><strong>Open Google Maps</strong>
        </a>
      </div>
      <p class="intent-delivery-note">${escapeHtml(site.delivery)}</p>
      <p class="intent-terms-note">Ask FORMEX to confirm stock, the exact device condition, current price, delivery details and any written warranty or after-sales terms before payment.</p>
    </div>
  </section>`;

const renderFaq = (page) => `
  <section class="intent-section intent-faq" aria-labelledby="frequently-asked-questions">
    <div class="intent-section-heading">
      <p class="intent-eyebrow">Questions before you buy</p>
      <h2 id="frequently-asked-questions">Frequently asked questions</h2>
      <p>Answers for someone searching specifically for ${escapeHtml(page.adGroupName.toLowerCase())}.</p>
    </div>
    <div class="intent-faq-list">
      ${page.faqs.map((item, index) => `
        <details ${index === 0 ? "open" : ""}>
          <summary>${escapeHtml(item.question)}<span aria-hidden="true">+</span></summary>
          <p>${escapeHtml(item.answer)}</p>
        </details>`).join("")}
    </div>
  </section>`;

const renderRelated = (page) => `
  <section class="intent-section intent-related" aria-labelledby="related-options">
    <div class="intent-section-heading">
      <p class="intent-eyebrow">Related buying options</p>
      <h2 id="related-options">Continue with a closely related page</h2>
    </div>
    <div class="intent-related-grid">
      ${page.related.map((route) => {
        const related = pageByRoute.get(route);
        return related
          ? `<a href="${related.route}"><span>${related.adGroupId}</span><strong>${escapeHtml(related.adGroupName)}</strong><small>${escapeHtml(related.primaryCta)} →</small></a>`
          : "";
      }).join("")}
    </div>
  </section>`;

const renderFinalCta = (page) => `
  <section class="intent-final-cta">
    <div>
      <p class="intent-eyebrow">Ready for a precise answer?</p>
      <h2>${escapeHtml(page.finalTitle)}</h2>
      <p>${escapeHtml(page.finalText)}</p>
    </div>
    <div>
      <a class="intent-button intent-button-primary" data-track="whatsapp" data-primary-action="${escapeHtml(page.conversionEventName)}" ${page.pageType === "easy-buy" ? 'data-easy-buy="true"' : ""} href="${whatsappHref(page)}" target="_blank" rel="noopener">${escapeHtml(page.primaryCta)}</a>
      <a class="intent-button intent-button-on-dark" data-track="call" href="tel:${site.telephoneHref}">Call ${site.telephoneDisplay}</a>
    </div>
  </section>`;

const renderFooter = (page) => `
  <footer class="intent-footer">
    <div>
      <a class="intent-brand intent-brand-footer" href="/">
        <span class="intent-brand-mark" aria-hidden="true"></span>
        <span><strong>FORMEX</strong><small>Communication</small></span>
      </a>
      <p>Phone and device enquiries from a physical store in Ikeja, Lagos.</p>
    </div>
    <div>
      <strong>Buying pages</strong>
      <a href="/used-iphones-lagos">UK-used iPhones</a>
      <a href="/deals/iphones">iPhone deals</a>
      <a href="/deals/samsung-phones">Samsung deals</a>
    </div>
    <div>
      <strong>Contact</strong>
      <a href="tel:${site.telephoneHref}">${site.telephoneDisplay}</a>
      <span>${escapeHtml(site.address)}</span>
    </div>
    <small>© 2026 FORMEX Communication.</small>
  </footer>
  <div class="intent-mobile-bar" aria-label="Quick contact actions">
    <a data-track="call" href="tel:${site.telephoneHref}"><span>Call</span><strong>${site.telephoneDisplay}</strong></a>
    <a data-track="whatsapp" href="${whatsappHref(page)}" target="_blank" rel="noopener"><span>WhatsApp</span><strong>Ask FORMEX</strong></a>
  </div>`;

const renderPage = (page) => {
  const canonical = `${site.baseUrl}${page.route}`;
  const depth = page.route.split("/").filter(Boolean).length;
  const localRoot = "../".repeat(depth);
  const localHeroImage = `${localRoot}${page.heroImage.replace(/^\//, "")}`;
  const schemas = [
    breadcrumbSchema(page),
    faqSchema(page),
    ...(page.pageType === "location" ? [localBusinessSchema] : [])
  ];

  return `<!doctype html>
<html lang="en-NG">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(page.seoTitle)}</title>
  <meta name="description" content="${escapeHtml(page.metaDescription)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${site.displayName}">
  <meta property="og:locale" content="en_NG">
  <meta property="og:title" content="${escapeHtml(page.seoTitle)}">
  <meta property="og:description" content="${escapeHtml(page.metaDescription)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${site.baseUrl}${escapeHtml(page.heroImage)}">
  <meta property="og:image:alt" content="${escapeHtml(page.heroAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#07130f">
  <link rel="icon" href="${localRoot}favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${localRoot}assets/landing-page.css">
  ${schemas.map((schema) => `<script type="application/ld+json">${escapeJson(schema)}</script>`).join("\n  ")}
</head>
<body
  data-ad-group-id="${page.adGroupId}"
  data-ad-group-name="${escapeHtml(page.adGroupName)}"
  data-landing-page="${page.route}"
  data-page-type="${page.pageType}"
  data-product-name="${escapeHtml(page.productName || page.adGroupName)}"
  data-phone-model="${escapeHtml(page.productName || "")}"
  data-device-condition="${escapeHtml(page.condition || "Confirm with FORMEX")}"
  data-lead-type="${page.leadType}"
>
  ${renderHeader(page)}
  <main id="main-content">
    ${renderBreadcrumbs(page)}
    ${renderHero(page, localHeroImage)}
    ${renderOfferInformation(page)}
    ${renderBuyerDecision(page)}
    ${renderTrust(page)}
    ${renderFaq(page)}
    ${renderRelated(page)}
    ${renderFinalCta(page)}
  </main>
  ${renderFooter(page)}
  <script src="${localRoot}assets/landing-page.js" defer></script>
</body>
</html>
`;
};

const adGroupMap = landingPages.map((page) => ({
  ad_group_id: page.adGroupId,
  ad_group_name: page.adGroupName,
  final_landing_page_url: `${site.baseUrl}${page.route}`,
  primary_keyword_theme: page.primaryKeywordTheme,
  h1: page.h1,
  main_cta: page.primaryCta,
  whatsapp_message: page.whatsappMessage,
  seo_title: page.seoTitle,
  meta_description: page.metaDescription,
  conversion_event_name: page.conversionEventName
}));

for (const page of landingPages) {
  const outputPath = join(root, page.route.slice(1), "index.html");
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, cleanGeneratedOutput(renderPage(page)), "utf8");
}

await writeFile(
  join(root, "landing-pages", "ad-group-map.json"),
  `${JSON.stringify(adGroupMap, null, 2)}\n`,
  "utf8"
);

const existingRoutes = [
  "/",
  "/easy-buy/",
  "/blog/best-uk-used-iphone-shop",
  "/blog/where-to-buy-original-samsung-phones",
  "/blog/best-phone-under-250000",
  "/blog/iphone-battery-health-guide",
  "/blog/pixel-vs-samsung-camera"
];
const sitemapRoutes = [...existingRoutes, ...landingPages.map((page) => page.route)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapRoutes.map((route) => `  <url><loc>${site.baseUrl}${route}</loc></url>`).join("\n")}
</urlset>
`;
await writeFile(join(root, "sitemap.xml"), sitemap, "utf8");

const redirectsPath = join(root, "_redirects");
const redirects = await readFile(redirectsPath, "utf8");
const normalizedRedirects = redirects
  .replaceAll("https://www.formxcommunication.netlify.app/* https://formxcommunication.netlify.app/:splat 301!", `https://formxcommunication.netlify.app/* ${site.baseUrl}/:splat 301!`)
  .trimEnd();
await writeFile(redirectsPath, `${normalizedRedirects}\n`, "utf8");

console.log(`Generated ${landingPages.length} intent-matched landing pages.`);
