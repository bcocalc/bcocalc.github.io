// Local synthetic REST/rules fixture. Not Firebase Emulator certification/deployment.
import {createServer} from 'node:http';
import {documentEnvelope} from '../pre-alpha/modern-transport.mjs';
import {verifyEnvelope} from '../pre-alpha/modern-envelope.mjs';
import {MODERN_DESTINATION} from '../pre-alpha/modern-sharing-config.mjs';
export async function modernRelayFixture(){
  const docs=new Map(),requests=[],posts=[];let mode='success',onPost=null,redirectTo=null;
  const name=`projects/${MODERN_DESTINATION.projectId}/databases/${MODERN_DESTINATION.database}/documents`;
  const server=createServer(async(request,response)=>{
    const reply=(status,payload)=>{if(!response.destroyed){response.writeHead(status,{'Content-Type':'application/json'});response.end(JSON.stringify(payload));}};
    const url=new URL(request.url,'http://127.0.0.1');
    requests.push({method:request.method,path:url.pathname,authorization:request.headers.authorization??null});
    if(mode==='redirect'&&redirectTo){response.writeHead(302,{Location:redirectTo});response.end();return;}
    const base='/__modern/v1/'+name,collection=base+'/'+MODERN_DESTINATION.collection;
    if(!url.pathname.startsWith(base))return reply(404,{error:{status:'NOT_FOUND'}});
    if(request.method==='GET'){
      if(mode==='denied')return reply(403,{error:{status:'PERMISSION_DENIED'}});
      if(url.pathname===collection){
        const all=[...docs.values()];if(mode==='pagination-loop')return reply(200,{documents:all,nextPageToken:'same'});if(mode==='pagination'&&!url.searchParams.has('pageToken'))return reply(200,{documents:all.slice(0,1),nextPageToken:'second'});
        return reply(200,{documents:mode==='pagination'?all.slice(1):all});
      }
      const document=docs.get(url.pathname.slice('/__modern/v1/'.length));
      if(!document)return reply(404,{error:{status:'NOT_FOUND'}});
      if(mode==='collision'){const corrupt=structuredClone(document);corrupt.fields.payloadJson.stringValue+=' ';return reply(200,corrupt);}
      return reply(200,document);
    }
    if(request.method!=='POST'||url.pathname!==base+':commit')return reply(403,{error:{status:'PERMISSION_DENIED'}});
    let body;try{let raw='';for await(const chunk of request)raw+=chunk;body=JSON.parse(raw);}catch{return reply(400,{error:{status:'INVALID_ARGUMENT'}});}
    const write=body.writes?.[0];posts.push(structuredClone(write));
    if(mode==='post-denied')return reply(403,{error:{status:'PERMISSION_DENIED'}});
    if(body.writes.length!==1||write?.currentDocument?.exists!==false||write.updateMask||write.delete||JSON.stringify(write.updateTransforms)!==JSON.stringify([{fieldPath:'syncedAt',setToServerValue:'REQUEST_TIME'}])||write.update?.name?.split('/').slice(0,-1).join('/')!==name+'/'+MODERN_DESTINATION.collection)return reply(403,{error:{status:'PERMISSION_DENIED'}});
    let envelope;try{envelope=documentEnvelope(write.update);await verifyEnvelope(envelope,{destination:MODERN_DESTINATION,cloudId:write.update.name.split('/').at(-1)});}catch{return reply(400,{error:{status:'INVALID_ARGUMENT'}});}
    if(mode==='timeout')return;
    if(onPost)await onPost(write);
    if(docs.has(write.update.name))return reply(409,{error:{status:'ALREADY_EXISTS'}});
    const document=structuredClone(write.update);document.fields.syncedAt={timestampValue:'2026-10-28T00:00:00.000Z'};
    docs.set(write.update.name,document);
    if(mode==='late-commit')return;
    return reply(200,{writeResults:[{updateTime:'synthetic-confirmed'}]});
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return {docs,requests,posts,name,endpoint:'http://127.0.0.1:'+server.address().port+'/__modern',setMode:value=>{mode=value;},setRedirect:value=>{redirectTo=value;mode='redirect';},setOnPost:value=>{onPost=value;},close:async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}};
}
