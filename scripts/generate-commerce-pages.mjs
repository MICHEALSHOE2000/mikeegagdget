import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { landingPages } from "../landing-pages/config.mjs";
import {media} from '../assets/storefront-ui.mjs';
import {shopCategories} from '../commerce/storefront-data.mjs';
import {
  accessories,
  categoryPages,
  commerceSite,
  products as baseProducts
} from "../commerce/catalog.mjs";

import {offerProduct,isComplete} from '../commerce/offers.mjs';
const products=baseProducts.map(offerProduct);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const escapeJson = (value) => JSON.stringify(value).replaceAll("<", "\\u003c");
const cleanGeneratedOutput = (value) => value.replace(/[ \t]+$/gm, "");
const formatNaira = (value) => new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0
}).format(value);

const whatsappHref = (message) =>
  `https://wa.me/${commerceSite.whatsappNumber}?text=${encodeURIComponent(message)}`;

const communityHref = commerceSite.communityUrl || whatsappHref(
  "Hello Mikee Gadget Plug, I want to join your WhatsApp Gadget Community for new arrivals, price drops, swap deals, Easy Buy offers and limited-stock alerts. Please send me the group link."
);

const productMessage = (product, storage = product.defaultStorage, intent = "buy") => {
  const productName = `${product.model} ${storage}`.trim();
  const messages = {
    buy: `Hello, I'm interested in the ${productName}. Is it currently available? Please confirm today’s price, available colours, condition, warranty terms and delivery options.`,
    easyBuy: `Hello, I'm interested in getting the ${productName} through Easy Buy. Please send me the deposit, payment options, eligibility requirements and complete terms.`,
    swap: `Hello, I want to swap my current phone for a ${productName}. How can I get a valuation?`,
    price: `Hello, please confirm today’s price and availability for the ${productName}, including colour, condition, warranty terms and delivery options.`
  };
  return messages[intent] || messages.buy;
};

const productFaqs = (product) => {
  const exampleStorage = product.defaultStorage;
  const conditionQuestion = product.brand === "Apple"
    ? `Do you sell UK-used ${product.model}?`
    : `What condition is the ${product.model} available in?`;
  const conditionAnswer = product.brand === "Apple"
    ? `Mikee Gadget Plug lists UK-used and brand-new iPhone enquiries. Ask which ${product.model} units are available today and request the exact condition before payment.`
    : `Condition depends on the current device available. Ask Mikee Gadget Plug whether the exact ${product.model} offered is new or used and request inspection details.`;

  return [
    {
      question: `What is the price of ${product.model} in Nigeria?`,
      answer: `The price depends on storage, condition, colour and current market availability. This page shows prices where available. Confirm today’s price and stock before payment.`
    },
    {
      question: `How much is ${product.model} ${exampleStorage}?`,
      answer: `Select ${exampleStorage} on this page to see the price where available, or use WhatsApp to request today’s price for that exact variant.`
    },
    {
      question: `Can I buy ${product.model} and pay in installments?`,
      answer: `Ask Mikee Gadget Plug to confirm Easy Buy eligibility for the exact device. The calculator is an estimate only; approval, deposit, due dates and complete terms are confirmed before commitment.`
    },
    {
      question: conditionQuestion,
      answer: conditionAnswer
    },
    {
      question: `Can I swap my old phone for ${product.model}?`,
      answer: `You can request a valuation on WhatsApp. Mikee Gadget Plug must inspect or review your current phone before confirming a swap value or balance.`
    },
    {
      question: "Do you deliver outside Lagos?",
      answer: `Delivery is available in Lagos and across Nigeria. Confirm the fee, timing and payment or handover arrangement for your location before ordering.`
    },
    {
      question: `Does ${product.model} come with a warranty?`,
      answer: commerceSite.warranty
    }
  ];
};

const productSchema = (product) => {
  const pricedOffers = product.variants
    .filter((variant) => Number.isFinite(variant.price))
    .map((variant) => ({
      "@type": "Offer",
      name: `${product.model} ${variant.storage}`,
      priceCurrency: "NGN",
      price: variant.price,
      url: `${commerceSite.baseUrl}${product.route}?storage=${encodeURIComponent(variant.storage)}`,
      seller: {
        "@type": "Organization",
        name: commerceSite.name
      }
    }));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.model,
    brand: {
      "@type": "Brand",
      name: product.brand
    },
    description: product.metaDescription,
    sku: product.slug,
    url: `${commerceSite.baseUrl}${product.route}`,
    ...(product.images.length ? {
      image: product.images.map((image) => `${commerceSite.baseUrl}${image}`)
    } : {}),
    ...(pricedOffers.length ? {
      offers: pricedOffers.length === 1 ? pricedOffers[0] : pricedOffers
    } : {})
  };
};

