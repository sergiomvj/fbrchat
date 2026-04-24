# FBR CHAT

Workspace principal do projeto FBR CHAT.

## Estrutura

- `frontend/` interface React + Vite
- `backend/` API HTTP, Socket.IO, contratos e testes
- `orchestrator/` worker de memoria e contexto
- `nginx/` proxy reverso local e base de deploy
- `docs/` OpenAPI inicial e notas operacionais
- `prd/` especificacao funcional, tasklist, plano e progresso
- `stitch_fbr/` exports visuais e guia de implementacao

## Estado Atual

- Chat e admin funcionando localmente com backend real mockado
- WebSocket e fallback HTTP alinhados
- Settings, logs, uploads, STT/TTS mockados e memoria contextual ativos
- Sprints autonomas 1 a 10 concluidas

## Como Rodar Localmente

1. `cd backend && npm install && npm run dev`
2. Em outro terminal: `cd frontend && npm install && npm run dev`
3. Opcional: `cd orchestrator && npm run dev`

## Validacao Rapida

- Backend: `cd backend && npm test`
- Frontend: `cd frontend && npm run build`

## Credenciais Locais

- Admin: `admin@fbr.local` / `admin123`
- User: `joao@fbr.local` / `user123`

## Documentos Principais

- `prd/FBR_CHAT_PRD.md`
- `prd/FBR_CHAT_TASKLIST.md`
- `prd/FBR_CHAT_EXECUTION_SPRINTS.md`
- `prd/FBR_CHAT_PROGRESS.md`
- `docs/OPERATIONS.md`
- `docs/openapi.yaml`
