import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createAgents} from '../server/agents.mjs';

test('fixed identities, queue, resume, failures and restart recovery',()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'farm-agents-'));const calls=[];
 const launch=(exe,args,options)=>{const c=new EventEmitter();Object.assign(c,{stdin:new PassThrough(),stdout:new PassThrough(),stderr:new PassThrough()});calls.push({c,args,options});return c;};
 const config={cwd:dir,stateFile:path.join(dir,'agents.json'),launch,executable:'codex'};
 try{
  const manager=createAgents(config);
  manager.submit('juniper','Read README');manager.submit('moss','Write docs');
  assert.equal(calls.length,1);assert.equal(manager.list()[5].status,'queued');
  assert.throws(()=>manager.submit('juniper','again'),/andamento/);
  calls[0].c.stdout.write('{"type":"thread.started","thread_id":"thread-one"}\n{"type":"turn.completed"}\n');
  calls[0].c.emit('close',0);assert.equal(calls.length,2);assert.equal(manager.list()[0].status,'idle');
  calls[1].c.stderr.write('Login required');calls[1].c.emit('close',1);
  assert.equal(manager.list()[5].status,'error');assert.match(manager.list()[5].error,/Login/);
  manager.submit('juniper','Follow up');assert.ok(calls[2].args.includes('thread-one'));assert.ok(calls[2].args.includes('resume'));
  const restored=createAgents(config);assert.equal(restored.list()[0].status,'error');assert.equal(restored.list()[0].threadId,'thread-one');
  calls[2].c.emit('close',1);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