const breadcrumbSchema = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: `${commerceSite.baseUrl}${item.href}`
  }))
});

const faqSchema = (faqs) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer
    }
  }))
});

const renderHeader = () => `
  <aside class="commerce-topbar">
    <span>Physical store in Computer Village, Ikeja</span>
    <span>Delivery in Lagos and across Nigeria</span>
    <a href="/easy-buy/">Easy Buy calculator</a>
  </aside>
  <header class="commerce-header">
    <nav class="commerce-nav" aria-label="Main navigation">
      <a class="commerce-brand" href="/" aria-label="Mikee Gadget Plug home">
        <span class="commerce-brand-mark" aria-hidden="true">M</span>
        <span><strong>MIKEE</strong><small>Gadget Plug</small></span>
      </a>
      <button class="commerce-menu-button" type="button" aria-expanded="false" aria-controls="commerce-menu" aria-label="Open navigation">
        <span></span><span></span>
      </button>
      <div class="commerce-menu" id="commerce-menu">
        <a href="/iphones">iPhones</a>
        <a href="/samsung-phones">Samsung</a>
        <a href="/google-pixel-phones">Google Pixel</a>
        <a href="/easy-buy/">Easy Buy</a>
        <a href="/phone-swap">Swap</a>
        <a href="/deals/">Deals</a>
        <a href="/phone-shop-ikeja">Visit store</a>
      </div>
      <div class="commerce-nav-actions">
        <button class="commerce-search-trigger" type="button" data-search-open aria-label="Search phones">
          <span aria-hidden="true">⌕</span> Search
        </button>
        <a class="commerce-nav-whatsapp" href="${whatsappHref("Hello Mikee Gadget Plug, I want to buy a phone. Please help me find the right model.")}" target="_blank" rel="noopener">WhatsApp</a>
      </div>
    </nav>
  </header>
  <dialog class="catalog-search-dialog" data-search-dialog>
    <form method="dialog" class="catalog-search-shell">
      <div class="catalog-search-heading">
        <div><span>Find your exact phone</span><strong>Search models or storage</strong></div>
        <button value="cancel" aria-label="Close search">×</button>
      </div>
      <label class="catalog-search-field">
        <span aria-hidden="true">⌕</span>
        <input type="search" data-catalog-search autocomplete="off" placeholder="Try “iPhone 11 128GB” or “Samsung S23”">
      </label>
      <div class="catalog-search-results" data-catalog-results aria-live="polite"></div>
    </form>
  </dialog>`;

const renderProductArtwork = (product) => {
  const galleryImages = product.images.map(image => /\.jpe?g$/i.test(image) ? `/images/store/${image.split('/').pop().replace(/\.jpe?g$/i,'')}-720.webp` : image);
  if (product.images.length) {
    return `
      <div class="product-gallery" data-product-gallery>
        <div class="product-main-image">
          ${media(product.images[0],product.model,true)
            .replace('sizes="(max-width:600px) 45vw, 280px"', 'sizes="(max-width:800px) 100vw, 52vw"')
            .replace('<img ', '<img data-main-image ')}
        </div>
        <div class="product-thumbnails" aria-label="${escapeHtml(product.model)} images">
          ${galleryImages.map((image, index) => `
            <button type="button" class="${index === 0 ? "is-active" : ""}" data-gallery-image="${escapeHtml(image)}" aria-label="Show ${escapeHtml(product.model)} image ${index + 1}">
              <img src="${escapeHtml(image.replace('-720.webp','-160.webp'))}" alt="" width="80" height="80" loading="lazy">
            </button>`).join("")}
        </div>
      </div>`;
  }

  return `
    <div class="product-artwork-placeholder" role="img" aria-label="Product image placeholder for ${escapeHtml(product.model)}">
      <span>${escapeHtml(product.brand)}</span>
      <div class="device-silhouette"><i></i><i></i><i></i></div>
      <strong>${escapeHtml(product.model)}</strong>
      <small>Photo coming soon.</small>
    </div>`;
};

