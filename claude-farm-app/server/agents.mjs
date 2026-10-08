import {spawn} from 'node:child_process';
import {existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync, renameSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createInterface} from 'node:readline';

export const roster = ['Juniper','Bramble','Wren','Clover','Pip','Moss'].map(name=>({id:name.toLowerCase(),name}));
export function findCodex(){
  if(process.env.CODEX_BIN)return process.env.CODEX_BIN;
  const dir=path.join(os.homedir(),'.vscode/extensions');
  if(existsSync(dir))for(const name of readdirSync(dir).filter(n=>n.startsWith('openai.chatgpt-')).sort().reverse()){
    const exe=path.join(dir,name,'bin/windows-x86_64/codex.exe');if(existsSync(exe))return exe;
  }
  return 'codex';
}
export function createAgents({cwd,stateFile,onChange=()=>{},launch=spawn,executable=findCodex()}){
  let saved=[];
  if(existsSync(stateFile))saved=JSON.parse(readFileSync(stateFile,'utf8'));
  const agents=roster.map(a=>({...a,threadId:null,prompt:'',output:'',status:'idle',error:'',...saved.find(s=>s.id===a.id)}));
  for(const a of agents)if(['working','queued'].includes(a.status)){a.status='error';a.error='Execução interrompida pelo reinício do servidor. Envie a tarefa novamente.';}
  const queue=[];let running=null;
  const list=()=>agents.map(a=>({...a}));
  function publish(){mkdirSync(path.dirname(stateFile),{recursive:true});writeFileSync(stateFile+'.tmp',JSON.stringify(agents,null,2));renameSync(stateFile+'.tmp',stateFile);onChange(list());}
  function next(){
    if(running||!queue.length)return;
    const a=queue.shift();a.status='working';a.error='';a.output='';
    const args=['exec','-c','sandbox_mode="workspace-write"','-c','approval_policy="never"','--disable','hooks'];
    if(a.threadId)args.push('resume',a.threadId);
    args.push('--skip-git-repo-check','--json','-');
    let child;
    try{child=launch(executable,args,{cwd,windowsHide:true,stdio:['pipe','pipe','pipe']});}
    catch(e){a.status='error';a.error=e.message;publish();next();return;}
    running=child;publish();let stderr='',failed=false,completed=false,closed=false;
    const lines=createInterface({input:child.stdout});
    lines.on('line',line=>{
      let e;try{e=JSON.parse(line)}catch{return;}
      if(e.type==='thread.started'&&e.thread_id)a.threadId=e.thread_id;
      if(e.type==='item.completed'&&e.item?.type==='agent_message')a.output=(a.output+'\n'+e.item.text).trim().slice(-40000);
      if(e.type==='turn.completed')completed=true;
      if(e.type==='turn.failed'){failed=true;a.error=e.error?.message||'A tarefa falhou.';}
      publish();
    });
    child.stderr.on('data',data=>{stderr=(stderr+data).slice(-6000)});
    const finish=(code,error)=>{
      if(closed)return;closed=true;lines.close();running=null;
      a.status=!error&&code===0&&!failed&&completed?'idle':'error';
      if(a.status==='error')a.error=error?.message||a.error||stderr||'Codex encerrou sem concluir a tarefa.';
      publish();next();
    };
    child.once('error',error=>finish(null,error));child.once('close',code=>finish(code));
    child.stdin.on('error',()=>{});
    child.stdin.end(`Você é ${a.name}, um agente de código deste projeto. Execute a tarefa abaixo e relate as mudanças e verificações reais.\n\n${a.prompt}`);
  }
  return {list,submit(id,prompt){
    const a=agents.find(a=>a.id===id);if(!a)throw Object.assign(Error('Agente não encontrado.'),{status:404});
    if(typeof prompt!=='string'||!prompt.trim()||prompt.length>16000)throw Object.assign(Error('Digite uma tarefa de até 16000 caracteres.'),{status:400});
    if(['working','queued'].includes(a.status))throw Object.assign(Error('Este agente já tem uma tarefa em andamento.'),{status:409});
    a.prompt=prompt.trim();a.status='queued';a.error='';queue.push(a);publish();next();return list();
  }};
}
