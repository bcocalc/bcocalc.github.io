import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

// Git's source blob uses LF; Windows checkouts may convert those newlines.
const source=readFileSync(new URL('../pre-alpha/vendor/pdf.worker.mjs',import.meta.url),'utf8').replace(/\r\n/g,'\n');
const provenance=JSON.parse(readFileSync(new URL('../pre-alpha/vendor/pdf-worker-provenance.json',import.meta.url),'utf8'));
const guarded='function onFailure(ex) {\n        if (terminated) {\n          return;\n        }';
const legacy='function onFailure(ex) {\n        ensureNotTerminated();';
assert.equal(source.split(guarded).length,2,'Exactly one upstream cancellation guard');
const original=source.replace(guarded,legacy),bytes=Buffer.from(original);
const originalSha=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
assert.equal(originalSha,provenance.source_git_blob_sha,'Apart from the guard, preserve every original public worker byte');
assert.equal(originalSha,'92eba689bfddc9b642260a0fd2763e4f85f3ab3c');
assert.ok(source.includes('4.10.38')&&source.includes('Apache License, Version 2.0'));
const owner=readFileSync(new URL('../pre-alpha/references.mjs',import.meta.url),'utf8');
assert.match(owner,/new URL\('\.\/vendor\/pdf\.worker\.mjs\?v=pre-alpha26',import\.meta\.url\)/);
assert.match(owner,/await import\('\.\.\/pdf\.mjs'\)/,'Keep the compatible shared API unchanged');

function failureHandler(text,terminated){
  const start=text.indexOf('function onFailure(ex) {'),end=text.indexOf('\n      function pdfManagerReady()',start);
  assert.ok(start>0&&end>start);
  const events=[];class PasswordException extends Error{}
  const context={terminated,PasswordException,WorkerTask:class{constructor(name){this.name=name;}},
    ensureNotTerminated(){if(terminated)throw Error('Worker was terminated');},
    startWorkerTask(task){events.push(['start',task.name]);},finishWorkerTask(task){events.push(['finish',task.name]);},
    handler:{send(...args){events.push(args);},sendWithPromise(...args){events.push(args);return Promise.resolve({password:'fixture-only'});}},
    wrapReason(error){return error;},pdfManager:{updatePassword(password){events.push(['password',password]);}},pdfManagerReady(){events.push(['ready']);}};
  return {run:vm.runInNewContext('('+text.slice(start,end)+')',context),events,PasswordException};
}
const old=failureHandler(original,true);
assert.throws(()=>old.run(new Error('fixture load cancelled')),/Worker was terminated/,'Reproduce the original secondary throw');
const cancelled=failureHandler(source,true);
assert.doesNotThrow(()=>cancelled.run(new Error('fixture load cancelled')));
assert.deepEqual(cancelled.events,[],'Cancelled loading is inert, not a document error or password request');
const failed=failureHandler(source,false),failure=new Error('fixture invalid PDF');failed.run(failure);
assert.deepEqual(failed.events,[['DocException',failure]],'Genuine noncancelled errors still reach the normal handler');
const password=failureHandler(source,false),challenge=new password.PasswordException('fixture password');challenge.code=1;
password.run(challenge);await Promise.resolve();await Promise.resolve();
assert.ok(password.events.some(event=>event[0]==='PasswordRequest'));
assert.ok(password.events.some(event=>event[0]==='ready'),'Uncancelled password handling stays intact');
console.log('PASS pre-alpha PDF cancellation: exact isolated upstream backport, terminated load, genuine error and password paths');