const renderVariantSelector = (product) => `
  <div class="purchase-panel" data-purchase-panel>
    <div class="availability-line"><span></span>${escapeHtml(product.stockStatus)}</div>
    <p class="purchase-label">Choose storage</p>
    <div class="selector-pills" data-storage-options>
      ${product.variants.map((variant) => `
        <button
          type="button"
          class="${variant.storage === product.defaultStorage ? "is-active" : ""}"
          data-storage="${escapeHtml(variant.storage)}"
          data-price="${variant.price ?? ""}"
          data-price-confirm="${variant.priceNeedsExtraConfirmation ? "true" : "false"}"
          aria-pressed="${variant.storage === product.defaultStorage ? "true" : "false"}"
        >${escapeHtml(variant.storage)}</button>`).join("")}
    </div>
    <div class="selection-grid">
      <label>
        <span>Preferred colour</span>
        <select data-color-select>
          ${product.colors.map((color) => `<option>${escapeHtml(color)}</option>`).join("")}
        </select>
      </label>
      <label>
        <span>Condition</span>
        <select data-condition-select>
          ${product.conditions.map((condition) => `<option>${escapeHtml(condition)}</option>`).join("")}
        </select>
      </label>
    </div>
    <div class="buying-facts">
      <span><b>Battery health</b>${product.listingPending ? "Details coming soon" : product.brand === "Apple" ? "UK-used units: above 83%; confirm exact reading" : "Reading available for the exact used unit"}</span>
      <span><b>Warranty</b>Confirm written terms for the exact unit</span>
      <span><b>Delivery</b>Lagos and nationwide options</span>
    </div>
    <div class="price-display">
      <span data-variant-label>${escapeHtml(product.model)} ${escapeHtml(product.defaultStorage)}</span>
      <strong data-product-price>${escapeHtml(
        product.variants.find((variant) => variant.storage === product.defaultStorage)?.price
          ? formatNaira(product.variants.find((variant) => variant.storage === product.defaultStorage).price)
          : "Confirm price"
      )}</strong>
      <small data-price-note>Confirm today’s price, condition and stock before payment.</small>
    </div>
    <div class="purchase-actions">
      <a class="commerce-button commerce-button-primary" data-action="buy" href="/buy/?phone=${encodeURIComponent(`${product.slug}|${product.defaultStorage}`)}">BUY — ${product.variants.find(v=>v.storage===product.defaultStorage)?.price ? formatNaira(product.variants.find(v=>v.storage===product.defaultStorage).price) : "ASK FOR PRICE"}</a>
      <a class="commerce-button commerce-button-dark" data-action="easyBuy" href="/easybuy/?phone=${encodeURIComponent(`${product.slug}|${product.defaultStorage}`)}">EASYBUY — FROM ${product.variants.find(v=>v.storage===product.defaultStorage)?.price ? formatNaira(Math.round(product.variants.find(v=>v.storage===product.defaultStorage).price*.4)) : "CONFIRM DEPOSIT"} TODAY</a>
      <a class="commerce-button commerce-button-ghost" data-action="swap" href="/swap/?target=${encodeURIComponent(`${product.slug}|${product.defaultStorage}`)}">SWAP — SEE WHAT YOU’LL ADD</a>
    </div>
    <p class="purchase-safety"><a data-action="price" href="${whatsappHref(productMessage(product, product.defaultStorage, 'price'))}" target="_blank" rel="noopener">Have a question? Chat on WhatsApp ↗</a></p>
  </div>`;

const renderVariantCards = (product) => `
  <section class="commerce-section product-options" id="options">
    <details class="storage-comparison"><summary>Compare storage prices <span>+</span></summary>
    <div class="variant-card-grid">
      ${product.variants.map((variant) => `
        <article class="variant-card" data-variant-card="${escapeHtml(variant.storage)}">
          <div class="variant-card-top"><span>${escapeHtml(product.brand)}</span><span>${escapeHtml(product.stockStatus)}</span></div>
          <h3>${escapeHtml(product.model)} ${escapeHtml(variant.storage)}</h3>
          <p class="variant-price">${variant.price ? formatNaira(variant.price) : "Confirm price"}</p>
          <button type="button" data-select-variant="${escapeHtml(variant.storage)}">Choose ${escapeHtml(variant.storage)}</button>
        </article>`).join("")}
    </div></details>
  </section>`;

