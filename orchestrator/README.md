# Orchestrator

Worker local responsavel por refrescar artefatos de memoria e contexto.

## Escopo Atual

- materializacao de `MEMORY.md`
- materializacao de `HISTORY.md`
- refresh periodico para usuarios ativos

## Comandos

- `npm install`
- `npm run dev`

## Observacao

O worker ainda usa a store local do backend. A troca para filas e persistencia real depende do ambiente definitivo.
