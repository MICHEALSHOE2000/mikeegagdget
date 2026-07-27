const whatsappNumber = "2349060699096";

const modelStorage = {
  "iPhone 17": "128GB, 256GB, 512GB",
  "iPhone 17 Air": "128GB, 256GB, 512GB",
  "iPhone 17 Pro": "128GB, 256GB, 512GB",
  "iPhone 17 Pro Max": "128GB, 256GB, 512GB, 1TB",
  "iPhone 16": "128GB, 256GB, 512GB",
  "iPhone 16 Plus": "128GB, 256GB, 512GB",
  "iPhone 16 Pro": "128GB, 256GB, 512GB",
  "iPhone 16 Pro Max": "128GB, 256GB, 512GB, 1TB",
  "iPhone 15": "128GB, 256GB",
  "iPhone 15 Pro": "128GB, 256GB, 512GB",
  "iPhone 15 Pro Max": "256GB, 512GB, 1TB",
  "iPhone 14": "128GB, 256GB",
  "iPhone 14 Pro": "128GB, 256GB, 512GB",
  "iPhone 14 Pro Max": "128GB, 256GB, 512GB, 1TB",
  "iPhone 13": "128GB, 256GB",
  "iPhone 13 Pro": "128GB, 256GB, 512GB",
  "iPhone 13 Pro Max": "128GB, 256GB, 512GB",
  "iPhone 12": "64GB, 128GB, 256GB",
  "iPhone 12 Pro": "64GB, 256GB, 512GB",
  "iPhone 12 Pro Max": "64GB, 256GB, 512GB",
  "iPhone 11": "64GB, 128GB, 256GB",
  "iPhone 11 Pro": "64GB, 256GB, 512GB",
  "iPhone 11 Pro Max": "64GB, 256GB, 512GB"
};

// Edit this model list when stock changes. UK Used and Brand New use the same order.
const orderedModels = [
  "iPhone 17",
  "iPhone 17 Air",
  "iPhone 17 Pro",
  "iPhone 17 Pro Max",
  "iPhone 16",
  "iPhone 16 Plus",
  "iPhone 16 Pro",
  "iPhone 16 Pro Max",
  "iPhone 15",
  "iPhone 15 Pro",
  "iPhone 15 Pro Max",
  "iPhone 14",
  "iPhone 14 Pro",
  "iPhone 14 Pro Max",
  "iPhone 13",
  "iPhone 13 Pro",
  "iPhone 13 Pro Max",
  "iPhone 12",
  "iPhone 12 Pro",
  "iPhone 12 Pro Max",
  "iPhone 11",
  "iPhone 11 Pro",
  "iPhone 11 Pro Max"
];

const ukUsedModels = orderedModels;
const brandNewModels = orderedModels;

function slugify(model) {
  return model.toLowerCase().replace(/\s+/g, "-");
}

const modelImageOverrides = {
  "iPhone 17": ["images/17-1.jpg", "images/17-2.jpg", "images/17-3.jpg"],
  "iPhone 15": ["images/15-1.jpeg", "images/15-2.jpeg", "images/15-3.jpeg"],
  "iPhone 15 Pro": ["images/15pro-1.jpeg", "images/15pro-2.jpeg", "images/15pro-3.jpeg"],
  "iPhone 15 Pro Max": ["images/15promax-1.jpeg", "images/15promax-2.jpeg", "images/15promax-3.jpeg"],
  "iPhone 14": ["images/14-1.jpeg", "images/14-2.jpeg", "images/14-3.jpeg"],
  "iPhone 14 Pro": ["images/14pro-1.jpeg", "images/14pro-2.jpeg", "images/14pro-3.jpeg"],
  "iPhone 14 Pro Max": ["images/14promax-1.jpeg", "images/14promax-2.jpeg", "images/14promax-3.jpeg"],
  "iPhone 13": ["images/13-1.jpeg", "images/13-2.jpeg", "images/13-3.jpeg"],
  "iPhone 13 Pro": ["images/13pro-1.jpeg", "images/13pro-2.jpeg", "images/13pro-3.jpeg"],
  "iPhone 13 Pro Max": ["images/13promax-1.jpeg", "images/13promax-2.jpeg", "images/13promax-3.jpeg"],
  "iPhone 12": ["images/12.jpeg", "images/12-2.jpeg", "images/12-3.jpeg"],
  "iPhone 12 Pro": ["images/12pro-1.jpeg", "images/12pro-2.jpeg", "images/12pro-3.jpeg"],
  "iPhone 12 Pro Max": ["images/12promax-1.jpeg", "images/12promax-2.jpeg", "images/12promax-3.jpeg"],
  "iPhone 11": ["images/11-1.jpeg", "images/11-2.jpeg", "images/11-3.jpeg"],
  "iPhone 11 Pro": ["images/11pro-1.jpeg", "images/11pro-2.jpeg", "images/11pro-3.jpeg"],
  "iPhone 11 Pro Max": ["images/11promax-1.jpeg", "images/11promax-2.jpeg", "images/11promax-3.jpeg"],
  "iPhone 17 Air": ["images/17air-1.jpg", "images/17air-2.jpg", "images/17air-3.jpg"],
  "iPhone 17 Pro": ["images/17pro-1.jpg", "images/17pro-2.jpg", "images/17pro-3.jpg"],
  "iPhone 17 Pro Max": ["images/17promax-1.jpg", "images/17promax-2.jpg"],
  "iPhone 16": ["images/16-1.jpg", "images/16-2.jpg", "images/16-3.jpg"],
  "iPhone 16 Plus": ["images/16plus-1.jpg", "images/16plus-2.webp", "images/16plus-3.jpg"],
  "iPhone 16 Pro": ["images/16pro-1.jpg", "images/16pro-2.jpg", "images/16pro-3.jpg"],
  "iPhone 16 Pro Max": ["images/16promax-1.jpg", "images/16promax-2.jpg", "images/16promax-3.jpg"]
};