const renderDetails = (product) => `
  <section class="commerce-section details-section" id="details">
    <div class="details-copy">
      <p class="commerce-eyebrow">Device details</p>
      <h2>Know what you’re choosing</h2>
      <p>We’ll confirm the colour, condition and SIM options for your exact device.</p>
      ${product.specificationsPending ? '<p>Ask Mikee for the specifications of the exact unit before ordering.</p>' : `<div class="spec-grid">
        <article><span>Display</span><strong>${escapeHtml(product.specifications.display)}</strong></article>
        <article><span>Camera</span><strong>${escapeHtml(product.specifications.camera)}</strong></article>
        <article><span>Processor</span><strong>${escapeHtml(product.specifications.processor)}</strong></article>
        <article><span>Network</span><strong>${escapeHtml(product.specifications.network)}</strong></article>
        <article><span>Security</span><strong>${escapeHtml(product.specifications.security)}</strong></article>
        <article><span>SIM options</span><strong>${escapeHtml(product.specifications.sim)}</strong></article>
      </div>`}
    </div>
    <aside class="condition-panel">
      <p class="commerce-eyebrow">Condition guide</p>
      <article><span>01</span><div><h3>Brand New</h3><p>Unused device in original or new packaging where applicable. Ask what comes in the box.</p></div></article>
      <article><span>02</span><div><h3>UK Used</h3><p>Imported used device. Request photos, exact condition and battery information before payment.</p></div></article>
      <article><span>03</span><div><h3>Nigerian Used</h3><p>Locally used and inspected device where available. Ask for repair history and the checks completed.</p></div></article>
    </aside>
  </section>`;

const relatedProducts = (product) => {
  const sameBrand = products.filter((item) => item.brand === product.brand && isComplete(item));
  const index = sameBrand.findIndex((item) => item.slug === product.slug);
  const candidates = [
    sameBrand[index - 2],
    sameBrand[index - 1],
    sameBrand[index + 1],
    sameBrand[index + 2],
    sameBrand[index + 3]
  ].filter(Boolean);
  return [...new Map(candidates.map((item) => [item.slug, item])).values()].slice(0, 4);
};

const renderRelated = (product) => {
  const related = relatedProducts(product);
  return `
    <section class="commerce-section related-section">
      <div class="section-heading-row">
        <div><p class="commerce-eyebrow">Compare other phones</p><h2>Keep your options open</h2></div>
        <p>Another model in mind?</p>
      </div>
      <div class="related-grid">
        ${related.map((item, index) => `
          <a href="${item.route}">
            <span>Compare model</span>
            <strong>${escapeHtml(item.model)}</strong>
            <small>${escapeHtml(item.variants.map((variant) => variant.storage).join(" · "))}</small>
          </a>`).join("")}
      </div>
    </section>`;
};

const renderDelivery = () => `
  <section class="commerce-section delivery-section" id="delivery">
    <div>
      <p class="commerce-eyebrow">Pickup and delivery</p>
      <h2>Buy from Ikeja. Receive across Nigeria.</h2>
      <p>${escapeHtml(commerceSite.delivery)}</p>
      <a class="text-link" href="${commerceSite.directionsUrl}" target="_blank" rel="noopener">Get directions to the store →</a>
    </div>
    <div class="delivery-grid">
      <article><span>01</span><h3>Lagos delivery</h3><p>Ask for timing, fee and whether a payment-on-delivery arrangement applies to your location.</p></article>
      <article><span>02</span><h3>Store pickup</h3><p>Visit ${escapeHtml(commerceSite.address)} and ask to inspect the exact unit before payment.</p></article>
      <article><span>03</span><h3>Nationwide delivery</h3><p>Confirm courier, fee, timing and handover process for your state before ordering.</p></article>
    </div>
  </section>`;

const renderFaq = (faqs) => `
  <section class="commerce-section faq-section" id="faq">
    <div><p class="commerce-eyebrow">Questions buyers ask</p><h2>Frequently asked questions</h2></div>
    <div class="faq-list">
      ${faqs.map((faq, index) => `
        <details class="product-faq" ${index === 0 ? "open" : ""}>
          <summary>${escapeHtml(faq.question)}<span>+</span></summary>
          <p>${escapeHtml(faq.answer)}</p>
        </details>`).join("")}
    </div>
  </section>`;

