import { allowedFrequencies, calculatePlan } from "./easy-buy-core.mjs";

const whatsappNumber = "2347086865133";

const easyBuyPhones = [
  { id: "iphone-11-64", model: "iPhone 11", storage: "64GB", price: 230000, series: 11, depositRate: 0.4, image: "../images/11-1.jpeg" },
  { id: "iphone-11-128", model: "iPhone 11", storage: "128GB", price: 280000, series: 11, depositRate: 0.4, image: "../images/11-1.jpeg" },
  { id: "iphone-11-pro-64", model: "iPhone 11 Pro", storage: "64GB", price: 275000, series: 11, depositRate: 0.4, image: "../images/11pro-1.jpeg" },
  { id: "iphone-11-pro-256", model: "iPhone 11 Pro", storage: "256GB", price: 315000, series: 11, depositRate: 0.4, image: "../images/11pro-1.jpeg" },
  { id: "iphone-11-pro-max-64", model: "iPhone 11 Pro Max", storage: "64GB", price: 320000, series: 11, depositRate: 0.4, image: "../images/11promax-1.jpeg" },
  { id: "iphone-11-pro-max-256", model: "iPhone 11 Pro Max", storage: "256GB", price: 355000, series: 11, depositRate: 0.4, image: "../images/11promax-1.jpeg" },
  { id: "iphone-12-64", model: "iPhone 12", storage: "64GB", price: 260000, series: 12, depositRate: 0.4, image: "../images/12.jpeg" },
  { id: "iphone-12-128", model: "iPhone 12", storage: "128GB", price: 295000, series: 12, depositRate: 0.4, image: "../images/12.jpeg" },
  { id: "iphone-12-pro-128", model: "iPhone 12 Pro", storage: "128GB", price: 365000, series: 12, depositRate: 0.4, image: "../images/12pro-1.jpeg" },
  { id: "iphone-12-pro-256", model: "iPhone 12 Pro", storage: "256GB", price: 395000, series: 12, depositRate: 0.4, image: "../images/12pro-1.jpeg" },
  { id: "iphone-12-pro-max-128", model: "iPhone 12 Pro Max", storage: "128GB", price: 430000, series: 12, depositRate: 0.4, image: "../images/12promax-1.jpeg" },
  { id: "iphone-12-pro-max-256", model: "iPhone 12 Pro Max", storage: "256GB", price: 490000, series: 12, depositRate: 0.4, image: "../images/12promax-1.jpeg" },
  { id: "iphone-13-128", model: "iPhone 13", storage: "128GB", price: 380000, series: 13, depositRate: 0.4, image: "../images/13-1.jpeg" },
  { id: "iphone-13-256", model: "iPhone 13", storage: "256GB", price: 410000, series: 13, depositRate: 0.4, image: "../images/13-1.jpeg" },
  { id: "iphone-13-pro-128", model: "iPhone 13 Pro", storage: "128GB", price: 500000, series: 13, depositRate: 0.4, image: "../images/13pro-1.jpeg" },
  { id: "iphone-13-pro-256", model: "iPhone 13 Pro", storage: "256GB", price: 530000, series: 13, depositRate: 0.4, image: "../images/13pro-1.jpeg" },
  { id: "iphone-14-128", model: "iPhone 14", storage: "128GB", price: 460000, series: 14, depositRate: 0.4, image: "../images/14-1.jpeg" },
  { id: "iphone-14-256", model: "iPhone 14", storage: "256GB", price: 520000, series: 14, depositRate: 0.4, image: "../images/14-1.jpeg" },
  { id: "iphone-14-pro-128", model: "iPhone 14 Pro", storage: "128GB", price: 640000, series: 14, depositRate: 0.4, image: "../images/14pro-1.jpeg" },
  { id: "iphone-14-pro-256", model: "iPhone 14 Pro", storage: "256GB", price: 700000, series: 14, depositRate: 0.4, image: "../images/14pro-1.jpeg" },
  { id: "iphone-14-pro-max-128", model: "iPhone 14 Pro Max", storage: "128GB", price: 770000, series: 14, depositRate: 0.4, image: "../images/14promax-1.jpeg" },
  { id: "iphone-14-pro-max-256", model: "iPhone 14 Pro Max", storage: "256GB", price: 835000, series: 14, depositRate: 0.4, image: "../images/14promax-1.jpeg" },
  { id: "iphone-15-128", model: "iPhone 15", storage: "128GB", price: 625000, series: 15, depositRate: 0.4, image: "../images/15-1.jpeg" },
  { id: "iphone-15-256", model: "iPhone 15", storage: "256GB", price: 670000, series: 15, depositRate: 0.4, image: "../images/15-1.jpeg" },
  { id: "iphone-15-pro-128", model: "iPhone 15 Pro", storage: "128GB", price: 800000, series: 15, depositRate: 0.4, image: "../images/15pro-1.jpeg" },
  { id: "iphone-15-pro-256", model: "iPhone 15 Pro", storage: "256GB", price: 840000, series: 15, depositRate: 0.4, image: "../images/15pro-1.jpeg" },
  { id: "iphone-15-pro-512", model: "iPhone 15 Pro", storage: "512GB", price: 510000, series: 15, depositRate: 0.4, image: "../images/15pro-1.jpeg", confirmPrice: true },
  { id: "iphone-16-128", model: "iPhone 16", storage: "128GB", price: 840000, series: 16, depositRate: 0.4, image: "../images/16-1.jpg" },
  { id: "iphone-16-256", model: "iPhone 16", storage: "256GB", price: 925000, series: 16, depositRate: 0.4, image: "../images/16-1.jpg" },
  { id: "iphone-16-512", model: "iPhone 16", storage: "512GB", price: 1000000, series: 16, depositRate: 0.4, image: "../images/16-1.jpg" },
  { id: "iphone-16-pro-128", model: "iPhone 16 Pro", storage: "128GB", price: 1030000, series: 16, depositRate: 0.4, image: "../images/16pro-1.jpg" },
  { id: "iphone-16-pro-256", model: "iPhone 16 Pro", storage: "256GB", price: 1160000, series: 16, depositRate: 0.4, image: "../images/16pro-1.jpg" },
  { id: "iphone-16-plus-128", model: "iPhone 16 Plus", storage: "128GB", price: 940000, series: 16, depositRate: 0.4, image: "../images/16plus-1.jpg" },
  { id: "iphone-17-air", model: "iPhone 17 Air", storage: "Storage to confirm", price: 1140000, series: 17, depositRate: 0.4, image: "../images/17air-1.jpg" }
];

