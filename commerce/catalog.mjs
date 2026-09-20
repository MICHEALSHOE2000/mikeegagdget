import { newestFirst } from "./catalog-order.mjs";
import { productImages } from "./product-images.mjs";
import { getSellingPrice } from "./pricing.mjs";
import { priceList, suppliedPrices } from "./price-list.mjs";
import { merchantListings } from './merchant-listings.mjs';
export const commerceSite = Object.freeze({
  name: "Mikee Gadget Plug",
  legalName: "MIKEE GADGET PLUG",
  baseUrl: "https://www.mikeegagdget.vercel.app",
  whatsappNumber: "2347086865133",
  telephoneHref: "+2347086865133",
  telephoneDisplay: "0708 686 5133",
  address: "1 Ola Ayeni Street, Off Simbiat Abiola Way, Ikeja, Computer Village, Lagos, Nigeria",
  directionsUrl: "https://www.google.com/maps/search/?api=1&query=1%20Ola%20Ayeni%20Street%2C%20Off%20Simbiat%20Abiola%20Way%2C%20Ikeja%2C%20Computer%20Village%2C%20Lagos%2C%20Nigeria",
  communityUrl: "",
  delivery: "Delivery is available in Lagos and across Nigeria. Confirm the delivery fee, timing and payment arrangement before placing an order.",
  warranty: "Ask for the written warranty or after-sales terms that apply to the exact device before payment.",
  usedIphoneBattery: "UK-used iPhones are supplied with battery health above 83%. Ask for the exact reading for the unit offered and confirm it during inspection.",
  easyBuyUrl: "/easy-buy/",
  easyBuyDepositRate: 0.4
});

const priceNeedsExtraConfirmation = new Set();

const iphoneImages = {
  "iPhone 11": ["/images/11-1.jpeg", "/images/11-2.jpeg", "/images/11-3.jpeg"],
  "iPhone 11 Pro": ["/images/11pro-1.jpeg", "/images/11pro-2.jpeg", "/images/11pro-3.jpeg"],
  "iPhone 11 Pro Max": ["/images/11promax-1.jpeg", "/images/11promax-2.jpeg", "/images/11promax-3.jpeg"],
  "iPhone 12": ["/images/12.jpeg", "/images/12-2.jpeg", "/images/12-3.jpeg"],
  "iPhone 12 Pro": ["/images/12pro-1.jpeg", "/images/12pro-2.jpeg", "/images/12pro-3.jpeg"],
  "iPhone 12 Pro Max": ["/images/12promax-1.jpeg", "/images/12promax-2.jpeg", "/images/12promax-3.jpeg"],
  "iPhone 13": ["/images/13-1.jpeg", "/images/13-2.jpeg", "/images/13-3.jpeg"],
  "iPhone 13 Pro": ["/images/13pro-1.jpeg", "/images/13pro-2.jpeg", "/images/13pro-3.jpeg"],
  "iPhone 13 Pro Max": ["/images/13promax-1.jpeg", "/images/13promax-2.jpeg", "/images/13promax-3.jpeg"],
  "iPhone 14": ["/images/14-1.jpeg", "/images/14-2.jpeg", "/images/14-3.jpeg"],
  "iPhone 14 Pro": ["/images/14pro-1.jpeg", "/images/14pro-2.jpeg", "/images/14pro-3.jpeg"],
  "iPhone 14 Pro Max": ["/images/14promax-1.jpeg", "/images/14promax-2.jpeg", "/images/14promax-3.jpeg"],
  "iPhone 15": ["/images/15-1.jpeg", "/images/15-2.jpeg", "/images/15-3.jpeg"],
  "iPhone 15 Pro": ["/images/15pro-1.jpeg", "/images/15pro-2.jpeg", "/images/15pro-3.jpeg"],
  "iPhone 15 Pro Max": ["/images/15promax-1.jpeg", "/images/15promax-2.jpeg", "/images/15promax-3.jpeg"],
  "iPhone 16": ["/images/16-1.jpg", "/images/16-2.jpg", "/images/16-3.jpg"],
  "iPhone 16 Plus": ["/images/16plus-1.jpg", "/images/16plus-2.webp", "/images/16plus-3.jpg"],
  "iPhone 16 Pro": ["/images/16pro-1.jpg", "/images/16pro-2.jpg", "/images/16pro-3.jpg"],
  "iPhone 16 Pro Max": ["/images/16promax-1.jpg", "/images/16promax-2.jpg", "/images/16promax-3.jpg"],
  "iPhone 17": ["/images/17-1.jpg", "/images/17-2.jpg", "/images/17-3.jpg"],
  "iPhone 17 Air": ["/images/17air-1.jpg", "/images/17air-2.jpg", "/images/17air-3.jpg"],
  "iPhone 17 Pro": ["/images/17pro-1.jpg", "/images/17pro-2.jpg", "/images/17pro-3.jpg"],
  "iPhone 17 Pro Max": ["/images/17promax-1.jpg", "/images/17promax-2.jpg"]
};

