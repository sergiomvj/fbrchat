# Backend

Backend local do FBR CHAT com Express e Socket.IO.

## Escopo Atual

- Auth: login, refresh, logout, me
- Admin: companies, users, agents, settings, logs
- Conversas: groups, PVTs, historico e envio de mensagens
- Uploads: descriptor local validado
- Agentes: runtime mockado com `callOpenClaw()` e `resolveSecret()`
- Memoria: ContextRouter, MEMORY.md e HISTORY.md

## Comandos

- `npm install`
- `npm run dev`
- `npm test`

## Estrutura

- `src/routes/` superficie HTTP
- `src/socket/` gateway realtime
- `src/services/` integracoes, memoria e midia
- `src/middleware/` auth, logging e seguranca
- `tests/` cobertura dos fluxos criticos