const renderFooter = () => `
  <footer class="commerce-footer">
    <div class="footer-intro">
      <a class="commerce-brand commerce-brand-footer" href="/">
        <span class="commerce-brand-mark" aria-hidden="true">M</span>
        <span><strong>MIKEE</strong><small>Gadget Plug</small></span>
      </a>
      <p>Original devices. Better deals.<br>Your gadget plug in Computer Village, Ikeja.</p>
      <a class="commerce-button commerce-button-light" href="${whatsappHref("Hello Mikee Gadget Plug, I need help choosing a phone.")}" target="_blank" rel="noopener">Ask Mikee Gadget Plug on WhatsApp</a>
    </div>
    <div><strong>Shop phones</strong><a href="/iphones">All iPhones</a><a href="/samsung-phones">Samsung phones</a><a href="/google-pixel-phones">Google Pixel</a><a href="/uk-used-iphones">UK-used iPhones</a></div>
    <div><strong>Ways to buy</strong><a href="/easy-buy/">Easy Buy calculator</a><a href="/phones-on-installment">Phones on installment</a><a href="/phone-swap">Swap your phone</a><a href="${escapeHtml(communityHref)}" target="_blank" rel="noopener">WhatsApp community</a></div>
    <address><strong>Visit or call</strong><span>${escapeHtml(commerceSite.address)}</span><a href="tel:${commerceSite.telephoneHref}">${commerceSite.telephoneDisplay}</a><a href="${commerceSite.directionsUrl}" target="_blank" rel="noopener">Get directions</a></address>
    <p class="footer-legal">© 2026 Mikee Gadget Plug. Prices, stock, warranty and Easy Buy terms must be confirmed before payment.</p>
  </footer>`;

const renderProductPage = (product) => {
  const faqs = productFaqs(product);
  const canonical = `${commerceSite.baseUrl}${product.route}`;
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: product.brand === "Apple" ? "iPhones" : product.brand === "Samsung" ? "Samsung phones" : "Google Pixel phones", href: product.brand === "Apple" ? "/iphones" : product.brand === "Samsung" ? "/samsung-phones" : "/google-pixel-phones" },
    { name: product.model, href: product.route }
  ];
  const productData = {
    model: product.model,
    slug: product.slug,
    defaultStorage: product.defaultStorage,
    variants: product.variants,
    colors: product.colors,
    conditions: product.conditions,
    whatsappNumber: commerceSite.whatsappNumber
  };
  const firstImage = product.images[0] || "/images/shop.jpeg";

  return `<!doctype html>
<html lang="en-NG">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(product.seoTitle)}</title>
  <meta name="description" content="${escapeHtml(product.metaDescription)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="${commerceSite.name}">
  <meta property="og:locale" content="en_NG">
  <meta property="og:title" content="${escapeHtml(product.seoTitle)}">
  <meta property="og:description" content="${escapeHtml(product.metaDescription)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${commerceSite.baseUrl}${firstImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#f7f8fb">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/media.css"><link rel="stylesheet" href="/assets/commerce.css"><link rel="stylesheet" href="/assets/sales.css">
  <script type="application/ld+json">${escapeJson(productSchema(product))}</script>
  <script type="application/ld+json">${escapeJson(breadcrumbSchema(breadcrumbs))}</script>
  <script type="application/ld+json">${escapeJson(faqSchema(faqs))}</script>
</head>
<body data-page-type="product" data-product-name="${escapeHtml(product.model)}" data-product-slug="${escapeHtml(product.slug)}" data-landing-page="${escapeHtml(product.route)}">
  ${renderHeader()}
  <main>
    <nav class="commerce-breadcrumbs" aria-label="Breadcrumb">
      ${breadcrumbs.map((item, index) => index === breadcrumbs.length - 1
        ? `<span aria-current="page">${escapeHtml(item.name)}</span>`
        : `<a href="${item.href}">${escapeHtml(item.name)}</a><i>/</i>`).join("")}
    </nav>
    <section class="product-hero">
      <div class="product-hero-media">
        ${renderProductArtwork(product)}
      </div>
      <div class="product-hero-copy">
        <p class="commerce-eyebrow">${escapeHtml(product.brand)} · Buy in Nigeria</p>
        <h1>${escapeHtml(product.model)}</h1>
        <p class="product-lead">${product.listingPending ? "Price, specifications and availability have not been supplied yet. Contact the store for updates." : "UK Used &amp; Brand New. Confirm the condition of your exact unit."}</p>
        <div class="hero-fact-row">
          <span><strong>Storage</strong>${escapeHtml(product.variants.map((variant) => variant.storage).join(" · "))}</span>
          <span><strong>Delivery</strong>Lagos & nationwide</span>
          <span><strong>Payment</strong>${product.listingPending ? "Options pending" : "Outright or Easy Buy"}</span>
        </div>
        ${renderVariantSelector(product)}<div class="product-trust"><span>Inspect before payment</span><span>Computer Village store</span><span>Nationwide delivery</span><span>Device checked before payment</span></div>
      </div>
    </section>
    ${renderVariantCards(product)}
    ${renderDetails(product)}
    ${renderRelated(product)}
    ${renderDelivery()}
    ${renderFaq(faqs)}
  </main>
  ${renderFooter()}
  <div class="mobile-purchase-bar" aria-label="Quick purchase actions">
    <a data-action="buy" href="/buy/?phone=${encodeURIComponent(`${product.slug}|${product.defaultStorage}`)}"><span>₦</span>Buy outright</a>
    <a data-action="easyBuy" href="/easybuy/?phone=${encodeURIComponent(`${product.slug}|${product.defaultStorage}`)}"><span>◷</span>EasyBuy</a>
    <a data-action="swap" href="/swap/?target=${encodeURIComponent(`${product.slug}|${product.defaultStorage}`)}"><span>↔</span>Swap</a>
  </div>
  <script type="application/json" id="product-data">${escapeJson(productData)}</script>
  <script type="module" src="/assets/commerce.js"></script>
  <script src="/assets/landing-page.js" defer></script>
<script type="module" src="/assets/sales.js"></script></body>
</html>`;
};

