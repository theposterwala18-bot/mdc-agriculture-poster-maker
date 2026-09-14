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


const PAYMENT_API = "https://the-poster-wala-payment-api.theposterwala18.workers.dev";
const PAYMENT_TOKEN_KEY = "tpw-poster-download-token-v1";
let razorpayLoader;

function loadRazorpayCheckout(){
  if(window.Razorpay)return Promise.resolve();
  if(razorpayLoader)return razorpayLoader;
  razorpayLoader=new Promise((resolve,reject)=>{
    const script=document.createElement("script");
    script.src="https://checkout.razorpay.com/v1/checkout.js";
    script.async=true;
    script.onload=()=>resolve();
    script.onerror=()=>reject(new Error("Razorpay checkout could not load"));
    document.head.appendChild(script);
  });
  return razorpayLoader;
}

async function hasValidPaymentToken(){
  const token=localStorage.getItem(PAYMENT_TOKEN_KEY);
  if(!token)return false;
  try{
    const response=await fetch(PAYMENT_API+"/validate-token",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({token})
    });
    const result=await response.json();
    if(result.success)return true;
  }catch(error){}
  localStorage.removeItem(PAYMENT_TOKEN_KEY);
  return false;
}

function addPaymentStyles(){
  if(document.getElementById("tpw-payment-styles"))return;
  const style=document.createElement("style");
  style.id="tpw-payment-styles";
  style.textContent=".tpw-pay-overlay{position:fixed;inset:0;z-index:100000;display:grid;place-items:center;padding:18px;background:rgba(7,14,30,.72);backdrop-filter:blur(5px)}"+
    ".tpw-pay-card{width:min(430px,100%);border-radius:22px;background:#fff;padding:26px;box-shadow:0 28px 80px rgba(0,0,0,.34);font-family:inherit;color:#172033}"+
    ".tpw-pay-badge{display:inline-flex;align-items:center;gap:7px;padding:6px 10px;border-radius:999px;background:#fff3cd;color:#765500;font-size:12px;font-weight:800}"+
    ".tpw-pay-card h2{margin:16px 0 8px;font-size:25px;line-height:1.2}.tpw-pay-card p{margin:0;color:#5d6678;line-height:1.55}"+
    ".tpw-pay-price{margin:20px 0;padding:16px;border:1px solid #dce4f2;border-radius:15px;background:#f7faff;display:flex;align-items:center;justify-content:space-between}"+
    ".tpw-pay-price strong{font-size:28px;color:#1557d5}.tpw-pay-actions{display:grid;grid-template-columns:1fr 1.5fr;gap:10px;margin-top:18px}"+
    ".tpw-pay-actions button{min-height:46px;border-radius:11px;border:1px solid #ccd5e3;font:700 15px inherit;cursor:pointer}"+
    ".tpw-pay-cancel{background:#fff;color:#3c4658}.tpw-pay-now{border-color:#1768e5!important;background:#1768e5;color:#fff}"+
    ".tpw-pay-now:disabled{opacity:.62;cursor:wait}.tpw-pay-message{min-height:20px;margin-top:12px!important;font-size:13px;color:#bf2b2b!important}"+
    ".tpw-pay-safe{margin-top:12px!important;font-size:12px!important;text-align:center}";
  document.head.appendChild(style);
}

