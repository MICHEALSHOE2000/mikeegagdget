import {env} from '../_shop.mjs';
export const ADMIN_EMAIL='aderintomicheal6@gmail.com';
export async function requireAdmin(req){
 const token=req.headers.authorization;
 if(typeof token!=='string'||!/^Bearer \S+$/.test(token))throw Error('Sign in to continue.');
 const response=await fetch(env('SUPABASE_URL')+'/auth/v1/user',{headers:{apikey:env('SUPABASE_SERVICE_ROLE_KEY'),Authorization:token},signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error('Your session has expired. Sign in again.');
 const user=await response.json();
 if(!user.id||!user.email_confirmed_at||user.is_anonymous||user.email?.toLowerCase()!==ADMIN_EMAIL)throw Error('Administrator access required.');
 return user;
}
