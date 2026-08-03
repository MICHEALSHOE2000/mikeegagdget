export const site = {
  name: "MIKEE GADGET PLUG",
  displayName: "Mikee Gadget Plug",
  baseUrl: "https://www.mikeegagdget.vercel.app",
  whatsappNumber: "2347086865133",
  telephoneHref: "+2347086865133",
  telephoneDisplay: "0708 686 5133",
  address: "1 Ola Ayeni Street, Off Simbiat Abiola Way, Ikeja, Computer Village, Lagos, Nigeria",
  delivery: "Delivery is available in Lagos and across Nigeria. Confirm the delivery fee and timing before payment.",
  directionsUrl: "https://www.google.com/maps/search/?api=1&query=1%20Ola%20Ayeni%20Street%2C%20Off%20Simbiat%20Abiola%20Way%2C%20Ikeja%2C%20Computer%20Village%2C%20Lagos%2C%20Nigeria"
};

const iphoneConditions = [
  "Ask which units are brand new or UK-used before choosing.",
  "For a UK-used unit, request the battery-health reading and condition details.",
  "Confirm the exact storage and colour currently available.",
  "Choose store pickup in Ikeja or request delivery to your location."
];

const priceAvailabilityFaq = (model) => [
  {
    question: `How do I get today’s ${model} price?`,
    answer: `Use the WhatsApp button on this page. Mikee Gadget Plug will confirm the current price for the storage, colour and condition you request.`
  },
  {
    question: `Is the ${model} currently available?`,
    answer: `Availability can change. Ask on WhatsApp before travelling to the store or making a payment.`
  },
  {
    question: `Can I choose the storage and colour?`,
    answer: `Tell Mikee Gadget Plug your preferred storage and colour. The team will confirm which combinations are available today.`
  },
  {
    question: `Can I inspect the ${model} before buying?`,
    answer: `You can request store pickup at 1 Ola Ayeni Street in Ikeja and inspect the exact device offered before payment.`
  },
  {
    question: `Can Mikee Gadget Plug deliver outside Lagos?`,
    answer: `Delivery is available in Lagos and across Nigeria. Confirm the fee, timing and delivery arrangement with Mikee Gadget Plug before payment.`
  }
];

const seriesFaq = (series) => [
  {
    question: `Which ${series} model should I choose?`,
    answer: `Compare screen size, camera needs, storage and budget. Send your priorities on WhatsApp and ask which matching models are currently available.`
  },
  {
    question: `Can I compare new and UK-used ${series} phones?`,
    answer: `Yes. Ask Mikee Gadget Plug to confirm the conditions available for the exact model and to explain the condition before you choose.`
  },
  {
    question: `How do I check battery health on a used ${series} phone?`,
    answer: `Request the current battery-health reading for the exact unit offered and confirm it again during store inspection or before delivery.`
  },
  {
    question: `Are all storage options always in stock?`,
    answer: `No stock level is assumed on this page. Ask for today’s available storage and colour combinations before payment.`
  },
  {
    question: `Can I collect my phone in Ikeja?`,
    answer: `Yes. Ask Mikee Gadget Plug to reserve the confirmed device for pickup at 1 Ola Ayeni Street, off Simbiat Abiola Way, Ikeja.`
  }
];

const samsungFaq = (subject) => [
  {
    question: `How do I get today’s ${subject} price?`,
    answer: `Send the prefilled WhatsApp message and state the model, storage, colour and condition you want. Mikee Gadget Plug will confirm today’s price.`
  },
  {
    question: `Is ${subject} available in different colours or storage sizes?`,
    answer: `Options depend on current stock. Ask Mikee Gadget Plug to send the exact colours and storage sizes available before you choose.`
  },
  {
    question: `Can I inspect the Samsung phone before payment?`,
    answer: `You can arrange pickup at the Ikeja store and ask to inspect the exact device offered before payment.`
  },
  {
    question: `Does this page guarantee warranty coverage?`,
    answer: `No warranty promise is made here. Ask for the written warranty or after-sales terms that apply to the exact unit before paying.`
  },
  {
    question: `Is delivery available outside Lagos?`,
    answer: `Mikee Gadget Plug offers delivery in Lagos and across Nigeria. Confirm the fee, timing and handover process before payment.`
  }
];

const easyBuyFaq = (deviceType) => [
  {
    question: `How much is the initial deposit for ${deviceType} Easy Buy?`,
    answer: `The starting deposit is 40% of the confirmed device price. The remaining 60% is used for the repayment estimate.`
  },
  {
    question: "How long is the repayment period?",
    answer: "The normal duration is one to three months. Monthly repayment is the default option."
  },
  {
    question: "Can I repay weekly or every two weeks?",
    answer: "Weekly and bi-weekly options only apply to eligible iPhone 11 and iPhone 12 offers. Other plans use monthly repayment."
  },
  {
    question: "What may be needed for verification?",
    answer: "Verification may involve a BVN or NIN. Mikee Gadget Plug will explain the current requirements and review the application."
  },
  {
    question: "Does the calculator or page guarantee approval?",
    answer: "No. Every amount is an estimate until Mikee Gadget Plug confirms the device price, eligibility, repayment dates and complete terms."
  }
];

const intentCards = {
  price: (model, storage) => [
    {
      kicker: "Price",
      title: "Request today’s price",
      text: `Prices can change with condition and storage. Ask for the current ${model} price before paying.`
    },
    {
      kicker: "Storage",
      title: storage,
      text: "These storage choices are listed in the existing Mikee Gadget Plug catalogue. Confirm which one is available today."
    },
    {
      kicker: "Condition",
      title: "Brand new or UK-used",
      text: "Ask for the exact condition, photos and inspection details for the unit being offered."
    }
  ],
  series: (series, models, storage) => [
    {
      kicker: "Models",
      title: models,
      text: `Compare the ${series} models in the existing Mikee Gadget Plug catalogue, then confirm the exact model in stock.`
    },
    {
      kicker: "Storage",
      title: storage,
      text: "Storage varies by model. Ask for the current model-and-storage combinations before choosing."
    },
    {
      kicker: "Condition",
      title: "New and UK-used choices",
      text: "Request the condition, battery-health information for used units and the current price."
    }
  ]
};

