// Maintained rollback publication slice. Pure transformation: no storage, network or publication.
import assert from 'node:assert/strict';
export const ROOT_VERSION='launch-pre-alpha26-2',ROLLBACK_VERSION='rollback-'+ROOT_VERSION;
export const ROLLBACK_FILES=['index.html','launch.js','manifest.json','measurement-card.html','service-worker.js'];
export function controlledRollback(read){
 const result=new Map();
 for(const path of ROLLBACK_FILES){let text=read(path);assert.equal(typeof text,'string');
  if(path==='launch.js'){assert.equal(text.split("VERSION='launch-'+APP+'-2',DESTINATION='modern'").length,2);text=text.replace("VERSION='launch-'+APP+'-2',DESTINATION='modern'","VERSION='rollback-launch-'+APP+'-2',DESTINATION='legacy'");}
  else if(path==='manifest.json'){const manifest=JSON.parse(text);assert.equal(manifest.start_url,'./?v='+ROOT_VERSION);text=text.replace('"./?v='+ROOT_VERSION+'"','"./?v='+ROLLBACK_VERSION+'"');}
  else{assert.ok(text.includes(ROOT_VERSION),path+' has the maintained release version');text=text.replaceAll(ROOT_VERSION,ROLLBACK_VERSION);}
  result.set(path,text);
 }
 return result;
}
