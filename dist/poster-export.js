const FORMATS = {
  "social": {
    "label": "Social / WhatsApp (2:3)",
    "width": 1080,
    "height": 1620,
    "note": "1080 × 1620 px • WhatsApp ਅਤੇ Social Media ਲਈ"
  },
  "instagram": {
    "label": "Instagram Portrait (4:5)",
    "width": 1080,
    "height": 1350,
    "note": "1080 × 1350 px • Instagram Portrait 4:5 ਲਈ"
  },
  "a4": {
    "label": "A4 Print (300 DPI)",
    "width": 2480,
    "height": 3508,
    "note": "A4 • 2480 × 3508 px • 300 DPI print quality"
  }
};

function fitRect(sw,sh,tw,th){const scale=Math.min(tw/sw,th/sh),width=sw*scale,height=sh*scale;return{x:(tw-width)/2,y:(th-height)/2,width,height};}

function coverRect(sw,sh,tw,th){const scale=Math.max(tw/sw,th/sh),width=sw*scale,height=sh*scale;return{x:(tw-width)/2,y:(th-height)/2,width,height};}

function paintConverted(sourceCanvas,targetCanvas,formatKey){const format=FORMATS[formatKey],ctx=targetCanvas.getContext("2d"),tw=targetCanvas.width,th=targetCanvas.height,same=Math.abs(sourceCanvas.width/sourceCanvas.height-format.width/format.height)<.0001;ctx.clearRect(0,0,tw,th);if(formatKey==="a4"){ctx.fillStyle="#fff";ctx.fillRect(0,0,tw,th);}else if(!same){const cover=coverRect(sourceCanvas.width,sourceCanvas.height,tw,th);ctx.save();ctx.filter="blur("+Math.max(18,Math.round(tw*.035))+"px) saturate(.72)";ctx.globalAlpha=.55;ctx.drawImage(sourceCanvas,cover.x,cover.y,cover.width,cover.height);ctx.restore();ctx.fillStyle="rgba(247,247,241,.7)";ctx.fillRect(0,0,tw,th);}const inset=formatKey==="a4"?Math.round(tw*.018):0,fitted=fitRect(sourceCanvas.width,sourceCanvas.height,tw-inset*2,th-inset*2);ctx.drawImage(sourceCanvas,fitted.x+inset,fitted.y+inset,fitted.width,fitted.height);}

function downloadBlob(blob,filename){const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);}

function withSuffix(filename,suffix,extension){const base=String(filename||"Poster.png").replace(/\.[^.]+$/,"");return base+"-"+suffix+"."+extension;}

function canvasToBlob(canvas,type,quality){return new Promise((resolve,reject)=>{try{canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("Canvas export failed")),type,quality);}catch(error){reject(error);}});}

function asciiBytes(value){return new TextEncoder().encode(value);}

function joinBytes(parts){const total=parts.reduce((sum,part)=>sum+part.length,0),joined=new Uint8Array(total);let offset=0;parts.forEach(part=>{joined.set(part,offset);offset+=part.length;});return joined;}

