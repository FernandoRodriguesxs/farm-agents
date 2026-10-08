import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
const port=39000+Math.floor(Math.random()*1000);const base='http://127.0.0.1:'+port;
test('serves map, accepts valid events and rejects invalid events',async()=>{
 const server=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,PORT:String(port)},stdio:'ignore'});
 try{
  for(let i=0;i<60;i++){try{if((await fetch(base+'/health')).ok)break}catch{}await new Promise(r=>setTimeout(r,50))}
  assert.equal((await fetch(base+'/')).status,200);
  assert.equal((await fetch(base+'/farm-engine.js')).status,200);
  const valid=await fetch(base+'/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'SubagentStart',sessionId:'abc',agentId:'one',project:'test'})});assert.equal(valid.status,202);
  const invalid=await fetch(base+'/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'madeup',sessionId:'abc'})});assert.equal(invalid.status,422);
  const health=await (await fetch(base+'/health')).json();assert.equal(health.events,1);
 }finally{server.kill()}
});
