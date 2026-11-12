import {addToCart} from '../commerce/cart.mjs';
import {financePlan} from '../commerce/upgrade-core.mjs';
import {financeMessage} from '../commerce/order-messages.mjs';
import {activateImages} from './storefront-ui.mjs';
activateImages();
import { calculatePlan } from "../easy-buy/easy-buy-core.mjs";
import {selectedCondition as conditionFor} from '../commerce/conditions.mjs';

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0
});

const plainNumber = new Intl.NumberFormat("en-NG");

const normalize = (value = "") => String(value)
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .trim();

const whatsappHref = (number, message) =>
  `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

const menuButton = document.querySelector(".commerce-menu-button");
const menu = document.querySelector(".commerce-menu");

if (menuButton && menu) {
  menuButton.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(open));
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });
}

const searchDialog = document.querySelector("[data-search-dialog]");
const searchOpenButtons = document.querySelectorAll("[data-search-open]");
let searchIndexPromise;

function loadSearchIndex() {
  if (!searchIndexPromise) {
    searchIndexPromise = fetch("/assets/catalog-search.json")
      .then((response) => {
        if (!response.ok) throw new Error("The phone search index could not be loaded.");
        return response.json();
      });
  }
  return searchIndexPromise;
}

function resultScore(item, term) {
  const label = normalize(item.label);
  const keywords = normalize(item.keywords.join(" "));
  const tokens = term.split(" ").filter(Boolean);
  if (!tokens.every((token) => keywords.includes(token))) return -1;

  let score = 0;
  if (label === term) score += 100;
  if (label.startsWith(term)) score += 55;
  if (label.includes(term)) score += 35;
  tokens.forEach((token) => {
    if (label.split(" ").includes(token)) score += 12;
    if (item.storage.some((storage) => normalize(storage) === token)) score += 18;
  });
  if (item.type === "product") score += 6;
  return score;
}

function matchedStorage(item, term) {
  return item.storage.find((storage) => term.includes(normalize(storage)))
    || item.storage.find((storage) => normalize(storage).includes(term))
    || null;
}

function renderSearchResults(input, container, index) {
  const term = normalize(input.value);
  const defaults = index.filter((item) => item.type === "product").slice(0, 8);
  const results = term
    ? index
      .map((item) => ({ item, score: resultScore(item, term) }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((entry) => entry.item)
    : defaults;

  if (!results.length) {
    container.innerHTML = '<p class="search-empty">No exact match found. Try a shorter model name such as “iPhone 11”, “S23” or “Pixel 8”.</p>';
    return;
  }

  container.innerHTML = results.map((item) => {
    const storage = matchedStorage(item, term);
    const route = storage
      ? `${item.route}?storage=${encodeURIComponent(storage)}`
      : item.route;
    const subtitle = storage
      ? `${storage} matches your search`
      : item.storage.length
        ? item.storage.join(" · ")
        : item.type === "category"
          ? "Browse this buying category"
          : "Storage to confirm";

    return `
      <a class="search-result-link" href="${route}">
        <span class="search-result-visual">
          ${item.image ? `<img src="${item.image}" alt="">` : item.brand.slice(0, 2).toUpperCase()}
        </span>
        <span class="search-result-copy">
          <strong>${item.label}</strong>
          <small>${subtitle}</small>
        </span>
        <span class="search-result-price">${item.price ? `From ${naira.format(item.price)}` : "Check price"}</span>
      </a>`;
  }).join("");
}

function activateSearch(root) {
  const input = root.querySelector("[data-catalog-search]");
  const results = root.querySelector("[data-catalog-results]");
  if (!input || !results) return;

  loadSearchIndex()
    .then((index) => {
      renderSearchResults(input, results, index);
      input.addEventListener("input", () => renderSearchResults(input, results, index));
    })
    .catch((error) => {
      results.innerHTML = `<p class="search-empty">${error.message} Use WhatsApp for help finding a phone.</p>`;
    });
}

if (searchDialog) {
  searchOpenButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!searchDialog.dataset.ready) { activateSearch(searchDialog); searchDialog.dataset.ready = 'true'; }
      searchDialog.showModal();
      window.requestAnimationFrame(() => searchDialog.querySelector("input")?.focus());
    });
  });

  searchDialog.addEventListener("click", (event) => {
    if (event.target === searchDialog) searchDialog.close();
  });
}

document.querySelectorAll("[data-catalog-search]:not([data-search-dialog] [data-catalog-search])").forEach((input) => {
  const root = input.closest("[data-search-root]") || input.parentElement?.parentElement;
  if (root) activateSearch(root);
});

const categoryFilter = document.querySelector("[data-category-filter]");
const categoryCards = [...document.querySelectorAll("[data-catalog-card]")];
const emptyCatalogue = document.querySelector("[data-empty-catalogue]");

if (categoryFilter && categoryCards.length) {
  categoryFilter.addEventListener("input", () => {
    const term = normalize(categoryFilter.value);
    let visible = 0;
    categoryCards.forEach((card) => {
      const matches = !term || normalize(card.dataset.searchValue).includes(term);
      card.hidden = !matches;
      if (matches) visible += 1;
    });
    if (emptyCatalogue) emptyCatalogue.hidden = visible > 0;
  });
}

document.querySelectorAll("[data-gallery-image]").forEach((button) => {
  button.addEventListener("click", () => {
    const gallery = button.closest("[data-product-gallery]");
    const mainImage = gallery?.querySelector("[data-main-image]");
    if (!gallery || !mainImage) return;
    mainImage.closest('.device-media')?.classList.add('is-loading');
    mainImage.removeAttribute('srcset');
    mainImage.src = button.dataset.galleryImage;
    gallery.querySelectorAll("[data-gallery-image]").forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });
  });
});

const productDataElement = document.querySelector("#product-data");

if (productDataElement) { const {mountProductSelection}=await import('./product-selection.js'); await mountProductSelection(JSON.parse(productDataElement.textContent)); }
