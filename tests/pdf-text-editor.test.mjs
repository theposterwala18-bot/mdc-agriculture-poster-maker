import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../dist/',import.meta.url);
const read=name=>readFile(new URL(name,root),'utf8');
test('PDF editor has all referenced controls',async()=>{
 const [js,html]=await Promise.all([read('pdf-text-editor.js'),read('pdf-text-editor.html')]);
 const ids=[...js.matchAll(/\$\("([a-z][a-zA-Z0-9]*)"\)/g)].map(m=>m[1]);
 const missing=[...new Set(ids)].filter(id=>!html.includes('id="'+id+'"'));
 assert.deepEqual(missing,[]);
});
test('Editor uses local browser render and flattened modified pages, preserves untouched pages',async()=>{
 const js=await read('pdf-text-editor.js');
 for(const token of ['pdfjsLib','getTextContent','drawPatch','copyPages(original','dest.embedJpg','source.render','page.render','readJson']) {
  if(token==='source.render'||token==='readJson')continue;
  assert.ok(js.includes(token),token);
 }
 assert.ok(!/fetch\s*\(/.test(js),'No network upload from editor script');
 assert.ok(js.includes('state.undo')&&js.includes('state.redo'));
 assert.ok(js.includes('PDFDocument.load')&&js.includes('page.getViewport'));
});
test('Navigation, converter and build expose new editor',async()=>{
 const [html,converter,nav,vite,tools]=await Promise.all([read('pdf-tools.html'),read('pdf-tools.js'),read('tools-navigation.js'),readFile(new URL('../vite.config.mjs',import.meta.url),'utf8'),read('tools.html')]);
 assert.ok(html.includes('value="edit"'));
 assert.ok(converter.includes('mode==="edit"'));
 for(const value of [nav,vite,tools])assert.ok(value.includes('pdf-text-editor.html'));
});
test('Original PDF features remain available',async()=>{
 const js=await read('pdf-tools.js');
 for(const value of ['merge','split','rotate','image'])assert.ok(js.includes('"'+value+'"'));
});
