const products=await fetch('/assets/store-catalog.json').then(r=>r.json());
const product=products.find(p=>p.route===location.pathname||p.route===location.pathname+'/');
const select=document.querySelector('#retail-variant');
function update(){const v=product.variants.find(v=>v.sku===select.value);document.querySelector('#retail-price').textContent=v.price?new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(v.price):'Price to confirm';document.querySelector('#retail-buy').href='/checkout/?phone='+encodeURIComponent(v.sku);document.querySelector('#retail-finance').href='/checkout/?method=finance&phone='+encodeURIComponent(v.sku);const url=new URL(location.href);url.searchParams.set('storage',v.storage);history.replaceState(null,'',url);}
const storage=new URLSearchParams(location.search).get('storage');if(storage&&product.variants.some(v=>v.storage===storage))select.value=product.slug+'|'+storage;
select.addEventListener('change',update);update();
