import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { landingPages } from "../landing-pages/config.mjs";
import {
  accessories,
  categoryPages,
  commerceSite,
  products
} from "../commerce/catalog.mjs";

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
      answer: `The price depends on storage, condition, colour and current market availability. This page shows supplied guide prices where Mikee Gadget Plug has provided them; confirm today’s exact price before payment.`
    },
    {
      question: `How much is ${product.model} ${exampleStorage}?`,
      answer: `Select ${exampleStorage} on this page to see the supplied guide price where available, or use WhatsApp to request today’s price for that exact variant.`
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
        <span class="commerce-brand-mark" aria-hidden="true">F</span>
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
  if (product.images.length) {
    return `
      <div class="product-gallery" data-product-gallery>
        <div class="product-main-image">
          <img src="${escapeHtml(product.images[0])}" alt="${escapeHtml(product.model)} available from Mikee Gadget Plug" data-main-image>
        </div>
        <div class="product-thumbnails" aria-label="${escapeHtml(product.model)} images">
          ${product.images.map((image, index) => `
            <button type="button" class="${index === 0 ? "is-active" : ""}" data-gallery-image="${escapeHtml(image)}" aria-label="Show ${escapeHtml(product.model)} image ${index + 1}">
              <img src="${escapeHtml(image)}" alt="" loading="lazy">
            </button>`).join("")}
        </div>
      </div>`;
  }

  return `
    <div class="product-artwork-placeholder" role="img" aria-label="Product image placeholder for ${escapeHtml(product.model)}">
      <span>${escapeHtml(product.brand)}</span>
      <div class="device-silhouette"><i></i><i></i><i></i></div>
      <strong>${escapeHtml(product.model)}</strong>
      <small>Add an approved product image in commerce/catalog.mjs</small>
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
      <span><b>Battery health</b>${product.brand === "Apple" ? "UK-used units: above 83%; confirm exact reading" : "Ask for details on the exact used unit"}</span>
      <span><b>Warranty</b>Confirm written terms for the exact unit</span>
      <span><b>Delivery</b>Lagos and nationwide options</span>
    </div>
    <div class="price-display">
      <span data-variant-label>${escapeHtml(product.model)} ${escapeHtml(product.defaultStorage)}</span>
      <strong data-product-price>${escapeHtml(
        product.variants.find((variant) => variant.storage === product.defaultStorage)?.price
          ? formatNaira(product.variants.find((variant) => variant.storage === product.defaultStorage).price)
          : "Request today’s price"
      )}</strong>
      <small data-price-note>Supplied guide price where shown. Confirm today’s exact price and availability before payment.</small>
    </div>
    <div class="purchase-actions">
      <a class="commerce-button commerce-button-primary" data-action="buy" href="${whatsappHref(productMessage(product))}" target="_blank" rel="noopener">Buy Now</a>
      <a class="commerce-button commerce-button-dark" data-action="easyBuy" href="${whatsappHref(productMessage(product, product.defaultStorage, "easyBuy"))}" target="_blank" rel="noopener">Buy With Easy Buy</a>
      <a class="commerce-button commerce-button-ghost" data-action="price" href="${whatsappHref(productMessage(product, product.defaultStorage, "price"))}" target="_blank" rel="noopener">Chat on WhatsApp</a>
    </div>
    <p class="purchase-safety">Confirm the exact unit, current price, warranty terms and payment details with Mikee Gadget Plug before sending money.</p>
  </div>`;

const renderVariantCards = (product) => `
  <section class="commerce-section product-options" id="options">
    <div class="section-heading-row">
      <div><p class="commerce-eyebrow">Choose the exact match</p><h2>${escapeHtml(product.model)} storage options</h2></div>
      <p>Select a card to update the buying panel and prefilled WhatsApp message.</p>
    </div>
    <div class="variant-card-grid">
      ${product.variants.map((variant) => `
        <article class="variant-card" data-variant-card="${escapeHtml(variant.storage)}">
          <div class="variant-card-top"><span>${escapeHtml(product.brand)}</span><span>${escapeHtml(product.stockStatus)}</span></div>
          <h3>${escapeHtml(product.model)} ${escapeHtml(variant.storage)}</h3>
          <p class="variant-price">${variant.price ? formatNaira(variant.price) : "Request today’s price"}</p>
          <ul>
            <li>Colours: confirm today’s options</li>
            <li>Condition: ${escapeHtml(product.conditions.join(" / "))}</li>
            <li>${escapeHtml(product.warranty)}</li>
          </ul>
          <button type="button" data-select-variant="${escapeHtml(variant.storage)}">Choose ${escapeHtml(variant.storage)}</button>
        </article>`).join("")}
    </div>
  </section>`;

const renderPaymentPaths = (product) => `
  <section class="commerce-section payment-section" id="payment">
    <div class="section-heading-row">
      <div><p class="commerce-eyebrow">Choose how to buy</p><h2>Two clear payment paths</h2></div>
      <p>Use the option that matches what you can pay today.</p>
    </div>
    <div class="payment-grid">
      <article class="payment-card payment-card-outright">
        <span class="payment-number">01</span>
        <p class="commerce-eyebrow">Pay outright</p>
        <h3>Ready to own your device today?</h3>
        <p>Ask Mikee Gadget Plug to confirm the exact phone, final price and collection or delivery arrangement, then pay the full amount.</p>
        <div>
          <a class="commerce-button commerce-button-primary" data-action="buy" href="${whatsappHref(productMessage(product))}" target="_blank" rel="noopener">Buy Now</a>
          <a class="text-link" data-action="price" href="${whatsappHref(productMessage(product, product.defaultStorage, "price"))}" target="_blank" rel="noopener">Chat with us on WhatsApp →</a>
        </div>
      </article>
      <article class="payment-card payment-card-easy">
        <span class="payment-number">02</span>
        <p class="commerce-eyebrow">Easy Buy</p>
        <h3>Don’t have the full payment?</h3>
        <ul><li>Start with an initial deposit</li><li>Review a 1–3 month estimate</li><li>Complete the required verification</li><li>Get final terms before commitment</li></ul>
        <div>
          <a class="commerce-button commerce-button-light" href="/easy-buy/?phone=${escapeHtml(product.slug)}#calculator">Check Easy Buy Options</a>
          <a class="text-link text-link-light" data-action="easyBuy" href="${whatsappHref(productMessage(product, product.defaultStorage, "easyBuy"))}" target="_blank" rel="noopener">Ask about eligibility →</a>
        </div>
      </article>
    </div>
  </section>`;

const renderTrust = () => `
  <section class="commerce-section compact-section">
    <div class="trust-strip">
      <article><span>✓</span><strong>Exact-device checks</strong><small>Ask to inspect the unit offered.</small></article>
      <article><span>CV</span><strong>Physical store</strong><small>Computer Village, Ikeja.</small></article>
      <article><span>NG</span><strong>Nationwide delivery</strong><small>Confirm fee and timing.</small></article>
      <article><span>₦</span><strong>Easy Buy</strong><small>Eligibility and terms apply.</small></article>
      <article><span>↻</span><strong>Swap enquiries</strong><small>Valuation required.</small></article>
      <article><span>WA</span><strong>WhatsApp support</strong><small>Send the exact model fast.</small></article>
    </div>
  </section>`;

const renderDetails = (product) => `
  <section class="commerce-section details-section" id="details">
    <div class="details-copy">
      <p class="commerce-eyebrow">Device details</p>
      <h2>Know what you’re choosing</h2>
      <p>These model-level details help you compare. Storage, SIM configuration, colour and condition must still be confirmed for the exact unit.</p>
      <div class="spec-grid">
        <article><span>Display</span><strong>${escapeHtml(product.specifications.display)}</strong></article>
        <article><span>Camera</span><strong>${escapeHtml(product.specifications.camera)}</strong></article>
        <article><span>Processor</span><strong>${escapeHtml(product.specifications.processor)}</strong></article>
        <article><span>Network</span><strong>${escapeHtml(product.specifications.network)}</strong></article>
        <article><span>Security</span><strong>${escapeHtml(product.specifications.security)}</strong></article>
        <article><span>SIM options</span><strong>${escapeHtml(product.specifications.sim)}</strong></article>
      </div>
    </div>
    <aside class="condition-panel">
      <p class="commerce-eyebrow">Condition guide</p>
      <article><span>01</span><div><h3>Brand New</h3><p>Unused device in original or new packaging where applicable. Ask what comes in the box.</p></div></article>
      <article><span>02</span><div><h3>UK Used</h3><p>Imported used device. Request photos, exact condition and battery information before payment.</p></div></article>
      <article><span>03</span><div><h3>Nigerian Used</h3><p>Locally used and inspected device where available. Ask for repair history and the checks completed.</p></div></article>
    </aside>
  </section>`;

const renderCalculator = (product) => `
  <section class="commerce-section calculator-section" id="calculator">
    <div class="calculator-copy">
      <p class="commerce-eyebrow">Easy Buy estimate</p>
      <h2>Plan the initial payment before you apply</h2>
      <p>Where a supplied guide price exists, the calculator starts with it. You can replace it with the current price Mikee Gadget Plug confirms.</p>
      <ul>
        <li>40% initial-deposit estimate</li>
        <li>Balance factor: ×1.2 for one month, ×1.4 for two, ×1.6 for three</li>
        <li>Final eligibility, price, dates and terms are confirmed by Mikee Gadget Plug</li>
      </ul>
    </div>
    <form class="mini-calculator" data-easy-buy-calculator>
      <label>
        <span>Phone price</span>
        <div class="money-input"><b>₦</b><input type="text" inputmode="numeric" data-calculator-price placeholder="Enter confirmed price"></div>
      </label>
      <label>
        <span>Payment duration</span>
        <select data-calculator-duration><option value="1">1 month</option><option value="2">2 months</option><option value="3">3 months</option></select>
      </label>
      <div class="calculator-results">
        <article><span>Initial payment (40%)</span><strong data-calculator-deposit>Enter a price</strong></article>
        <article><span>Estimated monthly payment</span><strong data-calculator-payment>Enter a price</strong></article>
        <article><span>Estimated total after deposit</span><strong data-calculator-total>Enter a price</strong></article>
      </div>
      <a class="commerce-button commerce-button-dark" data-calculator-whatsapp href="${whatsappHref(productMessage(product, product.defaultStorage, "easyBuy"))}" target="_blank" rel="noopener">Apply for Easy Buy</a>
      <small>This calculator is a planning estimate, not an offer or approval.</small>
    </form>
  </section>`;

const renderSwapAndCommunity = (product) => `
  <section class="commerce-section split-conversion">
    <article class="swap-card">
      <span class="conversion-icon">↻</span>
      <p class="commerce-eyebrow">Swap and upgrade</p>
      <h2>Have an old phone?</h2>
      <p>Send the model, storage, condition, battery information and clear photos. Mikee Gadget Plug will explain the inspection and valuation process.</p>
      <a class="commerce-button commerce-button-primary" data-action="swap" href="${whatsappHref(productMessage(product, product.defaultStorage, "swap"))}" target="_blank" rel="noopener">Get a Swap Quote on WhatsApp</a>
    </article>
    <article class="community-card">
      <span class="conversion-icon">WA</span>
      <p class="commerce-eyebrow">Not ready to buy yet?</p>
      <h2>Join our WhatsApp Gadget Community</h2>
      <p>Get new arrivals, flash sales, UK-used deals, price drops, swap offers, Easy Buy updates, accessories and limited-stock alerts.</p>
      <a class="commerce-button commerce-button-light" href="${escapeHtml(communityHref)}" target="_blank" rel="noopener">${commerceSite.communityUrl ? "Join Our WhatsApp Gadget Group" : "Request the WhatsApp Group Link"}</a>
    </article>
  </section>`;

const relatedProducts = (product) => {
  const sameBrand = products.filter((item) => item.brand === product.brand);
  const index = sameBrand.findIndex((item) => item.slug === product.slug);
  const candidates = [
    sameBrand[index - 2],
    sameBrand[index - 1],
    sameBrand[index + 1],
    sameBrand[index + 2],
    sameBrand[index + 3]
  ].filter(Boolean);
  return [...new Map(candidates.map((item) => [item.slug, item])).values()].slice(0, 5);
};

const renderRelated = (product) => {
  const related = relatedProducts(product);
  return `
    <section class="commerce-section related-section">
      <div class="section-heading-row">
        <div><p class="commerce-eyebrow">Compare other phones</p><h2>Keep your options open</h2></div>
        <p>Move down for a lower-cost starting point or up for a more powerful model.</p>
      </div>
      <div class="related-grid">
        ${related.map((item, index) => `
          <a href="${item.route}">
            <span>${index < 2 ? "Looking for something cheaper?" : "Want something more powerful?"}</span>
            <strong>${escapeHtml(item.model)}</strong>
            <small>${escapeHtml(item.variants.map((variant) => variant.storage).join(" · "))}</small>
          </a>`).join("")}
      </div>
    </section>`;
};

const renderAccessories = () => `
  <section class="commerce-section accessory-section">
    <div class="section-heading-row">
      <div><p class="commerce-eyebrow">Complete your setup</p><h2>Add only what you need</h2></div>
      <p>Accessory prices and availability are confirmed separately so the phone remains the main decision.</p>
    </div>
    <div class="accessory-grid">
      ${accessories.map((item, index) => `
        <article><span>${String(index + 1).padStart(2, "0")}</span><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.detail)}</p></article>`).join("")}
    </div>
  </section>`;

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
        <details ${index === 0 ? "open" : ""}>
          <summary>${escapeHtml(faq.question)}<span>+</span></summary>
          <p>${escapeHtml(faq.answer)}</p>
        </details>`).join("")}
    </div>
  </section>`;

