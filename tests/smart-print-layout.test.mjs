import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const code=await readFile(new URL('../dist/smart-print-layout.js',import.meta.url),'utf8');
const layout=await import('data:text/javascript,'+encodeURIComponent(code));
test('paper dimensions and orientations remain physically correct',()=>{
 assert.deepEqual(layout.paperMm('a4'),[210,297]);
 assert.deepEqual(layout.paperMm('a4','landscape'),[297,210]);
 assert.deepEqual(layout.paperMm('4x6'),[101.6,152.4]);
 assert.deepEqual(layout.paperMm('custom','landscape',120,200),[200,120]);
 assert.throws(()=>layout.paperMm('custom','portrait',0,297));
});
test('all nine position presets are constrained inside available page',()=>{
 for(const name of ['top-left','top-center','top-right','middle-left','center','middle-right','bottom-left','bottom-center','bottom-right']){
  const {x,y}=layout.anchorXY(name,210,297,100,120,10);
  assert.ok(x>=10&&x<=100, name+' x');
  assert.ok(y>=10&&y<=167, name+' y');
 }
 assert.deepEqual(layout.anchorXY('top-left',210,297,100,120,10),{x:10,y:10});
 assert.deepEqual(layout.anchorXY('bottom-right',210,297,100,120,10),{x:100,y:167});
 assert.throws(()=>layout.anchorXY('center',100,100,101,20,8));
});
test('large paper has bounded browser output resolution',()=>{
 const dimensions=layout.pageCanvasSize(304.8,457.2);
 assert.ok(dimensions.width*dimensions.height<=38000000+30000);
 assert.ok(dimensions.dpi<=300&&dimensions.dpi>=72);
});
test('each UI field required by the JS exists in corresponding HTML',async()=>{
 for(const stem of ['card-page-maker','passport-photo','pdf-tools']){
  const js=await readFile(new URL('../dist/'+stem+'.js',import.meta.url),'utf8');
  const html=await readFile(new URL('../dist/'+stem+'.html',import.meta.url),'utf8');
  const ids=[...js.matchAll(/\$\("([a-zA-Z][a-zA-Z0-9]*)"\)/g)].map(m=>m[1]);
  const missing=[...new Set(ids)].filter(id=>!html.includes('id="'+id+'"'));
  assert.deepEqual(missing,[],stem+' missing DOM IDs');
  assert.match(html,/smart-print-layout\.css/);
  assert.match(js,/smart-print-layout\.js/);
 }
});
test('pdf converter keeps merge split rotate and image operations',async()=>{
 const js=await readFile(new URL('../dist/pdf-tools.js',import.meta.url),'utf8');
 for(const key of ['merge','split','rotate','image'])assert.ok(js.includes('"'+key+'"'));
});
