import {normalizeJob} from '../pre-alpha/model.mjs';
const clone=value=>structuredClone(value);
const state={bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'6.0',preAlphaPipeOD:'6 5/8',bcoPipeID:'6',bcoCutterOD:'4',md:'10',ld:'-1/2',ldSign:'-',ptc:'1 1/4',start:'2',mt:'52',future:{arrays:[['1/4',null],['invalid',{keep:true}]]}};
export function modernJobFixture(){return normalizeJob({id:'synthetic-modern',record:{job:{client:'Synthetic only',pressure:'250 psi',temperature:'80 F',product:'Water',notes:'Complete notes α'},future:{preserve:[['unknown']]},jobBundle:{selectedOperationId:'hi',sharedState:{jobDescription:'Synthetic modern complete job'},futureBundle:{keep:true},operations:[
 {id:'tap',operationType:'Hot Tap',state:clone(state),measurements:{hotTap:{mco:'99'}}},
 {id:'htp',operationType:'HTP',state:{...clone(state),htpPipeSize:'6',htpMd:'12',htpLd:'-2',htpPtc:'1',htpMachine:'360'},measurements:{htp:{tco:'777'}}},
 {id:'hi',operationType:'Hi-Stop',state:{...clone(state),hsMd:'10',hsLd:'2',hsRl:'8',hsCl:'3',hsPtc:'1',hsRcd:'8',hsPb:'7',hsPtp:'1/4',hsPod:'99'},measurements:{hiStop:{plugSet:'888'}}},
 {id:'unknown',operationType:'ReStop',state:{future:{keep:true}},measurements:{future:{reading:'444'}}}
]}}});}
