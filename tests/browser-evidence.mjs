// Test-only bounded lifecycle evidence. Never reads page content or device diagnostics.
const observers=new WeakMap();
const safeUrl=page=>{try{const url=new URL(page.url());return ['127.0.0.1','localhost'].includes(url.hostname)?url.pathname+url.hash:'<non-fixture URL>';}catch{return '<no URL>';}};
const errorInfo=error=>({name:error?.name,message:String(error?.message??error).slice(0,1200),code:error?.code});
export function installBrowserEvidence(browser,metadata={},logger=console){
  const recent=[];let expectedClose=false,pages=0;
  const add=event=>{const item={time:new Date().toISOString(),...metadata,...event};recent.push(item);if(recent.length>60)recent.shift();return item;};
  const mark=(label,extra={})=>logger.log('BROWSER_CHECKPOINT',JSON.stringify(add({event:'checkpoint',label,...extra})));
  const watch=page=>{
    if(observers.has(page))return;
    const id=++pages;
    const record=event=>add({page:id,url:safeUrl(page),...event});
    observers.set(page,(label)=>logger.log('BROWSER_CHECKPOINT',JSON.stringify(record({event:'checkpoint',label}))));
    record({event:'page-created'});
    page.on('crash',()=>{record({event:'page-crash'});logger.error('BROWSER_PAGE_CRASH',JSON.stringify({metadata,page:id,recent:[...recent]}));});
    page.on('pageerror',error=>record({event:'pageerror',error:errorInfo(error)}));
    page.on('close',()=>record({event:'page-close',expectedBrowserClose:expectedClose}));
    page.on('framenavigated',frame=>{if(frame===page.mainFrame())record({event:'navigation'});});
  };
  const createContext=browser.newContext.bind(browser);
  browser.newContext=async options=>{const context=await createContext(options);context.on('page',watch);for(const page of context.pages())watch(page);return context;};
  browser.on('disconnected',()=>{add({event:'browser-disconnected',expected:expectedClose});if(!expectedClose)logger.error('BROWSER_UNEXPECTED_DISCONNECT',JSON.stringify({metadata,recent:[...recent]}));});
  return {mark,failure(error){logger.error('BROWSER_ORIGINAL_FAILURE',JSON.stringify({metadata,error:errorInfo(error),recent:[...recent]}));},closing(){expectedClose=true;},recent:()=>structuredClone(recent)};
}
export function browserCheckpoint(page,label){observers.get(page)?.(label);}
