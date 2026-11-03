// Exact reversible addition to the existing frozen-source guard.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url),plan=JSON.parse(readFileSync(new URL('./actual-pop-scope.json',import.meta.url),'utf8'));
const hash=s=>createHash('sha256').update(s).digest('hex');
const read=p=>readFileSync(new URL(p,root),'utf8').replaceAll('\r\n','\n');
export const actualPopPaths=Object.keys(plan.files);
export function restoreActualPop(path,source){
 const p=plan.files[path];if(!p||p.added)return source;
 assert.equal(hash(source),p.afterSha256,'Exact actual POP candidate: '+path);
 let before=source;
 for(const h of [...p.hunks].reverse()){assert.equal(before.slice(h.offset,h.offset+h.after.length),h.after,'Exact POP change span: '+path);before=before.slice(0,h.offset)+h.before+before.slice(h.offset+h.after.length);}
 assert.equal(hash(before),p.beforeSha256,'POP inverse retains frozen source: '+path);return before;
}
for(const [path,p]of Object.entries(plan.files)){
 const current=read(path);assert.equal(hash(current),p.afterSha256,'Pinned POP scope: '+path);
 if(!p.added){const original=execFileSync('git',['show',plan.base+':'+path],{encoding:'utf8',maxBuffer:30e6}).replaceAll('\r\n','\n');assert.equal(restoreActualPop(path,current),original,'POP patch restores exact public baseline: '+path);}
}
console.log('PASS exact reversible actual POP scope; frozen-source checks remain active');
