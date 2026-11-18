// One footer for every page (black, global-retail style). Applied to all pages by scripts/apply-experience.mjs.
const i={
 pin:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
 mail:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>',
 phone:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z"/></svg>',
 wa:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 0 1-11.8 7L4 20l1.1-4A8 8 0 1 1 20 12Z"/><path d="M9 8.5c0 3.5 2.5 6.5 6.5 6.5l1-1.5-2-1-1 1c-1.2-.5-2.5-1.8-3-3l1-1-1-2Z"/></svg>',
 clock:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
 shield:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v6c0 4.5 3 7.7 7 9 4-1.3 7-4.5 7-9V6Z"/><path d="m9 12 2 2 4-4"/></svg>'
};
const col=(title,links)=>`<nav class="mg-footer-col" aria-label="${title}"><h2>${title}</h2><ul>${links.map(([t,h])=>`<li><a href="${h}">${t}</a></li>`).join('')}</ul></nav>`;
export const SITE_FOOTER=`<footer class="mg-footer" id="contact">
<div class="mg-footer-promise"><div class="mg-footer-inner"><span>${i.shield}7-day warranty</span><span>Free nationwide delivery</span><span>Secure Paystack checkout</span><span>Test before you pay in store</span></div></div>
<div class="mg-footer-inner mg-footer-main">
<div class="mg-footer-brand"><a class="mg-footer-logo" href="/" aria-label="Mikee Gadget Plug home"><span class="mg-footer-mark" aria-hidden="true">M</span><span>MIKEE<small>GADGET PLUG</small></span></a>
<p class="mg-footer-tag">Genuine UK Used &amp; Brand New phones, tablets, watches and audio. Buy. Swap. Upgrade.</p>
<ul class="mg-footer-contact"><li>${i.pin}<span>1 Ola Ayeni Street, Off Simbiat Abiola Way,<br>Computer Village, Ikeja, Lagos, Nigeria.</span></li>
<li>${i.mail}<a href="mailto:support@mikeegadget.com.ng">support@mikeegadget.com.ng</a></li>
<li>${i.phone}<a href="tel:+2347086865133">+234 708 686 5133</a></li>
<li>${i.wa}<a href="https://wa.me/2347086865133">Chat on WhatsApp</a></li></ul></div>
${col('Shop',[['iPhones','/iphones'],['Samsung','/samsung-phones'],['Google Pixel','/google-pixel-phones'],['iPads &amp; tablets','/shop/ipads/'],['Smartwatches','/shop/watches/'],['Hot Deals','/deals/']])}
${col('My Account',[['Saved items','/account/'],['Track an order','/account/'],['My cart','/cart/'],['Swap your phone','/phone-swap/']])}
${col('Customer Service',[['Warranty','/warranty-policy/'],['Order tracking','/account/'],['Shipping &amp; Delivery','/delivery-policy/'],['Returns, Refunds &amp; Replacement','/returns-refunds/']])}
${col('Support',[['Visit our store','/#visit'],['Contact us','https://wa.me/2347086865133'],['Email support','mailto:support@mikeegadget.com.ng'],['Buying guide','/blog/best-uk-used-iphone-shop']])}
</div>
<section class="mg-footer-inner mg-footer-community" data-community hidden><h2>Join Our Gadget Deals Community</h2><button class="btn btn-primary" disabled>Join Group</button><p data-community-note>Our community invite will be available here soon.</p></section>
<div class="mg-footer-inner mg-footer-bottom"><p>© 2026 <strong>MIKEEGADGETS &amp; COMMUNICATIONS LIMITED</strong>. All rights reserved.</p>
<nav class="mg-footer-legal" aria-label="Legal"><a href="/terms/">Terms</a><a href="/privacy-policy/">Privacy</a><a href="/returns-refunds/">Refund policy</a><a href="/privacy-policy/#cookies">Cookies</a></nav>
<div class="mg-footer-pay" aria-label="Payment methods"><span>Visa</span><span>Mastercard</span><span>Verve</span><span>Bank transfer</span><span class="mg-pay-strong">Paystack</span></div></div>
</footer>`;
export const FOOTER_CSS='<link rel="stylesheet" href="/assets/footer.css">';
