import {stepsFor} from './model.mjs?v=pre-alpha18';
import {measurementFigureMarkup} from './measurement-figures.mjs?v=pre-alpha18';

const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const source=(title,pages)=>'TEAM training: '+title+', '+pages+'. Revision not recorded in this copy.';
const hotTap=pages=>source('Level I Hot Tap Measurements',pages);
const plant=pages=>source('Plant Series Completion Plugs',pages);
const pipeline=pages=>source('Pipeline Series Completion Plugs',pages);

// Physical endpoints below are source-backed descriptions, never inferred from equations.
export function measurementHelpFor(operation,stage){
  if(!stepsFor(operation).includes(stage))return null;
  if(stage==='tap')return {
    title:'Where to measure: Hot Tap',scope:'Standard pilot-and-adapter Hot Tap setup only. These reference figures are not equipment-specific setup approval.',
    cards:[
      {key:'tap-md',title:'MD: pipe to valve',upper:'Valve flange + gasket',lower:'Top of run pipe',figure:'tap-md',text:'Measure from the top outside surface of the run pipe to the valve flange face, including the gasket. This is not a pipe-centerline measurement.',source:hotTap('pp.5-6')},
      {key:'tap-positive-ld',title:'Positive LD: pilot inside adapter',upper:'Pilot tip inside adapter',lower:'Adapter flange face',figure:'tap-positive-ld',text:'The pilot tip is inside the adapter. The reference distance runs between the pilot tip and the adapter flange face.',source:hotTap('p.7')},
      {key:'tap-negative-ld',title:'Negative LD: pilot projects out',upper:'Adapter flange face',lower:'Pilot tip beyond flange',figure:'tap-negative-ld',text:'The pilot tip extends beyond the adapter flange face. This is the negative-LD configuration in the source.',source:hotTap('p.7')},
      {key:'tap-start',title:'Start: read the machine scale',text:'Use the initial measuring-rod or body-tube scale reading. It may be nonzero or negative. A universal physical index for every machine has not been established here, so no common Start datum is drawn.',source:hotTap('p.15')}
    ],notes:['This form applies the entered LD value and the selected Add/Subtract direction. A negative value with Subtract reverses the sign twice. Blank Hot Tap LD uses 0; it is not an entered measurement.']
  };
  if(stage==='stop')return {
    title:'Where to measure: pivot-head Line Stop',scope:'Standard pivot-head reference only. Do not transfer these endpoints to HTP, Hi-Stop or other equipment families.',
    cards:[
      {key:'stop-md',title:'MD: confirm the line-stop setup',text:'Line Stop MD endpoints still need applicability verification. General Line Stop p.28 illustrates LD/WD, not MD. Do not relabel that figure as an MD measurement; confirm the governing procedure for the actual head and adapter.',source:source('General Line Stop','p.28 (LD/WD only; not MD verification)')},
      {key:'stop-ld',title:'LD: use the line-stop head',text:'The reference endpoints are the flange face and the control-bar foot on the line-stop head. This is not the Hot Tap pilot-tip distance. Confirm the signed setup for the actual adapter and head.',source:source('General Line Stop','p.28')}
    ],notes:['Hot Tap and Line Stop keep independent LD values. These references do not calculate or verify measured line-stop travel.']
  };
  if(stage==='plug')return {
    title:'Plug families: check the measurement points',scope:'Reference comparison only, not a plug-family selector. The active general plug calculation is not certified for any family by these figures. No formula or saved input changes when this section is opened.',
    cards:[
      {key:'plant-pt',title:'Plant Series: PT is face to face',upper:'Top plug face',lower:'Bottom plug face',figure:'plant-pt',text:'For the Plant Series illustration, plug thickness spans the two plug faces, not the threaded attachment.',source:plant('p.14')},
      {key:'pipeline-pt',title:'Pipeline Series: PT ends at the groove',upper:'Top of segment groove',lower:'Bottom plug face',figure:'pipeline-pt',text:'For the Pipeline Series illustration, measure from the bottom plug face to the top of the segment groove. Do not substitute the Plant Series face-to-face thickness.',source:pipeline('p.15; side-outlet p.36')},
      {key:'plant-jbf',title:'Plant Series JBF',text:'The setting diagram names the jack-bolt centerline and the valve flange face as the JBF reference points.',source:plant('p.18')},
      {key:'pipeline-jbf',title:'Segmented Pipeline: valve to segment',text:'The pre-hot-tap illustration measures from the top of an extended retention segment to the service-valve top gasket face, not a Plant jack-bolt centerline. The IP914XL close-sure example separately uses valve top to segment top as C+D; its B dimension includes the adapter gasket offset. Pipeline training p.22 instead repeats jack-bolt wording and remains inconsistent; no formal erratum is recorded here. This comparison does not select a governing procedure or switch calculations.',source:pipeline('pp.19,22,24-26')+' TEAM IP914XL Operating Instructions, Revision A, 15MAY18, Figure 22 (printed p.27; PDF p.28).'},
      {key:'plug-ld',title:'Plug LD depends on the task',text:'Setting diagrams refer to the plug bottom and adapter flange. Retrieval pages use the retracted plug-holder bottom; the side-outlet method uses a rod mark and gearcase reference. They are not one interchangeable datum.',source:plant('pp.18,23')+' '+pipeline('pp.29,36-37')}
    ],notes:['Identify the actual plug family, task and approved procedure before applying a reference method. Segment indexing and the later plug-thickness advance are separate in the illustrated Pipeline method. Pipeline, side-outlet and retrieval methods are not implemented as distinct calculation modes here.']
  };
  return null;
}

export function measurementHelpMarkup(operation,stage){
  const guide=measurementHelpFor(operation,stage);
  if(!guide)return '';
  return '<details class="measurement-guidance" data-measurement-guidance="'+stage+'" data-no-terms="true"><summary>'+escape(guide.title)+'</summary><p class="result-hint">'+escape(guide.scope)+'</p>'+
    '<p class="result-hint">Figures load when this guide is opened. Open the figures you need while online before relying on them offline. Enlarge an original to read all arrows and captions.</p>'+
    guide.cards.map(card=>'<section class="datum-card" data-datum="'+card.key+'"><h3>'+escape(card.title)+'</h3>'+(card.figure?measurementFigureMarkup(card):'<p>'+escape(card.text)+'</p>')+'<small class="datum-source">'+escape(card.source)+'</small></section>').join('')+
    guide.notes.map(note=>'<p class="result-hint">'+escape(note)+'</p>').join('')+'<p class="datum-source">Not to scale. Endpoint guidance is not field verification or a substitute for the approved procedure.</p></details>';
}