function openPaymentDialog(showToast){
  addPaymentStyles();
  return new Promise(resolve=>{
    let finished=false;
    let checkoutOpened=false;
    const overlay=document.createElement("div");
    overlay.className="tpw-pay-overlay";
    overlay.setAttribute("role","dialog");
    overlay.setAttribute("aria-modal","true");
    overlay.setAttribute("aria-label","Poster download payment");
    overlay.innerHTML='<div class="tpw-pay-card">'+
      '<span class="tpw-pay-badge">TEST MODE • ਕੋਈ ਅਸਲੀ ਪੈਸਾ ਨਹੀਂ ਕੱਟੇਗਾ</span>'+
      '<h2>Poster Download Unlock ਕਰੋ</h2>'+
      '<p>₹50 ਦੀ successful payment ਤੋਂ ਬਾਅਦ PNG ਅਤੇ PDF download 30 ਮਿੰਟ ਲਈ unlock ਰਹੇਗਾ।</p>'+
      '<div class="tpw-pay-price"><span>Poster download access</span><strong>₹50</strong></div>'+
      '<div class="tpw-pay-actions"><button type="button" class="tpw-pay-cancel">Cancel</button>'+
      '<button type="button" class="tpw-pay-now">Pay ₹50 &amp; Download</button></div>'+
      '<p class="tpw-pay-message" aria-live="polite"></p>'+
      '<p class="tpw-pay-safe">Secure test checkout powered by Razorpay</p></div>';
    document.body.appendChild(overlay);
    const payButton=overlay.querySelector(".tpw-pay-now");
    const cancelButton=overlay.querySelector(".tpw-pay-cancel");
    const message=overlay.querySelector(".tpw-pay-message");
    const finish=allowed=>{
      if(finished)return;
      finished=true;
      overlay.remove();
      resolve(allowed);
    };
    cancelButton.addEventListener("click",()=>finish(false));
    overlay.addEventListener("click",event=>{
      if(event.target===overlay&&!checkoutOpened)finish(false);
    });
    payButton.addEventListener("click",async()=>{
      payButton.disabled=true;
      payButton.textContent="Checkout ਖੁੱਲ੍ਹ ਰਿਹਾ ਹੈ…";
      message.textContent="";
      try{
        const results=await Promise.all([
          loadRazorpayCheckout(),
          fetch(PAYMENT_API+"/create-order",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:"{}"
          })
        ]);
        const orderResponse=results[1];
        const order=await orderResponse.json();
        if(!orderResponse.ok||!order.success)throw new Error(order.error||"Order could not be created");
        checkoutOpened=true;
        const checkout=new window.Razorpay({
          key:order.keyId,
          amount:order.amount,
          currency:order.currency,
          name:order.businessName,
          description:order.description,
          order_id:order.orderId,
          theme:{color:"#1768e5"},
          retry:{enabled:true},
          modal:{
            escape:true,
            ondismiss:()=>finish(false)
          },
          handler:async payment=>{
            message.textContent="Payment verify ਹੋ ਰਹੀ ਹੈ…";
            try{
              const verificationResponse=await fetch(PAYMENT_API+"/verify-payment",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify(payment)
              });
              const verification=await verificationResponse.json();
              if(!verificationResponse.ok||!verification.success)throw new Error(verification.error||"Verification failed");
              localStorage.setItem(PAYMENT_TOKEN_KEY,verification.token);
              showToast?.("Payment verify ਹੋ ਗਈ। Download 30 ਮਿੰਟ ਲਈ unlock ਹੈ।");
              finish(true);
            }catch(error){
              checkoutOpened=false;
              payButton.disabled=false;
              payButton.textContent="Retry Payment";
              message.textContent="Payment verify ਨਹੀਂ ਹੋ ਸਕੀ। ਦੁਬਾਰਾ try ਕਰੋ।";
            }
          }
        });
        checkout.on("payment.failed",response=>{
          message.textContent=response?.error?.description||"Payment failed. ਦੁਬਾਰਾ try ਕਰੋ।";
        });
        checkout.open();
      }catch(error){
        checkoutOpened=false;
        payButton.disabled=false;
        payButton.textContent="Retry Payment";
        message.textContent="Checkout ਨਹੀਂ ਖੁੱਲ੍ਹਿਆ। Internet check ਕਰਕੇ ਦੁਬਾਰਾ try ਕਰੋ।";
      }
    });
  });
}

async function ensurePosterPayment(showToast){
  showToast?.("Payment access check ਹੋ ਰਹੀ ਹੈ…");
  if(await hasValidPaymentToken())return true;
  return openPaymentDialog(showToast);
}

