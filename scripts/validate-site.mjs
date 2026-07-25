import { access, readFile, readdir } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { landingPages, site } from "../landing-pages/config.mjs";
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

const coreRoutes = [
  "/about",
  "/android-phones",
  "/contact",
  "/laptops",
  "/phone-swap",
  "/reviews"
];
for (const route of coreRoutes) {
  assert(sitemap.includes(`<loc>${site.baseUrl}${route}</loc>`), `${route}: route is missing from sitemap.xml.`);
}

const homepage = await readFile(join(root, "index.html"), "utf8");
assert(count(homepage, /<h1(?:\s|>)/g) === 1, "Homepage must contain exactly one H1.");
assert(homepage.includes("buy outright, pay small-small or swap your current phone"), "Homepage hero must explain all three buying paths.");
assert(homepage.includes("40% initial deposit"), "Homepage must make the verified Easy Buy deposit visible.");
assert(homepage.includes('id="swapForm"'), "Homepage phone-swap form is missing.");
assert(homepage.includes(site.address), "Homepage physical-store address is missing.");
assert(homepage.includes(`wa.me/${site.whatsappNumber}`), "Homepage correct WhatsApp number is missing.");
assert(homepage.includes(`tel:${site.telephoneHref}`), "Homepage correct telephone link is missing.");

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

const homepageScript = await readFile(join(root, "script.js"), "utf8");
const phoneSwapScript = await readFile(join(root, "assets", "phone-swap.js"), "utf8");
assert(homepageScript.includes('"begin_phone_swap"'), "Homepage phone-swap tracking event is missing.");
assert(phoneSwapScript.includes('"begin_phone_swap"'), "Dedicated phone-swap tracking event is missing.");

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
