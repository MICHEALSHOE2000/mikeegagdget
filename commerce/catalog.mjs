import { newestFirst } from "./catalog-order.mjs";
import { retailPhoneProducts } from "./retail-inventory.mjs";

export const commerceSite = Object.freeze({
  name: "Mikee Gadget Plug",
  legalName: "MIKEE GADGET PLUG",
  baseUrl: "https://www.mikeegadget.com.ng",
  whatsappNumber: "2347086865133",
  telephoneHref: "+2347086865133",
  telephoneDisplay: "0708 686 5133",
  address: "1 Ola Ayeni Street, Off Simbiat Abiola Way, Ikeja, Computer Village, Lagos, Nigeria",
  directionsUrl: "https://www.google.com/maps/search/?api=1&query=1%20Ola%20Ayeni%20Street%2C%20Off%20Simbiat%20Abiola%20Way%2C%20Ikeja%2C%20Computer%20Village%2C%20Lagos%2C%20Nigeria",
  communityUrl: "",
  delivery: "Delivery is available in Lagos and across Nigeria. Confirm the delivery fee, timing and payment arrangement before placing an order.",
  warranty: "Ask for the written warranty or after-sales terms that apply to the exact device before payment.",
  usedIphoneBattery: "UK-used iPhones are supplied with battery health above 83%. Ask for the exact reading for the unit offered and confirm it during inspection.",
  easyBuyUrl: "/easy-buy/"
});

export const products = Object.freeze([...retailPhoneProducts].sort(newestFirst));

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
    description: "Compare iPhone models, storage and listed prices. Pay outright, ask about Easy Buy, swap a phone or order through WhatsApp.",
    brand: "Apple"
  },
  {
    route: "/uk-used-iphones",
    eyebrow: "Inspected-device enquiries",
    h1: "Shop UK-Used iPhones in Nigeria",
    title: "UK-Used iPhones in Nigeria | Battery Health Above 83% | Mikee Gadget Plug",
    description: "Compare UK-used iPhones from Mikee Gadget Plug. Ask for the exact unit, listed price, battery health above 83%, condition and delivery options.",
    brand: "Apple",
    condition: "UK Used"
  },
  {
    route: "/cheap-iphones",
    eyebrow: "Lower-price iPhone options",
    h1: "Find a More Affordable iPhone",
    title: "Affordable iPhones in Nigeria | Compare Listed Prices | Mikee Gadget Plug",
    description: "Start with iPhone options that have lower listed prices, then confirm today’s condition, storage, price and Easy Buy terms.",
    brand: "Apple",
    sort: "price-ascending"
  },
  {
    route: "/iphone-easy-buy",
    eyebrow: "Pay in stages",
    h1: "Get an iPhone With Easy Buy",
    title: "iPhone Easy Buy Nigeria | Calculator & Models | Mikee Gadget Plug",
    description: "Choose an iPhone and see the model-specific down payment and monthly repayment over one to three months.",
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
