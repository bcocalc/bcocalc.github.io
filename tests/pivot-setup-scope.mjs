// Reverse only the exact scoped Pivot candidate before running the
// existing fraction/POP/frozen-source guards. Never relax their assertions.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),plan=JSON.parse(readFileSync(new URL('./pivot-setup-scope.json',import.meta.url),'utf8'));
const hash=value=>createHash('sha256').update(value).digest('hex');
export const pivotSetupPaths=Object.keys(plan.files);
export function restorePivotSetup(path,source) {
  const item=plan.files[path];if(!item||item.added)return source;
  assert.equal(hash(source),item.afterSha256,'Pinned Pivot5014 candidate: '+path);
  let before=source;
  for(const h of [...item.hunks].reverse()) {
    assert.equal(before.slice(h.offset,h.offset+h.after.length),h.after,'Exact Pivot5014 span: '+path);
    before=before.slice(0,h.offset)+h.before+before.slice(h.offset+h.after.length);
  }
  assert.equal(hash(before),item.beforeSha256,'Pivot inverse preserves prior live source: '+path);
  return before;
}
for(const [path,item] of Object.entries(plan.files)) {
  const current=readFileSync(new URL(path,root),'utf8').replaceAll('\r\n','\n');
  assert.equal(hash(current),item.afterSha256,'Exact Pivot file scope: '+path);
  if(!item.added)restorePivotSetup(path,current);
}
console.log('PASS exact reversible Pivot5014 scope; legacy formulas, storage and frozen-source guards retained');
