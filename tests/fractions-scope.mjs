// Reversible display-only addition, preserving all previous frozen-source checks.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url),plan=JSON.parse(readFileSync(new URL('./fractions-scope.json',import.meta.url),'utf8'));
const hash=s=>createHash('sha256').update(s).digest('hex');
export const fractionPaths=Object.keys(plan.files);
export function restoreFractions(path,source) {
  const p=plan.files[path];if(!p||p.added)return source;
  assert.equal(hash(source),p.afterSha256,'Exact fractional display candidate: '+path);
  let before=source;
  for(const h of [...p.hunks].reverse()) {
    assert.equal(before.slice(h.offset,h.offset+h.after.length),h.after,'Exact fraction display span: '+path);
    before=before.slice(0,h.offset)+h.before+before.slice(h.offset+h.after.length);
  }
  assert.equal(hash(before),p.beforeSha256,'Fraction inverse retains current live source: '+path);
  return before;
}
for(const [path,p] of Object.entries(plan.files)) {
  const current=readFileSync(new URL(path,root),'utf8').replaceAll('\r\n','\n');
  assert.equal(hash(current),p.afterSha256,'Pinned fractional display scope: '+path);
  if(!p.added) {
    const original=execFileSync('git',['show',plan.base+':'+path],{cwd:root,encoding:'utf8',maxBuffer:30e6}).replaceAll('\r\n','\n');
    assert.equal(restoreFractions(path,current),original,'Fraction patch restores exact current live baseline: '+path);
  }
}
console.log('PASS exact reversible fraction display scope; original math, storage and frozen-source checks remain active');