const renderFooter = () => `
  <footer class="commerce-footer">
    <div class="footer-intro">
      <a class="commerce-brand commerce-brand-footer" href="/">
        <span class="commerce-brand-mark" aria-hidden="true">F</span>
        <span><strong>MIKEE</strong><small>Gadget Plug</small></span>
      </a>
      <p>Model-specific phone pages built to help Nigerian buyers choose, confirm and order the exact device they want.</p>
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
  <link rel="stylesheet" href="/assets/commerce.css">
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
        <h1>Buy ${escapeHtml(product.model)} in Nigeria</h1>
        <p class="product-lead">${escapeHtml(product.description)}</p>
        <div class="hero-fact-row">
          <span><strong>Storage</strong>${escapeHtml(product.variants.map((variant) => variant.storage).join(" · "))}</span>
          <span><strong>Delivery</strong>Lagos & nationwide</span>
          <span><strong>Payment</strong>Outright or Easy Buy</span>
        </div>
        ${renderVariantSelector(product)}
      </div>
    </section>
    ${renderVariantCards(product)}
    ${renderPaymentPaths(product)}
    ${renderTrust()}
    ${renderDetails(product)}
    ${renderCalculator(product)}
    ${renderSwapAndCommunity(product)}
    ${renderRelated(product)}
    ${renderAccessories()}
    ${renderDelivery()}
    <section class="commerce-section seo-copy">
      <p class="commerce-eyebrow">${escapeHtml(product.model)} price in Nigeria</p>
      <h2>What changes the price of ${escapeHtml(product.model)}?</h2>
      <p>The current price depends on storage, condition, colour, exchange-rate movement and the exact unit available. Supplied guide prices are shown on this page where Mikee Gadget Plug has provided them. Select your preferred storage, then request today’s final price and availability before paying.</p>
      <div class="seo-variant-list">${product.variants.map((variant) => `<span>${escapeHtml(product.model)} ${escapeHtml(variant.storage)} — ${variant.price ? formatNaira(variant.price) : "price on request"}</span>`).join("")}</div>
    </section>
    ${renderFaq(faqs)}
  </main>
  ${renderFooter()}
  <div class="mobile-purchase-bar" aria-label="Quick purchase actions">
    <a data-action="price" href="${whatsappHref(productMessage(product, product.defaultStorage, "price"))}" target="_blank" rel="noopener"><span>WA</span>WhatsApp</a>
    <a data-action="buy" href="${whatsappHref(productMessage(product))}" target="_blank" rel="noopener"><span>₦</span>Buy Now</a>
    <a data-action="easyBuy" href="${whatsappHref(productMessage(product, product.defaultStorage, "easyBuy"))}" target="_blank" rel="noopener"><span>↗</span>Easy Buy</a>
  </div>
  <script type="application/json" id="product-data">${escapeJson(productData)}</script>
  <script type="module" src="/assets/commerce.js"></script>
  <script src="/assets/landing-page.js" defer></script>
</body>
</html>`;
};

