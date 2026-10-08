import http from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createAgents} from './agents.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public');
const port=Number(process.env.PORT||3000);
const clients=new Set();
const events=[];
const agents=createAgents({cwd:path.resolve(root,'../..'),stateFile:path.resolve(root,'../.farm/agents.json'),onChange:state=>{for(const c of clients)c.write('event: agents\ndata: '+JSON.stringify(state)+'\n\n')}});
const types=new Set(['SessionStart','SessionEnd','SubagentStart','SubagentStop','PreToolUse','PostToolUse','PostToolUseFailure','Stop','UserPromptSubmit','Notification']);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg'};
const server=http.createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(!['localhost:'+port,'127.0.0.1:'+port].includes(req.headers.host)){res.writeHead(403);return res.end('Invalid host');}
  if(pathname==='/api/agents'&&req.method==='GET'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify(agents.list()));}
  if(pathname.startsWith('/api/agents/')&&req.method==='POST'){
    const json=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
    if(req.headers.origin!==`http://${req.headers.host}`||!req.headers['content-type']?.startsWith('application/json'))return json(403,{error:'Envie tarefas pela página da fazenda.'});
    let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>70000)return json(413,{error:'Tarefa muito grande.'});}
    try{return json(202,agents.submit(pathname.slice('/api/agents/'.length),JSON.parse(raw).prompt));}catch(e){return json(e.status||400,{error:e.message});}
  }
  if(pathname==='/health'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify({ok:true,clients:clients.size,events:events.length}));}
  if(pathname==='/events'&&req.method==='GET'){
    res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','Access-Control-Allow-Origin':'http://localhost:'+port});res.write(': connected\n\n');clients.add(res);
    res.write('event: agents\ndata: '+JSON.stringify(agents.list())+'\n\n');
    for(const e of events.slice(-30))res.write('event: farm\ndata: '+JSON.stringify(e)+'\n\n');
    req.on('close',()=>clients.delete(res));return;
  }
  if(pathname==='/api/events'&&req.method==='POST'){
    let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>65536){res.writeHead(413);return res.end('Too large');}}
    let input;try{input=JSON.parse(raw)}catch{res.writeHead(400);return res.end('Invalid JSON')}
    if(!input||!types.has(input.type)||typeof input.sessionId!=='string'||!input.sessionId){res.writeHead(422);return res.end('Invalid event')}
    const safe=v=>typeof v==='string'?v.slice(0,160):undefined;
    const e={type:input.type,sessionId:safe(input.sessionId),agentId:safe(input.agentId),agentName:safe(input.agentName),agentType:safe(input.agentType),toolName:safe(input.toolName),project:safe(input.project),timestamp:new Date().toISOString()};
    events.push(e);if(events.length>100)events.shift();for(const c of clients)c.write('event: farm\ndata: '+JSON.stringify(e)+'\n\n');res.writeHead(202,{'Content-Type':'application/json'});return res.end(JSON.stringify({accepted:true}));
  }
  if(req.method!=='GET'){res.writeHead(405);return res.end()}
  const page=pathname==='/'?'/index.html':pathname==='/login'||pathname==='/login/'?'/login.html':pathname;
  const filename=path.resolve(root,'.'+page);if(!filename.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
  try{const st=await stat(filename);if(!st.isFile())throw Error();const data=await readFile(filename);res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream'});res.end(data)}catch{res.writeHead(404);res.end('Not found')}
});
server.listen(port,'127.0.0.1',()=>console.log('Claude Farm: http://localhost:'+port));