const minimumKnownPrice = (product) => {
  const prices = product.variants.map((variant) => variant.price).filter(Number.isFinite);
  return prices.length ? Math.min(...prices) : Number.POSITIVE_INFINITY;
};

const categoryProducts = (category) => {
  let matches = category.contentOnly ? [] : [...products].sort((a,b)=>Number(isComplete(b))-Number(isComplete(a)));
  if (category.brand) matches = matches.filter((product) => product.brand === category.brand);
  if (category.easyBuy) matches = matches.filter((product) => Boolean(product.easyBuyEligible));
  if (category.swap) matches = matches.filter((product) => product.swapEligible);
  if (category.sort === "price-ascending") matches.sort((a, b) => minimumKnownPrice(a) - minimumKnownPrice(b));
  return matches;
};

const renderCategoryCard = (product) => {
  const minPrice = minimumKnownPrice(product);
  return `
    <article class="catalog-product-card" data-catalog-card data-search-value="${escapeHtml(`${product.model} ${product.variants.map((variant) => variant.storage).join(" ")}`.toLowerCase())}">
      <a class="catalog-card-media" href="${product.route}">
        ${media(product.images[0],product.model)}
      </a>
      <div>
        <span class="catalog-brand">${!isComplete(product)?"COMING SOON · ":""}${escapeHtml(product.conditions.includes('Details coming soon')?'Details coming soon':product.brand === 'Apple' ? 'UK Used / Brand New' : product.brand)}</span>
        <h2><a href="${product.route}">${escapeHtml(product.model)}</a></h2>
        <p>${escapeHtml(product.variants.map((variant) => variant.storage).join(" · "))}</p>
        <strong>${Number.isFinite(minPrice) ? `From ${formatNaira(minPrice)}` : "Confirm price"}</strong>
        <p class="catalog-availability">Confirm stock · EasyBuy & swap enquiries</p>
        <div><a href="${product.route}">View phone →</a></div>
      </div>
    </article>`;
};

