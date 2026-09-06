// Isolated visual preview: SDK imports are served locally and CSP blocks all external traffic.
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { extname, join, resolve, sep } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
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
  const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  response.setHeader('Content-Security-Policy', "default-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; worker-src 'none'; object-src 'none'");
  response.setHeader('Cache-Control', 'no-store');
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
      if (path.endsWith('/firebase-config.js')) content = content.replace(/window.TAPCALC_FIREBASE_CONFIG = \{[\s\S]*?\};/, 'window.TAPCALC_FIREBASE_CONFIG={apiKey:"fixture",projectId:"demo-tapcalc-test",appId:"fixture"};');
      if (path.endsWith('/measurement-card.html')) content = content.replace('<body class="measurement-page">', `<body class="measurement-page"><script>
        if(!localStorage.getItem('measurementCardHistoryV1'))localStorage.setItem('measurementCardHistoryV1',JSON.stringify(['A','B'].map(id=>({id,cloudId:null,state:{jobDescription:'Preview '+id},record:{meta:{title:'Preview '+id},state:{jobDescription:'Preview '+id}},summary:{title:'Preview '+id},savedAt:'2026-09-05'}))));
        </script>`);
    }
    response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' }); response.end(content);
  } catch { response.writeHead(404); response.end(); }
});
server.listen(0, '127.0.0.1', () => console.log('Isolated preview: http://127.0.0.1:' + server.address().port + '/measurement-card.html'));
