import {BUILD} from './model.mjs?v=pre-alpha19';

const hotTap='Level I Training / 6- Measurments.pdf';
export const MEASUREMENT_FIGURES={
  'tap-md':{file:'hot-tap-md-crop.webp',width:768,height:378,bytes:8598,sha256:'03efd1bf3f83e81aaa5a9eaaf5ac5dad474b866554341d8a8f2cebcb4db31e12',source:hotTap,page:6,
    title:'Hot Tap MD',alt:'MD arrow between the top outside surface of the run pipe and the valve flange in the shown Hot Tap assembly.'},
  'tap-negative-ld':{file:'negative-ld-crop.webp',width:712,height:513,bytes:9688,sha256:'6f875da3fa2ffa63ccc3e172c18737613584ca300580c72ad4dfc9c956de274e',source:hotTap,page:7,
    title:'Negative Hot Tap LD',alt:'Pilot tip projects outside the adapter flange. The original -LD arrow spans the flange face to the pilot tip. Original caption: Negative Lost Distance.'},
  'tap-positive-ld':{file:'positive-ld-crop.webp',width:672,height:513,bytes:10346,sha256:'95d0239a03f4f65de6c65ed524224afa7666b0e7bef8c761f4f662f25c717605',source:hotTap,page:7,
    title:'Positive Hot Tap LD',alt:'Pilot tip is within the adapter. The original +LD arrow spans the pilot tip to the adapter flange face. Original caption: Positive Lost Distance.'},
  'plant-pt':{file:'plant-pt-crop.webp',width:768,height:711,bytes:38582,sha256:'29d61e1bcc371b91601d6473430d10294587c44054166854b2a6e7131e66f7b5',source:'Level II Training / 3c - Plant Series Completion Plugs.pdf',page:14,
    title:'Plant Series plug thickness',alt:'Two Plant Series plug views with arrows between both plug faces. Original note: The plug thickness is measured from face to face.'},
  'pipeline-pt':{file:'pipeline-pt-crop.webp',width:768,height:603,bytes:20028,sha256:'f2e019c6810c346236b2520fdda42b4c7a237ead8ee8a684d7f73554cbe04cc3',source:'Level II Training / 3d - Pipeline Series Completion Plugs.pdf',page:15,
    title:'Pipeline Series plug thickness',alt:'Original PT arrow and note: The plug thickness is measured from the bottom face to the top of the segment groove.'}
};
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const figureUrl=figure=>'./measurement-figures/'+figure.file+'?v='+BUILD;
export const figureSource=figure=>'Original rendered excerpt: '+figure.source+', PDF/slide '+figure.page+'. TEAM, Inc. All rights reserved. Governing revision not recorded.';

export function measurementFigureMarkup(card){
  const figure=MEASUREMENT_FIGURES[card.figure];
  if(!figure)return '';
  // No src until the owning guide is opened; loading=lazy also defers offscreen figures.
  return '<figure class="datum-original"><img data-measurement-figure="'+escape(card.figure)+'" width="'+figure.width+'" height="'+figure.height+'" loading="lazy" decoding="async" alt="'+escape(figure.alt)+'">'+
    '<p class="figure-error result-hint" role="status" hidden></p><button type="button" class="quiet" data-figure-open="'+escape(card.figure)+'">Enlarge original figure</button>'+
    '<figcaption><p>'+escape(card.text)+'</p><small class="datum-source">'+escape(figureSource(figure))+'</small></figcaption></figure>';
}

export function installMeasurementFigures(document){
  const dialog=document.getElementById('measurement-figure-dialog');
  if(!dialog)return;
  const image=document.getElementById('original-figure-image'),pan=document.getElementById('original-figure-pan');
  const fit=document.getElementById('original-figure-fit');
  let opener=null;
  function load(img){
    const figure=MEASUREMENT_FIGURES[img.dataset.measurementFigure];
    if(!figure||img.getAttribute('src')===figureUrl(figure)&&img.dataset.figureFailed!=='true')return;
    const error=img.closest('figure').querySelector('.figure-error');
    img.hidden=false;error.hidden=true;img.setAttribute('aria-busy','true');
    img.onload=()=>{img.dataset.figureFailed='false';img.setAttribute('aria-busy','false');};
    img.onerror=()=>{
      img.dataset.figureFailed='true';img.hidden=true;img.setAttribute('aria-busy','false');
      error.textContent='Figure unavailable. Connect and reopen this guide to download it for offline use. Text equivalent: '+figure.alt;error.hidden=false;
    };
    if(img.dataset.figureFailed==='true')img.removeAttribute('src');
    img.src=figureUrl(figure);
  }
  document.addEventListener('toggle',event=>{
    const guide=event.target;
    if(guide.matches?.('details.measurement-guidance')&&guide.open)guide.querySelectorAll('img[data-measurement-figure]').forEach(load);
  },true);
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-figure-open]'),figure=MEASUREMENT_FIGURES[button?.dataset.figureOpen];
    if(!figure)return;
    opener=button;image.dataset.measurementFigure=button.dataset.figureOpen;image.alt=figure.alt;
    image.width=figure.width;image.height=figure.height;
    document.getElementById('original-figure-title').textContent=figure.title;
    document.getElementById('original-figure-caption').textContent=figure.alt;
    document.getElementById('original-figure-source').textContent=figureSource(figure);
    pan.classList.remove('is-fit');fit.setAttribute('aria-pressed','false');fit.textContent='Fit whole figure';
    dialog.showModal();load(image);pan.scrollLeft=0;pan.scrollTop=0;
  });
  function finishClose(){
    image.onload=null;image.onerror=null;image.removeAttribute('src');delete image.dataset.figureFailed;
    const target=opener;opener=null;
    if(target?.isConnected)target.focus({preventScroll:true});
  }
  function closeViewer(){
    dialog.close();finishClose();
  }
  document.getElementById('original-figure-close').addEventListener('click',closeViewer);
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeViewer();});
  fit.addEventListener('click',()=>{
    const fitting=fit.getAttribute('aria-pressed')!=='true';
    pan.classList.toggle('is-fit',fitting);fit.setAttribute('aria-pressed',String(fitting));
    fit.textContent=fitting?'Actual size':'Fit whole figure';
  });
  dialog.addEventListener('close',()=>{
    // Native close events are queued; an older close must not clear a reopened figure.
    if(!dialog.open)finishClose();
  });
}
