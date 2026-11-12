// Explicit adapter seam. A configured URL alone never activates financing.
export const financingStatus=()=>({provider:'credit-direct',available:false,reason:'Official integration pending verification'});
export async function beginFinancing(){throw new Error('Credit Direct checkout is currently unavailable.');}
