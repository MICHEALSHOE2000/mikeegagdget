const button=document.querySelector('.site-header .menu-toggle'),menu=document.getElementById('home-navigation');
button?.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));menu?.classList.toggle('open',open);});
