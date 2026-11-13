import http from 'node:http';
import {spawn} from 'node:child_process';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const dir=resolve(dirname(fileURLToPath(import.meta.url)),'../dist');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8'};
const port=Number(process.env.PORT||4173);
const baseInput=process.env.BASE_PATH||'/';
const base=baseInput==='/'?'/':`/${baseInput.replace(/^\/+|\/+$/g,'')}/`;
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid PORT');
const server=http.createServer(async(req,res)=>{
 try{
  let url=new URL(req.url||'/',`http://127.0.0.1:${port}`);
  let pathname=decodeURIComponent(url.pathname);
  if(!pathname.startsWith(base)){res.writeHead(404);res.end('Not found');return;}
  pathname=pathname.slice(base.length);
  if(pathname.includes('\\')||pathname.split('/').includes('..')){res.writeHead(400);res.end('Invalid path');return;}
  let file=resolve(dir,pathname);
  if(file!==dir&&!file.startsWith(dir+sep)){res.writeHead(400);res.end('Invalid path');return;}
  const info=await stat(file).catch(()=>null);
  if(info?.isDirectory())file=join(file,'index.html');
  else if(!info&&(!extname(file)||url.pathname.endsWith('/')))file=join(file,'index.html');
  let content=await readFile(file).catch(()=>null);
  if(!content){content=await readFile(join(dir,'404.html'));res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(content);return;}
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});
  res.end(req.method==='HEAD'?undefined:content);
 }catch(err){console.error('[FILEJOLT] Server error:',err.message);res.writeHead(500);res.end('Internal preview error');}
});
server.listen(port,'127.0.0.1',()=>{
 const url=`http://127.0.0.1:${port}${base}`;
 console.log(`[FILEJOLT] Local preview: ${url}\n[FILEJOLT] Press CTRL+C to stop.`);
 // Launch only once the server has successfully bound the port.
 if(process.env.FILEJOLT_OPEN_BROWSER==='1' && process.platform==='win32'){
  const opener=spawn('cmd.exe',['/d','/s','/c',`start \"\" \"${url}\"`],{stdio:'ignore',windowsHide:true});
  opener.on('error',err=>console.warn(`[FILEJOLT] Browser did not open automatically: ${err.message}. Open ${url} manually.`));
  opener.unref();
 }
});