const iphoneSpecs = {
  "11": {
    display: "Liquid Retina HD display",
    camera: "Dual 12MP camera system",
    processor: "A13 Bionic",
    network: "4G LTE",
    security: "Face ID",
    sim: "Nano-SIM and eSIM support; confirm the exact unit"
  },
  "11-pro": {
    display: "Super Retina XDR display",
    camera: "Triple 12MP camera system",
    processor: "A13 Bionic",
    network: "4G LTE",
    security: "Face ID",
    sim: "Nano-SIM and eSIM support; confirm the exact unit"
  },
  "12": {
    display: "Super Retina XDR OLED display",
    camera: "Dual 12MP camera system",
    processor: "A14 Bionic",
    network: "5G",
    security: "Face ID",
    sim: "Nano-SIM and eSIM support; confirm the exact unit"
  },
  "12-pro": {
    display: "Super Retina XDR OLED display",
    camera: "Triple 12MP Pro camera system with LiDAR",
    processor: "A14 Bionic",
    network: "5G",
    security: "Face ID",
    sim: "Nano-SIM and eSIM support; confirm the exact unit"
  },
  "13": {
    display: "Super Retina XDR OLED display",
    camera: "Dual 12MP camera system",
    processor: "A15 Bionic",
    network: "5G",
    security: "Face ID",
    sim: "Nano-SIM and eSIM support; confirm the exact unit"
  },
  "13-pro": {
    display: "Super Retina XDR display with ProMotion",
    camera: "Triple 12MP Pro camera system with LiDAR",
    processor: "A15 Bionic",
    network: "5G",
    security: "Face ID",
    sim: "Nano-SIM and eSIM support; confirm the exact unit"
  },
  "14": {
    display: "Super Retina XDR OLED display",
    camera: "Dual 12MP camera system",
    processor: "A15 Bionic",
    network: "5G",
    security: "Face ID",
    sim: "SIM options vary by market; confirm the exact unit"
  },
  "14-pro": {
    display: "Super Retina XDR display with ProMotion",
    camera: "48MP main Pro camera system",
    processor: "A16 Bionic",
    network: "5G",
    security: "Face ID",
    sim: "SIM options vary by market; confirm the exact unit"
  },
  "15": {
    display: "Super Retina XDR OLED display",
    camera: "48MP main dual-camera system",
    processor: "A16 Bionic",
    network: "5G",
    security: "Face ID",
    sim: "SIM options vary by market; confirm the exact unit"
  },
  "15-pro": {
    display: "Super Retina XDR display with ProMotion",
    camera: "48MP main Pro camera system",
    processor: "A17 Pro",
    network: "5G",
    security: "Face ID",
    sim: "SIM options vary by market; confirm the exact unit"
  },
  "16": {
    display: "Super Retina XDR OLED display",
    camera: "48MP Fusion dual-camera system",
    processor: "A18",
    network: "5G",
    security: "Face ID",
    sim: "SIM options vary by market; confirm the exact unit"
  },
  "16-pro": {
    display: "Super Retina XDR display with ProMotion",
    camera: "48MP Fusion Pro camera system",
    processor: "A18 Pro",
    network: "5G",
    security: "Face ID",
    sim: "SIM options vary by market; confirm the exact unit"
  },
  "17": {
    display: "Confirm the exact display specification",
    camera: "Confirm the exact camera configuration",
    processor: "Confirm the exact chipset",
    network: "5G",
    security: "Face ID",
    sim: "SIM options vary by market; confirm the exact unit"
  }
};

