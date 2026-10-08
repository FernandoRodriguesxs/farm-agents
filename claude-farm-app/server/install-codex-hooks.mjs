import {readFile, writeFile, mkdir, copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const home = process.env.CODEX_HOME || path.join(process.env.USERPROFILE || process.env.HOME, '.codex');
const target = path.join(home, 'hooks.json');
const hook = fileURLToPath(new URL('./hook.mjs', import.meta.url)).replaceAll('\\', '/');
const executable = process.execPath.replaceAll('\\', '/');
const command = `${/\s/.test(executable) ? `& "${executable}"` : executable} "${hook}"`;
const oldCommand = `"${executable}" "${hook}"`;
let config = {};
let exists = false;
try { config = JSON.parse(await readFile(target, 'utf8')); exists = true; }
catch (error) { if (error.code !== 'ENOENT') throw error; }
config.hooks ??= {};
for (const event of ['SessionStart', 'SessionEnd', 'SubagentStart', 'SubagentStop', 'PreToolUse', 'PostToolUse', 'Stop']) {
  config.hooks[event] ??= [];
  for (const group of config.hooks[event]) {
    for (const handler of group.hooks || []) {
      if (handler.command === oldCommand) handler.command = command;
    }
  }
  if (!config.hooks[event].some(group => group.hooks?.some(handler => handler.command === command))) {
    config.hooks[event].push({hooks: [{type: 'command', command, timeout: 3}]});
  }
}
await mkdir(home, {recursive: true});
if (exists) await copyFile(target, `${target}.${Date.now()}.bak`);
await writeFile(target, JSON.stringify(config, null, 2) + '\n');
console.log(`Codex hooks installed: ${target}`);