const renderContentOnly = (category) => {
  if (category.contentOnly === "accessories") {
    return `<div class="content-only-grid">${accessories.map((item, index) => `
      <article><span>${String(index + 1).padStart(2, "0")}</span><h2>${escapeHtml(item.name)}</h2><p>${escapeHtml(item.detail)}</p></article>`).join("")}</div>`;
  }

  return `<div class="content-only-grid">
    <article><span>01</span><h2>Tell us what you need</h2><p>Share your preferred brand, processor, RAM, storage, screen size, condition and budget.</p></article>
    <article><span>02</span><h2>Get current options</h2><p>Mikee Gadget Plug will send the laptops currently available with their exact specifications and prices.</p></article>
    <article><span>03</span><h2>Confirm before payment</h2><p>Ask for photos, condition, battery information where relevant, warranty terms and delivery arrangements.</p></article>
  </div>`;
};

const renderCategoryPage = (category) => {
  const matches = categoryProducts(category);
  const canonical = `${commerceSite.baseUrl}${category.route}`;
  const breadcrumbs = [{ name: "Home", href: "/" }, { name: category.h1, href: category.route }];
  const categoryMessage = category.contentOnly === "laptops"
    ? "Hello Mikee Gadget Plug, please send me the laptops currently available, including specifications, condition and prices."
    : category.contentOnly === "accessories"
      ? "Hello Mikee Gadget Plug, please send me the gadget accessories currently available and their prices."
      : category.swap
        ? "Hello Mikee Gadget Plug, I want to swap my current phone. Please explain how to get a valuation and send eligible upgrade options."
        : `Hello Mikee Gadget Plug, I’m browsing ${category.h1}. Please send current models, prices, condition and payment options.`;

  return `<!doctype html>
<html lang="en-NG">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(category.title)}</title>
  <meta name="description" content="${escapeHtml(category.description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${commerceSite.name}">
  <meta property="og:locale" content="en_NG">
  <meta property="og:title" content="${escapeHtml(category.title)}">
  <meta property="og:description" content="${escapeHtml(category.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${commerceSite.baseUrl}/images/shop.jpeg">
  <meta name="theme-color" content="#f7f8fb">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/media.css"><link rel="stylesheet" href="/assets/commerce.css"><link rel="stylesheet" href="/assets/sales.css">
  <script type="application/ld+json">${escapeJson(breadcrumbSchema(breadcrumbs))}</script>
</head>
<body data-page-type="category" data-landing-page="${escapeHtml(category.route)}">
  ${renderHeader()}
  <main>
    <nav class="commerce-breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><i>/</i><span aria-current="page">${escapeHtml(category.h1)}</span></nav>
    <section class="category-hero">
      <div>
        <p class="commerce-eyebrow">${escapeHtml(category.eyebrow)}</p>
        <h1>${escapeHtml(category.h1)}</h1>
        <p>${escapeHtml(category.description)}</p>
        <div class="category-actions">
          <a class="commerce-button commerce-button-primary" href="${whatsappHref(categoryMessage)}" target="_blank" rel="noopener">Ask Mikee Gadget Plug on WhatsApp</a>
          ${category.easyBuy ? `<a class="commerce-button commerce-button-dark" href="/easy-buy/#calculator">Open Easy Buy Calculator</a>` : ""}
        </div>
      </div>
      <aside>
        <span>${matches.length || "Current"} ${matches.length === 1 ? "model" : "options"}</span>
        <strong>Choose → Confirm → Buy</strong>
        <p>Pay outright, spread your payment or swap your current phone. Collect in Ikeja or arrange delivery.</p>
      </aside>
    </section>
    ${category.contentOnly ? `
      <section class="commerce-section">
        ${renderContentOnly(category)}
        <div class="content-only-cta">
          <h2>Get the current list on WhatsApp</h2>
          <p>Mikee Gadget Plug will confirm the exact products, specifications, condition, price and pickup or delivery arrangement.</p>
          <a class="commerce-button commerce-button-dark" href="${whatsappHref(categoryMessage)}" target="_blank" rel="noopener">Request Current Options</a>
        </div>
      </section>` : `
      <section class="commerce-section catalogue-section">
        <div class="catalogue-toolbar">
          <div><p class="commerce-eyebrow">Find the exact match</p><h2>${escapeHtml(category.h1)}</h2></div>
          <label><span>Search this list</span><input type="search" data-category-filter placeholder="Search model or storage"></label>
        </div>
        ${category.condition === "UK Used" ? `<p class="category-disclaimer">This page is an enquiry route. Confirm which exact devices are available in UK-used condition before payment.</p>` : ""}
        <div class="catalogue-grid" data-category-grid>
          ${matches.map(renderCategoryCard).join("")}
        </div>
        <p class="empty-catalogue" data-empty-catalogue hidden>No matching phone found. Try a shorter model name or use the full-site search.</p>
      </section>`}
    <section class="commerce-section category-paths">
      <a href="/iphones"><span>Apple</span><strong>Shop iPhones</strong></a>
      <a href="/samsung-phones"><span>Samsung</span><strong>Shop Galaxy phones</strong></a>
      <a href="/google-pixel-phones"><span>Google</span><strong>Shop Pixel phones</strong></a>
      <a href="/easy-buy/"><span>Payment</span><strong>Open Easy Buy</strong></a>
      <a href="/phone-swap"><span>Upgrade</span><strong>Swap your phone</strong></a>
    </section>
    <section class="commerce-section community-banner">
      <div><p class="commerce-eyebrow">Not ready to buy?</p><h2>Join the Mikee Gadget Plug gadget deals community</h2><p>Get arrival alerts, price drops, UK-used deals, swap updates, Easy Buy offers and accessory deals.</p></div>
      <a class="commerce-button commerce-button-light" href="${escapeHtml(communityHref)}" target="_blank" rel="noopener">${commerceSite.communityUrl ? "Join the WhatsApp Group" : "Request the Group Link"}</a>
    </section>
  </main>
  ${renderFooter()}
  <script type="module" src="/assets/commerce.js"></script>
  <script src="/assets/landing-page.js" defer></script>
<script type="module" src="/assets/sales.js"></script></body>
</html>`;
};