const legacyIphoneDefinitions = [
  ["iPhone 11", "iphone-11", ["64GB", "128GB", "256GB"], "128GB", "11"],
  ["iPhone 11 Pro", "iphone-11-pro", ["64GB", "256GB", "512GB"], "256GB", "11-pro"],
  ["iPhone 11 Pro Max", "iphone-11-pro-max", ["64GB", "256GB", "512GB"], "256GB", "11-pro"],
  ["iPhone 12", "iphone-12", ["64GB", "128GB", "256GB"], "128GB", "12"],
  ["iPhone 12 Pro", "iphone-12-pro", ["128GB", "256GB", "512GB"], "128GB", "12-pro"],
  ["iPhone 12 Pro Max", "iphone-12-pro-max", ["128GB", "256GB", "512GB"], "128GB", "12-pro"],
  ["iPhone 13", "iphone-13", ["128GB", "256GB", "512GB"], "128GB", "13"],
  ["iPhone 13 Pro", "iphone-13-pro", ["128GB", "256GB", "512GB", "1TB"], "128GB", "13-pro"],
  ["iPhone 13 Pro Max", "iphone-13-pro-max", ["128GB", "256GB", "512GB", "1TB"], "128GB", "13-pro"],
  ["iPhone 14", "iphone-14", ["128GB", "256GB", "512GB"], "128GB", "14"],
  ["iPhone 14 Pro", "iphone-14-pro", ["128GB", "256GB", "512GB", "1TB"], "128GB", "14-pro"],
  ["iPhone 14 Pro Max", "iphone-14-pro-max", ["128GB", "256GB", "512GB", "1TB"], "128GB", "14-pro"],
  ["iPhone 15", "iphone-15", ["128GB", "256GB", "512GB"], "128GB", "15"],
  ["iPhone 15 Pro", "iphone-15-pro", ["128GB", "256GB", "512GB", "1TB"], "128GB", "15-pro"],
  ["iPhone 15 Pro Max", "iphone-15-pro-max", ["256GB", "512GB", "1TB"], "256GB", "15-pro"],
  ["iPhone 16", "iphone-16", ["128GB", "256GB", "512GB"], "128GB", "16"],
  ["iPhone 16 Plus", "iphone-16-plus", ["128GB", "256GB", "512GB"], "128GB", "16"],
  ["iPhone 16 Pro", "iphone-16-pro", ["128GB", "256GB", "512GB", "1TB"], "128GB", "16-pro"],
  ["iPhone 16 Pro Max", "iphone-16-pro-max", ["256GB", "512GB", "1TB"], "256GB", "16-pro"],
  ["iPhone 17", "iphone-17", ["128GB", "256GB", "512GB"], "256GB", "17"],
  ["iPhone 17 Air", "iphone-17-air", ["To confirm"], "To confirm", "17"],
  ["iPhone 17 Pro", "iphone-17-pro", ["128GB", "256GB", "512GB"], "256GB", "17"],
  ["iPhone 17 Pro Max", "iphone-17-pro-max", ["128GB", "256GB", "512GB", "1TB"], "256GB", "17"]
];

const iphoneDefinitions = [
  ...Object.entries(merchantListings).map(([model,p])=>[model,p.slug,p.variants.map(([storage])=>storage),p.variants[0][0],'confirm']),
  ...priceList.map(([model, slug, variants]) => {
    const previous = legacyIphoneDefinitions.find(item => item[1] === slug);
    const storage = variants.map(([size]) => size);
    return [model, slug, storage, storage.includes(previous?.[3]) ? previous[3] : storage[0], previous?.[4] || 'confirm'];
  }),
  ...legacyIphoneDefinitions.filter(item => !priceList.some(([,slug]) => item[1] === slug))
];

