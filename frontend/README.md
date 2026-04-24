# FBR CHAT Frontend

Base inicial do frontend em React + Vite, criada a partir de:

- PRD aprovado em `prd/`
- exports do Stitch em `stitch_fbr/`
- blueprint de implementação em `stitch_fbr/IMPLEMENTATION_GUIDE.md`

## Rotas iniciais

- `/chat`
- `/admin`

## Estrutura

- `src/components/shell/` componentes compartilhados
- `src/features/chat/` tela principal do chat
- `src/features/admin/` tela inicial do painel admin
- `src/styles/` tokens e estilos globais

## Próximos passos

1. Instalar dependências com `npm install`
2. Subir o ambiente com `npm run dev`
3. Substituir dados mockados por contratos reais do backend
4. Conectar estados de:
   - autenticação
   - WebSocket
   - envio otimista
   - `message_updated`
   - logs e settings do admin
