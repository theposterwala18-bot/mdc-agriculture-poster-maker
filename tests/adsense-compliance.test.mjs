import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {join,dirname} from 'node:path';
const root=new URL('../dist/',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const pages=['index.html','about.html','contact.html','privacy-policy.html','terms.html','tools.html','custom-service.html'];
test('All public trust pages exist and are accessible through home',async()=>{
 const home=await read('index.html');
 for(const path of ['about.html','contact.html','privacy-policy.html','terms.html']) {
  const page=await read(path);assert.match(page,/<h1>/);assert.ok(home.includes('href="'+path+'"'),path);
  assert.match(page,/<meta name="robots" content="index,follow">/);
 }
});
test('Site accurately differentiates Google sign-in, payment, usage tracking and support',async()=>{
 const p=await read('privacy-policy.html');
 for(const word of ['Google','Firebase','Razorpay','Cloudflare','cookies','analytics','download','email'])assert.ok(p.toLowerCase().includes(word.toLowerCase()),word);
 const about=await read('about.html');
 assert.ok(about.includes('independent creative service'));
 assert.ok(about.includes('dhaliwalballi18@gmail.com'));
 assert.ok(about.includes('theposterwala18@gmail.com'));
});
test('Old company alias is absent from main support label',async()=>{
 const home=await read('index.html');
 assert.doesNotMatch(home,/Email Mr Dhaliwal Creation/i);
 assert.match(home,/Email The Poster Wala support/);
});
test('Google publisher ID appears in ad snippet and correct ads.txt',async()=>{
 const [home,ads]=await Promise.all([read('index.html'),read('ads.txt')]);
 const id=home.match(/ca-pub-([0-9]{16})/);assert.ok(id);
 assert.equal(ads.trim(),`google.com, pub-${id[1]}, DIRECT, f08c47fec0942fa0`);
});
test('Robots and sitemap point to real public pages',async()=>{
 const robots=await read('robots.txt'),sitemap=await read('sitemap.xml');
 assert.match(robots,/User-agent: \*/);
 assert.match(robots,/Sitemap: https:\/\/theposterwala\.in\/sitemap\.xml/);
 const paths=[...sitemap.matchAll(/<loc>https:\/\/theposterwala\.in\/([^<]*)<\/loc>/g)].map(m=>m[1]||'index.html');
 assert.ok(paths.length>=10);
 for(const path of paths){await access(new URL(path,root))}
 assert.ok(!sitemap.includes('owner-dashboard.html'));
});
test('Static public links target existing local HTML where relevant',async()=>{
 for(const page of pages){
  const html=await read(page);
  const links=[...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1]).filter(x=>/^[a-z0-9-]+\.html(?:#.*)?$/i.test(x));
  for(const href of links)await access(new URL(href.split('#')[0],root));
 }
});
test('Custom-design page and tools navigation expose trust links',async()=>{
 const [custom,nav,tools]=await Promise.all([read('custom-service.html'),read('tools-navigation.js'),read('tools.html')]);
 for(const name of ['about.html','contact.html','privacy-policy.html','terms.html']){
  assert.ok(custom.includes(name));assert.ok(nav.includes(name));assert.ok(tools.includes(name));
 }
});