const galaxyDefinitions = [
  {
    model: "Samsung Galaxy S23",
    slug: "samsung-s23",
    storage: ["128GB", "256GB"],
    specs: ["Dynamic AMOLED 2X display", "50MP main camera system", "Snapdragon 8 Gen 2 for Galaxy", "5G", "Ultrasonic fingerprint"]
  },
  {
    model: "Samsung Galaxy S23 Plus",
    slug: "samsung-s23-plus",
    storage: ["256GB", "512GB"],
    specs: ["Dynamic AMOLED 2X display", "50MP main camera system", "Snapdragon 8 Gen 2 for Galaxy", "5G", "Ultrasonic fingerprint"]
  },
  {
    model: "Samsung Galaxy S23 Ultra",
    slug: "samsung-s23-ultra",
    storage: ["256GB", "512GB", "1TB"],
    specs: ["Dynamic AMOLED 2X display", "200MP main camera system", "Snapdragon 8 Gen 2 for Galaxy", "5G", "S Pen and fingerprint security"]
  },
  {
    model: "Samsung Galaxy S24",
    slug: "samsung-s24",
    storage: ["128GB", "256GB"],
    specs: ["Dynamic AMOLED 2X display", "50MP main camera system", "Flagship Galaxy processor; region may vary", "5G", "Ultrasonic fingerprint"]
  },
  {
    model: "Samsung Galaxy S24 Plus",
    slug: "samsung-s24-plus",
    storage: ["256GB", "512GB"],
    specs: ["Dynamic AMOLED 2X display", "50MP main camera system", "Flagship Galaxy processor; region may vary", "5G", "Ultrasonic fingerprint"]
  },
  {
    model: "Samsung Galaxy S24 Ultra",
    slug: "samsung-s24-ultra",
    storage: ["256GB", "512GB", "1TB"],
    specs: ["Dynamic AMOLED 2X display", "200MP main camera system", "Snapdragon 8 Gen 3 for Galaxy", "5G", "S Pen and fingerprint security"]
  },
  {
    model: "Samsung Galaxy S25",
    slug: "samsung-s25",
    storage: ["128GB", "256GB"],
    specs: ["Dynamic AMOLED 2X display", "50MP main camera system", "Snapdragon 8 Elite for Galaxy", "5G", "Ultrasonic fingerprint"]
  },
  {
    model: "Samsung Galaxy S25 Plus",
    slug: "samsung-s25-plus",
    storage: ["256GB", "512GB"],
    specs: ["Dynamic AMOLED 2X display", "50MP main camera system", "Snapdragon 8 Elite for Galaxy", "5G", "Ultrasonic fingerprint"]
  },
  {
    model: "Samsung Galaxy S25 Ultra",
    slug: "samsung-s25-ultra",
    storage: ["256GB", "512GB", "1TB"],
    specs: ["Dynamic AMOLED 2X display", "200MP main camera system", "Snapdragon 8 Elite for Galaxy", "5G", "S Pen and fingerprint security"]
  },
  {
    model: "Samsung Galaxy Z Fold 7",
    slug: "samsung-z-fold-7",
    storage: ["256GB", "512GB", "1TB"],
    specs: ["Foldable AMOLED displays", "Multi-camera system", "Flagship Galaxy processor", "5G", "Fingerprint security"]
  }
];

