// Isolated visual preview: SDK imports are served locally and CSP blocks all external traffic.
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { extname, join, resolve, sep } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const documents = new Map();
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const modules = {
  'firebase-app.js': 'export const getApps=()=>[]; export const initializeApp=()=>({});',
  'firebase-auth.js': `const auth={currentUser:null,authStateReady:async()=>{}};
    export const getAuth=()=>auth;
    export async function signInAnonymously(){
      if(new URL(location.href).searchParams.get('fixture')!=='success') return new Promise(()=>{});
      auth.currentUser={getIdToken:async()=>"fixture"}; return {user:auth.currentUser};
    }`,
  'firebase-firestore.js': `export const getFirestore=()=>({}); export const collection=()=>({});
    export const serverTimestamp=()=>"fixture-timestamp";
    export const getDocs=async()=>({docs:[]}); export const getDocsFromServer=getDocs;
    export const addDoc=async(c,p)=>({id:"fixture-cloud-"+p.localId});`
};
const server = createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost');
  const path = decodeURIComponent(url.pathname);
  response.setHeader('Content-Security-Policy', "default-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; worker-src 'none'; object-src 'none'");
  response.setHeader('Cache-Control', 'no-store');
  if (path.startsWith('/v1/')) {
    response.setHeader('Content-Type', 'application/json');
    if (!path.startsWith('/v1/projects/demo-tapcalc-test/databases/(default)/documents')) {
      response.writeHead(403); response.end('{}'); return;
    }
    if (request.method === 'POST' && path.endsWith('/documents:commit')) {
      let body = '';
      request.on('data', (chunk) => { body += chunk; });
      request.on('end', () => {
        if (url.searchParams.get('fixture') !== 'success') {
          response.writeHead(403);
          response.end(JSON.stringify({ error: { status: 'PERMISSION_DENIED', message: 'Preview upload denied' } }));
          return;
        }
        const write = JSON.parse(body).writes[0];
        if (write.currentDocument?.exists !== false || !write.update.name.startsWith('projects/demo-tapcalc-test/')) {
          response.writeHead(400); response.end('{}'); return;
        }
        if (documents.has(write.update.name)) {
          response.writeHead(409); response.end(JSON.stringify({ error: { status: 'ALREADY_EXISTS' } })); return;
        }
        documents.set(write.update.name, write.update);
        response.end(JSON.stringify({ writeResults: [{ updateTime: new Date().toISOString() }] }));
      });
      return;
    }
    if (request.method !== 'GET') { response.writeHead(405); response.end('{}'); return; }
    if (path.endsWith('/tapcalcJobs')) {
      response.end(JSON.stringify({ documents: [...documents.values()] })); return;
    }
    const doc = documents.get(path.slice('/v1/'.length));
    response.writeHead(doc ? 200 : 404);
    response.end(JSON.stringify(doc || { error: { status: 'NOT_FOUND' } })); return;
  }
  if (path.startsWith('/__firebase/')) {
    const source = modules[path.split('/').at(-1)];
    response.writeHead(source ? 200 : 404, { 'Content-Type': 'text/javascript' });
    response.end(source || ''); return;
  }
  try {
    let file = resolve(root, '.' + path);
    if (!file.startsWith(resolve(root) + sep)) throw new Error('Invalid path');
    if (statSync(file).isDirectory()) file = join(file, 'index.html');
    let content = readFileSync(file);
    if (['.js', '.html', '.css', '.json'].includes(extname(file))) {
      content = content.toString('utf8').replaceAll('https://www.gstatic.com/firebasejs/10.12.5/', '/__firebase/');
      // Both the allowlist and request base point only at this local fake server.
      content = content.replaceAll('https://firestore.googleapis.com', 'http://127.0.0.1:' + server.address().port);
      if (path.endsWith('/cloud-sync.js')) content = content.replace("target.searchParams.set('key', key);", "target.searchParams.set('key', key); target.searchParams.set('fixture', new URL(location.href).searchParams.get('fixture') || 'denied');");
      if (path.endsWith('/firebase-config.js')) content = content.replace(/window.TAPCALC_FIREBASE_CONFIG = \{[\s\S]*?\};/, 'window.TAPCALC_FIREBASE_CONFIG={apiKey:"fixture",projectId:"demo-tapcalc-test",appId:"fixture"};');
      if (path.endsWith('/measurement-card.html')) content = content.replace('<body class="measurement-page">', `<body class="measurement-page"><script>
        if(!localStorage.getItem('measurementCardHistoryV1'))localStorage.setItem('measurementCardHistoryV1',JSON.stringify(['A','B','C','D'].map(id=>{
          const state={jobDescription:'Preview '+id,jobClient:'Fixture Customer',operationType:'Hot Tap',activeMode:'hotTap',bcoPipeMaterial:'CarbonSteel',bcoPipeOD:'4.0',bcoPipeID:'4.026',bcoCutterOD:'3.875',bcoSchedule:'STD',md:id==='A'?'12':'24',ptc:'2.5',mt:'52'};
          return {id,cloudId:['C','D'].includes(id)?'already-synced-'+id:null,state,record:{meta:{title:'Preview '+id},state},summary:{title:'Preview '+id},savedAt:'2026-09-05'};
        })));
        </script>`);
    }
    response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' }); response.end(content);
  } catch { response.writeHead(404); response.end(); }
});
server.listen(0, '127.0.0.1', () => console.log('Isolated preview: http://127.0.0.1:' + server.address().port + '/measurement-card.html'));