function makeImages(model) {
  if (modelImageOverrides[model]) {
    return modelImageOverrides[model];
  }

  const slug = slugify(model);
  return [1, 2, 3, 4].map((number) => `images/${slug}-${number}.jpg`);
}

const products = [
  ...ukUsedModels.map((model) => ({
    id: `uk-${slugify(model)}`,
    model,
    condition: "UK Used",
    storage: modelStorage[model],
    images: makeImages(model)
  })),
  ...brandNewModels.map((model) => ({
    id: `new-${slugify(model)}`,
    model,
    condition: "Brand New",
    storage: modelStorage[model],
    images: makeImages(model)
  }))
];

const productGrid = document.querySelector("#productGrid");
const searchInput = document.querySelector("#searchInput");
const resultsCount = document.querySelector("#resultsCount");
const tabs = document.querySelectorAll(".tab");
const shopImages = document.querySelectorAll(".shop-gallery img");
const heroSlides = document.querySelectorAll(".hero-slide");
const heroDots = document.querySelectorAll(".carousel-dot");
const menuToggle = document.querySelector(".menu-toggle");
const navActions = document.querySelector(".nav-actions");
const categoryCards = document.querySelectorAll(".category-card[data-category]");
const faqItems = document.querySelectorAll(".faq-item");

let activeFilter = "All";
let activeHeroSlide = 0;
let heroTimer;

