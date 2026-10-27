// Synthetic serial transaction authority, separate from per-tab storage views.
export function memoryDatabase({beforeWrite=()=>{}}={}){
  let raw=null,tail=Promise.resolve(),hook=beforeWrite;
  const writes=[];
  const serial=callback=>{const pending=tail.then(callback);tail=pending.catch(()=>{});return pending;};
  return {
    writes,peek:()=>raw,seed:value=>{raw=value;},setBeforeWrite:value=>{hook=value;},
    read:()=>serial(()=>raw),
    update:change=>serial(()=>{
      const result=change(raw);hook(result.raw);
      if(result.raw!==raw){raw=result.raw;writes.push(raw);}
      return result;
    })
  };
}
