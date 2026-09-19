import { access, readFile, readdir } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { landingPages, site } from "../landing-pages/config.mjs";
import { categoryPages, commerceSite, products } from "../commerce/catalog.mjs";
import { shopCategories } from "../commerce/storefront-data.mjs";
import { allowedFrequencies, calculatePlan, DEPOSIT_RATE } from "../easy-buy/easy-buy-core.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

const count = (source, pattern) => (source.match(pattern) || []).length;
const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const htmlFiles = [];
async function collectHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      await collectHtml(fullPath);
    } else if (entry.name.endsWith(".html")) {
      htmlFiles.push(fullPath);
    }
  }
}

assert(landingPages.length === 23, `Expected 23 landing pages, found ${landingPages.length}.`);
assert(new Set(landingPages.map((page) => page.route)).size === landingPages.length, "Landing-page routes must be unique.");
assert(new Set(landingPages.map((page) => page.adGroupId)).size === landingPages.length, "Ad-group IDs must be unique.");
assert(new Set(landingPages.map((page) => page.seoTitle)).size === landingPages.length, "SEO titles must be unique.");
assert(new Set(landingPages.map((page) => page.metaDescription)).size === landingPages.length, "Meta descriptions must be unique.");
assert(new Set(landingPages.map((page) => page.h1)).size === landingPages.length, "H1 values must be unique.");

const monthlyIphone11 = calculatePlan({ price: 230000, duration: 1, frequency: "monthly", series: 11 });
assert(monthlyIphone11.depositRate === DEPOSIT_RATE, "Easy Buy must use a 40% initial deposit.");
assert(monthlyIphone11.deposit === 92000, "Easy Buy 40% deposit calculation is incorrect.");
assert(monthlyIphone11.balance === 138000, "Easy Buy remaining-balance calculation is incorrect.");
assert(monthlyIphone11.installment === 165600, "Easy Buy monthly instalment calculation is incorrect.");
assert(allowedFrequencies(11).join(",") === "monthly,weekly,biweekly", "iPhone 11 must offer monthly, weekly and bi-weekly schedules.");
assert(allowedFrequencies(12).join(",") === "monthly,weekly,biweekly", "iPhone 12 must offer monthly, weekly and bi-weekly schedules.");
assert(allowedFrequencies(13).join(",") === "monthly", "Models above iPhone 12 must only offer monthly repayment.");
try {
  calculatePlan({ price: 380000, duration: 1, frequency: "weekly", series: 13 });
  errors.push("Weekly repayment must be rejected for iPhone 13.");
} catch (error) {
  assert(error instanceof RangeError, "Invalid Easy Buy schedules must raise a RangeError.");
}