// Polished fallback artwork keeps the catalog presentable before real product photos are added.
function createPlaceholderImage(model, condition) {
  const label = `${condition} ${model}`;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="675" viewBox="0 0 900 675">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="100%" stop-color="#cfd7e3"/>
        </linearGradient>
        <linearGradient id="phone" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#151923"/>
          <stop offset="45%" stop-color="#3b4352"/>
          <stop offset="100%" stop-color="#080a0f"/>
        </linearGradient>
      </defs>
      <rect width="900" height="675" fill="url(#bg)"/>
      <circle cx="724" cy="118" r="170" fill="#d8b45a" opacity=".24"/>
      <circle cx="145" cy="576" r="190" fill="#0ea36f" opacity=".12"/>
      <rect x="326" y="80" width="248" height="500" rx="48" fill="#12151d"/>
      <rect x="344" y="100" width="212" height="460" rx="38" fill="url(#phone)"/>
      <rect x="407" y="122" width="86" height="22" rx="11" fill="#030407"/>
      <path d="M392 410c44-64 86-92 132-84 32 6 56 28 72 66v168H344v-70c16-13 32-40 48-80z" fill="#d8b45a" opacity=".42"/>
      <text x="450" y="630" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="700" fill="#111318">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createShopPlaceholderImage(index) {
  const label = `Formex Communication Shop ${index}`;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="675" viewBox="0 0 900 675">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#0b0d13"/>
          <stop offset="100%" stop-color="#2d3543"/>
        </linearGradient>
        <linearGradient id="glass" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity=".62"/>
          <stop offset="100%" stop-color="#d8b45a" stop-opacity=".18"/>
        </linearGradient>
      </defs>
      <rect width="900" height="675" fill="url(#bg)"/>
      <rect x="112" y="154" width="676" height="366" rx="28" fill="#f6f7f9"/>
      <rect x="112" y="154" width="676" height="84" rx="28" fill="#111318"/>
      <text x="450" y="209" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="800" fill="#ffffff">FORMEX COMMUNICATIONS</text>
      <rect x="162" y="278" width="250" height="194" rx="16" fill="url(#glass)"/>
      <rect x="488" y="278" width="250" height="194" rx="16" fill="url(#glass)"/>
      <rect x="235" y="326" width="104" height="146" rx="22" fill="#151923"/>
      <rect x="560" y="326" width="104" height="146" rx="22" fill="#151923"/>
      <rect x="0" y="520" width="900" height="155" fill="#d8b45a" opacity=".18"/>
      <text x="450" y="602" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="700" fill="#ffffff">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildWhatsappLink(product) {
  const message = `Hello Formex Communication, I’m interested in the ${product.condition} ${product.model}. Please confirm today’s price, available storage, colour, exact condition and pickup or delivery options.`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function productMatches(product) {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const matchesFilter = activeFilter === "All" || product.condition === activeFilter;
  const matchesSearch = [product.model, product.condition, product.storage, "iphone apple uk used brand new"].join(" ").toLowerCase().includes(searchTerm);

  return matchesFilter && matchesSearch;
}

// Re-rendering from product data keeps filters, search, and future product edits simple.
function renderProducts() {
  const visibleProducts = products.filter(productMatches);

  resultsCount.textContent = `${visibleProducts.length} iPhone${visibleProducts.length === 1 ? "" : "s"} found`;
  productGrid.innerHTML = "";

  if (!visibleProducts.length) {
    productGrid.innerHTML = `<p class="empty-state">No iPhones matched your search. Try another model or filter.</p>`;
    return;
  }

  const fragment = document.createDocumentFragment();

  visibleProducts.forEach((product) => {
    const card = document.createElement("article");
    const conditionClass = product.condition === "Brand New" ? "brand-new" : "";
    const placeholder = createPlaceholderImage(product.model, product.condition);

    card.className = "product-card";
    card.innerHTML = `
      <div class="gallery">
        <img class="main-image" src="${product.images[0]}" alt="${product.condition} ${product.model}" loading="lazy">
        <div class="thumbs" aria-label="${product.model} image options">
          ${product.images.map((image, index) => `
            <button class="thumb ${index === 0 ? "active" : ""}" type="button" data-image="${image}" aria-label="Show image ${index + 1} for ${product.model}">
              <img src="${image}" alt="" loading="lazy">
            </button>
          `).join("")}
        </div>
      </div>
      <div class="card-body">
        <span class="condition ${conditionClass}">${product.condition}</span>
        <h3>${product.model}</h3>
        <div class="card-badges" aria-label="Product enquiry details"><span>Price on request</span><span>Condition confirmed per device</span></div>
        <ul class="detail-list">
          <li><strong>Storage:</strong> ${product.storage}</li>
          <li><strong>Condition:</strong> ${product.condition}</li>
          <li><strong>Battery health:</strong> Available on request before payment</li>
          <li><strong>Warranty:</strong> Ask for the written terms that apply to the exact unit</li>
          <li>Pickup in Computer Village &bull; Delivery in Lagos or across Nigeria</li>
        </ul>
        <p class="price-note">Request today’s price and availability</p>
        <a class="whatsapp-btn" data-track="whatsapp" data-select-phone="true" href="${buildWhatsappLink(product)}" target="_blank" rel="noopener">Ask about this phone</a>
      </div>
    `;

    card.querySelectorAll("img").forEach((image) => {
      image.addEventListener("error", () => {
        image.src = placeholder;
      }, { once: true });
    });

    card.querySelectorAll(".thumb").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        const mainImage = card.querySelector(".main-image");
        mainImage.src = thumb.dataset.image;
        mainImage.alt = `${product.condition} ${product.model}`;
        card.querySelectorAll(".thumb").forEach((item) => item.classList.remove("active"));
        thumb.classList.add("active");
      });
    });

    fragment.appendChild(card);
  });

  productGrid.appendChild(fragment);
  watchRevealElements();
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activeFilter = tab.dataset.filter;
    tabs.forEach((item) => item.classList.toggle("active", item === tab));
    renderProducts();
  });
});

searchInput.addEventListener("input", renderProducts);

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

categoryCards.forEach((card) => {
  card.addEventListener("click", () => {
    activeFilter = card.dataset.category;
    tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.filter === activeFilter));
    renderProducts();
    document.querySelector("#products").scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

faqItems.forEach((item) => {
  const button = item.querySelector("button");
  button.addEventListener("click", () => {
    item.classList.toggle("open");
  });
});

shopImages.forEach((image, index) => {
  image.addEventListener("error", () => {
    image.src = createShopPlaceholderImage(index + 1);
  }, { once: true });
});

function showHeroSlide(index) {
  if (!heroSlides.length) {
    return;
  }

  activeHeroSlide = (index + heroSlides.length) % heroSlides.length;
  heroSlides.forEach((slide, slideIndex) => {
    slide.classList.toggle("active", slideIndex === activeHeroSlide);
  });
  heroDots.forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === activeHeroSlide);
  });
}

function startHeroCarousel() {
  if (heroTimer || heroSlides.length <= 1) {
    return;
  }

  heroTimer = window.setInterval(() => {
    showHeroSlide(activeHeroSlide + 1);
  }, 3000);
}

heroDots.forEach((dot) => {
  dot.addEventListener("click", () => {
    showHeroSlide(Number(dot.dataset.slide));
    window.clearInterval(heroTimer);
    heroTimer = undefined;
    startHeroCarousel();
  });
});

document.querySelectorAll(".hero-slide img").forEach((image, index) => {
  image.addEventListener("error", () => {
    image.src = createPlaceholderImage(`Hero iPhone ${index + 1}`, "Formex");
  }, { once: true });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

function watchRevealElements() {
  document.querySelectorAll(".reveal, .product-card, .step, .shop-section, .category-card, .testimonial-card, .faq-item, .final-cta").forEach((element) => {
    revealObserver.observe(element);
  });
}

renderProducts();
showHeroSlide(0);
startHeroCarousel();
watchRevealElements();
