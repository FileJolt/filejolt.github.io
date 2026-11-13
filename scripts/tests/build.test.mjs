import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('../..',import.meta.url)));
const dist=join(root,'dist');
const routes=['','software','software/nexload','software/reelshift','downloads','updates','about','support'];
const products=JSON.parse(await readFile(join(root,'src/content/products.json'),'utf8'));
const repo=(process.env.GITHUB_REPOSITORY||'').split('/');
const automated=process.env.GITHUB_ACTIONS==='true';
const orgSite=automated&&repo[1]?.toLowerCase()===`${repo[0]?.toLowerCase()}.github.io`;
const baseInput=process.env.BASE_PATH||(automated?(orgSite?'/':`/${repo[1]}/`):'/');
const base=baseInput==='/'?'/':`/${baseInput.replace(/^\/+|\/+$/g,'')}/`;
const siteOrigin=process.env.SITE_URL?new URL(process.env.SITE_URL).origin:(automated?`https://${repo[0].toLowerCase()}.github.io`:null);
const get=async route=>readFile(join(dist,route,'index.html'),'utf8');

test('all public HTML pages generated with semantic landmarks',async()=>{
 for(const route of routes){
  const html=await get(route);
  assert.match(html,/<!doctype html>/i);
  assert.match(html,/<main id="main-content">/);
  assert.match(html,/<nav class="desktop-nav" aria-label="Main navigation">/);
  assert.match(html,/FileJolt/);
  assert.match(html,/<meta name="description"/);
  assert.match(html,/<a class="skip-link" href="#main-content">/);
  assert.doesNotMatch(html,/Cloudflare|SleepyKush software platform|CoreFile|FileRip/);
 }
});

test('each official product release has matching link, checksum and system details',async()=>{
 const downloads=await get('downloads');
 for(const p of products){
  assert.ok(downloads.includes(p.downloadUrl),`${p.id}: link not in downloads`);
  assert.ok(downloads.includes(p.sha256),`${p.id}: hash not in downloads`);
  assert.ok(downloads.includes(p.os),`${p.id}: OS not in downloads`);
  assert.ok((await stat(join(dist,p.screenshot))).size>0,`${p.id}: missing screenshot`);
  assert.ok((await stat(join(dist,p.logo))).size>0,`${p.id}: missing logo`);
  assert.ok((await get(`software/${p.id}`)).includes(p.headline),`${p.id}: missing product headline`);
 }
});

test('all page links to local routes and media resolve in dist',async()=>{
 const all=await Promise.all(routes.map(get));
 for(const html of all){
  for(const href of html.matchAll(/(?:href|src)="([^"]+)"/g)){
   const url=href[1];
   if(!url.startsWith('/'))continue;
   assert.ok(url.startsWith(base),`Invalid BASE_PATH in URL: ${url}`);
   let file=join(dist,url.slice(base.length));
   const info=await stat(file).catch(()=>null);
   if(info?.isDirectory())file=join(file,'index.html');
   assert.ok((await stat(file).catch(()=>null))?.isFile(),`Broken local reference: ${url}`);
  }
 }
});

test('required styles, scripts and 404 page exist',async()=>{
 for(const f of ['assets/css/site.css','assets/js/site.js','404.html','.nojekyll','robots.txt']){
  assert.ok((await stat(join(dist,f))).isFile(),`${f} missing`);
 }
 const css=await readFile(join(dist,'assets/css/site.css'),'utf8');
 assert.ok(css.includes('#08090B'),'Primary monochrome color missing');
 assert.ok(css.includes('#6298C9'),'NexLoad accent missing');
 assert.ok(css.includes('#BB4651'),'ReelShift accent missing');
});


test('decorative section-label dashes are removed across all pages',async()=>{
 const html=await Promise.all(routes.map(get));
 for(const page of html){
  assert.doesNotMatch(page,/eyebrow-divider|stripe-line/, 'Unwanted decorative dash remains in page HTML');
 }
 const css=await readFile(join(dist,'assets/css/site.css'),'utf8');
 assert.doesNotMatch(css,/\.eyebrow-divider|\.stripe-line/);
});


