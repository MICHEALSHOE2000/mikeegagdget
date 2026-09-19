import {activateImages,dealCard} from './storefront-ui.mjs';
activateImages();
const $ = id => document.getElementById(id);
const menu=document.querySelector('.menu-toggle');
const closeMenu=()=>{$('navigation').classList.remove('open');menu.setAttribute('aria-expanded','false');};
menu?.addEventListener('click',()=>{const open=$('navigation').classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});
$('navigation')?.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu?.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});
document.querySelectorAll('form').forEach(form=>form.addEventListener('submit',event=>event.preventDefault()));
if($('buy-flow')) await import('./buy-flow.js');
if($('deal-filters')){
 const {choices}=await import('../commerce/upgrade-core.mjs');
 const {DEPOSIT_RATE}=await import('../easy-buy/easy-buy-core.mjs');
 const {offerChoice}=await import('../commerce/offers.mjs');
 const catalogue=choices.map(offerChoice).filter(p=>p.price&&p.image&&p.offerId);
 const normalized=text=>text.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 let limit=12;
 function filterDeals(reset=true){
  if(reset)limit=12;
  const tokens=normalized($('deal-search').value).split(' ').filter(Boolean);
  const budget=$('deal-budget').value==='all'?Infinity:Number($('deal-budget').value);
  const sort=$('deal-sort').value;
  const matches=catalogue.filter(p=>p.price<=budget&&tokens.every(token=>normalized(p.label).includes(token)));
  if(sort!=='featured')matches.sort((a,b)=>(a.price-b.price)*(sort==='high'?-1:1));
  $('deal-grid').innerHTML=matches.slice(0,limit).map(p=>dealCard(p,DEPOSIT_RATE)).join('');
  activateImages($('deal-grid'));
  $('deal-count').textContent=`${matches.length} phone option${matches.length===1?'':'s'} found`;
  $('deals-empty').hidden=matches.length>0;
  $('deals-more').hidden=limit>=matches.length;
 }
 $('deal-filters').addEventListener('input',()=>filterDeals());
 $('deal-filters').addEventListener('change',()=>filterDeals());
 $('deal-filters').addEventListener('reset',()=>setTimeout(filterDeals,0));
 $('deals-more').addEventListener('click',()=>{limit+=12;filterDeals(false);});
 filterDeals();
}
