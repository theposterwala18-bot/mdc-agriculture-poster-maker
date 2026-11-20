import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const script=await readFile(new URL("../dist/pdf-text-editor.js",import.meta.url),"utf8");
test("font controls provide live preview before Apply",()=>{
 for(const id of ["editText","editFontSize","editFont","editColor","coverColor","editAlign","editBold"])assert.ok(script.includes('"'+id+'"'),id);
 assert.match(script,/addEventListener\("input",updateLiveDraft\)/);
 assert.match(script,/liveDraft/);
 assert.match(script,/fontPt|const pt=clamp/);
});
test("replacements never silently shrink to the old text run width",()=>{
 assert.doesNotMatch(script,/Math\.max\(\.45,maxW\/ctx\.measureText/);
 assert.doesNotMatch(script,/ctx\.fillText\(text,bx,y\+i\*lineHeight\)/);
 assert.match(script,/ctx\.fillText\(lines\[i\],bx,baseline\)/);
});
test("existing replacement can be selected and edited again",()=>{
 assert.match(script,/sourceItemId===item\.id/);
 assert.match(script,/state\.selection=existing\?/);
 assert.match(script,/updateSelectedPatch\(\{text,format:formatFromControls\(\)\}\)/);
});
test("background only masks old text footprint, not entire widened text box",()=>{
 assert.match(script,/const r=patch\.rect,original=patch\.originalRect\|\|r/);
 assert.match(script,/ctx\.fillRect\(ox-\.6,oy-\.6,ow\+1\.2,oh\+1\.2\)/);
});
test("file and user data stay local",()=>{
 assert.doesNotMatch(script,/\bfetch\s*\(/);
 assert.match(script,/PDFDocument\.load/);
 assert.match(script,/dest\.embedJpg/);
 assert.match(script,/copyPages\(original/);
});
