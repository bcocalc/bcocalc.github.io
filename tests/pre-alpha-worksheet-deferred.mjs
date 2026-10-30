// Worksheet is intentionally outside this launch scope; archived implementation remains intact.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8').replace(/\r\n/g,'\n'),hash=s=>createHash('sha256').update(s).digest('hex');
const archived={
  "pre-alpha/worksheet-draft.mjs": "bd04ed1661b0d1f2daaa748f216ef7f50d36d6acbf4ea5190f508c5f2b5ba982",
  "pre-alpha/worksheet-draft.html": "2177cf8d2b3fffc67878137244d84e529f20c4678f2ea26090862d694a1ecdd6",
  "pre-alpha/worksheet-draft.css": "9eb896be0b20e2c8d1fb7f7621606f7c89c346002b8147e0c5d99a6a70f6dd07",
  "pre-alpha/worksheet-print.css": "04de166fd4e01709797e08fb0ba2a1b0ecd1afbd33a7c8c2a3abcb5af080763c",
  "tests/pre-alpha-worksheet.mjs": "11bd35a79abe20dd53b735d1d438c5c77da2589c60f37d11847e04cce4b63be6",
  "tests/pre-alpha-worksheet-ui.mjs": "3303c501a9df1945fa905e85327df6ab2da9684361ef3bca39f9abbb92e352a4"
};
for(const [p,h]of Object.entries(archived))assert.equal(hash(read(p)),h,'Retained worksheet source/test: '+p);
const guard="// User deferred this feature until after launch. Fixed source gate; no runtime opt-in.\nconst WORKSHEET_LAUNCH_ENABLED=false;\nif(!WORKSHEET_LAUNCH_ENABLED){\n document.title='Worksheet deferred';\n document.body.innerHTML='<main><h1 id=\"worksheet-deferred\">Worksheet deferred until after launch</h1><p>This draft feature is on hold. Generic Print / Save PDF and Download PNG remain available from the job.</p><a href=\"./#home\">Return to calculator</a></main>';\n}else{\n",ui=read('pre-alpha/worksheet-draft-ui.mjs');assert.ok(ui.endsWith('}\n'));assert.equal(hash(ui.slice(0,-2).replace(guard,'')),"14514557958aa1c764d3a6e48c4749d5858f144694569b5ec21f4b4befd2843c",'Original UI body retained exactly behind fixed guard');
const document={title:'',body:{innerHTML:''},getElementById(){throw Error('Deferred picker must never initialize');}},window={WORKSHEET_LAUNCH_ENABLED:true};
vm.runInNewContext(ui.slice(ui.indexOf('\n')+1).replaceAll('import.meta.url',JSON.stringify('https://fixture.invalid/pre-alpha/worksheet-draft-ui.mjs')),{document,window},{timeout:1000});assert.equal(document.title,'Worksheet deferred');assert.match(document.body.innerHTML,/worksheet-deferred/);assert.doesNotMatch(document.body.innerHTML,/<input|type=.file|<canvas/);
assert.doesNotMatch(read('pre-alpha/index.html'),/data-job-export="worksheet"/);assert.match(read('pre-alpha/index.html'),/data-job-export="pdf"/);assert.match(read('pre-alpha/index.html'),/data-job-export="png"/);
assert.equal(hash(read('pre-alpha/exports.mjs')),"746b0e28292dd874a714899b0971eb0638ad7e503efff9ce6dd833ff535c54a0",'Generic exports unchanged after removing worksheet dispatch only');
const assets="'./worksheet-draft.mjs?v='+BUILD,'./worksheet-draft-ui.mjs?v='+BUILD,'./worksheet-draft.html?v='+BUILD,'./worksheet-draft.css?v='+BUILD,'./worksheet-print.css?v='+BUILD,",worker=read('pre-alpha/service-worker.js');assert.equal(worker.includes('./worksheet-'),false);assert.equal(hash(worker.replace("'./exports.mjs?v='+BUILD,","'./exports.mjs?v='+BUILD,"+assets)),"0de5991ac41f201ba7b53c338c3e0b17470ae810943f7347f1712e374d6d33af",'Only worksheet precache entries removed; scope, cache and lifecycle unchanged');
console.log('PASS worksheet deferred: hidden entry, inert direct route before picker/listener setup, no runtime opt-in, archived source/tests intact, generic exports and worker lifecycle preserved.');