const pixelDefinitions = [
  ["Google Pixel 7", "google-pixel-7", ["128GB", "256GB"], ["OLED display", "50MP dual-camera system", "Google Tensor G2", "5G", "Fingerprint and face unlock"]],
  ["Google Pixel 7 Pro", "google-pixel-7-pro", ["128GB", "256GB", "512GB"], ["LTPO OLED display", "50MP triple-camera system", "Google Tensor G2", "5G", "Fingerprint and face unlock"]],
  ["Google Pixel 8", "google-pixel-8", ["128GB", "256GB"], ["Actua OLED display", "50MP dual-camera system", "Google Tensor G3", "5G", "Fingerprint and face unlock"]],
  ["Google Pixel 8 Pro", "google-pixel-8-pro", ["128GB", "256GB", "512GB"], ["Super Actua LTPO OLED display", "50MP triple-camera system", "Google Tensor G3", "5G", "Fingerprint and face unlock"]],
  ["Google Pixel 9", "google-pixel-9", ["128GB", "256GB"], ["Actua OLED display", "50MP dual-camera system", "Google Tensor G4", "5G", "Fingerprint and face unlock"]],
  ["Google Pixel 9 Pro", "google-pixel-9-pro", ["128GB", "256GB", "512GB"], ["Super Actua LTPO OLED display", "50MP triple-camera system", "Google Tensor G4", "5G", "Fingerprint and face unlock"]],
  ["Google Pixel 9 Pro XL", "google-pixel-9-pro-xl", ["128GB", "256GB", "512GB", "1TB"], ["Large Super Actua LTPO OLED display", "50MP triple-camera system", "Google Tensor G4", "5G", "Fingerprint and face unlock"]]
];

const makeVariant = (model, storage) => {
  const key = `${model}|${storage}`;
  const sellingPrice=merchantListings[model]?.variants.find(([label])=>label===storage)?.[1];
  return {
    storage,
    basePrice: suppliedPrices[key] ?? null,
    sellingPrice: sellingPrice ?? (suppliedPrices[key] ? getSellingPrice(suppliedPrices[key]) : null),
    price: sellingPrice ?? (suppliedPrices[key] ? getSellingPrice(suppliedPrices[key]) : null),
    color: storage.includes('—') ? storage.split('—')[1].trim() : null,
    availability: model === 'iPhone 7 Plus' ? 'Few pieces — confirm availability' : 'Confirm availability', 
    priceNeedsExtraConfirmation: priceNeedsExtraConfirmation.has(key),
    oldPrice: null
  };
};

const makeIphone = ([model, slug, storage, defaultStorage, specKey]) => ({
  brand: "Apple",
  model,
  slug,
  route: `/${slug}`,
  family: "iPhone",
  listingPending: false,
  specificationsPending: Boolean(merchantListings[model]),
  variants: storage.map((value) => makeVariant(model, value)),
  defaultStorage,
  colors: merchantListings[model] ? ['Glacier','Black','Burgundy'] : ["Choose with your device"],
  conditions: merchantListings[model] ? ["Confirm condition"] : ["UK Used", "Brand New"],
  images: productImages[model]?.image === "" ? [] : productImages[model]?.preferred ? [productImages[model].preferred, ...(iphoneImages[model] ?? []).slice(1)] : productImages[model] ? [productImages[model].image, ...(iphoneImages[model] ?? [])] : iphoneImages[model] ?? [],
  stockStatus: merchantListings[model] ? "Merchant-supplied listing — confirm exact unit and availability" : "Stock and condition checked before payment",
  easyBuyEligible: true,
  swapEligible: true,
  warranty: commerceSite.warranty,
  batteryHealth: commerceSite.usedIphoneBattery,
  specifications: merchantListings[model] ? Object.fromEntries(["display","camera","processor","network","security","sim"].map(key=>[key,"Confirm specifications for the exact unit with Mikee"])) : iphoneSpecs[specKey] || {
    display: "Confirm the exact unit’s display", camera: "Ask for camera condition and specifications",
    processor: "Confirm the exact model", network: "Confirm network compatibility",
    security: /iphone-(6|7|8|se)/.test(slug) ? "Touch ID — confirm it works" : "Face ID — confirm it works",
    sim: "Confirm available SIM and network options"
  },
  description: `Choose ${storage.join(", ")} storage where available, then confirm today’s price, colour and condition with Mikee Gadget Plug.`,
  seoTitle: `Buy ${model} in Nigeria | Storage & Easy Buy | Mikee Gadget Plug`,
  metaDescription: `Buy ${model} in Nigeria. Compare ${storage.join(", ")}, request today’s price, pay outright or ask about Easy Buy, swap and nationwide delivery.`
});

