/** FileJolt pre-deploy verification: compare pinned product metadata with GitHub's published releases. */
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const products=JSON.parse(await readFile(fileURLToPath(new URL('../src/content/products.json',import.meta.url)),'utf8'));
const headers={'Accept':'application/vnd.github+json','User-Agent':'FileJolt-Pages-Release-Validation','X-GitHub-Api-Version':'2022-11-28'};
if(process.env.GITHUB_TOKEN)headers.Authorization=`Bearer ${process.env.GITHUB_TOKEN}`;
let count=0;
for(const product of products){
 const repo=new URL(product.repoUrl);
 if(repo.hostname!=='github.com'||repo.pathname.split('/').filter(Boolean).length!==2)throw new Error(`${product.name}: invalid repository URL`);
 const target=`https://api.github.com/repos${repo.pathname}/releases/latest`;
 const response=await fetch(target,{headers,signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw new Error(`${product.name}: GitHub API returned HTTP ${response.status}; publication blocked`);
 const latest=await response.json();
 if(latest.draft||latest.prerelease||latest.tag_name!==product.tag)throw new Error(`${product.name}: published latest release is ${latest.tag_name}; website pins ${product.tag}`);
 if(latest.html_url!==product.releaseUrl)throw new Error(`${product.name}: release page changed`);
 const asset=latest.assets?.find(a=>a.name===product.filename);
 if(!asset)throw new Error(`${product.name}: missing expected Windows ZIP asset ${product.filename}`);
 if(asset.size!==product.sizeBytes)throw new Error(`${product.name}: file size differs from the published asset`);
 if(asset.browser_download_url!==product.downloadUrl)throw new Error(`${product.name}: direct download link differs from the published asset`);
 if(asset.digest!==`sha256:${product.sha256}`)throw new Error(`${product.name}: SHA-256 differs from the published asset`);
 const date=latest.published_at?.slice(0,10);
 if(date && date!==product.releaseDate)throw new Error(`${product.name}: publication date differs; website=${product.releaseDate}, GitHub=${date}`);
 console.log(`[PASS] ${product.name} ${product.tag} — asset filename, size, URL, date, SHA-256`);
 count++;
}
console.log(`[PASS] ${count} stable releases match the official GitHub API metadata.`);