for (const product of products) {
  const outputPath = join(root, product.slug, "index.html");
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${cleanGeneratedOutput(renderProductPage(product))}\n`, "utf8");
}

for (const category of categoryPages) {
  const outputPath = join(root, category.route.slice(1), "index.html");
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${cleanGeneratedOutput(renderCategoryPage(category))}\n`, "utf8");
}

const searchIndex = [
  ...products.slice().sort((a,b)=>Number(isComplete(b))-Number(isComplete(a))).map((product) => ({
    type: "product",
    label: product.model,
    route: product.route,
    brand: product.brand,
    storage: product.variants.map((variant) => variant.storage),
    price: Number.isFinite(minimumKnownPrice(product)) ? minimumKnownPrice(product) : null,
    image: product.images[0] || null,
    keywords: [
      product.model,
      product.brand,
      product.family,
      ...product.variants.map((variant) => `${product.model} ${variant.storage}`),
      ...product.variants.map((variant) => variant.storage),
      "price in Nigeria",
      "Easy Buy",
      "swap"
    ]
  })),
  ...categoryPages.map((category) => ({
    type: "category",
    label: category.h1,
    route: category.route,
    brand: category.brand || "Mikee Gadget Plug",
    storage: [],
    price: null,
    image: null,
    keywords: [category.h1, category.title, category.eyebrow]
  }))
];

await writeFile(
  join(root, "assets", "catalog-search.json"),
  `${JSON.stringify(searchIndex, null, 2)}\n`,
  "utf8"
);

await writeFile(
  join(root, "commerce", "route-manifest.json"),
  `${JSON.stringify({
    products: products.map((product) => product.route),
    categories: [...categoryPages, ...shopCategories].map((category) => category.route)
  }, null, 2)}\n`,
  "utf8"
);

const fixedRoutes = [
  "/easybuy/",
  "/swap/",
  "/buy/",
  "/deals/",
  "/",
  "/easy-buy/",
  "/blog/best-uk-used-iphone-shop",
  "/blog/where-to-buy-original-samsung-phones",
  "/blog/best-phone-under-250000",
  "/blog/iphone-battery-health-guide",
  "/blog/pixel-vs-samsung-camera"
];
const sitemapRoutes = [
  ...new Set([
    ...fixedRoutes,
    ...landingPages.map((page) => page.route),
    ...products.map((product) => product.route),
    ...categoryPages.map((category) => category.route),
    ...shopCategories.map((category) => category.route)
  ])
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapRoutes.map((route) => `  <url><loc>${commerceSite.baseUrl}${route}</loc></url>`).join("\n")}
</urlset>
`;
await writeFile(join(root, "sitemap.xml"), sitemap, "utf8");

console.log(`Generated ${products.length} product pages and ${categoryPages.length} commerce category pages.`);
