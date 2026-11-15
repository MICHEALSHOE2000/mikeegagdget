// Policy pages. Text marked DRAFT restates only what the store has already published; anything the owner has not
// confirmed is left as "confirmed with you before you pay" rather than invented. Edit this file to change a policy.
const nav='<ul class="policy-nav"><li><a href="/warranty-policy/">Warranty</a></li><li><a href="/returns-refunds/">Returns &amp; refunds</a></li><li><a href="/delivery-policy/">Delivery</a></li><li><a href="/terms/">Terms</a></li></ul>';
const contact='<p>Questions? <a href="https://wa.me/2347086865133">Chat on WhatsApp</a> or call <a href="tel:+2347086865133">0708 686 5133</a>. Store: 1 Ola Ayeni Street, Off Simbiat Abiola Way, Computer Village, Ikeja, Lagos.</p>';
const rights='<p>Nothing on this page limits any right you have under Nigerian consumer protection law.</p>';
const wrap=(h1,body)=>`<div class="policy-page"><h1>${h1}</h1>${nav}${body}${rights}${contact}</div>`;
export const policyPages=[
 {path:'warranty-policy',title:'Warranty Policy',description:'Mikee Gadget Plug warranty: every device includes a 7-day warranty. How to report a fault and what happens next.',html:wrap('Warranty Policy',`
<h2>7-day warranty</h2><p>Every product sold by Mikee Gadget Plug includes a 7-day warranty, counted from the day you receive or collect it.</p>
<h2>Reporting a fault</h2><p>If your product is faulty or is not what you ordered, contact us within the warranty period with your order reference and a description of the problem. We will assess it and arrange the next step with you.</p>
<h2>Test before you pay</h2><p>When you buy in store or collect an order at our Computer Village store, you can inspect and test the device before you pay. For delivered orders, payment is made online first; check the device as soon as it arrives.</p>
<!-- DRAFT: owner to confirm exclusions (for example physical or liquid damage after delivery) and whether repair, replacement or refund applies. -->
<h2>What the warranty covers</h2><p>The exact cover for your device, including anything that is not covered, is confirmed with you before you pay. Ask us if you are unsure.</p>`)},
 {path:'returns-refunds',title:'Returns and Refunds Policy',description:'How returns and refunds work at Mikee Gadget Plug, and how to report a faulty or incorrectly supplied product.',html:wrap('Returns and Refunds Policy',`
<h2>Faulty or incorrect products</h2><p>If a product is faulty or incorrectly supplied, contact us within the 7-day warranty period with your order reference. We assess each case and agree the next step with you.</p>
<h2>Change of mind</h2><p>We do not promise unconditional returns or automatic refunds. Please review the exact product, condition, storage, colour and total before paying.</p>
<h2>Failed or cancelled payments</h2><p>An order is confirmed only after the payment provider verifies your payment. If a payment fails or is cancelled, the order is not placed.</p>
<!-- DRAFT: owner to confirm refund method and timescale, return shipping responsibility and the condition a returned product must be in. -->
<h2>How refunds are made</h2><p>Where a refund is agreed, we confirm the method and timing with you at that point.</p>`)},
 {path:'delivery-policy',title:'Delivery Policy',description:'Free nationwide delivery from Mikee Gadget Plug. Same-day delivery in Lagos where possible, 24–48-hour target for other states, or store pickup in Ikeja.',html:wrap('Delivery Policy',`
<h2>Free nationwide delivery</h2><p>Delivery is free across Nigeria on orders placed on this website.</p>
<h2>Delivery times</h2><ul><li><strong>Lagos:</strong> same-day delivery where possible.</li><li><strong>Other states:</strong> we aim for 24–48 hours, subject to dispatch and carrier confirmation.</li></ul><p>These are targets, not guarantees. We contact you after payment to confirm your delivery.</p>
<h2>Store pickup</h2><p>You can collect your order at 1 Ola Ayeni Street, Computer Village, Ikeja, Lagos. We call you when it is ready, and you can test the device at pickup.</p>
<!-- DRAFT: owner to confirm the carriers used, the same-day order cut-off time and what happens after a failed delivery attempt. -->
<h2>Receiving your order</h2><p>Please make sure someone can receive the order at the address you give. Check the device when it arrives and contact us straight away if anything is wrong.</p>`)},
 {path:'terms',title:'Terms and Conditions',description:'Terms for buying from Mikee Gadget Plug online: prices, payment by Paystack or Credit Direct, orders, delivery and warranty.',html:wrap('Terms and Conditions',`
<h2>Who we are</h2><p>Mikee Gadget Plug sells phones, tablets, laptops, wearables, gaming products and accessories from Computer Village, Ikeja, Lagos, and through this website.</p>
<h2>Products and prices</h2><p>Prices are in Nigerian naira (₦) and are shown for the exact storage, colour and condition you select. Hot Deals show the original price and the price after 10% off. The total you pay is confirmed at checkout.</p>
<h2>Payment</h2><ul><li><strong>Pay in full:</strong> secure payment by Paystack.</li><li><strong>Pay Small Small:</strong> instalments with Credit Direct. Credit Direct decides approval, down payment and repayments; their terms apply to the credit.</li></ul><p>Your order is confirmed only after payment is verified.</p>
<h2>Availability</h2><p>If an item you paid for turns out to be unavailable, we contact you to agree an alternative or a refund.</p>
<h2>Delivery, warranty and returns</h2><p>See our <a href="/delivery-policy/">Delivery Policy</a>, <a href="/warranty-policy/">Warranty Policy</a> and <a href="/returns-refunds/">Returns and Refunds Policy</a>.</p>
<h2>Your information</h2><p>We use the details you give at checkout to process, deliver and support your order.</p>
<!-- DRAFT: owner to add registered business name and number, governing law and dispute process, and a privacy notice. -->`)}
];
