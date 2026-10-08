# Claude Farm — live prototype

Preserves the original Claude Design Canvas pixel-art world and adds six persistent Codex agents controlled from the farm. **Not yet Next.js or Phaser.** This is an incremental prototype, not the completed PRD.

## Run

A tela de login está em http://localhost:3000/login. Ela acompanha o visual da fazenda, tem validação nativa de e-mail e senha obrigatórios e permite mostrar/ocultar a senha. É uma demonstração de interface: use dados fictícios; nenhum dado do formulário é enviado ou salvo, nenhuma sessão é criada e a fazenda continua acessível em `/`.

Requires Node.js 20+.

```bash
npm run dev
```

Open http://localhost:3000. Select a character, enter a task, and click **Executar tarefa** to run your local Codex.

## Connect Claude Code (VS Code CLI)

Find the absolute path to `server/hook.mjs` and replace `/ABSOLUTE/PATH/claude-farm-app` below. Add these hooks to your Claude Code user settings (`~/.claude/settings.json` on macOS/Linux, `%USERPROFILE%\\.claude\\settings.json` on Windows), **merging** with existing settings and preserving other hooks:

```json
{
  "hooks": {
    "SessionStart": [{"hooks":[{"type":"command","command":"node /ABSOLUTE/PATH/claude-farm-app/server/hook.mjs"}]}],
    "SessionEnd": [{"hooks":[{"type":"command","command":"node /ABSOLUTE/PATH/claude-farm-app/server/hook.mjs"}]}],
    "SubagentStart": [{"hooks":[{"type":"command","command":"node /ABSOLUTE/PATH/claude-farm-app/server/hook.mjs"}]}],
    "SubagentStop": [{"hooks":[{"type":"command","command":"node /ABSOLUTE/PATH/claude-farm-app/server/hook.mjs"}]}],
    "PreToolUse": [{"hooks":[{"type":"command","command":"node /ABSOLUTE/PATH/claude-farm-app/server/hook.mjs"}]}],
    "PostToolUse": [{"hooks":[{"type":"command","command":"node /ABSOLUTE/PATH/claude-farm-app/server/hook.mjs"}]}],
    "PostToolUseFailure": [{"hooks":[{"type":"command","command":"node /ABSOLUTE/PATH/claude-farm-app/server/hook.mjs"}]}],
    "Stop": [{"hooks":[{"type":"command","command":"node /ABSOLUTE/PATH/claude-farm-app/server/hook.mjs"}]}]
  }
}
```

For Windows paths, use forward slashes inside JSON and quote paths containing spaces: `node "C:/Users/.../server/hook.mjs"`.

Hooks send only event type, session/agent identifiers, tool name, and project folder name to localhost. Tool inputs, outputs, prompts, and credentials are **not** sent. No automatic permissions are granted. No Jev integration yet.

## Limitations

- The six characters have fixed identities and separate Codex conversations. Tasks run sequentially in the shared project.
- Characters stay seated until their task runs. The animation reflects the Codex process lifecycle.
- Legacy hook events stay in memory (last 100). Agent session IDs and latest results persist in `.farm/agents.json`; full conversations are managed by Codex.
- Event source is local and unauthenticated, so bind to localhost only.
- Live characters change state but do not yet pathfind between buildings based on tools.
- Desktop Claude integration depends on which hook events that version exposes; validate separately.
- This is a stepping stone toward the planned Next.js/Phaser architecture.

## Agentes reais na fazenda

Selecione um dos seis personagens (ou seu nome no painel), escreva uma tarefa e clique em **Executar tarefa**. O servidor inicia o Codex local no diretório deste projeto, com permissão de escrita limitada ao workspace. O personagem trabalha enquanto o processo executa e fica sentado ao encerrar. Falhas aparecem no painel.

Cada personagem mantém uma conversa Codex própria, retomada nas próximas tarefas. Identidades, última tarefa e resposta ficam em `.farm/agents.json`. Tarefas são executadas uma por vez para evitar edições simultâneas; personagens na fila ficam parados. Após um reinício, tarefas interrompidas precisam ser reenviadas.

É necessário estar autenticado no Codex local. O executável da extensão VS Code é detectado automaticamente no Windows; `CODEX_BIN` permite informar outro caminho. O painel usa os eventos JSON do processo e não depende dos hooks. Eventos externos dos hooks não controlam esses seis personagens.

No PowerShell, inicie com `npm.cmd run dev`. Recarregue a página após atualizar o frontend; alterações no servidor exigem reinício. Operações que exigem aprovação adicional falham no modo não interativo e aparecem na resposta do agente.
