// Facts shown on product pages, taken from the same sources as checkout so they always agree.
import {LAGOS_LGA_FEES,STATE_PARKS} from './delivery-rates.mjs';
export const STORE_ADDRESS='1 Ola Ayeni Street, Off Simbiat Abiola Way, Computer Village, Ikeja, Lagos';
export const MAPS_URL='https://www.google.com/maps/search/?api=1&query=1%20Ola%20Ayeni%20Street%20Ikeja%20Lagos';
// The standard every UK Used device meets before it is sold (owner's standard, 21 Nov 2026).
export const UK_USED_STANDARD=['Grade A condition','Original, non-boosted battery at 85% health or above','Original screen','Face ID or fingerprint working','Cameras working','Charging working','Speaker and microphone working'];
const naira=n=>'₦'+Number(n).toLocaleString('en-NG');
const range=list=>{const v=list.filter(n=>Number.isFinite(n));return v.length?(Math.min(...v)===Math.max(...v)?naira(Math.min(...v)):`${naira(Math.min(...v))}–${naira(Math.max(...v))}`):'';};
export const LAGOS_FEE_RANGE=range(Object.values(LAGOS_LGA_FEES));
export const PARK_FEE_RANGE=range(Object.values(STATE_PARKS).map(([,fee])=>fee));
export const DELIVERY_SUMMARY=`Lagos home delivery ${LAGOS_FEE_RANGE} by LGA · Other states: transport park pickup ${PARK_FEE_RANGE} · Free pickup at our store. Your exact fee is shown at checkout.`;
