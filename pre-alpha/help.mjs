import {DATA} from './reference-data.mjs?v=pre-alpha06';

export const TERMS=Object.fromEntries(DATA.glossary.filter(([key])=>/^[A-Z]{2,5}$/.test(key)).map(([key,full])=>[key,{full,meaning:full+'. Term from the existing TapCalc glossary.'}]));
Object.assign(TERMS,{
  MD:{full:'Measured distance',meaning:'Measured distance for this operation and stage. Hot Tap MD can feed Line Stop MD until you edit Line Stop MD.'},
  LD:{full:'Lost distance',meaning:'The signed lost-distance measurement for this stage only. It does not carry from Hot Tap to Line Stop.'},
  LI:{full:'Lower in',meaning:'The calculated lowering distance for the selected stage, or its explicitly selected manual override.'},
  PTC:{full:'Pilot to cutter',meaning:'Hot Tap pilot-to-cutter distance. It is added after pilot on pipe to calculate cutter on pipe.'},
  BCO:{full:'Book cut out',meaning:'Book Cut Out in the supplied glossary. This app calculates the cutter-shell distance using pipe dimensions and cutter outside diameter; pilot projection is separate.'},
  CCO:{full:'Coupon cut out',meaning:'Historical glossary term. The Coupon free result in this workspace uses cutter inside diameter; do not substitute it for BCO.'},
  POP:{full:'Pilot on pipe',meaning:'Hot Tap rod-scale position: Rod start plus Hot Tap lower in.'},
  COP:{full:'Cutter on pipe',meaning:'Calculated Hot Tap rod position: Pilot on pipe plus pilot-to-cutter distance. This is not a field-verified reading.'},
  TTD:{full:'Total travel distance',meaning:'Hot Tap lowering distance plus pilot-to-cutter distance and book cut out. Not the same as cutting-only ETA distance.'},
  OD:{full:'Outside diameter',meaning:'Outside diameter of the item named in this label. For pipe, use the actual dimension, not nominal size; Pipe & cutter is the single job source.'},
  ID:{full:'Inside diameter',meaning:'Inside diameter of the pipe or cutter named in this label. Pipe inside diameter must be smaller than pipe outside diameter.'},
  POD:{full:'Pipe outside diameter',meaning:'Actual pipe outside diameter from Pipe & cutter. Retired Line Stop overrides do not control calculations.'},
  WT:{full:'Wall thickness',meaning:'Pipe wall thickness: one half of actual pipe outside diameter minus inside diameter.'},
  JBF:{full:'Jack bolt to flange',meaning:'Completion Plug jack-bolt-to-flange measurement from the supplied glossary. Added to Start, Lost distance, and Plug thickness.'},
  PT:{full:'Plug thickness',meaning:'Completion Plug thickness for this operation; not a pressure or temperature value.'},
  MT:{full:'Machine travel',meaning:'Available machine travel for the selected stage. Blank means the travel limit has not been checked.'},
  RPM:{full:'Revolutions per minute',meaning:'Rotational speed. The existing estimator uses 0.004 inch per revolution; confirm equipment and actual cutting conditions.'},
  ETA:{full:'Estimated cutting time',meaning:'In this app, estimated cutting time to book cut out, not an arrival time or complete job duration. Setup, approach travel, and stopping/plug work are excluded.'},
  // RF / RTJ: Emerson Fisher 249 bulletin D200039X012, January 2023, page 1.
  RF:{full:'Raised face',meaning:'Flange facing identified as raised face in bolting references. Verify the applicable flange and stud chart.',source:'https://www.emerson.com/is/content/emerson/en/final-control/flow-controls/documents/d200039x012.pdf'},
  RTJ:{full:'Ring-type joint',meaning:'Flange facing identified as ring-type joint. It is not interchangeable with raised-face stud lengths.'},
  PSI:{full:'Pounds per square inch',meaning:'Pressure unit. A table entry alone does not establish an approved equipment or job rating.'},
  'FT-LB':{full:'Foot-pound',meaning:'Torque unit used in the named source table. Do not confuse with inch-pounds.'},
  'IN-LB':{full:'Inch-pound',meaning:'Torque unit used in the named source table. Blank source cells remain unlisted.'},
  FHLS:{full:'Folding Head Line Stop',meaning:'Folding-head equipment-specific reference. Do not substitute standard Line Stop setup assumptions.'},
  RL:{full:'Reamer length',meaning:'Reamer length in the Hi-Stop reference; not a Hot Tap rod-start measurement.'},
  CL:{full:'Cutter length',meaning:'Cutter length in the Hi-Stop reference; not cutter diameter.'},
  PB:{full:'Plug bottom',meaning:'Plug-bottom input in the Hi-Stop reference; not the standard Completion Plug Start value.'},
  PDF:{full:'Portable Document Format',meaning:'Document file format. References here are inline tables, not pop-out PDF pages.'},
  HTM:{full:'Hot Tap Machine',meaning:'Equipment identifier used in the supplied stack-up reference. Do not infer dimensions or an RPM profile from an unlisted model.'},
  LSM:{full:'Line Stop Machine',meaning:'Equipment identifier used in the supplied stack-up reference; not a Hot Tap RPM selection.'},
  IN:{full:'Inch',meaning:'Length unit used by this workspace.'},MIN:{full:'Minute',meaning:'Time unit in the cutting-only estimate.'},SEC:{full:'Second',meaning:'Time unit in the cutting-only estimate.'},HR:{full:'Hour',meaning:'Time unit in the cutting-only estimate.'},F:{full:'Degrees Fahrenheit',meaning:'Temperature unit in the source table.'},C:{full:'Degrees Celsius',meaning:'Temperature unit in the source table.'},
  'N/A':{full:'Not applicable',meaning:'Not applicable in the supplied reference context. It is not a zero measurement.'}
});
Object.assign(TERMS,{'VALVE T':{full:'Valve turns',meaning:'Valve turns in the supplied glossary; not an inch measurement.'},'SEG T':{full:'Segment turns',meaning:'Segment turns in the supplied glossary; not a rod-scale reading.'},'IP MANUAL':{full:'IP manual (source designation)',meaning:'Uploaded tapping-machine manual reference. The IP equipment-code expansion is not verified in this source.'},LB:{full:'Pound (source unit)',meaning:'Use the quantity identified by the source column; a weight value is not a torque value.'},REV:{full:'Revolution',meaning:'One full rotation, as used by the feed-per-revolution assumption.'},DEG:{full:'Degree',meaning:'Use the temperature scale or angle named by the source.'}});
for(const key of ['HTP','RCD','PSD','P&ID','ISO','PCCP','HTS','ASME','ANSI','IP','MA140']) {
  TERMS[key]??={full:key+' (source identifier)',meaning:'The full expansion is not verified in the supplied glossary for this context. Keep the source designation and check the original equipment document; do not infer a different meaning.'};
}
export const FIELD_HELP={
  operationType:'Choose the sequence for this operation. Line Stop includes Hot Tap and Completion Plug. Tap & Complete includes Hot Tap and Completion Plug without Line Stop.',
  machineType:'The saved job machine. ETA uses a separately identified supported RPM profile; an unknown machine is not silently treated as a 360.',
  bcoPipeMaterial:'Choose the material for the existing dimension tables. Unlisted dimensions require actual measurements.',
  bcoPipeOD:'Nominal pipe size selects a dimension-table row; it is not always the actual outside diameter.',
  bcoSchedule:'Choose a listed schedule or measured dimensions. Blank table dimensions are not fabricated.',
  preAlphaPipeOD:TERMS.OD.meaning,bcoPipeID:'Actual pipe inside diameter. Pipe wall is calculated from actual outside and inside diameters.',
  bcoCutterOD:'Cutter outside diameter, used for book cut out.',bcoCutterID:'Cutter inside diameter, used for Coupon free. It must be smaller than cutter outside diameter.',
  md:'Hot Tap measured distance. Only this measurement may feed Line Stop MD, until Line Stop MD is edited.',
  lsMd:'Line Stop measured distance. Follows Hot Tap MD until you edit it; other Line Stop measurements stay independent.',
  ld:'Hot Tap lost distance, independent of Line Stop and Completion Plug.',lsLd:'Line Stop lost distance, independent of Hot Tap lost distance.',
  ldSign:'Choose whether Hot Tap lost distance is added or subtracted.',lsLdSign:'Choose whether Line Stop lost distance is added or subtracted.',
  ptc:TERMS.PTC.meaning,start:'Hot Tap starting rod-scale reading. It shifts the rod positions, not cutter geometry.',mt:TERMS.MT.meaning,
  lsTravel:'Optional measured Line Stop travel check. Leaving it blank does not block browsing.',lsMachineTravel:'Available Line Stop machine travel, independent of Hot Tap machine travel.',
  lsLiManualToggle:'Calculated uses the Line Stop setup and Pipe & cutter dimensions. Manual uses only the entered lower-in override for that output.',
  lsLiManual:'Explicit Line Stop lower-in override. Original setup inputs stay preserved.',
  cpStart:'Completion Plug starting measurement. It is independent of Hot Tap rod start.',cpJbf:TERMS.JBF.meaning,
  cpLd:'Completion Plug lost distance, independent of Hot Tap and Line Stop lost distance.',cpPt:TERMS.PT.meaning,
  cpLiManualToggle:'Calculated adds Start, Jack bolt to flange, Lost distance, and Plug thickness. Manual uses the entered lower-in override.',
  cpLiManual:'Explicit Completion Plug lower-in override. Inactive saved overrides are retained but not used.',
  etaMachine:'Supported RPM chart profile for this estimate only. Changing it does not rename the job machine.',
  etaCutterSize:'Blank follows current Cutter O.D. A saved or entered size changes the RPM lookup only. Between chart sizes, RPM is interpolated; outside the chart, the nearest entry is clearly labeled.',
  etaRpmOverride:'Optional verified manual rotational speed. Invalid or zero input does not fall back silently to chart speed.'
};
export function termHelp(key,context='') {
  const raw=key.replace(/[.]/g,'').toUpperCase(),normalized=/^FT[-/]LBS?$/.test(raw)?'FT-LB':/^IN[-/]LBS?$/.test(raw)?'IN-LB':raw==='LBS'?'LB':raw,term=TERMS[normalized];
  if(context==='htp'&&normalized==='BCO')return {full:'BCO (HTP source-chart label)',meaning:'The exact expansion and measurement basis are not verified by this table. Do not substitute this equipment-specific source value for standard Hot Tap book cut out.'};
  if(!term)return {full:key,meaning:'No verified expansion is available for this source term.'};
  const stage=context==='tap'?'Hot Tap':context==='stop'?'Line Stop':context==='plug'?'Completion Plug':'';
  return {...term,meaning:stage&&['MD','LD','MT','LI'].includes(normalized)?stage+': '+term.meaning:term.meaning};
}
export function installHelp(root=document.body) {
  const tooltip=document.createElement('div');tooltip.id='term-tooltip';tooltip.role='tooltip';tooltip.className='term-tooltip';tooltip.hidden=true;tooltip.dataset.noTerms='true';document.body.append(tooltip);
  let current=null,pinned=false,timer;
  const target=event=>event.target.closest?.('[data-help-term],[data-help-field],[data-term-tip]');
  function hide(){tooltip.hidden=true;current?.removeAttribute('aria-describedby');current=null;pinned=false;}
  function position(){
    if(!current?.isConnected){hide();return;}
    const r=current.getBoundingClientRect(),width=Math.min(330,innerWidth-24);
    tooltip.style.width=width+'px';tooltip.style.left=Math.max(12,Math.min(r.left,innerWidth-width-12))+'px';
    const height=tooltip.getBoundingClientRect().height;
    tooltip.style.top=Math.max(8,r.bottom+8+height<innerHeight?r.bottom+8:r.top-height-8)+'px';
  }
  function show(element){
    clearTimeout(timer);if(current!==element){current?.removeAttribute('aria-describedby');pinned=false;}current=element;
    const context=element.closest('[data-help-context]')?.dataset.helpContext||'';
    const info=element.dataset.helpField?{full:element.getAttribute('aria-label')||'Measurement help',meaning:FIELD_HELP[element.dataset.helpField]||'Review the selected stage and equipment reference.'}:termHelp(element.dataset.helpTerm||element.dataset.termTip,context);
    tooltip.textContent=info.full+'. '+info.meaning;
    (element.closest('dialog')||document.body).append(tooltip);tooltip.hidden=false;element.setAttribute('aria-describedby',tooltip.id);position();
  }
  const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const keys=[...Object.keys(TERMS),'Valve T','Seg T','IP Manual','O.D.','I.D.','ft-lb','ft-lbs','ft/lb','ft/lbs','in-lb','in-lbs','in/lbs','psi','min','sec','hr','lb','lbs','rev','deg'].sort((a,b)=>b.length-a.length);
  const pattern=new RegExp('(?<![A-Za-z0-9])('+keys.map(escape).join('|')+')(?![A-Za-z0-9])|(?<=\\d\\s)in\\b|(?<=\\()in(?=\\))','g');
  function decorate(){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),texts=[];
    while(walker.nextNode()){
      const node=walker.currentNode,p=node.parentElement;
      if(!p||p.closest('script,style,select,textarea,input,abbr,[data-no-terms],.eyebrow,.edition,#job-title,#job-meta,#operations,.job-card,.masthead,.main-nav'))continue;
      pattern.lastIndex=0;if(node.data.trim()==='in'||pattern.test(node.data))texts.push(node);
    }
    for(const node of texts){
      const activePattern=node.data.trim()==='in'?/in/g:pattern;
      activePattern.lastIndex=0;const button=node.parentElement.closest('button');
      if(button){button.dataset.termTip=node.data.match(activePattern)[0];continue;}
      const fragment=document.createDocumentFragment();let last=0;
      activePattern.lastIndex=0;for(const match of node.data.matchAll(activePattern)){
        const grouped=node.data[match.index-1]==='('&&node.data[match.index+match[0].length]===')';
        fragment.append(node.data.slice(last,grouped?match.index-1:match.index));const abbr=document.createElement('abbr');
        abbr.textContent=match[0];abbr.dataset.helpTerm=match[0];abbr.tabIndex=0;abbr.role='button';
        const info=termHelp(match[0]);abbr.title=info.full;abbr.setAttribute('aria-label',match[0]+': '+info.full);
        if(grouped){const group=document.createElement('span');group.className='term-group';group.append('(',abbr,')');fragment.append(group);}else fragment.append(abbr);
        last=match.index+match[0].length+(grouped?1:0);
      }
      fragment.append(node.data.slice(last));node.replaceWith(fragment);
    }
    if(current&&!current.isConnected)hide();
  }
  let queued=false;const observer=new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(()=>{queued=false;decorate();});}});
  observer.observe(root,{childList:true,subtree:true});decorate();
  document.addEventListener('pointerover',event=>{const el=target(event);if(el)show(el);});
  document.addEventListener('pointerout',event=>{if(target(event)&&!pinned)timer=setTimeout(()=>{if(!current?.matches(':focus')&&!tooltip.matches(':hover'))hide();},180);});
  tooltip.addEventListener('pointerover',()=>clearTimeout(timer));tooltip.addEventListener('pointerout',()=>{if(!pinned&&!current?.matches(':focus'))hide();});
  document.addEventListener('focusin',event=>{const el=target(event);if(el)show(el);});
  document.addEventListener('focusout',()=>{if(!pinned)timer=setTimeout(hide,120);});
  document.addEventListener('click',event=>{
    const el=target(event);
    if(el?.matches('[data-help-term],[data-help-field]')){event.preventDefault();if(current===el&&pinned)hide();else{show(el);pinned=true;}}
    else if(!event.target.closest('.term-tooltip'))hide();
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!tooltip.hidden){event.preventDefault();event.stopImmediatePropagation();hide();}else if(['Enter',' '].includes(event.key)&&event.target.matches('abbr[data-help-term]')){event.preventDefault();event.target.click();}},true);
  window.addEventListener('resize',()=>{if(current)position();});window.addEventListener('scroll',()=>{if(current)position();},true);
  document.addEventListener('close',hide,true);
  return {hide,decorate};
}
