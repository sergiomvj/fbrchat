# FBR CHAT Frontend

Frontend em React + Vite alinhado ao PRD e aos exports do Stitch.

## Rotas

- `/chat`
- `/admin`

## Estado Atual

- Chat conectado ao backend local com bootstrap, historico, envio otimista e updates realtime
- Admin conectado ao backend local para users, agents, groups, logs e settings
- `socket.io-client` configurado para o fluxo realtime

## Comandos

- `npm install`
- `npm run dev`
- `npm run build`

## Variaveis Relevantes

- `VITE_API_BASE_URL`

## Estrutura

- `src/lib/` cliente HTTP base
- `src/features/chat/` runtime e UI do chat
- `src/features/admin/` runtime e UI do admin
- `src/components/shell/` shell compartilhado
- `src/styles/` tokens e estilos globais
