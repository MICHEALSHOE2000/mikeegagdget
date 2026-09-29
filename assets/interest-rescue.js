// An optional reminder after someone has actually reached a financing plan.
// One showing per session; ordinary navigation and the calculator stay usable.
const key='mikee-interest-reminder-shown';
const planVisible=()=>Boolean(document.querySelector('[data-journey="easy"] .plan-monthly') ||
  (document.getElementById('easy-fields')?.hidden===false && document.querySelector('[data-screen="3"]')?.hidden===false));
if(document.querySelector('[data-journey="easy"], #buy-flow')){
  const dialog=document.createElement('dialog');
  dialog.className='interest-rescue';
  dialog.innerHTML=`<div class="interest-rescue-content"><button type="button" class="interest-rescue-close" aria-label="Close reminder">×</button><p class="eyebrow">PAY SMALL SMALL</p><h2>Is the interest too high?</h2><p>You may qualify for a lower 7.5% monthly iPhone plan after a credit check and approval.</p><div class="interest-rescue-actions"><a class="button" href="https://www.creditdirect.ng/know-your-limit" target="_blank" rel="noopener" data-check-eligibility>Check Eligibility ↗</a><button type="button" class="button secondary" data-rescue-dismiss>Continue browsing</button></div></div>`;
  document.body.append(dialog);
  let resume=null;
  const track=(event)=>window.MikeeGadgetPlugTracking?.pushEvent(event,{source:'interest_reminder'});
  function alreadyShown(){try{return sessionStorage.getItem(key)==='1';}catch{return false;}}
  function show(){
    if(!planVisible()||alreadyShown()||typeof dialog.showModal!=='function')return false;
    try{sessionStorage.setItem(key,'1');}catch{}
    dialog.showModal();track('interest_reminder_shown');return true;
  }
  const close=()=>{dialog.close();const action=resume;resume=null;action?.();};
  dialog.querySelector('.interest-rescue-close').addEventListener('click',close);
  dialog.querySelector('[data-rescue-dismiss]').addEventListener('click',close);
  dialog.querySelector('[data-check-eligibility]').addEventListener('click',()=>{track('check_eligibility_clicked');resume=null;dialog.close();});
  dialog.addEventListener('cancel',()=>{const action=resume;resume=null;action?.();});
  document.addEventListener('mouseout',event=>{
    if(event.relatedTarget===null && event.clientY<=0 && window.innerWidth>=768)show();
  });
  document.addEventListener('click',event=>{
    const exit=event.target.closest('.journey-exit, #journey-back, #flow-back');
    if(!exit||!planVisible()||alreadyShown())return;
    event.preventDefault();event.stopImmediatePropagation();
    resume=()=>exit.click();
    if(!show()){const action=resume;resume=null;action();}
  },true);
  // Mobile users often leave with the Back button after viewing a plan.
  // Keep the reminder one-time and only after the plan is actually visible.
  window.addEventListener('popstate',()=>{if(window.innerWidth<768)show();});
}
