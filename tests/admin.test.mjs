import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {requireAdmin,ADMIN_EMAIL} from '../api/admin/_auth.mjs';
test('admin checks a server-verified confirmed identity, never user metadata',async()=>{
 const old=globalThis.fetch;const oldUrl=process.env.SUPABASE_URL,oldKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 process.env.SUPABASE_URL='https://fixture.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='fixture';
 try{
  await assert.rejects(requireAdmin({headers:{}}),/Sign in/);
  const request={headers:{authorization:'Bearer fixture'}};
  globalThis.fetch=async()=>({ok:true,json:async()=>({id:'fixture',email:'other@example.com',email_confirmed_at:'2026-11-11',user_metadata:{role:'admin',email:ADMIN_EMAIL}})});
  await assert.rejects(requireAdmin(request),/Administrator/);
  globalThis.fetch=async()=>({ok:true,json:async()=>({id:'fixture',email:ADMIN_EMAIL})});await assert.rejects(requireAdmin(request),/Administrator/);
  globalThis.fetch=async url=>({ok:true,json:async()=>url.includes('/rest/')?[{user_id:'fixture'}]:({id:'fixture',email:ADMIN_EMAIL,email_confirmed_at:'2026-11-11'})});assert.equal((await requireAdmin(request)).id,'fixture');
 }finally{globalThis.fetch=old;if(oldUrl===undefined)delete process.env.SUPABASE_URL;else process.env.SUPABASE_URL=oldUrl;if(oldKey===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=oldKey;}
});
test('admin callback page has no tracking and financing routes stay on hold',()=>{
 const admin=readFileSync('admin/index.html','utf8');assert.doesNotMatch(admin,/tiktok|analytics|landing-page.js/);assert.match(admin,/no-referrer/);
 const config=JSON.parse(readFileSync('vercel.json','utf8'));assert.ok(config.redirects.some(r=>r.source==='/easybuy'&&r.destination==='/financing/'));
 assert.match(readFileSync('financing/index.html','utf8'),/temporarily unavailable/);
});