const makeGalaxy = ({ model, slug, storage, specs }) => ({
  brand: "Samsung",
  model,
  slug,
  route: `/${slug}`,
  family: "Galaxy",
  variants: storage.map((value) => makeVariant(model, value)),
  defaultStorage: storage[0],
  colors: ["Ask for today’s available colours"],
  conditions: ["Confirm available condition"],
  images: [],
  stockStatus: "Available to enquire about — confirm the exact variant",
  easyBuyEligible: "confirm",
  swapEligible: true,
  warranty: commerceSite.warranty,
  batteryHealth: "Ask for battery-condition details when considering a used unit.",
  specifications: {
    display: specs[0],
    camera: specs[1],
    processor: specs[2],
    network: specs[3],
    security: specs[4],
    sim: "SIM options vary by unit and market; confirm before buying"
  },
  description: `Choose your preferred ${model} storage, condition and payment option, then ask Mikee Gadget Plug to confirm current price and availability.`,
  seoTitle: `Buy ${model} in Nigeria | Mikee Gadget Plug`,
  metaDescription: `Buy ${model} in Nigeria. Check storage, condition and current price, then pay outright or ask about Easy Buy, swap and nationwide delivery.`
});

const makePixel = ([model, slug, storage, specs]) => ({
  brand: "Google",
  model,
  slug,
  route: `/${slug}`,
  family: "Pixel",
  variants: storage.map((value) => makeVariant(model, value)),
  defaultStorage: storage[0],
  colors: ["Ask for today’s available colours"],
  conditions: ["Confirm available condition"],
  images: [],
  stockStatus: "Available to enquire about — confirm the exact variant",
  easyBuyEligible: "confirm",
  swapEligible: true,
  warranty: commerceSite.warranty,
  batteryHealth: "Ask for battery-condition details when considering a used unit.",
  specifications: {
    display: specs[0],
    camera: specs[1],
    processor: specs[2],
    network: specs[3],
    security: specs[4],
    sim: "Physical SIM and eSIM support can vary by unit; confirm before buying"
  },
  description: `Compare ${model} storage options and ask Mikee Gadget Plug to confirm today’s price, colour, condition and delivery arrangement.`,
  seoTitle: `Buy ${model} in Nigeria | Price & Storage | Mikee Gadget Plug`,
  metaDescription: `Buy ${model} in Nigeria. Check storage, condition and current price, then ask about outright payment, Easy Buy, swap and nationwide delivery.`
});

export const products = Object.freeze([
  ...iphoneDefinitions.map(makeIphone),
  ...galaxyDefinitions.map(makeGalaxy),
  ...pixelDefinitions.map(makePixel)
].sort(newestFirst));

export const accessories = Object.freeze([
  { name: "Compatible charger", detail: "Ask which charger is recommended for this exact phone." },
  { name: "Phone case", detail: "Request available protective cases and colours." },
  { name: "Screen protector", detail: "Ask for a compatible protector and installation option." },
  { name: "Power bank", detail: "Choose a capacity that fits your daily use." },
  { name: "Earbuds or AirPods", detail: "Ask which compatible audio options are available." },
  { name: "Smartwatch", detail: "Request watches that pair well with your selected phone." }
]);

