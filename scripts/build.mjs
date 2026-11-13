import {readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join,resolve} from 'node:path';
import {render as home} from '../src/pages/home.mjs';
import {render as software} from '../src/pages/software.mjs';
import {render as product} from '../src/pages/product.mjs';
import {render as downloads} from '../src/pages/downloads.mjs';
import {render as updates} from '../src/pages/updates.mjs';
import {render as about} from '../src/pages/about.mjs';
import {render as support} from '../src/pages/support.mjs';
import {render as notFound} from '../src/pages/notfound.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const dist=join(root,'dist');
// A GitHub Actions build derives the final Pages URL from its repository automatically.
// Override SITE_URL / BASE_PATH only when using a custom domain or custom deployment path.
const repoSlug=(process.env.GITHUB_REPOSITORY||'').trim();
const segments=repoSlug.split('/');
const onActions=process.env.GITHUB_ACTIONS==='true';
if(onActions && (segments.length!==2 || !segments.every(v=>/^[A-Za-z0-9_.-]+$/.test(v)))) {
 throw new Error('GITHUB_REPOSITORY must be owner/repository for Pages deployment');
}
const [owner,repository]=segments;
const isOrgSite=onActions && repository.toLowerCase()===`${owner.toLowerCase()}.github.io`;
const baseInput=(process.env.BASE_PATH?.trim() || (onActions?(isOrgSite?'/':`/${repository}/`):'/'));
if(!/^\/(?:[A-Za-z0-9_.-]+\/)*$/.test(baseInput) || baseInput.split('/').some(v=>v==='.'||v==='..')) {
 throw new Error('BASE_PATH must be / or /safe-directory/ with no dot-dot segments');
}
const base=baseInput;
const siteUrlInput=(process.env.SITE_URL?.trim() || (onActions?`https://${owner}.github.io`:null));
let siteUrl=null;
if(siteUrlInput){
 let origin;
 try { origin=new URL(siteUrlInput); } catch { throw new Error('Invalid SITE_URL'); }
 if(origin.protocol!=='https:'||origin.pathname!=='/'||origin.search||origin.hash||origin.username||origin.password){
  throw new Error('SITE_URL must be an HTTPS origin, e.g. https://example.github.io');
 }
 siteUrl=origin.origin;
}
const info=(message)=>process.stdout.write(`[FILEJOLT] ${message}\n`);
function assert(condition,message){if(!condition)throw new Error(message);}
function validateProducts(products){
 assert(Array.isArray(products)&&products.length>=2,'Expected at least two products in products.json');
 const ids=new Set();
 for(const p of products){
  assert(/^[a-z0-9-]+$/.test(p.id),`Invalid product ID: ${p.id}`);assert(!ids.has(p.id),`Duplicate product ID: ${p.id}`);ids.add(p.id);
  for(const field of ['name','category','summary','headline','description','version','os','type','filename','downloadUrl','releaseUrl','releasesUrl','repoUrl','screenshot','logo','note','releaseDate']) assert(typeof p[field]==='string'&&p[field].trim(),`${p.id}: missing ${field}`);
  assert(/^\d+\.\d+\.\d+$/.test(p.version),`${p.id}: invalid version`);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(p.releaseDate),`${p.id}: invalid releaseDate`);
  assert(/^https:\/\/github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+\/releases\/download\//.test(p.downloadUrl),`${p.id}: download must be official GitHub Releases URL`);
  assert(p.downloadUrl.includes(encodeURIComponent(p.filename)),`${p.id}: download URL does not match filename`);
  assert(/^([a-f0-9]{64})$/.test(p.sha256),`${p.id}: invalid SHA-256`);
  assert(Number.isSafeInteger(p.sizeBytes)&&p.sizeBytes>0,`${p.id}: invalid file size`);
  assert(Array.isArray(p.features)&&p.features.length>0,`${p.id}: features missing`);
 }
 return products;
}
async function build(){
 info('01 / Reading validated product catalog');
 const products=validateProducts(JSON.parse(await readFile(join(root,'src/content/products.json'),'utf8')));
 const ctx={products,base,siteUrl};
 info('02 / Building pages and shared design system');
 const pages=[home(ctx),software(ctx),...products.map(p=>product(ctx,p)),downloads(ctx),updates(ctx),about(ctx),support(ctx),notFound(ctx)];
 await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
 await cp(join(root,'public'),dist,{recursive:true});
 const css=(await Promise.all(['base.css','layout.css','home.css','pages.css'].map(file=>readFile(join(root,'src/styles',file),'utf8')))).join('\n');
 await mkdir(join(dist,'assets','css'),{recursive:true});
 await mkdir(join(dist,'assets','js'),{recursive:true});
 await writeFile(join(dist,'assets/css/site.css'),css,'utf8');
 await cp(join(root,'src/scripts/site.js'),join(dist,'assets/js/site.js'));
 for(const page of pages){
  const target=page.path==='404.html'?join(dist,'404.html'):join(dist,page.path,'index.html');
  await mkdir(dirname(target),{recursive:true});await writeFile(target,page.html,'utf8');
  assert(page.html.includes('</html>')&&page.html.includes('<main id="main-content">'),`Invalid output page ${page.path}`);
 }
 await writeFile(join(dist,'.nojekyll'),'','utf8');
 const robots=`User-agent: *\nAllow: /\n${siteUrl?`Sitemap: ${new URL(base+'sitemap.xml',siteUrl).href}\n`:''}`;
 await writeFile(join(dist,'robots.txt'),robots,'utf8');
 if(siteUrl){
  const sitemap=`<?xml version="1.0" encoding="utf-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.filter(p=>p.path!=='404.html').map(p=>`  <url><loc>${new URL(base+p.path,siteUrl).href}</loc></url>`).join('\n')}\n</urlset>\n`;
  await writeFile(join(dist,'sitemap.xml'),sitemap,'utf8');
 }
 info(`03 / Generated ${pages.length} pages (BASE_PATH=${base}, SITE_URL=${siteUrl||'local preview'})`);
 info('04 / Assets, metadata, and content are ready in dist/');
 info('PASS / Static website build completed');
}

await build().catch(error=>{console.error(`[FILEJOLT] FAIL / ${error.message}`);process.exitCode=1;});