async function makeA4Pdf(canvas){const jpegBlob=await canvasToBlob(canvas,"image/jpeg",.94),jpeg=new Uint8Array(await jpegBlob.arrayBuffer()),pw=595.28,ph=841.89,content="q\n"+pw+" 0 0 "+ph+" 0 0 cm\n/Im0 Do\nQ\n",objects=[asciiBytes("<< /Type /Catalog /Pages 2 0 R >>"),asciiBytes("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),asciiBytes("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 "+pw+" "+ph+"] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>"),joinBytes([asciiBytes("<< /Type /XObject /Subtype /Image /Width "+canvas.width+" /Height "+canvas.height+" /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length "+jpeg.length+" >>\nstream\n"),jpeg,asciiBytes("\nendstream")]),asciiBytes("<< /Length "+asciiBytes(content).length+" >>\nstream\n"+content+"endstream")],parts=[asciiBytes("%PDF-1.4\n")],offsets=[0];let position=parts[0].length;objects.forEach((object,index)=>{offsets.push(position);const wrapped=joinBytes([asciiBytes(index+1+" 0 obj\n"),object,asciiBytes("\nendobj\n")]);parts.push(wrapped);position+=wrapped.length;});const xrefPosition=position,xrefRows=offsets.slice(1).map(offset=>String(offset).padStart(10,"0")+" 00000 n \n").join("");parts.push(asciiBytes("xref\n0 "+(objects.length+1)+"\n0000000000 65535 f \n"+xrefRows+"trailer\n<< /Size "+(objects.length+1)+" /Root 1 0 R >>\nstartxref\n"+xrefPosition+"\n%%EOF"));return new Blob([joinBytes(parts)],{type:"application/pdf"});}

export function createPosterExportController(opts){const sourceCanvas=opts.sourceCanvas,modalCanvas=opts.modalCanvas,toolbar=opts.toolbar,previewNote=opts.previewNote,filename=opts.filename,showToast=opts.showToast,storageKey=opts.storageKey||"mdc-poster-size",sourceDefault=sourceCanvas.width/sourceCanvas.height>.7?"instagram":"social";let selected=localStorage.getItem(storageKey)||opts.defaultFormat||sourceDefault;if(!FORMATS[selected])selected=sourceDefault;const control=document.createElement("label");control.className="poster-size-control";control.innerHTML='<span>Poster Size</span><select aria-label="Poster export size">'+Object.entries(FORMATS).map(([key,item])=>'<option value="'+key+'">'+item.label+"</option>").join("")+"</select>";const select=control.querySelector("select");select.value=selected;toolbar.prepend(control);const pdfButton=document.createElement("button");pdfButton.className="pdf-download-button";pdfButton.type="button";pdfButton.textContent="PDF Download";pdfButton.hidden=selected!=="a4";toolbar.appendChild(pdfButton);const previewCanvas=document.createElement("canvas");previewCanvas.className="format-preview-canvas";previewCanvas.setAttribute("aria-label","ਚੁਣੇ ਹੋਏ size ਦਾ poster preview");sourceCanvas.insertAdjacentElement("afterend",previewCanvas);function getFilename(){return typeof filename==="function"?filename():filename;}function makeOutputCanvas(){const format=FORMATS[selected];if(sourceCanvas.width===format.width&&sourceCanvas.height===format.height)return sourceCanvas;const output=document.createElement("canvas");output.width=format.width;output.height=format.height;paintConverted(sourceCanvas,output,selected);return output;}function refreshPreview(){const format=FORMATS[selected],native=sourceCanvas.width===format.width&&sourceCanvas.height===format.height;sourceCanvas.classList.toggle("export-source-hidden",!native);previewCanvas.hidden=native;if(!native){const previewWidth=selected==="a4"?620:720;previewCanvas.width=previewWidth;previewCanvas.height=Math.round(previewWidth*format.height/format.width);paintConverted(sourceCanvas,previewCanvas,selected);}previewNote.textContent=format.note;pdfButton.hidden=selected!=="a4";}function copyToModal(){const output=makeOutputCanvas(),maxWidth=selected==="a4"?900:Math.min(output.width,1080);modalCanvas.width=maxWidth;modalCanvas.height=Math.round(maxWidth*output.height/output.width);const mc=modalCanvas.getContext("2d");mc.clearRect(0,0,modalCanvas.width,modalCanvas.height);mc.drawImage(output,0,0,modalCanvas.width,modalCanvas.height);}async function downloadPNG(){try{const format=FORMATS[selected],output=makeOutputCanvas(),blob=await canvasToBlob(output,"image/png"),suffix=selected==="a4"?"A4-Print":selected==="instagram"?"Instagram-4x5":"Social-2x3";downloadBlob(blob,withSuffix(getFilename(),suffix,"png"));window.mdcTrack?.("poster_download",{export_format:selected,export_size:format.width+"x"+format.height});showToast?.(format.label+" PNG download ਹੋ ਗਿਆ।");}catch(error){showToast?.("Poster download ਨਹੀਂ ਹੋ ਸਕਿਆ। Online photo ਹੋਵੇ ਤਾਂ Manual Upload try ਕਰੋ।");}}async function downloadPDF(){try{const output=makeOutputCanvas(),blob=await makeA4Pdf(output);downloadBlob(blob,withSuffix(getFilename(),"A4-Print","pdf"));window.mdcTrack?.("poster_download",{export_format:"a4-pdf",export_size:"A4"});showToast?.("A4 Print PDF download ਹੋ ਗਿਆ।");}catch(error){showToast?.("PDF download ਨਹੀਂ ਹੋ ਸਕਿਆ। Online photo ਹੋਵੇ ਤਾਂ Manual Upload try ਕਰੋ।");}}select.addEventListener("change",()=>{selected=select.value;localStorage.setItem(storageKey,selected);refreshPreview();window.mdcTrack?.("poster_size_select",{export_format:selected});});pdfButton.addEventListener("click",downloadPDF);refreshPreview();return{refreshPreview,copyToModal,downloadPNG,downloadPDF,makeOutputCanvas,get format(){return selected;}};}
