import {WORKSHEET_SOURCE,WORKSHEET_FIELDS,createWorksheetDraft,applyHotTapCandidates,setWorksheetValue,worksheetLayout,worksheetPrintDocument} from './worksheet-draft.mjs?v=pre-alpha25';
const $=id=>document.getElementById(id),escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let draft=null,background='',backgroundImage=null,loadingTask=null,renderTask=null,generation=0,closed=false;
const measureCanvas=document.createElement('canvas'),measureContext=measureCanvas.getContext('2d');
const measure=(text,font)=>{measureContext.font=font+'px Arial';return measureContext.measureText(text).width;};
function cancelLoading(){generation++;renderTask?.cancel();loadingTask?.destroy()?.catch(()=>{});renderTask=null;loadingTask=null;}
function updatePreview(){
 if(!draft)return;const layout=worksheetLayout(draft.values,measure);$('overflow').textContent=layout.errors.join('\n');$('print').disabled=!background||layout.errors.length>0;
 const canvas=$('preview'),ctx=canvas.getContext('2d');ctx.clearRect(0,0,612,792);if(!backgroundImage)return;ctx.drawImage(backgroundImage,0,0,612,792);ctx.fillStyle='#000';
 for(const row of layout.entries){ctx.font=row.font+'px Arial';ctx.textBaseline='top';const left=row.field.section==='Job details'||row.field.id==='notes';ctx.textAlign=left?'left':'center';row.lines.forEach((line,i)=>ctx.fillText(line,left?row.x+2:row.x+row.width/2,row.y+(row.field.id==='notes'?1:(row.height-row.lineHeight)/2)+i*row.lineHeight));}
 ctx.save();ctx.translate(20,390);ctx.rotate(-Math.PI/2);ctx.font='bold 9px Arial';ctx.textAlign='left';ctx.fillStyle='#555';ctx.fillText('DRAFT - REVIEW REQUIRED - NOT FIELD VERIFICATION',0,0);ctx.restore();
}
function installFields(){
 const groups=new Map();for(const field of WORKSHEET_FIELDS){const key=(field.side==='lead'?'Lead technician - ':field.side==='second'?'Second technician - ':'')+field.section;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(field);}
 $('fields').innerHTML=[...groups].map(([label,fields])=>'<details'+(label==='Job details'?' open':'')+'><summary>'+escape(label)+'</summary>'+fields.map(field=>'<label class="field">'+escape(field.label)+(field.id==='notes'?'<textarea rows="5"':'<input type="text"')+' data-worksheet-field="'+field.id+'">'+(field.id==='notes'?'</textarea>':'')+'<small>'+(field.binding?'Confirmed Hot Tap candidate in inches; review applicability.':field.section==='Job details'||field.id==='notes'?'Explicit matching metadata or independent manual entry.':'Manual only; no automatic binding confirmed.')+'</small></label>').join('')+'</details>').join('');
 for(const input of document.querySelectorAll('[data-worksheet-field]'))input.value=draft.values[input.dataset.worksheetField];
 $('fields').addEventListener('input',event=>{const id=event.target.dataset.worksheetField;if(!id)return;setWorksheetValue(draft,id,event.target.value);updatePreview();});
}
async function loadTemplate(file){
 cancelLoading();background='';backgroundImage=null;updatePreview();if(!file)return;const token=generation;
 $('template-status').textContent='Checking the original source and rendering page 5 only...';
 try{
  const bytes=new Uint8Array(await file.arrayBuffer());const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');
  if(digest!==WORKSHEET_SOURCE.sha256)throw Error('This is not the reviewed HTS-5201 source version. Nothing was printed. Select the correct original file.');
  const pdfjs=await import('../pdf.mjs');if(token!==generation||closed)return;
  pdfjs.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.mjs?v=pre-alpha25',import.meta.url).href;
  loadingTask=pdfjs.getDocument({data:bytes,isEvalSupported:false});const pdf=await loadingTask.promise;if(token!==generation||closed)return;
  if(pdf.numPages<5)throw Error('The reviewed worksheet page is missing.');
  const page=await pdf.getPage(5),actual=page.getViewport({scale:1});if(Math.abs(actual.width-612)>.1||Math.abs(actual.height-792)>.1)throw Error('Worksheet page 5 must be Letter 612 x 792 points.');
  const viewport=page.getViewport({scale:2}),canvas=document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;renderTask=page.render({canvasContext:canvas.getContext('2d'),viewport});await renderTask.promise;if(token!==generation||closed)return;
  const image=new Image();image.src=canvas.toDataURL('image/png');await image.decode();if(token!==generation||closed)return;
  background=image.src;backgroundImage=image;$('template-status').textContent='Verified original source. Page 5 only; original header, footer and Stop Work background retained. Review the draft before printing.';await pdf.destroy();loadingTask=null;renderTask=null;updatePreview();
 }catch(error){if(token===generation&&!closed){background='';backgroundImage=null;$('template-status').textContent=error.message;updatePreview();}}
}
$('template').addEventListener('change',()=>loadTemplate($('template').files[0]));
$('applicability').addEventListener('change',()=>{$('fill').disabled=!draft?.eligible||!$('applicability').checked;});
$('fill').addEventListener('click',()=>{try{applyHotTapCandidates(draft,{applicabilityConfirmed:$('applicability').checked});for(const input of document.querySelectorAll('[data-worksheet-field]'))input.value=draft.values[input.dataset.worksheetField];$('binding-status').textContent='Confirmed Hot Tap candidates applied to both columns; missing or invalid results remain blank. Entries stay independently editable and unverified.';updatePreview();}catch(error){$('binding-status').textContent=error.message;}});
$('print').addEventListener('click',async()=>{
 let popup;try{const html=worksheetPrintDocument(background,draft.values,measure);popup=window.open('','_blank','width=900,height=1000');if(!popup)throw Error('Print window blocked. Allow the print window; your job is unchanged.');popup.document.write(html);popup.document.close();await Promise.all([...popup.document.querySelectorAll('link[rel="stylesheet"]')].map(link=>link.sheet?Promise.resolve():new Promise((resolve,reject)=>{link.onload=resolve;link.onerror=()=>reject(Error('Worksheet print styles did not load.'));})));await popup.document.fonts?.ready;const image=new popup.Image();image.src=background;await image.decode();if(!popup.closed){popup.focus();popup.print();}}
 catch(error){popup?.close();$('overflow').textContent=error.message;}
});
$('cancel').addEventListener('click',()=>{closed=true;cancelLoading();window.close();});
window.addEventListener('beforeunload',()=>{closed=true;cancelLoading();});
window.addEventListener('message',event=>{
 if(draft||event.origin!==location.origin||event.source!==window.opener||event.data?.type!=='tapcalc-worksheet-snapshot')return;
 try{draft=createWorksheetDraft(event.data.snapshot);$('operation').textContent='Snapshot: '+draft.operationLabel+' (selected operation only; subsequent job edits do not change this draft).';installFields();$('applicability').disabled=!draft.eligible;$('binding-status').textContent=draft.eligible?'Only BCO/MCO distances, Rod BCO/Rod MCO and Hot Tap LI have confirmed candidate bindings in inches. Confirm applicability before filling.':'This operation has no standard Hot Tap stage. All numeric autofill stays blank; no operation or family fallback is supplied.';updatePreview();}
 catch(error){$('operation').textContent=error.message;}
});
if(window.opener)window.opener.postMessage({type:'tapcalc-worksheet-ready'},location.origin);else $('operation').textContent='Open this local draft from a selected calculator operation.';
