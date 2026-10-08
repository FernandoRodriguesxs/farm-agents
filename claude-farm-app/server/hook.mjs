// Reads Claude Code hook payload from stdin. Never forwards prompts, tool inputs, outputs or secrets.
let raw='';for await(const part of process.stdin){raw+=part;if(raw.length>1_000_000)process.exit(0)}
try{
 const p=JSON.parse(raw);const type=process.env.CLAUDE_FARM_EVENT||p.hook_event_name;
 const e={type,sessionId:p.session_id||'unknown',agentId:p.agent_id||(type?.startsWith('Subagent')?p.agent_id:'main'),agentType:p.agent_type,toolName:p.tool_name,project:p.cwd?.split(/[\\/]/).filter(Boolean).pop()};
 await fetch('http://127.0.0.1:'+(process.env.CLAUDE_FARM_PORT||3000)+'/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(e),signal:AbortSignal.timeout(1200)});
}catch{} // Hook failure must never block Claude Code.