export const landingPages = [
  {
    adGroupId: "AG01",
    adGroupName: "iPhone Instalment / Easy Buy",
    route: "/easy-buy/iphone",
    primaryKeywordTheme: "buy iPhone on instalment in Lagos",
    h1: "Buy an iPhone with Easy Buy in Lagos",
    eyebrow: "iPhone Easy Buy",
    heroText: "Start with a 40% initial deposit, then review an estimated 1–3 month repayment plan. Monthly is the default; eligible iPhone 11 and 12 offers may also have weekly or bi-weekly options.",
    primaryCta: "Apply for iPhone Easy Buy",
    secondaryCta: { label: "Use the iPhone calculator", href: "/easy-buy/#calculator" },
    whatsappMessage: "Hello, I want to buy an iPhone through Easy Buy. Please send me the 40% deposit, repayment options, eligible phones and verification requirements.",
    seoTitle: "iPhone Easy Buy in Lagos | 40% Deposit | Mikee Gadget Plug",
    metaDescription: "Apply for iPhone Easy Buy in Lagos with a 40% initial deposit and estimated 1–3 month repayment. Confirm eligibility and current iPhone prices.",
    conversionEventName: "begin_easy_buy_application",
    leadType: "easy_buy",
    pageType: "easy-buy",
    heroImage: "/images/15promax-1.jpeg",
    heroAlt: "iPhone available to enquire about through Mikee Gadget Plug Easy Buy",
    badge: "40% initial deposit",
    infoTitle: "See the deposit before the repayments",
    infoText: "The initial deposit is calculated from the confirmed device price. Repayment figures remain estimates until Mikee Gadget Plug reviews the application.",
    cards: [
      { kicker: "First", title: "40% initial deposit", text: "Confirmed phone price × 40%. This is the first and most important amount to plan for." },
      { kicker: "Second", title: "60% remaining balance", text: "The balance is used to estimate repayments over the selected 1–3 month duration." },
      { kicker: "Schedule", title: "Monthly by default", text: "Weekly or bi-weekly is shown only for eligible iPhone 11 and iPhone 12 offers." }
    ],
    buyerTitle: "Before you apply",
    buyerItems: [
      "Choose the exact iPhone model, storage and condition.",
      "Ask Mikee Gadget Plug to confirm today’s price before calculating.",
      "Select a one-, two- or three-month duration; monthly is the default.",
      "Prepare for verification that may involve your BVN or NIN."
    ],
    faqs: easyBuyFaq("iPhone"),
    finalTitle: "Start your iPhone Easy Buy request",
    finalText: "Send the model you want and ask Mikee Gadget Plug to confirm today’s price, your 40% deposit and the application requirements.",
    related: ["/iphone/iphone-11-series", "/iphone/iphone-12-series", "/iphone/iphone-13-series"]
  },
  {
    adGroupId: "AG02",
    adGroupName: "Samsung Instalment / Easy Buy",
    route: "/easy-buy/samsung",
    primaryKeywordTheme: "Samsung phone instalment plan Lagos",
    h1: "Ask About Samsung Easy Buy in Lagos",
    eyebrow: "Samsung Easy Buy enquiry",
    heroText: "Request an eligibility check for a Samsung phone plan. The estimate starts with a 40% initial deposit, with monthly repayment over 1–3 months as the default.",
    primaryCta: "Check Samsung Easy Buy Eligibility",
    secondaryCta: { label: "Call Mikee Gadget Plug", href: "tel:+2347086865133" },
    whatsappMessage: "Hello, I want to buy a Samsung phone through Easy Buy. Please confirm eligible Samsung models, today’s price, the 40% deposit, monthly repayment estimate and verification requirements.",
    seoTitle: "Samsung Easy Buy in Lagos | Ask Mikee Gadget Plug About Eligibility",
    metaDescription: "Ask about Samsung Easy Buy in Lagos. Request eligible models, today’s price, a 40% initial-deposit estimate and 1–3 month monthly options.",
    conversionEventName: "begin_easy_buy_application",
    leadType: "easy_buy",
    pageType: "easy-buy",
    heroImage: "/images/shop.jpeg",
    heroAlt: "Mikee Gadget Plug Communication store in Ikeja for Samsung Easy Buy enquiries",
    badge: "40% initial-deposit estimate",
    infoTitle: "Confirm Samsung eligibility before planning",
    infoText: "No Samsung model or approval is promised on this page. Mikee Gadget Plug must confirm the eligible model, device price and complete plan terms.",
    cards: [
      { kicker: "First", title: "40% initial deposit", text: "Once the phone price is confirmed, 40% is the starting deposit used for the estimate." },
      { kicker: "Second", title: "60% remaining balance", text: "The remaining balance is used to estimate the monthly repayment amount." },
      { kicker: "Duration", title: "1–3 months", text: "Monthly repayment is the default. Final dates and terms are confirmed during review." }
    ],
    buyerTitle: "What to confirm with Mikee Gadget Plug",
    buyerItems: [
      "Which Samsung models are currently eligible for Easy Buy.",
      "The exact model, storage, colour, condition and confirmed price.",
      "Your monthly repayment estimate over one to three months.",
      "The verification requirements, which may involve BVN or NIN."
    ],
    faqs: easyBuyFaq("Samsung"),
    finalTitle: "Request a Samsung Easy Buy check",
    finalText: "Tell Mikee Gadget Plug the Samsung model and budget you have in mind. The team will confirm whether it is eligible and explain the next steps.",
    related: ["/samsung/galaxy-a-series", "/samsung/galaxy-s25-series", "/samsung-shop-ikeja-lagos"]
  },
  {
    adGroupId: "AG03",
    adGroupName: "Used iPhone Buyers",
    route: "/used-iphones-lagos",
    primaryKeywordTheme: "UK used iPhones in Lagos",
    h1: "UK-Used iPhones in Lagos",
    eyebrow: "Used iPhone buying",
    heroText: "Compare Mikee Gadget Plug’s listed iPhone models, then request today’s price, available storage, exact condition and battery-health information for the unit offered.",
    primaryCta: "Check Used iPhone Availability",
    secondaryCta: { label: "Visit the Ikeja store", href: "#store" },
    whatsappMessage: "Hello, I’m looking for a UK-used iPhone in Lagos. Please send today’s available models, prices, storage options, exact condition and battery-health information.",
    seoTitle: "UK-Used iPhones in Lagos | Mikee Gadget Plug Ikeja",
    metaDescription: "Find UK-used iPhones in Lagos. Ask Mikee Gadget Plug for today’s models, prices, storage, condition and battery health, with pickup in Ikeja or delivery.",
    conversionEventName: "click_whatsapp",
    leadType: "price_availability",
    pageType: "used",
    heroImage: "/images/15promax-1.jpeg",
    heroAlt: "UK-used iPhone available to enquire about from Mikee Gadget Plug in Lagos",
    badge: "Condition confirmed per device",
    infoTitle: "Choose the exact used iPhone, not just the model name",
    infoText: "A used phone’s value depends on its specific storage, body condition, battery health and working features. Ask for details for the exact unit offered.",
    cards: [
      { kicker: "Condition", title: "Request exact device details", text: "Ask for current photos or a video and confirm the screen, body, cameras, charging and Face ID where applicable." },
      { kicker: "Battery", title: "Ask for battery health", text: "Request the reading for the exact iPhone and confirm it again during pickup or before delivery." },
      { kicker: "Choice", title: "iPhone 11 through 17", text: "These series appear in the existing Mikee Gadget Plug catalogue. Current stock and condition must be confirmed." }
    ],
    buyerTitle: "Used iPhone inspection checklist",
    buyerItems: [
      "Confirm the exact model, storage and colour.",
      "Request battery health and device-condition information.",
      "Test or confirm cameras, Face ID, charging, speakers and network.",
      "Ask for the written warranty or support terms for the exact unit."
    ],
    faqs: [
      { question: "Which UK-used iPhones does Mikee Gadget Plug list?", answer: "The existing catalogue covers iPhone 11 through iPhone 17 series. Ask which exact models and conditions are available today." },
      { question: "Will I see the battery health before buying?", answer: "Ask for the battery-health reading for the exact device offered and confirm it before payment." },
      { question: "Can I inspect a used iPhone in person?", answer: "Yes. Arrange pickup at 1 Ola Ayeni Street in Ikeja and inspect the exact phone offered." },
      { question: "Are used iPhone prices fixed?", answer: "Prices can vary by model, storage and condition. Use WhatsApp to request today’s price." },
      { question: "Can a used iPhone be delivered outside Lagos?", answer: "Delivery is available in Lagos and across Nigeria. Confirm the fee, timing and inspection arrangement first." }
    ],
    finalTitle: "Find the right UK-used iPhone",
    finalText: "Send your budget or preferred model and ask for today’s price, storage, condition and battery-health information.",
    related: ["/iphone/iphone-11-series", "/iphone/iphone-12-series", "/iphone/iphone-15-series"]
  },
  {
    adGroupId: "AG04",
    adGroupName: "iPhone Shop Lagos / Ikeja",
    route: "/iphone-shop-ikeja-lagos",
    primaryKeywordTheme: "iPhone shop in Ikeja Lagos",
    h1: "iPhone Shop in Ikeja, Lagos",
    eyebrow: "Visit Mikee Gadget Plug in Computer Village",
    heroText: "Visit Mikee Gadget Plug to ask about brand-new and UK-used iPhones, inspect the exact device offered, confirm today’s price and arrange pickup or delivery.",
    primaryCta: "Ask About Available iPhones",
    secondaryCta: { label: "Get store directions", href: "#store" },
    whatsappMessage: "Hello, I’m looking for an iPhone shop in Ikeja. Please send today’s available iPhone models, prices, storage options and store pickup details.",
    seoTitle: "iPhone Shop in Ikeja, Lagos | Mikee Gadget Plug Communication",
    metaDescription: "Visit Mikee Gadget Plug Communication, an iPhone shop at 1 Ola Ayeni Street, Ikeja. Ask about current models, prices, inspection, pickup and delivery.",
    conversionEventName: "click_whatsapp",
    leadType: "store_visit",
    pageType: "location",
    heroImage: "/images/shop.jpeg",
    heroAlt: "Mikee Gadget Plug Communication phone shop in Ikeja Lagos",
    badge: "Physical store in Ikeja",
    infoTitle: "Plan your iPhone purchase before visiting",
    infoText: "Send the model, storage and condition you want so Mikee Gadget Plug can confirm availability before you travel to Computer Village.",
    cards: [
      { kicker: "Address", title: "1 Ola Ayeni Street, Ikeja", text: "Off Simbiat Abiola Way, in the Computer Village area of Lagos." },
      { kicker: "Before pickup", title: "Confirm the exact device", text: "Ask for the model, storage, colour, condition and current price before visiting." },
      { kicker: "At the store", title: "Inspect before payment", text: "Review the exact phone offered and ask for the applicable written warranty or support terms." }
    ],
    buyerTitle: "What to bring to the conversation",
    buyerItems: [
      "Your preferred iPhone model or budget range.",
      "The storage, colour and condition you want.",
      "Whether you want to buy outright or ask about Easy Buy.",
      "Whether you prefer store pickup or delivery."
    ],
    faqs: [
      { question: "Where is Mikee Gadget Plug Communication in Ikeja?", answer: "The store address is 1 Ola Ayeni Street, off Simbiat Abiola Way, Ikeja, Computer Village, Lagos." },
      { question: "Should I confirm stock before visiting?", answer: "Yes. Send the exact iPhone model and storage on WhatsApp so Mikee Gadget Plug can confirm current availability." },
      { question: "Does Mikee Gadget Plug sell both brand-new and UK-used iPhones?", answer: "Both conditions appear in the existing Mikee Gadget Plug catalogue. Confirm the condition available for your model today." },
      { question: "Can I ask about Easy Buy in the store?", answer: "Yes. Ask for the current eligible devices, 40% initial deposit, repayment estimate and verification requirements." },
      { question: "Can Mikee Gadget Plug arrange delivery?", answer: "Delivery is available in Lagos and across Nigeria. Confirm the fee and timing before payment." }
    ],
    finalTitle: "Check stock before you visit",
    finalText: "Tell Mikee Gadget Plug which iPhone you want, then ask for today’s price and pickup details.",
    related: ["/used-iphones-lagos", "/deals/iphones", "/phone-shop-ikeja"]
  },
  {
    adGroupId: "AG05",
    adGroupName: "Samsung Shop Lagos / Ikeja",
    route: "/samsung-shop-ikeja-lagos",
    primaryKeywordTheme: "Samsung phone shop in Ikeja Lagos",
    h1: "Samsung Phone Shop in Ikeja, Lagos",
    eyebrow: "Samsung enquiries at Mikee Gadget Plug",
    heroText: "Ask about currently available Samsung phones, today’s price, storage, colour and condition before visiting the Mikee Gadget Plug store in Ikeja.",
    primaryCta: "Get Today’s Samsung Options",
    secondaryCta: { label: "Get store directions", href: "#store" },
    whatsappMessage: "Hello, I’m looking for a Samsung phone shop in Ikeja. Please send today’s available Samsung models, prices, storage options, colours and pickup details.",
    seoTitle: "Samsung Phone Shop in Ikeja, Lagos | Mikee Gadget Plug",
    metaDescription: "Ask Mikee Gadget Plug in Ikeja about current Samsung phones, prices, storage, colours and condition. Visit the Computer Village store or arrange delivery.",
    conversionEventName: "click_whatsapp",
    leadType: "store_visit",
    pageType: "location",
    heroImage: "/images/shop.jpeg",
    heroAlt: "Mikee Gadget Plug Communication store in Ikeja for Samsung phone enquiries",
    badge: "Confirm Samsung stock before visiting",
    infoTitle: "Start with the model and budget you have in mind",
    infoText: "The repository does not contain a verified Samsung price list, so this page asks Mikee Gadget Plug to confirm current models and prices rather than displaying assumptions.",
    cards: [
      { kicker: "Flagship", title: "Galaxy S and Fold enquiries", text: "Ask whether the S25 series, S25 Ultra or Fold 7 is available in your preferred configuration." },
      { kicker: "Value", title: "Galaxy A-series enquiries", text: "Share your budget and ask which A-series models are currently available." },
      { kicker: "Store", title: "Inspect in Ikeja", text: "Arrange pickup and ask to inspect the exact Samsung phone offered before payment." }
    ],
    buyerTitle: "What to confirm before buying",
    buyerItems: [
      "Exact Samsung model, storage, colour and condition.",
      "Today’s confirmed price for that configuration.",
      "Written warranty or after-sales terms for the exact unit.",
      "Pickup time or delivery fee and timing."
    ],
    faqs: samsungFaq("Samsung phone"),
    finalTitle: "Ask Mikee Gadget Plug for today’s Samsung options",
    finalText: "Send the Samsung model or budget you have in mind and request current price and availability.",
    related: ["/samsung/galaxy-s25-series", "/samsung/galaxy-a-series", "/deals/samsung-phones"]
  },
  {
    adGroupId: "AG06",
    adGroupName: "Phone Shop Near Me",
    route: "/phone-shop-ikeja",
    primaryKeywordTheme: "phone shop near me Ikeja",
    h1: "Phone Shop in Ikeja, Computer Village",
    eyebrow: "Find Mikee Gadget Plug Communication",
    heroText: "Visit Mikee Gadget Plug at 1 Ola Ayeni Street for iPhone, Samsung and other device enquiries, or message first to confirm current availability and price.",
    primaryCta: "Get Directions to Mikee Gadget Plug",
    secondaryCta: { label: "Call 0708 686 5133", href: "tel:+2347086865133" },
    whatsappMessage: "Hello, I found your phone shop in Ikeja. Please send today’s available phone brands, prices and store pickup details.",
    seoTitle: "Phone Shop in Ikeja, Computer Village | Mikee Gadget Plug",
    metaDescription: "Find Mikee Gadget Plug Communication at 1 Ola Ayeni Street, Ikeja, Computer Village. Call, WhatsApp, get directions or ask about pickup and delivery.",
    conversionEventName: "click_directions",
    leadType: "directions",
    pageType: "location",
    heroImage: "/images/shop.jpeg",
    heroAlt: "Mikee Gadget Plug Communication phone shop in Computer Village Ikeja",
    badge: "1 Ola Ayeni Street, Ikeja",
    infoTitle: "Contact the store before you travel",
    infoText: "Ask for the exact product, current price and pickup timing so the team can respond to your need directly.",
    cards: [
      { kicker: "Shop", title: "iPhones", text: "Ask about listed iPhone 11 through 17 models, condition, storage and current price." },
      { kicker: "Shop", title: "Samsung phones", text: "Request current Galaxy models, colours, storage and price." },
      { kicker: "Also ask about", title: "Other devices", text: "The existing site also lists Google Pixel phones, laptops, accessories and smartwatches as categories." }
    ],
    buyerTitle: "Choose how you want to buy",
    buyerItems: [
      "Call the store for a quick availability check.",
      "Send a model-specific WhatsApp message.",
      "Arrange store pickup and inspect the device.",
      "Ask about delivery in Lagos or across Nigeria."
    ],
    faqs: [
      { question: "What is the Mikee Gadget Plug store address?", answer: "1 Ola Ayeni Street, off Simbiat Abiola Way, Ikeja, Computer Village, Lagos, Nigeria." },
      { question: "What phone number can I call?", answer: "Call 0708 686 5133. You can also use the WhatsApp button on this page." },
      { question: "Which brands can I ask about?", answer: "The existing Mikee Gadget Plug site lists iPhone, Samsung and Google Pixel phones, plus laptops, accessories and smartwatches." },
      { question: "Can I arrange store pickup?", answer: "Yes. Confirm the exact device, price and pickup time with Mikee Gadget Plug before visiting." },
      { question: "Does Mikee Gadget Plug deliver outside Ikeja?", answer: "Delivery is available in Lagos and across Nigeria. Confirm the fee and timing before payment." }
    ],
    finalTitle: "Get directions or check a phone first",
    finalText: "Open directions to the store, or message Mikee Gadget Plug with the exact phone you want before travelling.",
    related: ["/iphone-shop-ikeja-lagos", "/samsung-shop-ikeja-lagos", "/used-iphones-lagos"]
  },
  {
    adGroupId: "AG07",
    adGroupName: "iPhone 17 Pro Max",
    route: "/iphone/iphone-17-pro-max",
    primaryKeywordTheme: "iPhone 17 Pro Max price Lagos",
    h1: "iPhone 17 Pro Max Price & Availability in Lagos",
    eyebrow: "iPhone 17 Pro Max enquiry",
    heroText: "Request today’s price and confirm whether your preferred storage, colour and condition is available for pickup in Ikeja or delivery.",
    primaryCta: "Check iPhone 17 Pro Max Availability",
    secondaryCta: { label: "Compare the iPhone 17 series", href: "/iphone/iphone-17-series" },
    whatsappMessage: "Hello, I’m interested in the iPhone 17 Pro Max. Please send me today’s price, available storage options, colours and condition.",
    seoTitle: "iPhone 17 Pro Max Price in Lagos | Mikee Gadget Plug",
    metaDescription: "Check iPhone 17 Pro Max price and availability in Lagos. Ask Mikee Gadget Plug about 128GB, 256GB, 512GB or 1TB, colours, condition and pickup.",
    conversionEventName: "click_whatsapp",
    leadType: "price_availability",
    pageType: "product",
    productName: "iPhone 17 Pro Max",
    condition: "Confirm new or UK-used",
    heroImage: "/images/17promax-1.jpg",
    heroAlt: "iPhone 17 Pro Max available to enquire about from Mikee Gadget Plug",
    badge: "128GB · 256GB · 512GB · 1TB",
    infoTitle: "Confirm the exact iPhone 17 Pro Max you want",
    infoText: "The Mikee Gadget Plug catalogue lists four storage choices. Price and availability depend on the exact unit and must be confirmed.",
    cards: intentCards.price("iPhone 17 Pro Max", "128GB, 256GB, 512GB or 1TB"),
    buyerTitle: "Your buying checklist",
    buyerItems: iphoneConditions,
    faqs: priceAvailabilityFaq("iPhone 17 Pro Max"),
    finalTitle: "Check iPhone 17 Pro Max availability",
    finalText: "Ask for today’s price and the storage, colour and condition currently available.",
    related: ["/iphone/iphone-17-series", "/iphone/iphone-16-pro-max", "/deals/iphones"]
  },
  {
    adGroupId: "AG08",
    adGroupName: "iPhone 17 Series",
    route: "/iphone/iphone-17-series",
    primaryKeywordTheme: "iPhone 17 series price Lagos",
    h1: "Compare the iPhone 17 Series in Lagos",
    eyebrow: "iPhone 17 series comparison",
    heroText: "Compare iPhone 17, iPhone 17 Air, iPhone 17 Pro and iPhone 17 Pro Max, then ask which model, storage, colour and condition is available today.",
    primaryCta: "Compare Available iPhone 17 Models",
    secondaryCta: { label: "See iPhone 17 Pro Max", href: "/iphone/iphone-17-pro-max" },
    whatsappMessage: "Hello, I want to compare the iPhone 17 series. Please send today’s prices and available models, storage options, colours and conditions.",
    seoTitle: "Compare iPhone 17 Series in Lagos | Mikee Gadget Plug",
    metaDescription: "Compare iPhone 17, 17 Air, 17 Pro and 17 Pro Max in Lagos. Ask Mikee Gadget Plug for today’s prices, storage, colours and availability.",
    conversionEventName: "select_phone",
    leadType: "comparison",
    pageType: "series",
    productName: "iPhone 17 Series",
    condition: "Confirm new or UK-used",
    heroImage: "/images/17pro-1.jpg",
    heroAlt: "iPhone 17 series model available to enquire about from Mikee Gadget Plug",
    badge: "17 · 17 Air · 17 Pro · 17 Pro Max",
    infoTitle: "Choose by size, storage and budget",
    infoText: "The existing catalogue lists four iPhone 17 models. Ask Mikee Gadget Plug to confirm which models and configurations are available.",
    cards: intentCards.series("iPhone 17 series", "17, 17 Air, 17 Pro and 17 Pro Max", "128GB through 1TB, depending on model"),
    buyerTitle: "How to narrow your choice",
    buyerItems: [
      "Start with the screen size and phone style you prefer.",
      "Choose the storage that fits your photos, videos and apps.",
      "Ask for current prices across two or more models.",
      "Confirm colour, condition and pickup or delivery."
    ],
    faqs: seriesFaq("iPhone 17 series"),
    finalTitle: "Compare today’s iPhone 17 options",
    finalText: "Tell Mikee Gadget Plug which models you want compared and request the current configurations and prices.",
    related: ["/iphone/iphone-17-pro-max", "/iphone/iphone-16-series", "/deals/iphones"]
  },
  {
    adGroupId: "AG09",
    adGroupName: "iPhone 16 Pro Max",
    route: "/iphone/iphone-16-pro-max",
    primaryKeywordTheme: "iPhone 16 Pro Max price Lagos",
    h1: "iPhone 16 Pro Max Price & Availability in Lagos",
    eyebrow: "iPhone 16 Pro Max enquiry",
    heroText: "Ask for today’s iPhone 16 Pro Max price, available storage, colour and condition before arranging pickup or delivery.",
    primaryCta: "Check iPhone 16 Pro Max Availability",
    secondaryCta: { label: "Compare the iPhone 16 series", href: "/iphone/iphone-16-series" },
    whatsappMessage: "Hello, I’m interested in the iPhone 16 Pro Max. Please send me today’s price, available storage options, colours and condition.",
    seoTitle: "iPhone 16 Pro Max Price in Lagos | Mikee Gadget Plug",
    metaDescription: "Check iPhone 16 Pro Max price and availability in Lagos. Ask Mikee Gadget Plug about 128GB, 256GB, 512GB or 1TB, colour and condition.",
    conversionEventName: "click_whatsapp",
    leadType: "price_availability",
    pageType: "product",
    productName: "iPhone 16 Pro Max",
    condition: "Confirm new or UK-used",
    heroImage: "/images/16promax-1.jpg",
    heroAlt: "iPhone 16 Pro Max available to enquire about from Mikee Gadget Plug",
    badge: "128GB · 256GB · 512GB · 1TB",
    infoTitle: "Match the price to the exact configuration",
    infoText: "Storage and condition affect the offer. Ask for the price attached to the exact unit you are considering.",
    cards: intentCards.price("iPhone 16 Pro Max", "128GB, 256GB, 512GB or 1TB"),
    buyerTitle: "Your buying checklist",
    buyerItems: iphoneConditions,
    faqs: priceAvailabilityFaq("iPhone 16 Pro Max"),
    finalTitle: "Get today’s iPhone 16 Pro Max price",
    finalText: "Send your preferred storage, colour and condition to receive the matching current offer.",
    related: ["/iphone/iphone-16-series", "/iphone/iphone-15-pro-max", "/easy-buy/iphone"]
  },
  {
    adGroupId: "AG10",
    adGroupName: "iPhone 16 Series",
    route: "/iphone/iphone-16-series",
    primaryKeywordTheme: "iPhone 16 series price Lagos",
    h1: "Compare the iPhone 16 Series in Lagos",
    eyebrow: "iPhone 16 series comparison",
    heroText: "Compare iPhone 16, iPhone 16 Plus, iPhone 16 Pro and iPhone 16 Pro Max, then confirm current price, storage, colour and condition.",
    primaryCta: "Compare Available iPhone 16 Models",
    secondaryCta: { label: "See iPhone 16 Pro Max", href: "/iphone/iphone-16-pro-max" },
    whatsappMessage: "Hello, I want to compare the iPhone 16 series. Please send today’s prices and available models, storage options, colours and conditions.",
    seoTitle: "Compare iPhone 16 Series in Lagos | Mikee Gadget Plug",
    metaDescription: "Compare iPhone 16, 16 Plus, 16 Pro and 16 Pro Max in Lagos. Ask Mikee Gadget Plug for today’s prices, storage, colours and availability.",
    conversionEventName: "select_phone",
    leadType: "comparison",
    pageType: "series",
    productName: "iPhone 16 Series",
    condition: "Confirm new or UK-used",
    heroImage: "/images/16-1.jpg",
    heroAlt: "iPhone 16 series model available to enquire about from Mikee Gadget Plug",
    badge: "16 · 16 Plus · 16 Pro · 16 Pro Max",
    infoTitle: "Compare the four listed iPhone 16 models",
    infoText: "Ask Mikee Gadget Plug to price the exact storage and condition you want so you can compare like with like.",
    cards: intentCards.series("iPhone 16 series", "16, 16 Plus, 16 Pro and 16 Pro Max", "128GB through 1TB, depending on model"),
    buyerTitle: "How to narrow your choice",
    buyerItems: [
      "Choose standard, larger-screen Plus or a Pro model.",
      "Compare storage and condition at the same time as price.",
      "Ask whether outright purchase or Easy Buy fits your plan.",
      "Confirm store pickup or delivery before payment."
    ],
    faqs: seriesFaq("iPhone 16 series"),
    finalTitle: "Compare iPhone 16 models with today’s prices",
    finalText: "Ask Mikee Gadget Plug for the current configurations and prices of the iPhone 16 models you are considering.",
    related: ["/iphone/iphone-16-pro-max", "/iphone/iphone-15-series", "/easy-buy/iphone"]
  },
  {
    adGroupId: "AG11",
    adGroupName: "iPhone 15 Pro Max",
    route: "/iphone/iphone-15-pro-max",
    primaryKeywordTheme: "iPhone 15 Pro Max price Lagos",
    h1: "iPhone 15 Pro Max Price & Availability in Lagos",
    eyebrow: "iPhone 15 Pro Max enquiry",
    heroText: "Request today’s iPhone 15 Pro Max price and confirm storage, colour, condition and battery health for a UK-used unit.",
    primaryCta: "Check iPhone 15 Pro Max Availability",
    secondaryCta: { label: "Compare the iPhone 15 series", href: "/iphone/iphone-15-series" },
    whatsappMessage: "Hello, I’m interested in the iPhone 15 Pro Max. Please send me today’s price, available storage options, colours, condition and battery health if UK-used.",
    seoTitle: "iPhone 15 Pro Max Price in Lagos | Mikee Gadget Plug",
    metaDescription: "Check iPhone 15 Pro Max price and availability in Lagos. Ask about 256GB, 512GB or 1TB, colour, condition and used-device battery health.",
    conversionEventName: "click_whatsapp",
    leadType: "price_availability",
    pageType: "product",
    productName: "iPhone 15 Pro Max",
    condition: "Confirm new or UK-used",
    heroImage: "/images/15promax-1.jpeg",
    heroAlt: "iPhone 15 Pro Max available to enquire about from Mikee Gadget Plug",
    badge: "256GB · 512GB · 1TB",
    infoTitle: "Ask for the offer that matches your exact phone",
    infoText: "The existing catalogue lists three storage choices. For a used unit, request the current condition and battery-health reading.",
    cards: intentCards.price("iPhone 15 Pro Max", "256GB, 512GB or 1TB"),
    buyerTitle: "Your buying checklist",
    buyerItems: iphoneConditions,
    faqs: priceAvailabilityFaq("iPhone 15 Pro Max"),
    finalTitle: "Check iPhone 15 Pro Max availability",
    finalText: "Ask for today’s price and the exact storage, colour and condition you want.",
    related: ["/iphone/iphone-15-series", "/iphone/iphone-14-pro-max", "/easy-buy/iphone"]
  },
  {
    adGroupId: "AG12",
    adGroupName: "iPhone 15 Series",
    route: "/iphone/iphone-15-series",
    primaryKeywordTheme: "iPhone 15 series price Lagos",
    h1: "Compare the iPhone 15 Series in Lagos",
    eyebrow: "iPhone 15 series comparison",
    heroText: "Compare the iPhone 15, iPhone 15 Pro and iPhone 15 Pro Max models listed by Mikee Gadget Plug, then request current prices and availability.",
    primaryCta: "Compare Available iPhone 15 Models",
    secondaryCta: { label: "See iPhone 15 Pro Max", href: "/iphone/iphone-15-pro-max" },
    whatsappMessage: "Hello, I want to compare the iPhone 15 series. Please send today’s prices and available models, storage options, colours and conditions.",
    seoTitle: "Compare iPhone 15 Series in Lagos | Mikee Gadget Plug",
    metaDescription: "Compare iPhone 15, 15 Pro and 15 Pro Max in Lagos. Ask Mikee Gadget Plug for today’s prices, storage, colours, condition and availability.",
    conversionEventName: "select_phone",
    leadType: "comparison",
    pageType: "series",
    productName: "iPhone 15 Series",
    condition: "Confirm new or UK-used",
    heroImage: "/images/15-1.jpeg",
    heroAlt: "iPhone 15 series model available to enquire about from Mikee Gadget Plug",
    badge: "15 · 15 Pro · 15 Pro Max",
    infoTitle: "Compare the listed iPhone 15 models",
    infoText: "Use one message to request prices for the exact models and storage choices you want to compare.",
    cards: intentCards.series("iPhone 15 series", "15, 15 Pro and 15 Pro Max", "128GB through 1TB, depending on model"),
    buyerTitle: "How to compare the offers",
    buyerItems: [
      "Choose the standard or Pro experience you need.",
      "Compare the same storage and condition across models.",
      "For used devices, request battery health and exact condition.",
      "Ask about outright payment or current Easy Buy eligibility."
    ],
    faqs: seriesFaq("iPhone 15 series"),
    finalTitle: "Compare iPhone 15 prices today",
    finalText: "Send the models and storage choices you want compared and ask for current availability.",
    related: ["/iphone/iphone-15-pro-max", "/iphone/iphone-14-series", "/easy-buy/iphone"]
  },
  {
    adGroupId: "AG13",
    adGroupName: "iPhone 14 Pro Max",
    route: "/iphone/iphone-14-pro-max",
    primaryKeywordTheme: "iPhone 14 Pro Max UK used price Lagos",
    h1: "iPhone 14 Pro Max Condition, Battery Health & Price",
    eyebrow: "iPhone 14 Pro Max buying check",
    heroText: "Ask for the exact unit’s current price, storage, colour, body condition and battery-health reading before you buy.",
    primaryCta: "Check iPhone 14 Pro Max Details",
    secondaryCta: { label: "Compare the iPhone 14 series", href: "/iphone/iphone-14-series" },
    whatsappMessage: "Hello, I’m interested in the iPhone 14 Pro Max. Please send today’s price, available storage, colours, exact condition and battery health for the unit offered.",
    seoTitle: "iPhone 14 Pro Max Price & Battery Health | Mikee Gadget Plug",
    metaDescription: "Check iPhone 14 Pro Max price, condition and battery health in Lagos. Ask Mikee Gadget Plug about 128GB, 256GB, 512GB or 1TB and availability.",
    conversionEventName: "click_whatsapp",
    leadType: "price_availability",
    pageType: "product",
    productName: "iPhone 14 Pro Max",
    condition: "New or UK-used; confirm exact unit",
    heroImage: "/images/14promax-1.jpeg",
    heroAlt: "iPhone 14 Pro Max available to enquire about from Mikee Gadget Plug",
    badge: "Condition and battery health on request",
    infoTitle: "The exact used unit matters",
    infoText: "Two phones of the same model can differ in condition and battery health. Ask for details tied to the exact iPhone offered.",
    cards: [
      { kicker: "Battery", title: "Request the current reading", text: "Ask for battery health for the exact unit and confirm it before payment." },
      { kicker: "Condition", title: "Review the device itself", text: "Request photos or a video and inspect the body, screen, cameras, charging and Face ID." },
      { kicker: "Storage", title: "128GB, 256GB, 512GB or 1TB", text: "These options appear in the existing catalogue. Confirm the one available today." }
    ],
    buyerTitle: "Your used-device checklist",
    buyerItems: iphoneConditions,
    faqs: priceAvailabilityFaq("iPhone 14 Pro Max"),
    finalTitle: "Ask about the exact iPhone 14 Pro Max unit",
    finalText: "Get today’s price together with the storage, condition and battery-health information you need to decide.",
    related: ["/iphone/iphone-14-series", "/used-iphones-lagos", "/iphone/iphone-15-pro-max"]
  },
  {
    adGroupId: "AG14",
    adGroupName: "iPhone 14 Series",
    route: "/iphone/iphone-14-series",
    primaryKeywordTheme: "iPhone 14 series price Lagos",
    h1: "Compare the iPhone 14 Series in Lagos",
    eyebrow: "iPhone 14 series comparison",
    heroText: "Compare iPhone 14, iPhone 14 Pro and iPhone 14 Pro Max, then confirm today’s price, condition, storage and battery health where applicable.",
    primaryCta: "Compare Available iPhone 14 Models",
    secondaryCta: { label: "See iPhone 14 Pro Max", href: "/iphone/iphone-14-pro-max" },
    whatsappMessage: "Hello, I want to compare the iPhone 14 series. Please send today’s prices, available models, storage options, conditions and battery health for used units.",
    seoTitle: "Compare iPhone 14 Series in Lagos | Mikee Gadget Plug",
    metaDescription: "Compare iPhone 14, 14 Pro and 14 Pro Max in Lagos. Ask Mikee Gadget Plug for today’s prices, storage, condition and used-device battery health.",
    conversionEventName: "select_phone",
    leadType: "comparison",
    pageType: "series",
    productName: "iPhone 14 Series",
    condition: "Confirm new or UK-used",
    heroImage: "/images/14-1.jpeg",
    heroAlt: "iPhone 14 series model available to enquire about from Mikee Gadget Plug",
    badge: "14 · 14 Pro · 14 Pro Max",
    infoTitle: "Compare model and condition together",
    infoText: "Ask for the exact configuration and condition so the price comparison reflects the phone you would actually receive.",
    cards: intentCards.series("iPhone 14 series", "14, 14 Pro and 14 Pro Max", "128GB through 1TB, depending on model"),
    buyerTitle: "How to choose",
    buyerItems: [
      "Compare the standard iPhone 14 with Pro models.",
      "Choose storage for your current and future use.",
      "For used units, compare battery health and exact condition.",
      "Ask about outright purchase or Easy Buy eligibility."
    ],
    faqs: seriesFaq("iPhone 14 series"),
    finalTitle: "Compare today’s iPhone 14 offers",
    finalText: "Ask for model-specific prices, storage, condition and battery-health information.",
    related: ["/iphone/iphone-14-pro-max", "/iphone/iphone-13-series", "/used-iphones-lagos"]
  },
  {
    adGroupId: "AG15",
    adGroupName: "iPhone 13 Series",
    route: "/iphone/iphone-13-series",
    primaryKeywordTheme: "iPhone 13 price and Easy Buy Lagos",
    h1: "iPhone 13 Series: Outright or Easy Buy",
    eyebrow: "Compare purchase options",
    heroText: "Compare iPhone 13, iPhone 13 Pro and iPhone 13 Pro Max, then ask for today’s outright price or a 40% initial-deposit Easy Buy estimate.",
    primaryCta: "Compare iPhone 13 Purchase Options",
    secondaryCta: { label: "Open Easy Buy calculator", href: "/easy-buy/#calculator" },
    whatsappMessage: "Hello, I want to compare iPhone 13 models for outright purchase or Easy Buy. Please send today’s prices, available storage, condition and a 40% deposit estimate.",
    seoTitle: "iPhone 13 Series Price or Easy Buy in Lagos | Mikee Gadget Plug",
    metaDescription: "Compare iPhone 13, 13 Pro and 13 Pro Max in Lagos. Request today’s outright price or a 40% initial-deposit Easy Buy estimate.",
    conversionEventName: "select_phone",
    leadType: "comparison",
    pageType: "series",
    productName: "iPhone 13 Series",
    condition: "Confirm new or UK-used",
    heroImage: "/images/13-1.jpeg",
    heroAlt: "iPhone 13 series model available to enquire about from Mikee Gadget Plug",
    badge: "Outright or Easy Buy enquiry",
    infoTitle: "Compare the phone and the payment path",
    infoText: "First confirm the exact phone price. For Easy Buy, the 40% deposit comes first and all repayment amounts are estimates until approved.",
    cards: [
      { kicker: "Models", title: "13, 13 Pro and 13 Pro Max", text: "These models appear in the Mikee Gadget Plug catalogue. Confirm the current model and condition." },
      { kicker: "Outright", title: "Request today’s full price", text: "Ask for the price tied to the storage, colour and condition you want." },
      { kicker: "Easy Buy", title: "Start with a 40% deposit estimate", text: "Monthly repayment over one to three months is the default, subject to review." }
    ],
    buyerTitle: "Choose the option that fits",
    buyerItems: [
      "Compare the iPhone 13 models and storage choices.",
      "Ask for the outright price first.",
      "If considering Easy Buy, calculate the 40% deposit.",
      "Review estimated repayments and verification requirements."
    ],
    faqs: [
      ...seriesFaq("iPhone 13 series").slice(0, 3),
      { question: "Can I ask for an iPhone 13 Easy Buy estimate?", answer: "Yes. Ask for today’s confirmed phone price first, then calculate the 40% initial deposit and estimated monthly repayments." },
      { question: "Does an Easy Buy estimate guarantee approval?", answer: "No. Mikee Gadget Plug must confirm eligibility, repayment dates and complete terms after reviewing the application." }
    ],
    finalTitle: "Compare outright and Easy Buy for iPhone 13",
    finalText: "Send the model you want and request both today’s outright price and the 40% deposit estimate.",
    related: ["/easy-buy/iphone", "/iphone/iphone-14-series", "/iphone/iphone-12-series"]
  },
  {
    adGroupId: "AG16",
    adGroupName: "iPhone 12 Series",
    route: "/iphone/iphone-12-series",
    primaryKeywordTheme: "iPhone 12 price by budget Lagos",
    h1: "Find an iPhone 12 Series Phone for Your Budget",
    eyebrow: "iPhone 12 budget guide",
    heroText: "Compare iPhone 12, iPhone 12 Pro and iPhone 12 Pro Max by model, storage and condition, then request today’s price or an Easy Buy estimate.",
    primaryCta: "Find an iPhone 12 for My Budget",
    secondaryCta: { label: "Open Easy Buy calculator", href: "/easy-buy/#calculator" },
    whatsappMessage: "Hello, I’m looking for an iPhone 12 series phone within my budget. Please send available models, storage, condition, today’s prices and eligible payment options.",
    seoTitle: "iPhone 12 Series Prices by Budget in Lagos | Mikee Gadget Plug",
    metaDescription: "Find an iPhone 12, 12 Pro or 12 Pro Max for your budget in Lagos. Ask about current price, storage, condition and Easy Buy options.",
    conversionEventName: "select_phone",
    leadType: "budget_match",
    pageType: "series",
    productName: "iPhone 12 Series",
    condition: "Confirm new or UK-used",
    heroImage: "/images/12.jpeg",
    heroAlt: "iPhone 12 series model available to enquire about from Mikee Gadget Plug",
    badge: "12 · 12 Pro · 12 Pro Max",
    infoTitle: "Send your budget and non-negotiables",
    infoText: "A useful recommendation needs your budget, preferred model, minimum storage and whether you are open to a UK-used phone.",
    cards: [
      { kicker: "Models", title: "12, 12 Pro and 12 Pro Max", text: "Compare the listed models, then ask which one is available in your budget." },
      { kicker: "Storage", title: "64GB through 512GB", text: "Storage depends on the model. Confirm the exact current configuration." },
      { kicker: "Payment", title: "Outright or eligible Easy Buy", text: "Easy Buy starts with a 40% deposit estimate; monthly is default, with eligible weekly or bi-weekly choices." }
    ],
    buyerTitle: "How to get a useful recommendation",
    buyerItems: [
      "State your maximum budget.",
      "Choose your minimum acceptable storage.",
      "Say whether UK-used condition is acceptable.",
      "Ask for outright and eligible Easy Buy options."
    ],
    faqs: [
      ...seriesFaq("iPhone 12 series").slice(0, 3),
      { question: "Can iPhone 12 offers have weekly or bi-weekly repayments?", answer: "Eligible iPhone 12 offers may show weekly or bi-weekly options in addition to the monthly default. Mikee Gadget Plug must confirm eligibility and terms." },
      { question: "How much is the Easy Buy deposit?", answer: "The initial deposit estimate is 40% of the confirmed phone price." }
    ],
    finalTitle: "Find an iPhone 12 that fits your budget",
    finalText: "Send your budget, storage preference and condition choice for a model-specific response.",
    related: ["/easy-buy/iphone", "/iphone/iphone-11-series", "/used-iphones-lagos"]
  },
  {
    adGroupId: "AG17",
    adGroupName: "iPhone 11 Series",
    route: "/iphone/iphone-11-series",
    primaryKeywordTheme: "buy iPhone 11 outright or payment plan Lagos",
    h1: "Buy an iPhone 11 Outright or with a Short Plan",
    eyebrow: "iPhone 11 buying options",
    heroText: "Compare iPhone 11, iPhone 11 Pro and iPhone 11 Pro Max, then ask for today’s outright price or a 40% initial-deposit Easy Buy estimate.",
    primaryCta: "Check iPhone 11 Buying Options",
    secondaryCta: { label: "Open Easy Buy calculator", href: "/easy-buy/#calculator" },
    whatsappMessage: "Hello, I’m interested in an iPhone 11 series phone. Please send today’s outright prices, available storage and condition, plus eligible Easy Buy repayment options.",
    seoTitle: "Buy iPhone 11 Outright or Easy Buy in Lagos | Mikee Gadget Plug",
    metaDescription: "Compare iPhone 11, 11 Pro and 11 Pro Max in Lagos. Request outright prices or a 40% initial-deposit Easy Buy estimate.",
    conversionEventName: "select_phone",
    leadType: "comparison",
    pageType: "series",
    productName: "iPhone 11 Series",
    condition: "Confirm new or UK-used",
    heroImage: "/images/11-1.jpeg",
    heroAlt: "iPhone 11 series model available to enquire about from Mikee Gadget Plug",
    badge: "Outright · monthly · eligible weekly/bi-weekly",
    infoTitle: "Compare price, condition and repayment schedule",
    infoText: "Eligible iPhone 11 offers can show weekly or bi-weekly repayment choices in addition to the monthly default. Approval is never guaranteed.",
    cards: [
      { kicker: "Models", title: "11, 11 Pro and 11 Pro Max", text: "Choose a model, then confirm its available storage, condition and price." },
      { kicker: "Outright", title: "Request today’s price", text: "Ask for the price tied to the exact device condition and storage." },
      { kicker: "Easy Buy", title: "40% deposit estimate first", text: "Eligible offers may include monthly, weekly or bi-weekly schedules over one to three months." }
    ],
    buyerTitle: "Before you decide",
    buyerItems: [
      "Compare the iPhone 11 models and storage choices.",
      "For used units, request condition and battery health.",
      "Ask for the outright price and 40% deposit estimate.",
      "Review only the repayment schedules Mikee Gadget Plug confirms as eligible."
    ],
    faqs: [
      ...seriesFaq("iPhone 11 series").slice(0, 3),
      { question: "Can an iPhone 11 plan be weekly or bi-weekly?", answer: "Eligible iPhone 11 offers may include weekly or bi-weekly repayment in addition to the monthly default." },
      { question: "Is approval automatic after I pay 40%?", answer: "No. Do not treat an estimate as approval. Mikee Gadget Plug must review and confirm eligibility and complete terms." }
    ],
    finalTitle: "Check today’s iPhone 11 buying options",
    finalText: "Ask for the outright price, exact device details and any eligible Easy Buy schedule.",
    related: ["/easy-buy/iphone", "/iphone/iphone-12-series", "/used-iphones-lagos"]
  },
  {
    adGroupId: "AG18",
    adGroupName: "Galaxy S25 Ultra",
    route: "/samsung/galaxy-s25-ultra",
    primaryKeywordTheme: "Samsung Galaxy S25 Ultra price Lagos",
    h1: "Galaxy S25 Ultra Price & Availability in Lagos",
    eyebrow: "Galaxy S25 Ultra enquiry",
    heroText: "Ask Mikee Gadget Plug to confirm today’s Galaxy S25 Ultra price and the storage, colour and condition currently available.",
    primaryCta: "Get Today’s S25 Ultra Price",
    secondaryCta: { label: "Compare the Galaxy S25 series", href: "/samsung/galaxy-s25-series" },
    whatsappMessage: "Hello, I’m interested in the Samsung Galaxy S25 Ultra. Please send today’s price, available storage options, colours and condition.",
    seoTitle: "Galaxy S25 Ultra Price in Lagos | Mikee Gadget Plug",
    metaDescription: "Check Samsung Galaxy S25 Ultra price and availability in Lagos. Ask Mikee Gadget Plug about current storage, colours, condition, pickup and delivery.",
    conversionEventName: "click_whatsapp",
    leadType: "price_availability",
    pageType: "product",
    productName: "Samsung Galaxy S25 Ultra",
    condition: "Confirm current condition",
    heroImage: "/images/shop.jpeg",
    heroAlt: "Mikee Gadget Plug Communication store for Galaxy S25 Ultra enquiries in Lagos",
    badge: "Request today’s exact configuration",
    infoTitle: "Match the price to the exact S25 Ultra",
    infoText: "No Samsung price or stock list exists in the repository. Mikee Gadget Plug will confirm the available storage, colour, condition and price.",
    cards: [
      { kicker: "Price", title: "Request today’s price", text: "Ask for the price attached to the exact storage, colour and condition offered." },
      { kicker: "Configuration", title: "Confirm storage and colour", text: "Do not assume a variant is in stock; request the options currently available." },
      { kicker: "Handover", title: "Pickup or delivery", text: "Arrange inspection and pickup in Ikeja, or confirm delivery details for your location." }
    ],
    buyerTitle: "What to confirm before paying",
    buyerItems: [
      "Exact model, storage, colour and condition.",
      "Today’s price for that configuration.",
      "Written warranty or after-sales terms for the unit.",
      "Pickup arrangement or delivery fee and timing."
    ],
    faqs: samsungFaq("Galaxy S25 Ultra"),
    finalTitle: "Get today’s Galaxy S25 Ultra offer",
    finalText: "Ask for the exact configurations and price currently available from Mikee Gadget Plug.",
    related: ["/samsung/galaxy-s25-series", "/samsung-shop-ikeja-lagos", "/deals/samsung-phones"]
  },
  {
    adGroupId: "AG19",
    adGroupName: "Galaxy S25 Series",
    route: "/samsung/galaxy-s25-series",
    primaryKeywordTheme: "Samsung Galaxy S25 series price Lagos",
    h1: "Compare the Samsung Galaxy S25 Series in Lagos",
    eyebrow: "Galaxy S25 comparison",
    heroText: "Ask Mikee Gadget Plug which Galaxy S25 models, storage options, colours and conditions are available, then compare today’s prices.",
    primaryCta: "Compare Available Galaxy S25 Models",
    secondaryCta: { label: "See Galaxy S25 Ultra", href: "/samsung/galaxy-s25-ultra" },
    whatsappMessage: "Hello, I want to compare the Samsung Galaxy S25 series. Please send today’s available models, prices, storage options, colours and conditions.",
    seoTitle: "Compare Samsung Galaxy S25 Series in Lagos | Mikee Gadget Plug",
    metaDescription: "Compare currently available Samsung Galaxy S25 series phones in Lagos. Ask Mikee Gadget Plug for models, prices, storage, colours and condition.",
    conversionEventName: "select_phone",
    leadType: "comparison",
    pageType: "series",
    productName: "Samsung Galaxy S25 Series",
    condition: "Confirm current condition",
    heroImage: "/images/shop.jpeg",
    heroAlt: "Mikee Gadget Plug Communication store for Galaxy S25 series enquiries",
    badge: "Compare current S25 options",
    infoTitle: "Build a comparison from confirmed stock",
    infoText: "Rather than assuming every variant is available, ask Mikee Gadget Plug to list the current S25 models and configurations side by side.",
    cards: [
      { kicker: "Models", title: "Request the current S25 lineup", text: "Ask which Galaxy S25 models are available today, including whether S25 Ultra stock is present." },
      { kicker: "Configuration", title: "Compare storage and colour", text: "Request the price for each exact configuration you are considering." },
      { kicker: "Purchase", title: "Confirm condition and terms", text: "Ask for condition, inspection details and written warranty or support terms." }
    ],
    buyerTitle: "How to make a clean comparison",
    buyerItems: [
      "Ask for the currently available S25 models.",
      "Compare prices at the same storage and condition.",
      "Choose your preferred colour from confirmed stock.",
      "Confirm pickup or delivery and applicable written terms."
    ],
    faqs: samsungFaq("Galaxy S25 series"),
    finalTitle: "Compare today’s Galaxy S25 options",
    finalText: "Ask Mikee Gadget Plug to send a model-by-model list of current configurations and prices.",
    related: ["/samsung/galaxy-s25-ultra", "/samsung/galaxy-z-fold-7", "/deals/samsung-phones"]
  },
  {
    adGroupId: "AG20",
    adGroupName: "Galaxy Z Fold 7",
    route: "/samsung/galaxy-z-fold-7",
    primaryKeywordTheme: "Samsung Galaxy Z Fold 7 price Lagos",
    h1: "Galaxy Z Fold 7 Price, Colour & Storage in Lagos",
    eyebrow: "Galaxy Z Fold 7 enquiry",
    heroText: "Request today’s Galaxy Z Fold 7 price and ask which storage, colour and condition is available before arranging pickup or delivery.",
    primaryCta: "Check Galaxy Z Fold 7 Availability",
    secondaryCta: { label: "Call Mikee Gadget Plug", href: "tel:+2347086865133" },
    whatsappMessage: "Hello, I’m interested in the Samsung Galaxy Z Fold 7. Please send today’s price and the available storage options, colours and condition.",
    seoTitle: "Galaxy Z Fold 7 Price in Lagos | Mikee Gadget Plug",
    metaDescription: "Check Samsung Galaxy Z Fold 7 price and availability in Lagos. Ask Mikee Gadget Plug about current storage, colours, condition, pickup and delivery.",
    conversionEventName: "click_whatsapp",
    leadType: "price_availability",
    pageType: "product",
    productName: "Samsung Galaxy Z Fold 7",
    condition: "Confirm current condition",
    heroImage: "/images/shop.jpeg",
    heroAlt: "Mikee Gadget Plug Communication store for Galaxy Z Fold 7 enquiries",
    badge: "Confirm colour and storage",
    infoTitle: "Ask about the exact Fold 7 configuration",
    infoText: "Current price depends on the unit offered. Mikee Gadget Plug must confirm storage, colour, condition and availability.",
    cards: [
      { kicker: "Price", title: "Request today’s price", text: "Ask for the price tied to the exact configuration offered." },
      { kicker: "Options", title: "Confirm storage and colour", text: "Request only current options; no stock combination is assumed on this page." },
      { kicker: "Purchase", title: "Arrange inspection or delivery", text: "Visit the Ikeja store or confirm the delivery arrangement before payment." }
    ],
    buyerTitle: "What to confirm",
    buyerItems: [
      "Exact Fold 7 storage, colour and condition.",
      "Today’s confirmed price.",
      "Inspection and applicable written warranty terms.",
      "Pickup time or delivery fee and timing."
    ],
    faqs: samsungFaq("Galaxy Z Fold 7"),
    finalTitle: "Check today’s Galaxy Z Fold 7 stock",
    finalText: "Ask Mikee Gadget Plug which storage and colour combinations are available and request the matching price.",
    related: ["/samsung/galaxy-s25-series", "/samsung-shop-ikeja-lagos", "/deals/samsung-phones"]
  },
  {
    adGroupId: "AG22",
    adGroupName: "Samsung Galaxy A Series",
    route: "/samsung/galaxy-a-series",
    primaryKeywordTheme: "affordable Samsung Galaxy A series Lagos",
    h1: "Find an Affordable Samsung Galaxy A-Series Phone",
    eyebrow: "Galaxy A-series budget match",
    heroText: "Share your budget and ask Mikee Gadget Plug which Galaxy A-series models, storage options, colours and conditions are available today.",
    primaryCta: "Find a Galaxy A-Series Phone",
    secondaryCta: { label: "Ask about Samsung Easy Buy", href: "/easy-buy/samsung" },
    whatsappMessage: "Hello, I’m looking for an affordable Samsung Galaxy A-series phone. My budget is ____. Please send available models, prices, storage options, colours and condition.",
    seoTitle: "Affordable Samsung Galaxy A Series in Lagos | Mikee Gadget Plug",
    metaDescription: "Find a Samsung Galaxy A-series phone for your budget in Lagos. Ask Mikee Gadget Plug for today’s available models, prices, storage, colours and condition.",
    conversionEventName: "select_phone",
    leadType: "budget_match",
    pageType: "series",
    productName: "Samsung Galaxy A Series",
    condition: "Confirm current condition",
    heroImage: "/images/shop.jpeg",
    heroAlt: "Mikee Gadget Plug Communication store for Galaxy A-series enquiries",
    badge: "Start with your budget",
    infoTitle: "A useful recommendation begins with your budget",
    infoText: "The repository does not contain a verified A-series stock list. Send your budget so Mikee Gadget Plug can respond with current options only.",
    cards: [
      { kicker: "Step 1", title: "Set your maximum budget", text: "Include your budget in the WhatsApp message so unsuitable options can be removed." },
      { kicker: "Step 2", title: "Choose storage and condition", text: "Say what storage you need and whether you have a condition preference." },
      { kicker: "Step 3", title: "Compare confirmed models", text: "Review only the models, prices and colours Mikee Gadget Plug confirms as available." }
    ],
    buyerTitle: "Tell Mikee Gadget Plug what matters",
    buyerItems: [
      "Your maximum budget.",
      "Minimum storage and preferred colour.",
      "New or used condition preference, if any.",
      "Outright purchase or a request for Easy Buy eligibility."
    ],
    faqs: [
      { question: "Which Galaxy A-series phone fits my budget?", answer: "Send your budget, preferred storage and condition. Mikee Gadget Plug will confirm which current A-series options match." },
      { question: "Are prices displayed on this page?", answer: "No verified Samsung price list exists in the repository, so the page asks Mikee Gadget Plug for today’s price instead of inventing one." },
      { question: "Can I ask for Samsung Easy Buy?", answer: "Yes. Ask which Samsung models are currently eligible. The estimate starts with a 40% deposit, but approval is not guaranteed." },
      { question: "Can I inspect the phone in Ikeja?", answer: "Yes. Arrange pickup at the Mikee Gadget Plug store and inspect the exact device offered before payment." },
      { question: "Can Mikee Gadget Plug deliver the phone?", answer: "Delivery is available in Lagos and across Nigeria. Confirm the fee and timing first." }
    ],
    finalTitle: "Find a Galaxy A-series phone for your budget",
    finalText: "Add your budget to the message and ask for the current models and prices that match.",
    related: ["/easy-buy/samsung", "/deals/samsung-phones", "/samsung-shop-ikeja-lagos"]
  },
  {
    adGroupId: "AG23",
    adGroupName: "Samsung Phone Deals",
    route: "/deals/samsung-phones",
    primaryKeywordTheme: "Samsung phone deals Lagos",
    h1: "Current Samsung Phone Deals in Lagos",
    eyebrow: "Samsung deal enquiry",
    heroText: "Ask Mikee Gadget Plug for today’s Samsung offers. Every deal must be confirmed with the exact model, storage, colour, condition and current price.",
    primaryCta: "Get Today’s Samsung Deals",
    secondaryCta: { label: "Browse Samsung buying options", href: "/samsung-shop-ikeja-lagos" },
    whatsappMessage: "Hello, please send me today’s Samsung phone deals, including the exact models, prices, storage options, colours and condition.",
    seoTitle: "Samsung Phone Deals in Lagos | Today’s Mikee Gadget Plug Offers",
    metaDescription: "Request today’s Samsung phone deals in Lagos. Mikee Gadget Plug will confirm exact models, prices, storage, colours, condition, pickup and delivery.",
    conversionEventName: "click_whatsapp",
    leadType: "deal",
    pageType: "deal",
    heroImage: "/images/shop.jpeg",
    heroAlt: "Mikee Gadget Plug Communication store for current Samsung phone deal enquiries",
    badge: "Offers confirmed on request",
    infoTitle: "A real deal needs an exact phone and price",
    infoText: "No countdown, fake discount or assumed stock is used. Ask for the current offer and compare the exact device configuration.",
    cards: [
      { kicker: "Flagship", title: "Ask about S-series offers", text: "Request current S25-series and other available S-series deals." },
      { kicker: "Foldable", title: "Ask about Fold offers", text: "Request current Fold models, configurations and prices." },
      { kicker: "Budget", title: "Ask about A-series offers", text: "Send your budget and ask for current A-series options." }
    ],
    buyerTitle: "How to judge a deal",
    buyerItems: [
      "Compare the exact model, storage and condition.",
      "Ask whether the shown price is current today.",
      "Confirm written warranty or support terms.",
      "Include pickup or delivery cost in your decision."
    ],
    faqs: [
      { question: "Which Samsung phones are on offer today?", answer: "Offers can change. Use the WhatsApp button to request current Samsung models, configurations and prices." },
      { question: "Are the deals guaranteed to stay available?", answer: "No. Mikee Gadget Plug must confirm the exact price and availability when you enquire." },
      { question: "Can I compare two Samsung deals?", answer: "Yes. Ask for model, storage, colour, condition and price for each phone so you can compare fairly." },
      { question: "Can I collect a deal in Ikeja?", answer: "Yes. Confirm the exact device and pickup time before visiting 1 Ola Ayeni Street." },
      { question: "Can a Samsung deal be delivered?", answer: "Delivery is available in Lagos and across Nigeria. Confirm the fee and timing before payment." }
    ],
    finalTitle: "Get today’s confirmed Samsung offers",
    finalText: "Ask Mikee Gadget Plug to send only current deals with the exact model, configuration, condition and price.",
    related: ["/samsung/galaxy-s25-series", "/samsung/galaxy-a-series", "/easy-buy/samsung"]
  },
  {
    adGroupId: "AG24",
    adGroupName: "iPhone Deals",
    route: "/deals/iphones",
    primaryKeywordTheme: "iPhone deals Lagos",
    h1: "Current iPhone Deals in Lagos",
    eyebrow: "iPhone deal enquiry",
    heroText: "Request today’s Mikee Gadget Plug iPhone offers and compare exact model, storage, condition, battery health for used units and current price.",
    primaryCta: "Get Today’s iPhone Deals",
    secondaryCta: { label: "Browse UK-used iPhones", href: "/used-iphones-lagos" },
    whatsappMessage: "Hello, please send me today’s iPhone deals, including the exact models, prices, storage options, condition and battery health for used units.",
    seoTitle: "iPhone Deals in Lagos | Today’s Mikee Gadget Plug Offers",
    metaDescription: "Request today’s iPhone deals in Lagos. Compare exact models, prices, storage, condition and battery health for used units before buying.",
    conversionEventName: "click_whatsapp",
    leadType: "deal",
    pageType: "deal",
    heroImage: "/images/14promax-1.jpeg",
    heroAlt: "iPhone available to enquire about in Mikee Gadget Plug current deals",
    badge: "Today’s price on request",
    infoTitle: "Compare the real device, not just a deal label",
    infoText: "Mikee Gadget Plug must confirm the current price and exact unit. For used iPhones, include condition and battery health in the comparison.",
    cards: [
      { kicker: "Value", title: "Ask about iPhone 11–13 deals", text: "Send your budget and ask which current models and conditions fit." },
      { kicker: "Pro", title: "Ask about Pro Max offers", text: "Request current Pro Max models, storage choices and prices." },
      { kicker: "Latest", title: "Ask about iPhone 16–17 offers", text: "Confirm current configurations, condition and price before deciding." }
    ],
    buyerTitle: "How to compare iPhone offers",
    buyerItems: [
      "Compare exact model, storage and condition.",
      "For used units, request battery health and device details.",
      "Ask for today’s confirmed price.",
      "Compare outright purchase with eligible Easy Buy estimates."
    ],
    faqs: [
      { question: "Which iPhone deals are available today?", answer: "Use WhatsApp to request the current models, storage, condition and prices. No stock is assumed on this page." },
      { question: "Do deal prices change?", answer: "They can. Confirm today’s price for the exact unit before making a payment." },
      { question: "Will a used iPhone deal include battery health?", answer: "Ask Mikee Gadget Plug for the battery-health reading and condition of the exact used iPhone offered." },
      { question: "Can I use Easy Buy on an iPhone deal?", answer: "Ask whether the exact phone is eligible. Easy Buy estimates start with a 40% deposit, but approval is not guaranteed." },
      { question: "Can I pick up the phone in Ikeja?", answer: "Yes. Confirm the device and pickup time before visiting the Mikee Gadget Plug store." }
    ],
    finalTitle: "Get today’s confirmed iPhone deals",
    finalText: "Ask for current offers with the exact model, storage, condition and price you can compare.",
    related: ["/used-iphones-lagos", "/easy-buy/iphone", "/iphone/iphone-15-series"]
  }
];

export const pageByRoute = new Map(landingPages.map((page) => [page.route, page]));