const menuToggle = document.querySelector(".menu-toggle");
const navActions = document.querySelector(".nav-actions");

if (menuToggle && navActions) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navActions.classList.toggle("open");
    menuToggle.classList.toggle("open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navActions.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navActions.classList.remove("open");
      menuToggle.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const priceGrid = document.querySelector("#easyPriceGrid");
const priceSearch = document.querySelector("#priceSearch");
const priceResultCount = document.querySelector("#priceResultCount");
const modelSelect = document.querySelector("#iphoneModel");
const priceInput = document.querySelector("#phonePrice");
const frequencySelect = document.querySelector("#repaymentFrequency");
const durationInputs = [...document.querySelectorAll('input[name="duration"]')];
const depositRate = document.querySelector("#depositRate");
const downPayment = document.querySelector("#downPayment");
const remainingBalance = document.querySelector("#remainingBalance");
const durationFactor = document.querySelector("#durationFactor");
const planCost = document.querySelector("#planCost");
const financedTotal = document.querySelector("#financedTotal");
const repaymentAmount = document.querySelector("#repaymentAmount");
const paymentLabel = document.querySelector("#paymentLabel");
const paymentCount = document.querySelector("#paymentCount");
const frequencyHelp = document.querySelector("#frequencyHelp");
const weeklyOption = frequencySelect ? frequencySelect.querySelector('option[value="weekly"]') : null;
const biweeklyOption = frequencySelect ? frequencySelect.querySelector('option[value="biweekly"]') : null;
const monthlyOption = frequencySelect ? frequencySelect.querySelector('option[value="monthly"]') : null;
const calculatorWhatsapp = document.querySelector("#calculatorWhatsapp");
const selectedPhoneImage = document.querySelector("#selectedPhoneImage");
const selectedPhoneName = document.querySelector("#selectedPhoneName");
const selectedPhonePrice = document.querySelector("#selectedPhonePrice");

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0
});

const plainNumber = new Intl.NumberFormat("en-NG");

function phoneLabel(phone) {
  return phone.storage === "Storage to confirm"
    ? phone.model
    : `${phone.model} ${phone.storage}`;
}