export function createPosterExportController(opts){const sourceCanvas=opts.sourceCanvas,modalCanvas=opts.modalCanvas,toolbar=opts.toolbar,previewNote=opts.previewNote,filename=opts.filename,showToast=opts.showToast,storageKey=opts.storageKey||"mdc-poster-size",sourceDefault=sourceCanvas.width/sourceCanvas.height>.7?"instagram":"social";let selected=localStorage.getItem(storageKey)||opts.defaultFormat||sourceDefault;if(!FORMATS[selected])selected=sourceDefault;const control=document.createElement("label");control.className="poster-size-control";control.innerHTML='<span>Poster Size</span><select aria-label="Poster export size">'+Object.entries(FORMATS).map(([key,item])=>'<option value="'+key+'">'+item.label+"</option>").join("")+"</select>";const select=control.querySelector("select");select.value=selected;toolbar.prepend(control);const pdfButton=document.createElement("button");pdfButton.className="pdf-download-button";pdfButton.type="button";pdfButton.textContent="PDF Download";pdfButton.hidden=selected!=="a4";toolbar.appendChild(pdfButton);const previewCanvas=document.createElement("canvas");previewCanvas.className="format-preview-canvas";previewCanvas.setAttribute("aria-label","ਚੁਣੇ ਹੋਏ size ਦਾ poster preview");sourceCanvas.insertAdjacentElement("afterend",previewCanvas);function getFilename(){return typeof filename==="function"?filename():filename;}function makeOutputCanvas(){const format=FORMATS[selected];if(sourceCanvas.width===format.width&&sourceCanvas.height===format.height)return sourceCanvas;const output=document.createElement("canvas");output.width=format.width;output.height=format.height;paintConverted(sourceCanvas,output,selected);return output;}function refreshPreview(){const format=FORMATS[selected],native=sourceCanvas.width===format.width&&sourceCanvas.height===format.height;sourceCanvas.classList.toggle("export-source-hidden",!native);previewCanvas.hidden=native;if(!native){const previewWidth=selected==="a4"?620:720;previewCanvas.width=previewWidth;previewCanvas.height=Math.round(previewWidth*format.height/format.width);paintConverted(sourceCanvas,previewCanvas,selected);}previewNote.textContent=format.note;pdfButton.hidden=selected!=="a4";}function copyToModal(){const output=makeOutputCanvas(),maxWidth=selected==="a4"?900:Math.min(output.width,1080);modalCanvas.width=maxWidth;modalCanvas.height=Math.round(maxWidth*output.height/output.width);const mc=modalCanvas.getContext("2d");mc.clearRect(0,0,modalCanvas.width,modalCanvas.height);mc.drawImage(output,0,0,modalCanvas.width,modalCanvas.height);}async function performDownloadPNG(){try{const format=FORMATS[selected],output=makeOutputCanvas(),blob=await canvasToBlob(output,"image/png"),suffix=selected==="a4"?"A4-Print":selected==="instagram"?"Instagram-4x5":"Social-2x3";downloadBlob(blob,withSuffix(getFilename(),suffix,"png"));window.mdcTrack?.("poster_download",{export_format:selected,export_size:format.width+"x"+format.height});showToast?.(format.label+" PNG download ਹੋ ਗਿਆ।");}catch(error){showToast?.("Poster download ਨਹੀਂ ਹੋ ਸਕਿਆ। Online photo ਹੋਵੇ ਤਾਂ Manual Upload try ਕਰੋ।");}}async function performDownloadPDF(){try{const output=makeOutputCanvas(),blob=await makeA4Pdf(output);downloadBlob(blob,withSuffix(getFilename(),"A4-Print","pdf"));window.mdcTrack?.("poster_download",{export_format:"a4-pdf",export_size:"A4"});showToast?.("A4 Print PDF download ਹੋ ਗਿਆ।");}catch(error){showToast?.("PDF download ਨਹੀਂ ਹੋ ਸਕਿਆ। Online photo ਹੋਵੇ ਤਾਂ Manual Upload try ਕਰੋ।");}}async function downloadPNG(){if(!(await ensurePosterPayment(showToast)))return;return performDownloadPNG();}async function downloadPDF(){if(!(await ensurePosterPayment(showToast)))return;return performDownloadPDF();}select.addEventListener("change",()=>{selected=select.value;localStorage.setItem(storageKey,selected);refreshPreview();window.mdcTrack?.("poster_size_select",{export_format:selected});});pdfButton.addEventListener("click",downloadPDF);refreshPreview();return{refreshPreview,copyToModal,downloadPNG,downloadPDF,makeOutputCanvas,get format(){return selected;}};}
