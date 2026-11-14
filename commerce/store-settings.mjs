// Owner-confirmed 11 November 2026. Shared by storefront and checkout.
export const storeSettings = Object.freeze({
  deliveryFeeNgn: 0,
  deliveryLagos: 'Same-day delivery in Lagos',
  deliveryOtherStates: 'Delivery within 24–48 hours to other states',
  pickupAddress: '1 Ola Ayeni Street, Off Simbiat Abiola Way, Computer Village, Ikeja, Lagos',
  warrantyDays: 7,
  featuredProducts: ['iphone-18-pro-max','iphone-18-pro','iphone-17-pro-max','iphone-16-pro-max','iphone-15-pro-max','iphone-13'],
  // Default homepage mix for “Find your next device”; the administrator can publish a different selection.
  homeFeaturedProducts: ['iphone-18-pro-max','iphone-17-pro-max-wifi-only','pixel-11-pro-xl','samsung-s26-ultra','apple-watch-ultra-4','ipad-air-8th-gen-11-inch-m4'],
  // Credit Direct checkout integration requires the merchant's documented SDK/API.
  creditDirectCheckoutUrl: null
});
