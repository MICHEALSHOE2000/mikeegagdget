import {defineConfig} from 'vite';
import {existsSync} from 'node:fs';
import {resolve,extname} from 'node:path';

// Resolve the generated static directories during local review.
export default defineConfig({
 appType:'mpa',
 plugins:[{name:'static-clean-urls',configureServer(server){
  server.middlewares.use((req,res,next)=>{
   const url=new URL(req.url,'http://localhost');
   const path=decodeURIComponent(url.pathname);
   const file=resolve(server.config.root,`.${path}/index.html`);
   if(!extname(path)&&file.startsWith(`${server.config.root}/`)&&existsSync(file)) req.url=`${url.pathname.replace(/\/$/,'')}/index.html${url.search}`;
   next();
  });
 }}],
 server:{host:'0.0.0.0',allowedHosts:['terminal.local']}
});