export const categoryPages = Object.freeze([
  {
    route: "/iphones",
    eyebrow: "Apple iPhone catalogue",
    h1: "Buy iPhones in Nigeria",
    title: "Buy iPhones in Nigeria | UK Used, New & Easy Buy | Mikee Gadget Plug",
    description: "Compare iPhone models, storage and supplied guide prices. Pay outright, ask about Easy Buy, swap a phone or order through WhatsApp.",
    brand: "Apple"
  },
  {
    route: "/uk-used-iphones",
    eyebrow: "Inspected-device enquiries",
    h1: "Shop UK-Used iPhones in Nigeria",
    title: "UK-Used iPhones in Nigeria | Battery Health Above 83% | Mikee Gadget Plug",
    description: "Compare UK-used iPhones from Mikee Gadget Plug. Ask for the exact unit, supplied price, battery health above 83%, condition and delivery options.",
    brand: "Apple",
    condition: "UK Used"
  },
  {
    route: "/cheap-iphones",
    eyebrow: "Lower-price iPhone options",
    h1: "Find a More Affordable iPhone",
    title: "Affordable iPhones in Nigeria | Compare Supplied Prices | Mikee Gadget Plug",
    description: "Start with iPhone options that have lower supplied guide prices, then confirm today’s condition, storage, price and Easy Buy terms.",
    brand: "Apple",
    sort: "price-ascending"
  },
  {
    route: "/iphone-easy-buy",
    eyebrow: "Pay in stages",
    h1: "Get an iPhone With Easy Buy",
    title: "iPhone Easy Buy Nigeria | Calculator & Models | Mikee Gadget Plug",
    description: "Choose an iPhone, review the 40% initial-deposit estimate and continue to Mikee Gadget Plug Easy Buy for final eligibility and terms.",
    brand: "Apple",
    easyBuy: true
  },
  {
    route: "/phones-on-installment",
    eyebrow: "Flexible payment enquiries",
    h1: "Phones on Installment in Nigeria",
    title: "Phones on Installment in Nigeria | Easy Buy Options | Mikee Gadget Plug",
    description: "Compare phones and ask Mikee Gadget Plug which models qualify for Easy Buy. Final prices, eligibility, dates and terms must be confirmed.",
    easyBuy: true
  },
  {
    route: "/samsung-phones",
    eyebrow: "Samsung Galaxy catalogue",
    h1: "Buy Samsung Phones in Nigeria",
    title: "Buy Samsung Phones in Nigeria | Galaxy Price Enquiries | Mikee Gadget Plug",
    description: "Compare Samsung Galaxy models and storage, then ask Mikee Gadget Plug for today’s condition, current price, Easy Buy eligibility and delivery.",
    brand: "Samsung"
  },
  {
    route: "/uk-used-samsung",
    eyebrow: "Used Samsung enquiries",
    h1: "Ask About UK-Used Samsung Phones",
    title: "UK-Used Samsung Phones in Nigeria | Mikee Gadget Plug",
    description: "Compare Samsung models and ask which UK-used units are available, including exact condition, storage, battery information and price.",
    brand: "Samsung",
    condition: "UK Used"
  },
  {
    route: "/google-pixel-phones",
    eyebrow: "Google Pixel catalogue",
    h1: "Buy Google Pixel Phones in Nigeria",
    title: "Buy Google Pixel Phones in Nigeria | Mikee Gadget Plug",
    description: "Compare Google Pixel models and storage, then ask Mikee Gadget Plug for today’s condition, current price, swap and delivery options.",
    brand: "Google"
  },
  {
    route: "/phone-swap",
    eyebrow: "Trade in and upgrade",
    h1: "Swap Your Current Phone for an Upgrade",
    title: "Phone Swap in Lagos, Nigeria | Get a WhatsApp Quote | Mikee Gadget Plug",
    description: "Send your current phone details to Mikee Gadget Plug, request a valuation and compare eligible upgrade options before accepting a swap quote.",
    swap: true
  },
  {
    route: "/laptops",
    eyebrow: "Work, school and business",
    h1: "Ask About Laptops Available From Mikee Gadget Plug",
    title: "Laptops in Computer Village, Ikeja | Mikee Gadget Plug",
    description: "Ask Mikee Gadget Plug for currently available laptops, specifications, condition, price, pickup and nationwide delivery options.",
    contentOnly: "laptops"
  },
  {
    route: "/gadget-accessories",
    eyebrow: "Complete your setup",
    h1: "Phone and Gadget Accessories",
    title: "Phone & Gadget Accessories in Ikeja | Mikee Gadget Plug",
    description: "Ask about chargers, phone cases, screen protectors, power banks, earbuds and smartwatches available from Mikee Gadget Plug.",
    contentOnly: "accessories"
  }
]);

export const productBySlug = new Map(products.map((product) => [product.slug, product]));