const minimumKnownPrice = (product) => {
  const prices = product.variants.map((variant) => variant.price).filter(Number.isFinite);
  return prices.length ? Math.min(...prices) : Number.POSITIVE_INFINITY;
};

const categoryProducts = (category) => {
  let matches = category.contentOnly ? [] : [...products];
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
        ${product.images.length
          ? `<img src="${product.images[0]}" alt="${escapeHtml(product.model)}" loading="lazy">`
          : `<span class="catalog-card-placeholder"><i>${escapeHtml(product.brand)}</i><strong>${escapeHtml(product.model)}</strong></span>`}
      </a>
      <div>
        <span class="catalog-brand">${escapeHtml(product.brand)}</span>
        <h2><a href="${product.route}">${escapeHtml(product.model)}</a></h2>
        <p>${escapeHtml(product.variants.map((variant) => variant.storage).join(" · "))}</p>
        <strong>${Number.isFinite(minPrice) ? `From supplied guide price ${formatNaira(minPrice)}` : "Request today’s price"}</strong>
        <div><a href="${product.route}">View phone</a><a href="${whatsappHref(productMessage(product, product.defaultStorage, "price"))}" target="_blank" rel="noopener">Ask on WhatsApp</a></div>
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
  <link rel="stylesheet" href="/assets/commerce.css">
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
        <p>No fake stock count. No assumed warranty. Missing prices are clearly marked for confirmation.</p>
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
</body>
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
  ...products.map((product) => ({
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
    categories: categoryPages.map((category) => category.route)
  }, null, 2)}\n`,
  "utf8"
);

const fixedRoutes = [
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
    ...categoryPages.map((category) => category.route)
  ])
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapRoutes.map((route) => `  <url><loc>${commerceSite.baseUrl}${route}</loc></url>`).join("\n")}
</urlset>
`;
await writeFile(join(root, "sitemap.xml"), sitemap, "utf8");

console.log(`Generated ${products.length} product pages and ${categoryPages.length} commerce category pages.`);