test('homepage hero uses the official FileJolt emblem and unchanged application logos',async()=>{
 const html=await get('');
 assert.match(html,/<div class="art-core"><img class="core-emblem" src="[^"]*\/assets\/brand\/emblem\.svg"/);
 assert.match(html,/class="art-chip art-chip-one"[\s\S]*?class="chip-brand chip-brand-nexload"><img src="[^"]*\/assets\/nexload\/logo\.svg" alt="NexLoad official logo"/);
 assert.match(html,/class="art-chip art-chip-two"[\s\S]*?class="chip-brand chip-brand-reelshift"><img src="[^"]*\/assets\/reelshift\/emblem\.webp" alt="ReelShift official logo"/);
});


test('official FileJolt identity is wired into every public page',async()=>{
 const pages=await Promise.all(routes.map(get));
 for(const html of pages){
  assert.match(html,/assets\/brand\/logo-primary\.svg/, 'official header logo missing');
  assert.match(html,/assets\/brand\/logo-footer\.svg/, 'official footer logo missing');
  assert.match(html,/<meta property="og:image" content="[^"]+"/, 'social preview metadata missing');
  assert.match(html,/assets\/brand\/favicon\.ico/, 'favicon missing');
  assert.match(html,/assets\/brand\/site\.webmanifest/, 'site manifest missing');
  assert.doesNotMatch(html,/assets\/brand\/(?:mark|favicon)\.svg/, 'obsolete placeholder remains');
 }
 for(const file of [
  'logo-primary.svg','logo-footer.svg','logo-light.svg','emblem.svg','favicon.ico',
  'favicon-dark-32.png','favicon-white-32.png','apple-touch-icon.png',
  'github-avatar.png','brand-tile.png','social-preview.png','site.webmanifest'
 ]){
  assert.ok((await stat(join(dist,'assets/brand',file))).size>0,`Missing FileJolt brand asset: ${file}`);
 }
 const manifest=JSON.parse(await readFile(join(dist,'assets/brand/site.webmanifest'),'utf8'));
 assert.equal(manifest.name,'FileJolt');
});

test('general pages use FileJolt social preview and product pages preserve product previews',async()=>{
 for (const route of ['','about','downloads','software','support','updates']){
  assert.match(await get(route),/property="og:image" content="[^"]*assets\/brand\/social-preview\.png"/);
 }
 for (const p of products){
  assert.ok((await get(`software/${p.id}`)).includes(`property="og:image" content="` + (siteOrigin||'') + base + p.screenshot + `"`));
 }
});


test('production Pages URLs, SEO metadata and sitemap follow hosting path',async()=>{
 const home=await get('');
 const product=await get('software/nexload');
 const notFound=await readFile(join(dist,'404.html'),'utf8');
 assert.match(notFound,/<meta name="robots" content="noindex,follow">/);
 if(!siteOrigin)return;
 const origin=new URL(siteOrigin).origin;
 assert.ok(home.includes(`<link rel="canonical" href="${origin}${base}">`),'Home canonical wrong');
 assert.ok(product.includes(`<link rel="canonical" href="${origin}${base}software/nexload/">`),'Product canonical wrong');
 assert.ok(product.includes(`property="og:image" content="${origin}${base}assets/nexload/dashboard.png"`),'Product preview absolute URL wrong');
 const map=await readFile(join(dist,'sitemap.xml'),'utf8');
 assert.ok(map.includes(`<loc>${origin}${base}software/nexload/</loc>`),'Product sitemap missing');
 assert.ok(map.includes(`<loc>${origin}${base}downloads/</loc>`),'Downloads sitemap missing');
 assert.doesNotMatch(map,/404/);
 const robots=await readFile(join(dist,'robots.txt'),'utf8');
 assert.ok(robots.includes(`Sitemap: ${origin}${base}sitemap.xml`));
});
