import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {controlledRollback,ROOT_VERSION,ROLLBACK_VERSION,ROLLBACK_FILES} from './controlled-rollback.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8'),artifact=controlledRollback(read);
assert.deepEqual([...artifact.keys()],ROLLBACK_FILES);
for(const [path,source]of artifact){let restored=source;
 if(path==='launch.js')restored=source.replace("VERSION='rollback-launch-'+APP+'-2',DESTINATION='legacy'","VERSION='launch-'+APP+'-2',DESTINATION='modern'");
 else restored=source.replaceAll(ROLLBACK_VERSION,ROOT_VERSION);
 assert.equal(restored,read(path),'Exact reverse reconstruction: '+path);
}
const manifest=JSON.parse(artifact.get('manifest.json')),current=JSON.parse(read('manifest.json'));
assert.equal(manifest.start_url,'./?v='+ROLLBACK_VERSION);assert.equal(current.start_url,'./?v='+ROOT_VERSION);
for(const key of ['id','scope','icons','name','short_name'])assert.deepEqual(manifest[key],current[key]);
assert.match(artifact.get('launch.js'),/DESTINATION='legacy'/);assert.match(artifact.get('measurement-card.html'),/launch\.js\?v=rollback-launch-pre-alpha26-2/);
assert.match(artifact.get('index.html'),/launch-stay/);assert.match(artifact.get('index.html'),/legacy=1/);assert.doesNotMatch(artifact.get('index.html'),/http-equiv="refresh"/);
let version;vm.runInNewContext(artifact.get('service-worker.js'),{URL,Request,self:{addEventListener:(type,fn)=>{if(type==='message')fn({data:{type:'tapcalc-launch-version'},ports:[{postMessage:p=>version=p.version}]});}}});assert.equal(version,ROLLBACK_VERSION);
assert.throws(()=>controlledRollback(path=>read(path).replaceAll(ROOT_VERSION,'invalid-version')));
console.log('PASS maintained rollback: five exact reversible root files, legacy destination, synchronized landing/worker/bridge/start; unchanged installed id/icons/scope and no data edits.');