for (const page of landingPages) {
  const filePath = join(root, page.route.slice(1), "index.html");
  let html = "";
  try {
    html = await readFile(filePath, "utf8");
  } catch {
    errors.push(`${page.adGroupId}: generated HTML is missing at ${page.route}.`);
    continue;
  }

  assert(count(html, /<h1(?:\s|>)/g) === 1, `${page.adGroupId}: page must contain exactly one H1.`);
  assert(html.includes(`<h1>${escapeHtml(page.h1)}</h1>`), `${page.adGroupId}: H1 does not match the configuration.`);
  assert(html.includes(`<title>${escapeHtml(page.seoTitle)}</title>`), `${page.adGroupId}: SEO title does not match.`);
  assert(html.includes(`content="${escapeHtml(page.metaDescription)}"`), `${page.adGroupId}: meta description does not match.`);
  assert(html.includes(`rel="canonical" href="${site.baseUrl}${page.route}"`), `${page.adGroupId}: canonical URL is incorrect.`);
  assert(html.includes(`property="og:title"`), `${page.adGroupId}: Open Graph title is missing.`);
  assert(html.includes(`property="og:description"`), `${page.adGroupId}: Open Graph description is missing.`);
  assert(html.includes(`"@type":"BreadcrumbList"`), `${page.adGroupId}: BreadcrumbList schema is missing.`);
  assert(html.includes(`"@type":"FAQPage"`), `${page.adGroupId}: FAQPage schema is missing.`);
  assert(count(html, /<details(?:\s|>)/g) >= 4 && count(html, /<details(?:\s|>)/g) <= 6, `${page.adGroupId}: expected four to six visible FAQs.`);
  assert(html.includes(`wa.me/${site.whatsappNumber}`), `${page.adGroupId}: correct WhatsApp number is missing.`);
  const trackedWhatsAppLinks = [...html.matchAll(/<a[^>]*data-track="whatsapp"[^>]*href="([^"]+)"/g)].map((match) => match[1]);
  assert(trackedWhatsAppLinks.length >= 4, `${page.adGroupId}: expected WhatsApp entry points are missing.`);
  assert(trackedWhatsAppLinks.every((href) => href.includes(`wa.me/${site.whatsappNumber}?text=`)), `${page.adGroupId}: every tracked WhatsApp link must use the model-specific prefilled message.`);
  assert(html.includes(`tel:${site.telephoneHref}`), `${page.adGroupId}: correct telephone link is missing.`);
  assert(html.includes(`data-ad-group-id="${page.adGroupId}"`), `${page.adGroupId}: tracking context is missing.`);
  assert(!/data-select-phone="(?:true|false)\s+href=/.test(html), `${page.adGroupId}: malformed data-select-phone attribute is present.`);
  assert(!html.includes("2348039248231"), `${page.adGroupId}: old phone number is present.`);
  assert(!html.includes("formxcommunication.netlify.app"), `${page.adGroupId}: old canonical domain is present.`);
  assert(!/\b(?:10k\+|4\.9|free shipping|24\/7|quality guaranteed|verified buyer)\b/i.test(html), `${page.adGroupId}: an unverified claim is present.`);

  const imagePath = join(root, page.heroImage.replace(/^\//, ""));
  try {
    await access(imagePath);
  } catch {
    errors.push(`${page.adGroupId}: hero image is missing: ${page.heroImage}.`);
  }
}

assert(products.length >= 40, `Expected at least 40 reusable product pages, found ${products.length}.`);
assert(categoryPages.length >= 11, `Expected at least 11 commerce category pages, found ${categoryPages.length}.`);
assert(new Set(products.map((product) => product.slug)).size === products.length, "Product slugs must be unique.");
assert(new Set(products.map((product) => product.seoTitle)).size === products.length, "Product SEO titles must be unique.");
assert(new Set(products.map((product) => product.metaDescription)).size === products.length, "Product meta descriptions must be unique.");
assert(new Set(categoryPages.map((category) => category.route)).size === categoryPages.length, "Commerce category routes must be unique.");

for (const product of products) {
  const filePath = join(root, product.slug, "index.html");
  let html = "";
  try {
    html = await readFile(filePath, "utf8");
  } catch {
    errors.push(`${product.slug}: generated product page is missing.`);
    continue;
  }

  assert(count(html, /<h1(?:\s|>)/g) === 1, `${product.slug}: product page must contain exactly one H1.`);
  assert(html.includes(`<h1>${escapeHtml(product.model)}</h1>`), `${product.slug}: model-specific H1 is missing.`);
  assert(html.includes(`<title>${escapeHtml(product.seoTitle)}</title>`), `${product.slug}: SEO title does not match product data.`);
  assert(html.includes(`content="${escapeHtml(product.metaDescription)}"`), `${product.slug}: product meta description does not match.`);
  assert(html.includes(`rel="canonical" href="${commerceSite.baseUrl}${product.route}"`), `${product.slug}: canonical URL is incorrect.`);
  assert(html.includes(`property="og:title"`), `${product.slug}: Open Graph title is missing.`);
  assert(html.includes(`"@type":"Product"`), `${product.slug}: Product schema is missing.`);
  assert(html.includes(`"@type":"BreadcrumbList"`), `${product.slug}: Breadcrumb schema is missing.`);
  assert(html.includes(`"@type":"FAQPage"`), `${product.slug}: FAQ schema is missing.`);
  assert(html.includes(`class="mobile-purchase-bar"`), `${product.slug}: sticky mobile purchase bar is missing.`);
  assert(html.includes(`data-action="buy"`), `${product.slug}: outright purchase path is missing.`);
  assert(html.includes(`data-action="easyBuy"`), `${product.slug}: Easy Buy purchase path is missing.`);
  assert(html.includes(`data-action="swap"`), `${product.slug}: swap enquiry path is missing.`);
  assert(html.includes(`wa.me/${commerceSite.whatsappNumber}?text=`), `${product.slug}: prefilled WhatsApp link is missing.`);
  assert(count(html, /data-storage="/g) === product.variants.length, `${product.slug}: rendered storage selector does not match product data.`);
  assert(count(html, /data-variant-card="/g) === product.variants.length, `${product.slug}: rendered variant cards do not match product data.`);
  assert(count(html, /<details class="product-faq"/g) === 7, `${product.slug}: expected seven product FAQs.`);
  assert(!html.includes("InStock"), `${product.slug}: schema must not invent a stock availability claim.`);
  assert(!html.includes("aggregateRating"), `${product.slug}: page must not invent product reviews or ratings.`);
}

for (const category of categoryPages) {
  const filePath = join(root, category.route.slice(1), "index.html");
  let html = "";
  try {
    html = await readFile(filePath, "utf8");
  } catch {
    errors.push(`${category.route}: generated commerce category page is missing.`);
    continue;
  }

  assert(count(html, /<h1(?:\s|>)/g) === 1, `${category.route}: category page must contain exactly one H1.`);
  assert(html.includes(`<h1>${category.swap ? "Know what to add." : escapeHtml(category.h1)}</h1>`), `${category.route}: category H1 does not match configuration.`);
  assert(html.includes(`<title>${escapeHtml(category.title)}</title>`), `${category.route}: category SEO title does not match.`);
  assert(html.includes(`rel="canonical" href="${commerceSite.baseUrl}${category.route}"`), `${category.route}: category canonical URL is incorrect.`);
  assert(html.includes(`wa.me/${commerceSite.whatsappNumber}?text=`), `${category.route}: category WhatsApp path is missing.`);
}

const mapping = JSON.parse(await readFile(join(root, "landing-pages", "ad-group-map.json"), "utf8"));
assert(mapping.length === landingPages.length, "Ad-group mapping row count does not match the landing-page count.");
for (const page of landingPages) {
  const row = mapping.find((item) => item.ad_group_id === page.adGroupId);
  assert(Boolean(row), `${page.adGroupId}: missing from the ad-group mapping file.`);
  if (row) {
    assert(row.final_landing_page_url === `${site.baseUrl}${page.route}`, `${page.adGroupId}: mapping final URL is incorrect.`);
    assert(row.conversion_event_name === page.conversionEventName, `${page.adGroupId}: mapping conversion event is incorrect.`);
  }
}

const sitemap = await readFile(join(root, "sitemap.xml"), "utf8");
for (const page of landingPages) {
  assert(sitemap.includes(`<loc>${site.baseUrl}${page.route}</loc>`), `${page.adGroupId}: route is missing from sitemap.xml.`);
}
for (const product of products) {
  assert(sitemap.includes(`<loc>${commerceSite.baseUrl}${product.route}</loc>`), `${product.slug}: product route is missing from sitemap.xml.`);
}
for (const category of categoryPages) {
  assert(sitemap.includes(`<loc>${commerceSite.baseUrl}${category.route}</loc>`), `${category.route}: category route is missing from sitemap.xml.`);
}

const routeManifest = JSON.parse(await readFile(join(root, "commerce", "route-manifest.json"), "utf8"));
for (const category of shopCategories) {
  const html = await readFile(join(root, category.route, "index.html"), "utf8");
  const url = `${commerceSite.baseUrl}${category.route}`;
  assert(sitemap.includes(`<loc>${url}</loc>`), `${category.route}: shop route is missing from sitemap.xml.`);
  assert(routeManifest.categories.includes(category.route), `${category.route}: shop route is missing from the route manifest.`);
  assert(html.includes(`data-landing-page="${category.route}" data-page-type="category"`), `${category.route}: analytics must use the category route.`);
  assert(html.includes(`<meta property="og:url" content="${url}">`), `${category.route}: sharing URL must match the category.`);
  assert(html.includes(`<link rel="canonical" href="${url}" />`), `${category.route}: incorrect canonical URL.`);
  for (const property of ["og:title", "og:description"]) {
    const content = html.match(new RegExp(`<meta property="${property}" content="([^"]+)"`))?.[1];
    assert(content?.includes(category.name), `${category.route}: ${property} must describe the category.`);
  }
  assert(html.includes(`<meta property="og:image" content="${commerceSite.baseUrl}${category.image}">`), `${category.route}: sharing image must be an absolute category image URL.`);
}

const catalogSearch = JSON.parse(await readFile(join(root, "assets", "catalog-search.json"), "utf8"));
for (const product of products) {
  const row = catalogSearch.find((item) => item.route === product.route);
  assert(Boolean(row), `${product.slug}: product is missing from the search index.`);
  if (row) {
    for (const variant of product.variants) {
      assert(row.storage.includes(variant.storage), `${product.slug}: ${variant.storage} is missing from search data.`);
    }
  }
}

const tracking = await readFile(join(root, "assets", "landing-page.js"), "utf8");
[
  "view_landing_page",
  "view_product",
  "select_phone",
  "click_whatsapp",
  "click_call",
  "click_directions",
  "begin_easy_buy_application",
  "submit_lead"
].forEach((eventName) => {
  assert(tracking.includes(`"${eventName}"`), `Tracking event ${eventName} is missing.`);
});
["gclid", "wbraid", "gbraid", "utm_source", "utm_campaign", "utm_term"].forEach((parameter) => {
  assert(tracking.includes(`"${parameter}"`), `Attribution parameter ${parameter} is not preserved.`);
});

await collectHtml(root);
for (const filePath of htmlFiles) {
  const html = await readFile(filePath, "utf8");
  const relative = filePath.replace(`${root}/`, "");
  assert(!html.includes("2348039248231"), `${relative}: old phone number is present.`);
  assert(!html.includes("0803 924 8231"), `${relative}: old display phone number is present.`);
  assert(!/\b(?:10k\+|4\.9|free shipping nationwide|24\/7 customer support|quality guaranteed|verified buyer)\b/i.test(html), `${relative}: an unverified claim is present.`);

  const references = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  for (const reference of references) {
    if (
      !reference
      || reference.startsWith("#")
      || reference.startsWith("data:")
      || reference.startsWith("tel:")
      || reference.startsWith("mailto:")
      || reference.startsWith("http://")
      || reference.startsWith("https://")
      || reference.startsWith("//")
    ) continue;

    const cleanReference = reference.split("#")[0].split("?")[0];
    if (!cleanReference) continue;
    let target = cleanReference.startsWith("/")
      ? join(root, cleanReference.replace(/^\/+/, ""))
      : join(dirname(filePath), cleanReference);
    if (!extname(target)) target = join(target, "index.html");

    try {
      await access(target);
    } catch {
      errors.push(`${relative}: broken local reference ${reference}.`);
    }
  }
}

if (errors.length) {
  console.error(`Validation failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Validated ${landingPages.length} landing pages, ${htmlFiles.length} HTML files and all required tracking events.`);
}