function createPricePlaceholder(model) {
  const safeLabel = model.replace(/[<>&"']/g, "");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="500" height="650" viewBox="0 0 500 650">
      <defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#e8edf3"/><stop offset="1" stop-color="#bac5d2"/></linearGradient></defs>
      <rect width="500" height="650" fill="url(#bg)"/>
      <rect x="125" y="55" width="250" height="460" rx="48" fill="#111318"/>
      <rect x="145" y="78" width="210" height="414" rx="34" fill="#273142"/>
      <circle cx="204" cy="139" r="42" fill="#07090e"/><circle cx="296" cy="139" r="42" fill="#07090e"/>
      <circle cx="204" cy="229" r="42" fill="#07090e"/><circle cx="296" cy="229" r="18" fill="#d8b45a"/>
      <text x="250" y="580" text-anchor="middle" font-family="Arial, sans-serif" font-size="25" font-weight="700" fill="#111318">${safeLabel}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function renderPriceList() {
  if (!priceGrid) return;

  const term = priceSearch ? priceSearch.value.trim().toLowerCase() : "";
  const visiblePhones = easyBuyPhones.filter((phone) =>
    [phone.model, phone.storage, `iphone ${phone.series}`].join(" ").toLowerCase().includes(term)
  );

  if (priceResultCount) {
    priceResultCount.textContent = `${visiblePhones.length} phone price${visiblePhones.length === 1 ? "" : "s"} shown`;
  }

  priceGrid.innerHTML = "";

  if (!visiblePhones.length) {
    priceGrid.innerHTML = '<p class="empty-price-state">No listed phone matches that search. Try a model such as “iPhone 14” or a storage size such as “256GB”.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();

  visiblePhones.forEach((phone) => {
    const card = document.createElement("article");
    card.className = "easy-price-card";
    card.innerHTML = `
      <div class="easy-price-card-media">
        <img src="${phone.image}" alt="${phoneLabel(phone)} available on Mikee Gadget Plug Easy Buy" loading="lazy">
        <span>${Math.round(phone.depositRate * 100)}% initial deposit</span>
      </div>
      <div class="easy-price-card-body">
        <h3>${phone.model}</h3>
        <small>${phone.storage}</small>
        <div class="easy-price">${naira.format(phone.price)}</div>
        <small>${phone.confirmPrice ? "Price entered as supplied—please confirm before applying." : "Guide price—confirm current price and stock."}</small>
        <button class="calculate-phone" type="button" data-phone-id="${phone.id}">Calculate this phone</button>
      </div>
    `;

    const image = card.querySelector("img");
    image.addEventListener("error", () => {
      image.src = createPricePlaceholder(phone.model);
    }, { once: true });

    card.querySelector(".calculate-phone").addEventListener("click", () => selectPhone(phone.id, true));
    fragment.appendChild(card);
  });

  priceGrid.appendChild(fragment);
}

function populateModelSelect() {
  if (!modelSelect) return;
  modelSelect.innerHTML = easyBuyPhones.map((phone) =>
    `<option value="${phone.id}">${phoneLabel(phone)} — ${naira.format(phone.price)} — ${Math.round(phone.depositRate * 100)}% down</option>`
  ).join("");
}

function selectedPhone() {
  return easyBuyPhones.find((phone) => phone.id === modelSelect.value) || easyBuyPhones[0];
}

function numericPrice() {
  return Number(priceInput.value.replace(/[^0-9]/g, "")) || 0;
}

function formatInputPrice() {
  const price = numericPrice();
  priceInput.value = price ? plainNumber.format(price) : "";
}

function rememberSelectedPhone(phoneId, moveToCalculator = false) {
  try {
    window.sessionStorage.setItem("mikee-gadget-plugEasyBuyPhone", phoneId);
  } catch (error) {
    // The URL still preserves the selection when storage is unavailable.
  }

  const url = new URL(window.location.href);
  url.searchParams.set("phone", phoneId);
  if (moveToCalculator) url.hash = "calculator";
  window.history.replaceState({}, "", url);
}

function showSelectedPhone(phone) {
  if (selectedPhoneName) selectedPhoneName.textContent = phoneLabel(phone);
  if (selectedPhonePrice) selectedPhonePrice.textContent = `Guide price: ${naira.format(numericPrice() || phone.price)}`;

  if (selectedPhoneImage) {
    selectedPhoneImage.onerror = () => {
      selectedPhoneImage.onerror = null;
      selectedPhoneImage.src = createPricePlaceholder(phone.model);
    };
    selectedPhoneImage.src = phone.image;
    selectedPhoneImage.alt = `${phoneLabel(phone)} selected for Easy Buy calculation`;
  }
}

function selectPhone(phoneId, scrollToCalculator = false) {
  const phone = easyBuyPhones.find((item) => item.id === phoneId);
  if (!phone || !modelSelect || !priceInput) return;

  modelSelect.value = phone.id;
  priceInput.value = plainNumber.format(phone.price);
  showSelectedPhone(phone);
  rememberSelectedPhone(phone.id, scrollToCalculator);
  updateCalculator();

  if (scrollToCalculator) {
    window.MikeeGadgetPlugTracking?.pushEvent("select_phone", {
      phone_model: phone.model,
      product_name: phoneLabel(phone),
      lead_type: "easy_buy"
    });
    window.requestAnimationFrame(() => {
      document.querySelector("#calculator").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

function syncFrequencyAvailability(phone) {
  if (!frequencySelect || !weeklyOption || !biweeklyOption || !monthlyOption) return;

  const isIphone11Or12 = phone.series === 11 || phone.series === 12;

  weeklyOption.disabled = !isIphone11Or12;
  weeklyOption.hidden = !isIphone11Or12;
  biweeklyOption.disabled = !isIphone11Or12;
  biweeklyOption.hidden = !isIphone11Or12;
  monthlyOption.disabled = false;
  monthlyOption.hidden = false;

  const frequencies = allowedFrequencies(phone.series);
  if (!frequencies.includes(frequencySelect.value)) {
    frequencySelect.value = "monthly";
  }

  if (frequencyHelp) {
    frequencyHelp.textContent = isIphone11Or12
      ? "Monthly is the default. Eligible iPhone 11 and 12 offers may also use weekly or bi-weekly repayment."
      : "This iPhone series uses monthly repayment.";
  }
}

function updateCalculator() {
  if (!modelSelect || !priceInput || !frequencySelect || !durationInputs.length) return;

  const phone = selectedPhone();
  syncFrequencyAvailability(phone);
  const selectedFrequency = frequencySelect.options[frequencySelect.selectedIndex];
  const price = numericPrice();
  const rate = phone.depositRate;
  const selectedDuration = document.querySelector('input[name="duration"]:checked');
  const duration = Number(selectedDuration ? selectedDuration.value : 1);
  const {
    factor,
    deposit,
    balance,
    balanceRepayment,
    additionalCost,
    installment,
    repayments
  } = calculatePlan({
    price,
    duration,
    frequency: selectedFrequency.value,
    series: phone.series,
    depositRate: rate
  });
  const frequencyName = selectedFrequency.textContent.trim().toLowerCase();

  depositRate.textContent = `${Math.round(rate * 100)}% initial deposit`;
  downPayment.textContent = naira.format(deposit);
  remainingBalance.textContent = naira.format(balance);
  durationFactor.textContent = `${duration} month${duration === 1 ? "" : "s"} · × ${factor.toFixed(1)}`;
  planCost.textContent = naira.format(additionalCost);
  financedTotal.textContent = naira.format(balanceRepayment);
  repaymentAmount.textContent = naira.format(installment);
  paymentLabel.textContent = `Estimated ${frequencyName} instalment`;
  paymentCount.textContent = `${repayments} payment${repayments === 1 ? "" : "s"}`;
  if (selectedPhonePrice) selectedPhonePrice.textContent = `Price used: ${naira.format(price)}`;

  const message = [
    "Hello Mikee Gadget Plug, I want to apply for Easy Buy.",
    `Phone: ${phoneLabel(phone)}`,
    `Price used for estimate: ${naira.format(price)}`,
    `Initial deposit: ${naira.format(deposit)} (${Math.round(rate * 100)}%)`,
    `Balance after deposit: ${naira.format(balance)}`,
    `Duration: ${duration} month${duration === 1 ? "" : "s"} (balance × ${factor.toFixed(1)})`,
    `Additional plan cost on balance: ${naira.format(additionalCost)}`,
    `Total balance repayment: ${naira.format(balanceRepayment)}`,
    `Preferred schedule: ${selectedFrequency.textContent.trim()} — ${naira.format(installment)} × ${repayments} payments`,
    "Please confirm the current phone price, stock, eligibility, exact due dates, and complete terms before I pay."
  ].join("\n");

  calculatorWhatsapp.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

if (modelSelect && priceInput && frequencySelect && durationInputs.length) {
  populateModelSelect();
  modelSelect.addEventListener("change", () => {
    selectPhone(modelSelect.value);
    const phone = selectedPhone();
    window.MikeeGadgetPlugTracking?.pushEvent("select_phone", {
      phone_model: phone.model,
      product_name: phoneLabel(phone),
      lead_type: "easy_buy"
    });
  });
  frequencySelect.addEventListener("change", updateCalculator);
  durationInputs.forEach((field) => field.addEventListener("change", updateCalculator));
  priceInput.addEventListener("input", updateCalculator);
  priceInput.addEventListener("blur", () => {
    formatInputPrice();
    updateCalculator();
  });

  const phoneFromUrl = new URLSearchParams(window.location.search).get("phone");
  let savedPhone = "";
  try {
    savedPhone = window.sessionStorage.getItem("mikee-gadget-plugEasyBuyPhone") || "";
  } catch (error) {
    savedPhone = "";
  }

  const initialPhoneId = [phoneFromUrl, savedPhone]
    .find((phoneId) => easyBuyPhones.some((phone) => phone.id === phoneId))
    || easyBuyPhones[0].id;

  selectPhone(initialPhoneId);
}

if (priceSearch) priceSearch.addEventListener("input", renderPriceList);
renderPriceList();
