import assert from "node:assert/strict";
import {targetBytes,fitSize,safeFilename,bytesLabel,zipFiles,PRESETS} from "../dist/smart-image-engine.js";
import {writeFile} from "node:fs/promises";
assert.equal(targetBytes(45),46080);
assert.equal(targetBytes(1024),1048576);
assert.throws(()=>targetBytes(5));
assert.throws(()=>targetBytes(Infinity));
assert.equal(fitSize(4000,3000,2000).width,2000);
assert.equal(fitSize(4000,3000,2000).height,1500);
assert.equal(fitSize(400,200,1000).width,400);
assert.ok(!safeFilename("../../hello.jpeg").includes("/"));
assert.ok(bytesLabel(1024).includes("KB"));
assert.equal(PRESETS.govt45.kb,45);
const zipped=await zipFiles([
 {name:"hello.jpg",blob:new Blob([new Uint8Array([1,2,3,4,5])],{type:"image/jpeg"})},
 {name:"test.png",blob:new Blob([new Uint8Array([9,8,7])],{type:"image/png"})}
]);
await writeFile("/tmp/smart-image-studio-test.zip",new Uint8Array(await zipped.arrayBuffer()));
assert.equal(zipped.type,"application/zip");
console.log("Smart Image engine: target KB, dimensions and batch ZIP generated");
