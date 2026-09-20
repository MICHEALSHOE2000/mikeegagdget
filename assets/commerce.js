import {activateImages} from './storefront-ui.mjs';
activateImages();
import { calculatePlan } from "../easy-buy/easy-buy-core.mjs";

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

if (productDataElement) {
  const product = JSON.parse(productDataElement.textContent);
  const storageButtons = [...document.querySelectorAll("[data-storage]")];
  const variantButtons = [...document.querySelectorAll("[data-select-variant]")];
  const colorSelect = document.querySelector("[data-color-select]");
  const conditionSelect = document.querySelector("[data-condition-select]");
  const variantLabel = document.querySelector("[data-variant-label]");
  const productPrice = document.querySelector("[data-product-price]");
  const priceNote = document.querySelector("[data-price-note]");
  const priceInput = document.querySelector("[data-calculator-price]");
  const durationSelect = document.querySelector("[data-calculator-duration]");
  const depositOutput = document.querySelector("[data-calculator-deposit]");
  const paymentOutput = document.querySelector("[data-calculator-payment]");
  const totalOutput = document.querySelector("[data-calculator-total]");
  const calculatorWhatsapp = document.querySelector("[data-calculator-whatsapp]");
  let selectedStorage = product.defaultStorage;

  const selectedVariant = () =>
    product.variants.find((variant) => variant.storage === selectedStorage) || product.variants[0];

  const selectedColor = () => colorSelect?.value || "Confirm available colour";
  const selectedCondition = () => conditionSelect?.value || "Confirm available condition";

  function messageFor(intent) {
    const name = `${product.model} ${selectedStorage}`.trim();
    const context = `Preferred colour: ${selectedColor()}. Condition: ${selectedCondition()}.`;
    const messages = {
      buy: `Hello, I'm interested in the ${name}. ${context} Is it currently available? Please confirm today’s price, warranty terms and delivery options.`,
      price: `Hello, please confirm today’s price and availability for the ${name}. ${context} Please also send the warranty terms and delivery options.`,
      easyBuy: `Hello, I'm interested in getting the ${name} through Easy Buy. ${context} Please send me the deposit, payment options, eligibility requirements and complete terms.`,
      swap: `Hello, I want to swap my current phone for a ${name}. ${context} How can I get a valuation?`
    };
    return messages[intent] || messages.buy;
  }

  function updateActionLinks() {
    document.querySelectorAll("[data-action]").forEach((link) => {
      if (['swap', 'easyBuy', 'buy'].includes(link.dataset.action)) {
        const variant=product.variants.find(v=>v.storage===selectedStorage), price=variant?.price;
        const q=new URLSearchParams({phone:`${product.slug}|${selectedStorage}`,condition:selectedCondition(),color:selectedColor()});
        if(link.dataset.action==='buy') {link.href=whatsappHref(product.whatsappNumber,`${messageFor('buy')}\nListed price: ${price?naira.format(price):'Please confirm'}${variant?.offerId?' (20% promotion)':''}`);link.textContent=price?`BUY — ${naira.format(price)}`:'ASK FOR PRICE';}
        if(link.dataset.action==='easyBuy'){link.href=`/easybuy/?${q}`;link.textContent=price?`EASYBUY — FROM ${naira.format(Math.round(price*.4))} TODAY`:'EASYBUY — CONFIRM PRICE';}
        if(link.dataset.action==='swap'){q.set('target',q.get('phone'));link.href=`/swap/?${q}`;link.textContent='SWAP — SEE WHAT YOU’LL ADD';}
        if(!price && link.dataset.action!=='buy'){link.href=whatsappHref(product.whatsappNumber,messageFor(link.dataset.action));link.textContent=link.dataset.action==='easyBuy'?'ASK ABOUT EASYBUY':'ASK ABOUT A SWAP';}
        link.removeAttribute('target');

      } else {
        link.href = whatsappHref(product.whatsappNumber, messageFor(link.dataset.action));
      }
    });
  }

  function numericPrice() {
    return Number((priceInput?.value || "").replace(/[^0-9]/g, "")) || 0;
  }

  function updateCalculator() {
    if (!priceInput || !durationSelect) return;
    const price = numericPrice();
    if (!price) {
      depositOutput.textContent = "Enter a price";
      paymentOutput.textContent = "Enter a price";
      totalOutput.textContent = "Enter a price";
      calculatorWhatsapp.href = whatsappHref(product.whatsappNumber, messageFor("easyBuy"));
      return;
    }

    const duration = Number(durationSelect.value);
    const plan = calculatePlan({ price, duration, series: Number(product.model.match(/iPhone (\d+)/)?.[1]) });
    const deposit = plan.deposit;
    const totalAfterDeposit = plan.balanceRepayment;
    const monthlyPayment = plan.installment;
    depositOutput.textContent = naira.format(deposit);
    paymentOutput.textContent = naira.format(monthlyPayment);
    totalOutput.textContent = naira.format(totalAfterDeposit);

    const message = [
      "Hello Mikee Gadget Plug, I want to apply for Easy Buy.",
      `Phone: ${product.model} ${selectedStorage}`,
      `Preferred colour: ${selectedColor()}`,
      `Condition: ${selectedCondition()}`,
      `Price used for estimate: ${naira.format(price)}`,
      `Initial payment estimate: ${naira.format(deposit)} (40%)`,
      `Duration: ${duration} month${duration === 1 ? "" : "s"}`,
      `Estimated monthly payment: ${naira.format(monthlyPayment)}`,
      `Estimated total after deposit: ${naira.format(totalAfterDeposit)}`,
      "Please confirm the current phone price, stock, eligibility, exact due dates and complete terms before I pay."
    ].join("\n");
    calculatorWhatsapp.href = whatsappHref(product.whatsappNumber, message);
  }

  function updateSelection(storage, updateUrl = true) {
    const variant = product.variants.find((item) => item.storage === storage);
    if (!variant) return;
    selectedStorage = variant.storage;

    storageButtons.forEach((button) => {
      const active = button.dataset.storage === selectedStorage;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    variantButtons.forEach((button) => {
      button.textContent = button.dataset.selectVariant === selectedStorage
        ? `Selected ${selectedStorage}`
        : `Choose ${button.dataset.selectVariant}`;
    });

    if (variantLabel) variantLabel.textContent = `${product.model} ${selectedStorage}`;
    if (productPrice) productPrice.textContent = variant.price ? naira.format(variant.price) : "Confirm price";
    if (priceNote) {
      priceNote.textContent = variant.priceNeedsExtraConfirmation
        ? "This supplied guide price needs extra confirmation. Ask Mikee Gadget Plug for today’s exact price before planning."
        : variant.price
          ? (variant.offerId ? `20% off ${naira.format(variant.regularPrice)}. Confirm the exact unit before payment.` : "Confirm today’s price, condition and stock before payment.")
          : "No price was supplied for this variant. Request today’s exact price before payment.";
    }

    if (priceInput) {
      priceInput.value = variant.price ? plainNumber.format(variant.price) : "";
    }

    updateActionLinks();
    updateCalculator();

    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set("storage", selectedStorage);
      window.history.replaceState({}, "", url);
    }

    window.MikeeGadgetPlugTracking?.pushEvent("select_storage", {
      phone_model: product.model,
      product_name: `${product.model} ${selectedStorage}`,
      storage: selectedStorage,
      device_condition: selectedCondition(),
      lead_type: "price_availability"
    });
  }

  storageButtons.forEach((button) => {
    button.addEventListener("click", () => updateSelection(button.dataset.storage));
  });

  variantButtons.forEach((button) => {
    button.addEventListener("click", () => {
      updateSelection(button.dataset.selectVariant);
      document.querySelector("[data-purchase-panel]")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  colorSelect?.addEventListener("change", () => {
    updateActionLinks();
    updateCalculator();
  });

  conditionSelect?.addEventListener("change", () => {
    window.MikeeGadgetPlugTracking?.pushEvent("select_condition",{product_name:product.model,device_condition:selectedCondition()});
    updateActionLinks();
    updateCalculator();
  });

  priceInput?.addEventListener("input", updateCalculator);
  priceInput?.addEventListener("blur", () => {
    const price = numericPrice();
    priceInput.value = price ? plainNumber.format(price) : "";
  });
  durationSelect?.addEventListener("change", updateCalculator);

  const requestedStorage = new URL(window.location.href).searchParams.get("storage");
  updateSelection(
    product.variants.some((variant) => variant.storage === requestedStorage)
      ? requestedStorage
      : product.defaultStorage,
    false
  );
}
