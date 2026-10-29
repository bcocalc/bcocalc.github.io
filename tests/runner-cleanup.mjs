// Owned runner cleanup only. This does not assert descendant-process termination.
export const CLEANUP_TIMEOUT_MS=5000;
export function boundedCleanup(owner,action,{report,setTimer=setTimeout,clearTimer=clearTimeout,timeoutMs=CLEANUP_TIMEOUT_MS}){
 return new Promise(resolve=>{
  let finished=false,timer;
  const finish=(error,phase)=>{if(finished){if(error)report({owner,phase:'late-rejection',error});return;}finished=true;clearTimer(timer);if(error)report({owner,phase,error});resolve();};
  timer=setTimer(()=>finish(Error(owner+' cleanup exceeded '+timeoutMs+'ms'),'timeout'),timeoutMs);
  try{Promise.resolve(action()).then(()=>finish(),error=>finish(error,'rejection'));}catch(error){finish(error,'rejection');}
 });
}
export async function cleanupLaunch(context,server,{checkLateErrors,...options}){
 try{
  await boundedCleanup('browser-context',()=>context?.close(),options);
  // Subscribe/initiate close before closing active connections. Observe rejection immediately.
  const closing=boundedCleanup('http-server',()=>new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve())),options);
  await boundedCleanup('http-connections',()=>server.closeAllConnections(),options);
  await closing;
 }finally{checkLateErrors();}
}
export function observeChildClose(child){
 let closed=false,result,error;
 const onError=value=>{error??=value;};
 const completion=new Promise(resolve=>{
  child.on('error',onError);
  child.once('close',(code,signal)=>{closed=true;result={code,signal};child.removeListener('error',onError);resolve(result);});
 });
 return {async terminate(){
  if(!closed&&child.exitCode===null&&child.signalCode===null&&!child.killed){
   const accepted=child.kill('SIGTERM');
   if(!accepted&&!closed&&child.exitCode===null&&child.signalCode===null)throw error||Error('Preview termination signal was not accepted');
  }
  const outcome=closed?result:await completion;
  if(error)throw error;
  if(!(outcome.code===0&&!outcome.signal||outcome.code===null&&outcome.signal==='SIGTERM'))throw Error('Preview exited unexpectedly: code='+outcome.code+', signal='+outcome.signal);
 }};
}
export async function cleanupExports(context,preview,options){
 await boundedCleanup('browser-context',()=>context?.close(),options);
 await boundedCleanup('preview-child',()=>preview.terminate(),options);
}
