// Opens the official Credit Direct widget for a transaction the server has already priced and signed.
// Nothing here confirms payment: the order is confirmed only by Credit Direct's signed webhook to the server.
const SCRIPT='https://checkout.creditdirect.ng/bnpl/checkout.min.js';
let loading;
const load=()=>loading||(loading=new Promise((resolve,reject)=>{if(window.Connect)return resolve();const s=document.createElement('script');s.src=SCRIPT;s.onload=()=>resolve();s.onerror=()=>{loading=null;reject(Error('Pay Small Small could not load. Check your connection or pay outright.'));};document.head.append(s);}));
export async function openCreditDirect(session,notify){
 await load();
 if(typeof window.Connect!=='function')throw Error('Pay Small Small is unavailable right now. You can pay outright instead.');
 const status='/checkout/complete/?reference='+encodeURIComponent(session.reference);
 const link=data=>{const id=data?.checkoutTransactionId;if(typeof id!=='string'||!id)return Promise.resolve();return fetch('/api/shop/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'credit_direct_link',reference:session.reference,token:session.linkToken,checkoutTransactionId:id})}).catch(()=>{});};
 const widget=new window.Connect({publicKey:session.publicKey,transaction:session.transaction,signature:session.signature,isLive:session.isLive===true,
  onPopup:data=>{link(data);},
  onSuccess:async data=>{await link(data);location.assign(status);},
  onClose:()=>notify('Pay Small Small was closed before it finished. Nothing is confirmed. You can try again or pay outright with Paystack.'),
  onError:()=>notify('Pay Small Small could not continue. You can try again or pay outright with Paystack.')});
 widget.setup();widget.open();
 notify('Complete your application in the Credit Direct window.');
}
