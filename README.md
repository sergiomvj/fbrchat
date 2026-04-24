# FBR CHAT

Workspace principal do projeto FBR CHAT.

## Estrutura

- `frontend/` interface React + Vite
- `backend/` API HTTP e camada de mensageria
- `orchestrator/` workers de memória e contexto
- `nginx/` proxy reverso local e produção
- `prd/` especificação funcional e plano de execução
- `stitch_fbr/` exports visuais, design tokens e guia de implementação

## Ordem sugerida para desenvolvimento local

1. Instalar dependências do frontend
2. Validar bootstrap do frontend
3. Evoluir backend e orchestrator
4. Conectar frontend aos contratos reais

## Documentos principais

- `prd/FBR_CHAT_PRD.md`
- `prd/FBR_CHAT_TASKLIST.md`
- `prd/FBR_CHAT_EXECUTION_SPRINTS.md`
- `stitch_fbr/IMPLEMENTATION_GUIDE.md`
