// Policy pages. Terms and Privacy are the owner's own text (17 Nov 2026); Refund follows the format the owner
// supplied. Edit this file to change a policy.
import {BUYER_FAQS} from './seo.mjs';
const nav='<ul class="policy-nav"><li><a href="/about/">About us</a></li><li><a href="/faq/">FAQ</a></li><li><a href="/contact/">Contact</a></li><li><a href="/warranty-policy/">Warranty</a></li><li><a href="/returns-refunds/">Refund &amp; returns</a></li><li><a href="/delivery-policy/">Delivery</a></li><li><a href="/terms/">Terms</a></li><li><a href="/privacy-policy/">Privacy</a></li></ul>';
const contact='<h2>Contact us</h2><ul class="policy-contact"><li><strong>Email:</strong> <a href="mailto:support@mikeegadget.com.ng">support@mikeegadget.com.ng</a></li><li><strong>WhatsApp / phone:</strong> <a href="https://wa.me/2347086865133">0708 686 5133</a></li><li><strong>Website:</strong> <a href="https://www.mikeegadget.com.ng">www.mikeegadget.com.ng</a></li><li><strong>Store:</strong> 1 Ola Ayeni Street, Off Simbiat Abiola Way, Computer Village, Ikeja, Lagos</li></ul>';
const rights='<p>Nothing on this page limits any right you have under Nigerian consumer protection law.</p>';
const wrap=(h1,body,{ownContact=false}={})=>`<div class="policy-page"><h1>${h1}</h1>${nav}${body}${rights}${ownContact?'':contact}</div>`;
const h=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const linkify=s=>h(s).replace(/https:\/\/www\.creditdirect\.ng\/know-your-limit/g,'<a href="https://www.creditdirect.ng/know-your-limit" rel="noopener">check your Credit Direct limit</a>');
export const policyPages=[
 {path:'about',title:'About Mikee Gadget Plug',description:'Mikee Gadget Plug (MIKEEGADGETS & COMMUNICATIONS LIMITED) sells UK-used and brand-new phones and gadgets from its store in Computer Village, Ikeja, Lagos, with delivery across Nigeria.',html:wrap('About Mikee Gadget Plug',`
<p><strong>Mikee Gadget Plug</strong> is the trading name of <strong>MIKEEGADGETS &amp; COMMUNICATIONS LIMITED</strong>, a phone and gadget retailer with a physical store in Computer Village, Ikeja, Lagos — Nigeria’s best-known market for phones and electronics.</p>
<h2>What we sell</h2><p>UK-used and brand-new <a href="/iphones">iPhones</a>, <a href="/samsung-phones">Samsung Galaxy phones</a> and <a href="/google-pixel-phones">Google Pixel phones</a>, plus <a href="/shop/ipads/">iPads</a>, <a href="/shop/tablets/">Samsung tablets</a>, <a href="/shop/watches/">smartwatches</a>, <a href="/shop/airpods/">AirPods</a>, <a href="/shop/audio/">headphones</a>, <a href="/shop/speakers/">speakers</a>, <a href="/shop/accessories/">accessories</a> and PlayStation 5 games.</p>
<h2>How we sell</h2><ul>
<li>Every phone has battery health above 85%, and every iPhone has working Face ID.</li>
<li>Every device comes with a <a href="/warranty-policy/">7-day warranty</a>.</li>
<li>You can inspect and test a phone in our store, or on pickup, before paying.</li>
<li>Pay by card (Paystack), bank transfer, or <a href="/financing/">Pay Small Small</a> with Credit Direct; for iPhones you can also pay a 50% down payment in our shop.</li>
<li><a href="/phone-swap">Swap</a> your current iPhone towards an upgrade.</li>
<li>Home delivery across Lagos, transport-park delivery to every other state, and free pickup at our store (<a href="/delivery-policy/">delivery policy</a>).</li></ul>
<h2>Visit us</h2><p>1 Ola Ayeni Street, Off Simbiat Abiola Way, Computer Village, Ikeja, Lagos. We open at 10am.</p>`)},
 {path:'contact',title:'Contact Mikee Gadget Plug',description:'Contact Mikee Gadget Plug in Computer Village, Ikeja, Lagos: call or WhatsApp 0708 686 5133, email support@mikeegadget.com.ng, or visit 1 Ola Ayeni Street. Opens 10am.',html:wrap('Contact Mikee Gadget Plug',`
<ul class="policy-contact"><li><strong>Call or WhatsApp:</strong> <a href="tel:+2347086865133">0708 686 5133</a> · <a href="https://wa.me/2347086865133">Chat on WhatsApp</a></li>
<li><strong>Email:</strong> <a href="mailto:support@mikeegadget.com.ng">support@mikeegadget.com.ng</a></li>
<li><strong>Store:</strong> 1 Ola Ayeni Street, Off Simbiat Abiola Way, Computer Village, Ikeja, Lagos (<a href="https://www.google.com/maps/search/?api=1&amp;query=1%20Ola%20Ayeni%20Street%20Ikeja%20Lagos" rel="noopener">get directions</a>)</li>
<li><strong>Opening time:</strong> 10am</li>
<li><strong>Company:</strong> MIKEEGADGETS &amp; COMMUNICATIONS LIMITED, trading as Mikee Gadget Plug</li></ul>
<p>You can also chat with Mikee AI, our shopping assistant, on any product page for prices, swap estimates and delivery fees.</p>`,{ownContact:true})},
 {path:'faq',title:'Frequently Asked Questions',description:'Answers about buying phones from Mikee Gadget Plug in Lagos: battery health, Face ID, UK Used vs Brand New, warranty, returns, delivery, payment, Pay Small Small and swaps.',html:wrap('Frequently asked questions',BUYER_FAQS.map(f=>`<h2>${h(f.q)}</h2><p>${linkify(f.a)}</p>`).join('\n'))},

 {path:'warranty-policy',title:'Warranty Policy',description:'Mikee Gadget Plug warranty: every device includes a 7-day warranty. How to report a fault and what happens next.',html:wrap('Warranty Policy',`
<h2>7-day warranty</h2><p>Every product sold by Mikee Gadget Plug includes a 7-day warranty, counted from the day you receive or collect it.</p>
<h2>Reporting a fault</h2><p>If your product is faulty or is not what you ordered, contact us within the warranty period with your order reference and a description of the problem. We will assess it and arrange the next step with you.</p>
<h2>Test before you pay</h2><p>When you buy in store or collect an order at our Computer Village store, you can inspect and test the device before you pay. For delivered orders, payment is made online first; check the device as soon as it arrives.</p>
<h2>What the warranty covers</h2><p>Faults that were present when you received the device. We repair or replace the device and, if neither is possible, refund you in full, as set out in our <a href="/returns-refunds/">Refund and Returns Policy</a>.</p>
<h2>What it does not cover</h2><p>Damage after delivery from drops, liquid, misuse or repairs by anyone other than Mikee Gadget Plug, and loss of data. Please back up your device.</p>`)},
 {path:'returns-refunds',title:'Refund and Returns Policy',description:'Mikee Gadget Plug refund and returns policy: 7-day window for factory defects, what is not refundable, inspection, return procedure, shipping costs and refund timeline.',html:wrap('Refund and Returns Policy',`
<p class="policy-updated">Last updated: 17 November 2026</p>
<p class="policy-lead">Customer satisfaction is our priority.</p>
<h2>Overview</h2>
<p>At Mikee Gadget Plug, customer satisfaction is our priority. Because we sell electronic devices, we give refunds only for items with a verified factory defect, or with a fault that was present when you received the item. We do not give refunds for problems caused by misuse or damage after delivery. This policy covers orders placed on www.mikeegadget.com.ng and purchases at our store in Computer Village, Ikeja.</p>
<h2>Eligibility for refunds</h2>
<p>A refund or replacement request is valid if:</p>
<ol><li>the product has a manufacturer or factory defect, or (for UK Used devices) a fault that was present when you received it, or you received the wrong item;</li><li>you make the request within <strong>7 days</strong> of delivery or collection; and</li><li>you return the product in its original packaging with all accessories and your proof of purchase (order reference or receipt), signed out of all accounts (Apple ID / iCloud, Google, Samsung).</li></ol>
<h2>Non-refundable cases</h2>
<p>We will not give a refund if:</p>
<ul><li>the item was damaged through negligence, misuse, a drop, a power surge or water damage;</li><li>the product seal or packaging has been tampered with;</li><li>the problem comes from improper installation, software modification or repair by anyone other than Mikee Gadget Plug;</li><li>the item was bought in a Hot Deal, clearance or promo sale, unless it is defective; or</li><li>you changed your mind after delivery or collection. Please check the model, storage, colour, condition and network notes (for example eSIM only or Wi‑Fi Only) before you pay.</li></ul>
<h2>Verification process</h2>
<p>Our technical team inspects every returned product. If we confirm a factory defect, or a fault that was present at delivery, you can choose:</p>
<ul><li>a <strong>full refund</strong>, processed within 5–10 business days; or</li><li>a <strong>replacement</strong> of the same model, subject to availability.</li></ul>
<p>If the product passes inspection and works as it should, we return it to you and no refund is given.</p>
<h2>Return procedure</h2>
<ol><li>Within 7 days of receiving your item, contact <a href="mailto:support@mikeegadget.com.ng">support@mikeegadget.com.ng</a> or WhatsApp <a href="https://wa.me/2347086865133">0708 686 5133</a>.</li><li>Give your order number, photos or videos of the defect, and a short description of the problem.</li><li>Once your request is approved, we send instructions to drop the product at our Computer Village store or hand it to our logistics partner.</li></ol>
<h2>Shipping costs</h2>
<ul><li>If the return is due to a factory defect, a fault present at delivery, or our mistake, Mikee Gadget Plug pays the return shipping cost.</li><li>If a product is returned without a valid reason, you pay the shipping cost.</li></ul>
<h2>Refund timeline</h2>
<p>Approved refunds go to your original payment method within <strong>5–10 business days</strong> after inspection and confirmation:</p>
<ul><li><strong>Card or bank transfer (Paystack):</strong> refunded to the same card or account through Paystack.</li><li><strong>Paid in store:</strong> refunded by bank transfer to an account in the buyer’s name.</li><li><strong>Pay Small Small (Credit Direct):</strong> we notify Credit Direct, and the loan is cancelled or settled under Credit Direct’s terms. Any down payment you made is refunded to you.</li></ul>
<h2>Cancellations and payment problems</h2>
<ul><li>You can cancel an order before it is dispatched or collected and receive a full refund.</li><li>If we cannot supply an item you have paid for, you can choose an alternative or a full refund.</li><li>An order is placed only after your payment is confirmed. If you were charged for a failed payment, or charged twice, contact us with the payment reference and we will refund the extra amount in full.</li></ul>`)},
 {path:'delivery-policy',title:'Delivery Policy',description:'Mikee Gadget Plug delivery: Lagos home delivery priced by LGA, transport park pickup in every other state, and free pickup at our Computer Village store.',html:wrap('Delivery Policy',`
<h2>Delivery options and fees</h2><ul><li><strong>Lagos home delivery:</strong> a fee based on your Local Government Area, shown at checkout before you pay.</li><li><strong>Other states — transport park pickup:</strong> your order is sent to a designated transport park in your destination state, for a fee shown at checkout. We contact you with collection details when it is ready. Interstate orders are paid before dispatch.</li><li><strong>Pickup at our store — FREE:</strong> 1 Ola Ayeni Street, Off Simbiat Abiola Way, Computer Village, Ikeja, Lagos.</li></ul>
<h2>Delivery times</h2><p>We contact you after payment to arrange delivery. Times depend on your location, the carrier and product availability.</p>
<h2>Reserve Now, Pay at Pickup</h2><p>For store pickup you can reserve an item without paying online. A reservation is a request: we confirm availability first, then hold the item until the pickup deadline we give you (24 hours by default). You pay at the store. Reservations that are not collected by the deadline expire.</p>
<!-- DRAFT: owner to confirm the carriers used, the same-day order cut-off time and what happens after a failed delivery attempt. -->
<h2>Receiving your order</h2><p>Please make sure someone can receive the order at the address you give. Check the device when it arrives and contact us straight away if anything is wrong.</p>`)},
 {path:'terms',title:'Terms and Conditions',description:'Terms and Conditions of MIKEEGADGETS & COMMUNICATIONS LIMITED (Mikee Gadget) for using www.mikeegadget.com.ng and buying from our online store.',html:wrap('Terms and Conditions',`
<p class="policy-updated">Last updated: November 2026</p>
<h2>Introduction</h2>
<p>Welcome to MIKEEGADGETS &amp; COMMUNICATIONS LIMITED ("Mikee Gadget", "we", "our", "us"). These Terms and Conditions govern your use of our website <a href="https://www.mikeegadget.com.ng">www.mikeegadget.com.ng</a> and the purchase of products from our online store. By accessing or using our website, you agree to comply with and be bound by these Terms. If you do not agree, please do not use the site.</p>
<h2>Company Information</h2>
<p>MIKEEGADGETS &amp; COMMUNICATIONS LIMITED</p>
<ul><li>Business Name: MIKEEGADGETS &amp; COMMUNICATIONS LIMITED</li><li>Registration Location: Ola Ayeni, Lagos, Nigeria</li><li>Website: <a href="https://www.mikeegadget.com.ng">www.mikeegadget.com.ng</a></li><li>Email: <a href="mailto:support@mikeegadget.com.ng">support@mikeegadget.com.ng</a></li></ul>
<h2>Eligibility</h2>
<p>By using our website, you confirm that you are at least 18 years old or have obtained parental consent to use this platform and make purchases.</p>
<h2>Use of the Website</h2>
<p>You agree to use this website only for lawful purposes and in accordance with these Terms. You may not use the site to:</p>
<ul><li>Engage in fraudulent or deceptive activities.</li><li>Copy, distribute, or exploit any content without our consent.</li><li>Interfere with the security or operation of the website.</li></ul>
<h2>Product Information and Availability</h2>
<p>We make every effort to display accurate product information, images, descriptions, and prices. However, errors may occur. If an error is discovered after you have placed an order, we will notify you and give you the option to confirm or cancel the order.</p>
<h2>Warranty Limitations for Pre-Owned Equipment</h2>
<p>Please be advised that warranty coverage varies significantly based on the condition of the product purchased. While brand-new devices typically include a comprehensive manufacturer's limited warranty, these original manufacturer warranties do not extend to used, refurbished, or open-box electronics unless explicitly stated otherwise in the product description. All pre-owned devices are sold "as-is" regarding original manufacturer support. However, we may provide a separate, limited functional warranty for a specified period from the date of purchase; please refer to your specific item's listing for coverage details and duration.</p>
<h2>Pricing and Payment</h2>
<p>All prices listed on our website are in Nigerian Naira. Payment can be made securely using approved online payment gateways integrated on our platform. We reserve the right to modify prices or discontinue products at any time without prior notice.</p>
<h2>Shipping and Delivery</h2>
<ul><li>We deliver nationwide across Nigeria and neighboring African countries.</li><li>Delivery timelines vary based on your location and product availability.</li><li>We are not liable for delays caused by courier services, public holidays, or unforeseen circumstances.</li></ul>
<h2>Return and Refund Policy</h2>
<p>Mikee Gadget accepts returns only for products with verified factory defects. Items damaged due to customer mishandling, incorrect installation, or electrical issues at the buyer's premises are not eligible for refund or replacement. See our <a href="/returns-refunds/">Refund Policy</a> for detailed information.</p>
<h2>Limitation of Liability</h2>
<p>Mikee Gadget will not be held liable for indirect, incidental, or consequential damages resulting from:</p>
<ul><li>Product misuse or installation errors,</li><li>Unauthorized modification of purchased items,</li><li>Third-party service disruptions.</li></ul>
<h2>Intellectual Property</h2>
<p>All trademarks, logos, images, and content on this site are the property of Mikee Gadget. They may not be copied, distributed, or used for commercial purposes without prior written consent.</p>
<h2>Governing Law</h2>
<p>These Terms are governed by and construed under the laws of the Federal Republic of Nigeria.</p>
<h2>Contact Us</h2>
<ul><li><a href="mailto:support@mikeegadget.com.ng">support@mikeegadget.com.ng</a></li><li><a href="https://www.mikeegadget.com.ng">www.mikeegadget.com.ng</a></li></ul>`,{ownContact:true})},
 {path:'privacy-policy',title:'Privacy Policy',description:'How Mikee Gadget collects, uses and protects your personal information when you visit or buy from www.mikeegadget.com.ng.',html:wrap('Privacy Policy',`
<p class="policy-updated">Last Updated: November 2026</p>
<h2>Introduction</h2>
<p>Your privacy is important to us. This Privacy Policy explains how Mikee Gadget ("we", "our", "us") collects, uses, and protects your personal information when you visit or make a purchase through <a href="https://www.mikeegadget.com.ng">www.mikeegadget.com.ng</a>.</p>
<h2>Information We Collect</h2>
<p>We collect personal and transactional information that helps us process your orders and improve your experience, including:</p>
<ul><li>Full name</li><li>Email address</li><li>Phone number</li><li>Billing and delivery address</li><li>Day and Month of birth (optional) for birthday celebration</li><li>Payment information (handled securely through third-party gateways)</li><li>Browsing activity on our website</li></ul>
<h2>How We Use Your Information</h2>
<p>Your data is used to:</p>
<ul><li>Process and fulfill orders.</li><li>Communicate order updates or delivery details.</li><li>Respond to customer inquiries and complaints.</li><li>Improve our services and product offerings.</li><li>Comply with Nigerian e-commerce and consumer protection regulations.</li></ul>
<h2>Data Protection</h2>
<p>We take appropriate security measures to protect your data against unauthorized access, alteration, or disclosure. All payment details are processed securely through trusted third-party payment processor, Paystack — we do not store your card details.</p>
<h2 id="cookies">Cookies</h2>
<p>Our website uses cookies to enhance user experience, analyze traffic, and remember your preferences. This includes the TikTok Pixel, which helps us measure our TikTok adverts. You can disable cookies through your browser, but some parts of the site may not function properly.</p>
<h3>Analytics</h3>
<p>We use Google Analytics to understand how many people visit our website, where they come from and which pages and products they view, and Microsoft Clarity to see how visitors use our pages (for example, where they click and scroll) so we can make the site easier to use. Microsoft Clarity records page interactions; text you type into forms is hidden, and pages that show your order or contact details are masked. We do not send your name, phone number, email address or delivery address to either service. Google and Microsoft may use cookies and process this data under their own privacy policies (<a href="https://policies.google.com/privacy" rel="noopener">Google</a>, <a href="https://privacy.microsoft.com/privacystatement" rel="noopener">Microsoft</a>). You can opt out of Google Analytics with the <a href="https://tools.google.com/dlpage/gaoptout" rel="noopener">Google Analytics opt-out browser add-on</a>.</p>
<h2>Data Sharing and Disclosure</h2>
<p>We do not sell, rent, or trade your personal data. We may share limited information with:</p>
<ul><li>Logistics partners for delivery purposes.</li><li>Payment processors for secure transactions.</li><li>Credit Direct, only if you choose Pay Small Small.</li><li>Legal authorities when required by Nigerian law.</li></ul>
<h2>Retention Period</h2>
<p>We retain your information for as long as necessary to fulfill orders, comply with legal obligations, and improve user experience.</p>
<h2>Your Rights</h2>
<p>You have the right to:</p>
<ul><li>Access and request correction of your personal data.</li><li>Withdraw consent for marketing communication.</li><li>Request deletion of your personal information (subject to applicable law).</li></ul>
<p>To use any of these rights, email <a href="mailto:support@mikeegadget.com.ng">support@mikeegadget.com.ng</a>.</p>
<h2>Third-Party Links</h2>
<p>Our website may contain links to other websites. We are not responsible for the privacy practices of these third-party sites.</p>
<h2>Changes to This Policy</h2>
<p>Mikee Gadget reserves the right to update this Privacy Policy periodically. Updates will be posted on this page with a revised "Last Updated" date.</p>
<h2>Last Updated</h2>
<p>November 2026</p>
<h2>Contact Us</h2>
<ul><li><a href="mailto:support@mikeegadget.com.ng">support@mikeegadget.com.ng</a></li><li><a href="https://www.mikeegadget.com.ng">www.mikeegadget.com.ng</a></li></ul>`,{ownContact:true})}
];
