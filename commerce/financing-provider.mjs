// Explicit adapter seam. Financing is offered only when CREDIT_DIRECT_ENABLED is "true" and every key is set.
import {creditDirectConfig} from './credit-direct.mjs';
export const financingStatus=()=>{const config=creditDirectConfig();return config.ready?{provider:'credit-direct',available:true,publicKey:config.publicKey,isLive:config.isLive}:{provider:'credit-direct',available:false,reason:'Official integration pending verification'};};
export async function beginFinancing(){throw new Error('Credit Direct checkout is currently unavailable.');}
