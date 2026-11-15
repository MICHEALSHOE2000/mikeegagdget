// Guest wishlist kept on the customer's own device. Stores product page names only — no personal data.
export const WISHLIST_KEY='mikee-wishlist-v1';
const clean=list=>[...new Set((Array.isArray(list)?list:[]).filter(s=>typeof s==='string'&&/^[a-z0-9-]{1,120}$/.test(s)))].slice(0,100);
export function readWishlist(storage){try{return clean(JSON.parse(storage.getItem(WISHLIST_KEY)||'[]'));}catch{return [];}}
export function toggleWishlist(storage,slug){const list=readWishlist(storage),has=list.includes(slug),next=clean(has?list.filter(s=>s!==slug):[slug,...list]);storage.setItem(WISHLIST_KEY,JSON.stringify(next));return {saved:!has&&next.includes(slug),list:next};}
