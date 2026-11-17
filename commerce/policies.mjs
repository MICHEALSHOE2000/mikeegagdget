// Policy pages. Refund, Terms and Privacy follow standard e-commerce practice (owner instruction, 17 Nov 2026,
// for the Paystack account review). Edit this file to change a policy.
const nav='<ul class="policy-nav"><li><a href="/warranty-policy/">Warranty</a></li><li><a href="/returns-refunds/">Refunds &amp; returns</a></li><li><a href="/delivery-policy/">Delivery</a></li><li><a href="/terms/">Terms</a></li><li><a href="/privacy-policy/">Privacy</a></li></ul>';
const contact='<p>Questions? <a href="https://wa.me/2347086865133">Chat on WhatsApp</a> or call <a href="tel:+2347086865133">0708 686 5133</a>. Store: 1 Ola Ayeni Street, Off Simbiat Abiola Way, Computer Village, Ikeja, Lagos.</p>';
const rights='<p>Nothing on this page limits any right you have under Nigerian consumer protection law.</p>';
const wrap=(h1,body)=>`<div class="policy-page"><h1>${h1}</h1>${nav}${body}${rights}${contact}</div>`;
export const policyPages=[
 {path:'warranty-policy',title:'Warranty Policy',description:'Mikee Gadget Plug warranty: every device includes a 7-day warranty. How to report a fault and what happens next.',html:wrap('Warranty Policy',`
<h2>7-day warranty</h2><p>Every product sold by Mikee Gadget Plug includes a 7-day warranty, counted from the day you receive or collect it.</p>
<h2>Reporting a fault</h2><p>If your product is faulty or is not what you ordered, contact us within the warranty period with your order reference and a description of the problem. We will assess it and arrange the next step with you.</p>
<h2>Test before you pay</h2><p>When you buy in store or collect an order at our Computer Village store, you can inspect and test the device before you pay. For delivered orders, payment is made online first; check the device as soon as it arrives.</p>
<h2>What the warranty covers</h2><p>Faults that were present when you received the device. We repair or replace the device and, if neither is possible, refund you in full, as set out in our <a href="/returns-refunds/">Refund and Returns Policy</a>.</p>
<h2>What it does not cover</h2><p>Damage after delivery from drops, liquid, misuse or repairs by anyone other than Mikee Gadget Plug, and loss of data. Please back up your device.</p>`)},
 {path:'returns-refunds',title:'Refund and Returns Policy',description:'When you can get a refund or replacement from Mikee Gadget Plug, how to ask for one, and how long refunds take.',html:wrap('Refund and Returns Policy',`
<p class="policy-updated">Last updated: 17 November 2026</p>
<p>This policy explains when you can return a product or get a refund, and how to ask for one. It applies to orders placed on this website and to purchases at our store in Computer Village, Ikeja.</p>
<h2>1. When you can get a refund, repair or replacement</h2>
<p>Contact us within <strong>7 days</strong> of receiving or collecting your product if:</p>
<ul><li>the product is faulty;</li><li>you received the wrong product, storage size, colour or condition; or</li><li>the product is materially different from its description on our website.</li></ul>
<p>After we check the product, we will repair it or replace it with the same item. If we cannot do either, we will give you a full refund.</p>
<h2>2. Change of mind</h2>
<p>We do not accept returns for change of mind once a product has been delivered to you or collected. Please check the model, storage, colour, condition (Brand New or UK Used), network notes (for example eSIM only or Wi‑Fi Only) and the total before you pay. If you are unsure, ask us first on WhatsApp.</p>
<h2>3. Cancelling an order</h2>
<ul><li><strong>Before dispatch or collection:</strong> you can cancel and receive a full refund.</li><li><strong>If we cannot supply your order</strong> (for example, the item is no longer in stock), we will offer you an alternative or a full refund. The choice is yours.</li><li><strong>Pricing errors:</strong> if a product was clearly listed at the wrong price, we will contact you before dispatch. You can pay the correct price or cancel for a full refund.</li></ul>
<h2>4. Condition of returned products</h2>
<p>To qualify, a returned product must:</p>
<ul><li>come back with its box, charger and any accessories supplied with it;</li><li>be free of physical damage, liquid damage or tampering that happened after delivery;</li><li>not have been opened or repaired by anyone other than Mikee Gadget Plug; and</li><li>be signed out of all accounts (Apple ID / iCloud, Google, Samsung), with screen locks removed.</li></ul>
<p>The 7-day warranty does not cover damage caused by accidents, misuse, liquid or unauthorised repairs.</p>
<h2>5. How to request a refund or return</h2>
<ol><li>Contact us on <a href="https://wa.me/2347086865133">WhatsApp</a> or call <a href="tel:+2347086865133">0708 686 5133</a> within 7 days. Give your <strong>order reference</strong>, describe the problem and, if you can, send photos or a short video.</li><li>We reply within 2 business days and tell you how to return the product. You can bring it to our store or we will arrange collection. If the product is faulty or we sent the wrong item, we pay the return delivery cost.</li><li>We inspect the product, usually within 2 business days of receiving it, and tell you the outcome.</li></ol>
<h2>6. How refunds are paid</h2>
<ul><li><strong>Paid by card or bank transfer (Paystack):</strong> we refund the same payment method through Paystack. We start the refund within 3 business days of approving it. It usually reaches your account within 5–10 business days, depending on your bank.</li><li><strong>Paid in store:</strong> refunded by bank transfer to an account in the buyer’s name.</li><li><strong>Pay Small Small (Credit Direct):</strong> we tell Credit Direct about the return, and the loan is cancelled or settled under Credit Direct’s terms. Any down payment you made is refunded to you.</li></ul>
<p>The refund is the amount you paid for the product, including any delivery charge. If a payment failed but you were still charged, or you were charged twice, contact us with the payment reference and we will refund the extra amount in full.</p>
<h2>7. Failed or cancelled payments</h2>
<p>An order is placed only after the payment provider confirms your payment. If a payment fails or is cancelled, no order is created. Any amount that was held is released by your bank.</p>`)},
 {path:'delivery-policy',title:'Delivery Policy',description:'Free nationwide delivery from Mikee Gadget Plug. Same-day delivery in Lagos where possible, 24–48-hour target for other states, or store pickup in Ikeja.',html:wrap('Delivery Policy',`
<h2>Free nationwide delivery</h2><p>Delivery is free across Nigeria on orders placed on this website.</p>
<h2>Delivery times</h2><ul><li><strong>Lagos:</strong> same-day delivery where possible.</li><li><strong>Other states:</strong> we aim for 24–48 hours, subject to dispatch and carrier confirmation.</li></ul><p>These are targets, not guarantees. We contact you after payment to confirm your delivery.</p>
<h2>Store pickup</h2><p>You can collect your order at 1 Ola Ayeni Street, Computer Village, Ikeja, Lagos. We call you when it is ready, and you can test the device at pickup.</p>
<!-- DRAFT: owner to confirm the carriers used, the same-day order cut-off time and what happens after a failed delivery attempt. -->
<h2>Receiving your order</h2><p>Please make sure someone can receive the order at the address you give. Check the device when it arrives and contact us straight away if anything is wrong.</p>`)},
 {path:'terms',title:'Terms and Conditions',description:'Terms for buying from Mikee Gadget Plug: products and conditions, prices, payment by Paystack or Credit Direct, delivery, warranty, refunds and your rights.',html:wrap('Terms and Conditions',`
<p class="policy-updated">Last updated: 17 November 2026</p>
<p>These terms apply when you buy from Mikee Gadget Plug on this website or at our store. By placing an order you agree to them, together with our <a href="/returns-refunds/">Refund and Returns Policy</a>, <a href="/warranty-policy/">Warranty Policy</a>, <a href="/delivery-policy/">Delivery Policy</a> and <a href="/privacy-policy/">Privacy Policy</a>.</p>
<h2>1. Who we are</h2>
<p>Mikee Gadget Plug sells phones, tablets, laptops, smartwatches, audio, gaming products and accessories. Our store is at 1 Ola Ayeni Street, Off Simbiat Abiola Way, Computer Village, Ikeja, Lagos. You can contact us on WhatsApp or by phone at 0708 686 5133.</p>
<h2>2. Who can buy</h2>
<p>You must be at least 18 years old, or have the permission of a parent or guardian, and you must give accurate contact and delivery details.</p>
<h2>3. Products and their condition</h2>
<ul><li><strong>Brand New:</strong> new, unused devices. “Non-Active” means the device has not been activated.</li><li><strong>UK Used:</strong> pre-owned devices in good working order. They may show light signs of use.</li><li>Network notes shown on a product, such as <strong>eSIM only</strong> or <strong>Wi‑Fi Only (eSIM locked)</strong>, are part of the description. Wi‑Fi Only devices may not support mobile calls or mobile data.</li><li>Photos may be representative. The colour, storage and condition you select are what you receive. Ask us if you need a photo of the actual unit.</li></ul>
<h2>4. Prices</h2>
<p>Prices are in Nigerian naira (₦) and include any delivery charge stated at checkout. Hot Deals show the original price crossed out next to the discounted price, for a limited time. Prices can change at any time, but a change does not affect an order you have already paid for, except in the case of a clear pricing error (see the Refund and Returns Policy).</p>
<h2>5. Orders and payment</h2>
<ul><li><strong>Pay in full:</strong> by card or bank transfer, processed securely by Paystack. We never see or store your full card details.</li><li><strong>Pay Small Small:</strong> instalments through Credit Direct. Credit Direct decides on approval, the down payment and the repayment schedule, and its own terms apply to the credit.</li></ul>
<p>Your order is confirmed only after the payment is verified. We may decline or cancel an order if we suspect fraud, if the item is unavailable, or if the price was clearly wrong. In any of these cases you receive a full refund.</p>
<h2>6. Delivery and collection</h2>
<p>Delivery times and options are explained in our <a href="/delivery-policy/">Delivery Policy</a>. Responsibility for the product passes to you when it is delivered to the address you gave or collected from our store. Please check the product as soon as you receive it.</p>
<h2>7. Warranty, returns and refunds</h2>
<p>Every product includes a 7-day warranty. Faulty, wrong or materially different products are handled as described in our <a href="/warranty-policy/">Warranty Policy</a> and <a href="/returns-refunds/">Refund and Returns Policy</a>.</p>
<h2>8. Phone swap</h2>
<p>A swap value shown online is an estimate. The final value is confirmed after we inspect your device in person. The device you trade in must be yours, fully paid for, and signed out of all accounts.</p>
<h2>9. Our responsibility</h2>
<p>We are responsible for supplying products as described and for any loss that is a foreseeable result of our breaking these terms. We are not responsible for indirect losses, for loss of data (please back up your device), or for delays caused by events outside our reasonable control. Nothing in these terms limits liability that cannot be limited by law, including your rights under the Federal Competition and Consumer Protection Act 2018.</p>
<h2>10. Your information</h2>
<p>We handle your personal information as described in our <a href="/privacy-policy/">Privacy Policy</a>.</p>
<h2>11. Website content</h2>
<p>The text, logo and design of this website belong to Mikee Gadget Plug. Product names and trademarks belong to their owners.</p>
<h2>12. Complaints and governing law</h2>
<p>If you have a complaint, please contact us first. We aim to resolve it within 5 business days. These terms are governed by the laws of the Federal Republic of Nigeria. Any dispute that we cannot resolve together will be handled by the courts of Lagos State.</p>
<h2>13. Changes to these terms</h2>
<p>We may update these terms. The version published on the day you place your order applies to that order.</p>`)},
 {path:'privacy-policy',title:'Privacy Policy',description:'How Mikee Gadget Plug collects, uses, stores and protects your personal information, and your rights under the Nigeria Data Protection Act 2023.',html:wrap('Privacy Policy',`
<p class="policy-updated">Last updated: 17 November 2026</p>
<p>This policy explains what personal information Mikee Gadget Plug collects, why, who we share it with, how we protect it, and the rights you have under the Nigeria Data Protection Act 2023 (NDPA).</p>
<h2>1. Who is responsible for your information</h2>
<p>Mikee Gadget Plug, 1 Ola Ayeni Street, Off Simbiat Abiola Way, Computer Village, Ikeja, Lagos, is responsible for the personal information described here. Contact us about privacy on <a href="https://wa.me/2347086865133">WhatsApp</a> or at 0708 686 5133.</p>
<h2>2. What we collect</h2>
<ul><li><strong>Order details you give us:</strong> first and last name, phone number, email address, delivery address, city and state, order notes, and what you buy.</li><li><strong>Payment information:</strong> Paystack processes your payment. We receive the payment reference, amount and status, but <strong>not</strong> your full card or bank details.</li><li><strong>Pay Small Small:</strong> if you choose Credit Direct, Credit Direct collects the information it needs to assess your application, under its own privacy policy. We receive the application and payment status for your order.</li><li><strong>Messages:</strong> what you send us on WhatsApp, by phone or by email, for example about an order or a swap.</li><li><strong>Information kept on your device:</strong> your cart, saved items, filters and which advert brought you to our site are stored in your browser, not on our servers. You can clear them in your browser settings.</li><li><strong>Advertising measurement:</strong> we use the TikTok Pixel. It uses cookies and similar technology to record pages you visit and actions you take (for example, adding to cart), so we can measure our TikTok adverts.</li></ul>
<h2>3. How we use it, and our legal basis</h2>
<ul><li>To process, deliver and support your order, and to provide the warranty: <em>performance of a contract</em>.</li><li>To keep accounting and tax records and to meet legal obligations: <em>legal obligation</em>.</li><li>To prevent fraud and keep our website secure: <em>legitimate interests</em>.</li><li>To measure our adverts and improve our website: <em>legitimate interests</em> or, where required, your <em>consent</em>.</li></ul>
<p>We do not sell your personal information.</p>
<h2>4. Who we share it with</h2>
<ul><li><strong>Paystack:</strong> to take your payment.</li><li><strong>Credit Direct:</strong> only if you choose Pay Small Small.</li><li><strong>Delivery partners:</strong> your name, phone number and address, so they can deliver your order.</li><li><strong>Service providers that run our website:</strong> secure hosting and database providers that store information for us under contract.</li><li><strong>TikTok:</strong> advertising measurement data, as described above.</li><li><strong>Authorities:</strong> when the law requires it.</li></ul>
<h2>5. Where it is stored and how we protect it</h2>
<p>Your information is stored with cloud providers whose servers may be outside Nigeria, for example in the European Union. Where information is transferred, we rely on providers that protect it to standards the NDPA recognises.</p>
<p>All connections to our website are encrypted (HTTPS). Access to order information is limited to authorised staff who sign in securely. Payment card data is handled only by Paystack.</p>
<h2>6. How long we keep it</h2>
<p>We keep order records for as long as we need them to deliver, support and warrant your order. After that, we keep them for as long as accounting and tax laws require, generally up to 6 years. Then we delete or anonymise them. Information in your browser stays until you clear it.</p>
<h2>7. Your rights</h2>
<p>Under the NDPA you can:</p>
<ul><li>ask for a copy of your personal information;</li><li>ask us to correct it;</li><li>ask us to delete it;</li><li>object to or restrict how we use it;</li><li>withdraw consent at any time; and</li><li>ask for your information in a portable format.</li></ul>
<p>Contact us to use any of these rights. We reply within 30 days. You can also complain to the <a href="https://ndpc.gov.ng">Nigeria Data Protection Commission</a>.</p>
<h2>8. Cookies and advertising choices</h2>
<p>You can block or delete cookies in your browser settings. You can also limit personalised adverts in your TikTok settings. Our website still works without advertising cookies.</p>
<h2>9. Children</h2>
<p>Our website is not intended for children under 18, and we do not knowingly collect their information.</p>
<h2>10. Changes to this policy</h2>
<p>If we update this policy, we will change the date at the top of this page.</p>`)}
];
