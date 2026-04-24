# TaskList — FBR CHAT · Plataforma de Mensageria com Agentes Virtuais
> Gerada por Chain-of-Thought em Abril 2026  
> Sprints: 3 fases · 24 semanas totais  
> Total de tarefas: 27

---

## Contexto do Projeto

O FBR CHAT é uma plataforma proprietária de mensageria que permite integrar agentes virtuais de forma irrestrita, superando as limitações de plataformas como WhatsApp Business e Telegram. Cada agente tem seu modelo LLM configurado individualmente via OpenClaw. A plataforma mantém memória contextual persistente por usuário (MEMORY.md para grupos, HISTORY.md para PVTs), suporta grupos temáticos e conversas privadas, e opera integralmente em um servidor KVM de 8GB RAM já existente. O custo operacional incremental é de ~R$200/mês (STT + TTS via APIs externas). O sistema não processa LLMs localmente — o backend é um roteador inteligente de mensagens.

---

## SPRINT 1 — Fundação & Infraestrutura

### Raciocínio
> O sistema inteiro depende de uma base sólida de banco de dados, autenticação e infraestrutura Docker antes de qualquer feature de produto poder existir. Este sprint não entrega valor visível ao usuário final, mas é pré-requisito bloqueante para todos os demais. As tarefas são sequenciais: banco → autenticação → infraestrutura → validação.

---

#### TASK-01 · david · 🔴 Alta
**Ação:** Criar o schema completo do banco de dados PostgreSQL com todas as tabelas do FBR CHAT (users, companies, agents, groups, group_members, messages, pvt_conversations, refresh_tokens, system_settings, openclaw_call_logs) conforme especificação do PRD, incluindo índices de performance e constraints de integridade.

**Contexto:** O banco de dados é o alicerce de todo o sistema. Sem o schema correto e performático desde o início, migrações futuras serão custosas. O FBR CHAT precisa de tabelas para usuários, empresas, agentes virtuais, grupos, membros de grupos, mensagens (suportando texto e mídia), PVTs, sessões JWT, configurações globais e logs operacionais do OpenClaw. O schema de usuários precisa suportar `role` e soft delete; o schema de PVT precisa ser canônico para garantir idempotência simétrica em conversas `user-user` e `user-agent`; e agentes precisam pertencer a empresas para permitir filtro operacional no admin.

**Input esperado:** PRD do FBR CHAT com seção 2.3 (Modelo de dados principal) contendo todos os DDLs. PostgreSQL 15+ disponível no KVM.

**Output esperado:** Arquivo `backend/migrations/001_initial_schema.sql` com todo o DDL executável. Arquivo `backend/migrations/002_indexes.sql` com índices de performance (messages.conversation_id, messages.created_at, messages.sender_id, pvt_conversations UNIQUE canônico). Script `backend/scripts/seed_admin.sql` criando 1 usuário admin inicial com `role='admin'`. Campos obrigatórios em `users`: `role`, `is_active`, `deactivated_at`. Tabela `pvt_conversations` modelada com `participant_a_*` e `participant_b_*` em ordem canônica.

**Critério de conclusão:** Executar os scripts em banco limpo sem erros. Inserir e consultar 1 usuário admin, 1 agente, 1 grupo, 1 PVT `user-user`, 5 mensagens sem erros. Validar que A→B e B→A retornam o mesmo PVT lógico. Todas as foreign keys e constraints validadas.

---

#### TASK-02 · david · 🔴 Alta
**Ação:** Configurar o ambiente Docker completo do FBR CHAT com docker-compose.yml orquestrando todos os serviços (PostgreSQL, Redis, MinIO, Nginx, Backend API, Orquestrador), com variáveis de ambiente separadas por arquivo .env e healthchecks em cada serviço.

**Contexto:** O FBR CHAT roda integralmente em um servidor KVM de 8GB RAM. Docker Compose garante isolamento, reprodutibilidade e facilidade de manutenção. Cada serviço precisa de healthcheck para que o Compose suba na ordem correta (banco antes da API, Redis antes do backend, etc.).

**Input esperado:** Stack definida no PRD seção 2.1: PostgreSQL 15, Redis 7, MinIO, Node.js 20, Nginx 1.25. Estrutura de diretórios da seção 2.2.

**Output esperado:** Arquivo `docker-compose.yml` com todos os serviços. Arquivo `.env.example` com todas as variáveis necessárias documentadas. Arquivo `nginx/fbr-chat.conf` com proxy reverso configurado (porta 80 → backend:3000, /socket.io → backend WebSocket). README com instruções `docker compose up -d`.

**Critério de conclusão:** `docker compose up -d` sobe todos os serviços sem erro. `docker compose ps` mostra todos como "healthy". MinIO acessível em localhost:9001. PostgreSQL acessível via psql.

---

#### TASK-03 · david · 🔴 Alta
**Ação:** Implementar o sistema completo de autenticação JWT do FBR CHAT com os endpoints POST /api/auth/login, POST /api/auth/refresh, POST /api/auth/logout e GET /api/auth/me, incluindo middleware de autenticação reutilizável, bcrypt para senhas (salt rounds 12), rate limiting no login (5 tentativas/minuto/IP) e rotação de refresh tokens.

**Contexto:** Todos os endpoints do FBR CHAT exceto /auth/login são protegidos por JWT. O access token expira em 24h e o refresh token em 30 dias. A rotação de refresh tokens invalida o token anterior a cada uso, prevenindo reutilização por tokens roubados. Rate limiting no login previne ataques de força bruta.

**Input esperado:** Schema do banco (TASK-01 concluída). PRD seção 3 Módulo 1.1 com especificação completa dos endpoints, regras de expiração e critérios de aceite.

**Output esperado:** Arquivos `backend/src/routes/auth.js` (ou `.py`) com os 4 endpoints implementados. Arquivo `backend/src/middleware/authenticate.js` com middleware JWT reutilizável. Testes de integração em `backend/tests/auth.test.js` cobrindo: login válido, login inválido, token expirado, refresh válido, refresh já usado, logout.

**Critério de conclusão:** Todos os 6 cenários de teste passando. Teste manual: login → usar access token → esperar expiração → usar refresh → receber novo access token. Rate limiting ativado após 5 tentativas falhas em 1 minuto.

---

#### TASK-04 · erick · 🟡 Normal
**Ação:** Documentar o processo de deploy do FBR CHAT no KVM, criar checklist de go-live e definir procedimento de backup do banco de dados PostgreSQL com retenção de 7 dias e scripts de restore testados.

**Contexto:** O FBR CHAT roda em servidor KVM próprio. Sem documentação de operação, qualquer incidente vira uma crise. O backup é especialmente crítico pois o banco armazena todas as conversas e a memória dos agentes. Um restore não testado é um backup inútil.

**Input esperado:** docker-compose.yml gerado na TASK-02. Acesso ao KVM (IP, credenciais SSH).

**Output esperado:** Documento `docs/DEPLOY.md` com passo a passo completo de deploy (clone, configurar .env, docker compose up). Documento `docs/BACKUP.md` com: script de backup diário via cron (`backend/scripts/backup.sh`), política de retenção 7 dias, procedimento de restore com passo a passo testado. Documento `docs/RUNBOOK.md` com: como reiniciar cada serviço, como ver logs, como acessar o banco em produção.

**Critério de conclusão:** Backup executado manualmente com sucesso. Restore executado em ambiente limpo com sucesso. Documentação revisada por outro membro do time.

---

## SPRINT 2 — Backend Core (API + WebSocket)

### Raciocínio
> Com a fundação pronta, o backend precisa implementar toda a lógica de negócio antes do frontend poder ser construído. A ordem é: CRUD de usuários/agentes → grupos/PVTs → mensageria WebSocket (o componente mais complexo). O módulo WebSocket é o coração do sistema e merece tarefas separadas para a lógica de roteamento e a integração com OpenClaw.

---

#### TASK-05 · david · 🔴 Alta
**Ação:** Implementar os endpoints de administração do FBR CHAT para gestão de usuários (/api/admin/users CRUD), empresas (/api/admin/companies CRUD) e agentes (/api/admin/agents CRUD), com validação de schema, soft delete, proteção por role 'admin', filtro de agentes por empresa e validação dos campos obrigatórios da openclaw_config (model e system_prompt).

**Contexto:** Administradores precisam cadastrar usuários (sem cadastro público) e configurar agentes com seus modelos OpenClaw antes de qualquer uso da plataforma. O CRUD de agentes é especialmente crítico pois a openclaw_config define o comportamento de cada agente virtual. Soft delete garante que histórico de mensagens não seja perdido.

**Input esperado:** Schema do banco (TASK-01). Autenticação JWT (TASK-03). PRD seção 3 Módulo 1.2 com especificação completa dos endpoints e estrutura do objeto openclaw_config.

**Output esperado:** Arquivos de rotas `backend/src/routes/admin/users.js`, `backend/src/routes/admin/companies.js` e `backend/src/routes/admin/agents.js`. Schemas de validação (Zod ou Joi) para criação e atualização. Testes de integração cobrindo: criar usuário, email duplicado, criar empresa, criar agente com config inválida, atualizar, soft delete, listar só ativos e filtrar agentes por empresa.

**Critério de conclusão:** Todos os testes passando. Tentativa de acessar /api/admin com role 'user' retorna 403. Agente criado com openclaw_config completo, vinculado a uma empresa, consultado e atualizado via API sem erro. Filtro `company_id` ou `company_slug` retorna apenas os agentes daquela empresa.

---

#### TASK-06 · david · 🔴 Alta
**Ação:** Implementar os endpoints de grupos (/api/groups CRUD + gestão de membros + histórico paginado) e PVTs (/api/pvt com idempotência + histórico paginado) do FBR CHAT, garantindo isolamento de dados por usuário (usuário só vê suas próprias conversas) e paginação cursor-based no histórico.

**Contexto:** Grupos e PVTs são as duas estruturas de conversa do FBR CHAT. A paginação cursor-based (não offset) é obrigatória para históricos longos — offset quebra quando novas mensagens chegam durante o scroll. A idempotência no POST /api/pvt garante que abrir o mesmo PVT duas vezes não duplica a conversa.

**Input esperado:** Schema do banco (TASK-01). Autenticação JWT (TASK-03). PRD seção 3 Módulos 1.3 e 1.4 com todos os endpoints e critérios de aceite.

**Output esperado:** Rotas `backend/src/routes/groups.js` e `backend/src/routes/pvt.js`. Testes cobrindo: criar grupo, adicionar membro agente, buscar histórico com cursor, idempotência do PVT, isolamento de dados (usuário B não acessa grupo do usuário A).

**Critério de conclusão:** Teste de idempotência: POST /api/pvt com mesmos params duas vezes retorna mesmo pvt_id com is_new=false na segunda. Paginação testada com 500+ mensagens.

---

#### TASK-07 · david · 🔴 Alta
**Ação:** Implementar o servidor WebSocket do FBR CHAT com Socket.io implementando todos os eventos definidos no PRD (join_room, send_message, typing_start/stop, read_messages, message_received, agent_typing, message_updated, error), incluindo autenticação JWT no handshake do WebSocket, persistência de mensagens no PostgreSQL, entrega para todos os membros conectados e compatibilidade com o pipeline de envio via fallback HTTP.

**Contexto:** O WebSocket é o núcleo de entrega de mensagens em tempo real do FBR CHAT. Cada mensagem precisa ser persistida ANTES de ser entregue (garantia de entrega). A autenticação no handshake previne conexões não autorizadas. O indicador de "digitando" do agente melhora significativamente a experiência ao esperar respostas do OpenClaw.

**Input esperado:** Schema do banco (TASK-01). Autenticação JWT (TASK-03). Grupos e PVTs implementados (TASK-06). PRD seção 3 Módulo 1.5 com todos os eventos WebSocket e seus payloads exatos.

**Output esperado:** Arquivo `backend/src/socket/index.js` com toda a lógica WebSocket. Arquivo `backend/src/socket/handlers/message.js` com handler de mensagens. Endpoint `POST /api/messages` usando o mesmo pipeline interno do WebSocket para envio quando o socket estiver offline. Reconexão automática com exponential backoff configurada. Teste de carga: script que abre 30 conexões simultâneas e envia 10 mensagens cada.

**Critério de conclusão:** 30 WebSockets simultâneos sem erro. Mensagem enviada por usuário A aparece para usuário B em < 500ms. Desconexão e reconexão recebe mensagens perdidas no intervalo. Com o socket offline, `POST /api/messages` persiste e entrega a mensagem sem divergência de payload.

---

#### TASK-08 · david · 🔴 Alta
**Ação:** Implementar a integração do FBR CHAT com OpenClaw para resposta de agentes em grupos e PVTs, incluindo: seleção do agente correto por conversa, montagem do contexto com últimas 20 mensagens, resolução segura de credenciais via `api_key_ref`, chamada à API OpenClaw com timeout de 10s, tratamento de erros (timeout, API fora do ar, resposta vazia) com mensagens de erro legíveis no chat, debounce de 3s para agrupar mensagens consecutivas do mesmo usuário e logging operacional de cada chamada.

**Contexto:** A integração com OpenClaw é o diferencial do FBR CHAT. Cada agente tem sua própria configuração (model, system_prompt, temperature) armazenada no banco, mas o segredo real nunca fica persistido: apenas `api_key_ref` fica salvo e o backend resolve a chave em runtime. O debounce de 3s evita que o agente responda 5 vezes quando o usuário envia "oi", "tudo", "bem", "e", "você?" em sequência rápida. Erros precisam ser visíveis no chat — silêncio é inaceitável.

**Input esperado:** WebSocket implementado (TASK-07). Agentes cadastrados no banco (TASK-05). PRD seção 3 Módulo 1.5 (fluxo de mensagem com agente) e seção 6.1 (contrato Backend → OpenClaw).

**Output esperado:** Arquivo `backend/src/services/openclaw.js` com função `callOpenClaw(agent, messages, context)` e timeout configurável. Função `resolveSecret(api_key_ref)` com falha explícita se a referência não existir. Arquivo `backend/src/services/agent-router.js` com lógica de seleção de agente e debounce. Persistência em `openclaw_call_logs` com latência, tokens, custo estimado e status. Tratamento de todos os cenários de erro documentados no PRD seção 8 (casos de borda).

**Critério de conclusão:** Teste com OpenClaw mockado retornando em 2s → mensagem de resposta no chat. Teste com OpenClaw mockado demorando 11s → mensagem de erro no chat após 10s. Teste com resposta vazia → mensagem de erro específica. API admin nunca retorna a chave resolvida; log operacional é persistido para chamadas bem-sucedidas e falhas.

---

#### TASK-09 · david · 🟡 Normal
**Ação:** Implementar o endpoint de upload de mídia do FBR CHAT (POST /api/upload) com integração ao MinIO, validação de MIME type real (não só extensão), limites por tipo de arquivo (áudio 25MB, vídeo 50MB, imagem 10MB) e path de armazenamento organizado por tipo e data.

**Contexto:** Usuários do FBR CHAT podem enviar áudios, vídeos e imagens nas conversas. A validação de MIME type real (lendo os bytes do arquivo, não só a extensão) previne uploads maliciosos disfarçados com extensão incorreta. O MinIO é self-hosted no mesmo KVM, então latência de upload é mínima.

**Input esperado:** MinIO configurado no Docker Compose (TASK-02). PRD seção 3 Módulo 1.6 com tabela de tipos/limites e path de armazenamento.

**Output esperado:** Rota `backend/src/routes/upload.js`. Bucket `fbr-chat-media` criado no MinIO com política de acesso público para leitura. Validação usando biblioteca `file-type` (Node) ou `python-magic` (Python). Testes: upload válido de cada tipo, upload de arquivo grande, upload com MIME forjado.

**Critério de conclusão:** Upload de arquivo .mp3 de 5MB completa em < 3s e URL retornada é acessível no browser. Upload de arquivo .txt renomeado para .mp3 rejeitado com 415.

---

## SPRINT 3 — Frontend (Interface de Chat)

### Raciocínio
> Com toda a API e WebSocket funcionando, o frontend pode ser construído de forma segura sabendo que os contratos de interface estão estáveis. A ordem é: estrutura base e autenticação → sidebar e navegação → painel de chat (o mais complexo) → componentes de mídia → polish de UX.

---

#### TASK-10 · chiara · 🔴 Alta
**Ação:** Criar a estrutura base do projeto React do FBR CHAT com: setup com Vite, configuração do Socket.io-client, AuthContext (armazenamento e renovação automática do JWT), SocketContext (conexão e reconexão automática), roteamento com React Router (/ → chat, /login → autenticação, /admin → painel admin), e tela de login com validação de formulário.

**Contexto:** A estrutura base do React define como toda a aplicação se organiza. O AuthContext precisa renovar o access token automaticamente antes de expirar (interceptor de 401 no axios que chama /refresh). O SocketContext precisa reconectar automaticamente com exponential backoff quando a conexão cair. Essa base afeta todos os outros componentes que serão construídos em cima.

**Input esperado:** Endpoints de autenticação funcionando (TASK-03). PRD seção 3 Módulo 1.7 com estrutura de componentes e comportamentos de UX.

**Output esperado:** Projeto React em `frontend/` com: `src/contexts/AuthContext.jsx`, `src/contexts/SocketContext.jsx`, `src/pages/Login.jsx` (formulário estilizado), `src/App.jsx` com roteamento. Tela de login funcional conectada ao backend real.

**Critério de conclusão:** Login com credenciais válidas redireciona para /chat. Login com credenciais inválidas exibe mensagem de erro inline. Token expirado → renovação automática transparente sem logout.

---

#### TASK-11 · chiara · 🔴 Alta
**Ação:** Implementar o layout principal do FBR CHAT com sidebar responsiva contendo lista de grupos e PVTs (com badges de não-lidos, último texto e timestamp), navegação entre conversas, avatar e nome do usuário logado com indicador de status online, e banner de status de conexão WebSocket (amarelo quando offline).

**Contexto:** A sidebar é o hub de navegação do FBR CHAT, inspirada no Telegram. O badge de não-lidos deve atualizar em tempo real via WebSocket sem precisar recarregar. A lista deve ordenar conversas por última mensagem (mais recente primeiro). O banner de offline é crítico para o usuário saber que mensagens podem não estar sendo entregues.

**Input esperado:** AuthContext e SocketContext funcionando (TASK-10). Endpoints /api/groups e /api/pvt funcionando (TASK-06). Eventos WebSocket de mensagem funcionando (TASK-07).

**Output esperado:** Componentes `src/components/Sidebar/GroupList.jsx`, `src/components/Sidebar/PvtList.jsx`, `src/components/Sidebar/UserProfile.jsx`, `src/components/layout/OfflineBanner.jsx`. Layout responsivo funcional de 1024px a 1920px.

**Critério de conclusão:** Abrir nova mensagem no grupo zera o badge de não-lidos. Nova mensagem recebida move a conversa para o topo da lista. Banner amarelo aparece em < 2s após simular desconexão de rede.

---

#### TASK-12 · chiara · 🔴 Alta
**Ação:** Implementar o painel de chat principal do FBR CHAT com: lista de mensagens virtualizada (react-window ou similar para suportar 500+ mensagens sem travar), scroll automático inteligente (fixa no fundo exceto quando usuário rolou para cima), carregamento de histórico ao rolar para o topo (infinite scroll reverso, 50 mensagens por vez), separadores de data entre dias, e diferenciação visual entre mensagens de usuário, agente e sistema.

**Contexto:** O MessageList é o componente mais crítico de performance do FBR CHAT. Sem virtualização, 500 mensagens renderizadas ao mesmo tempo trava o browser. O scroll automático inteligente é essencial: se o usuário rolou para cima para ler o histórico, não deve ser jogado para o fim quando chegar uma nova mensagem.

**Input esperado:** Sidebar implementada (TASK-11). Endpoints de histórico paginado funcionando (TASK-06). Eventos WebSocket de message_received funcionando (TASK-07).

**Output esperado:** Componentes `src/components/Chat/MessageList.jsx` (virtualizado), `src/components/Chat/MessageBubble.jsx` (user vs agent vs sistema), `src/components/Chat/DateSeparator.jsx`. Scroll automático com scroll-lock implementado.

**Critério de conclusão:** Renderizar 500 mensagens e scrollar sem frame drops visíveis. Receber nova mensagem enquanto rolando para cima NÃO move o scroll. Rolar até o topo carrega 50 mensagens anteriores sem piscar.

---

#### TASK-13 · chiara · 🔴 Alta
**Ação:** Implementar o input de mensagens do FBR CHAT com: textarea com Enter para enviar (Shift+Enter para nova linha), botão de upload de mídia com preview antes do envio, indicador de typing do agente ("...") com animação enquanto aguarda resposta OpenClaw, estado de erro de envio com botão de reenviar, e exibição de mensagens com status (enviando → enviado → erro).

**Contexto:** O input é o ponto de ação principal do usuário. O indicador de typing do agente é fundamental para a experiência — sem ele, o usuário não sabe se o sistema está processando ou travado. O estado de erro com reenvio previne mensagens perdidas silenciosamente. Preview antes do envio de mídia previne envios acidentais.

**Input esperado:** Painel de mensagens (TASK-12). Upload de mídia funcionando (TASK-09). Eventos agent_typing e agent_done_typing do WebSocket (TASK-07).

**Output esperado:** Componentes `src/components/Chat/MessageInput.jsx`, `src/components/Chat/TypingIndicator.jsx`, `src/components/Chat/MediaUploadPreview.jsx`. Estados de mensagem: 'sending' (spinner), 'sent' (checkmark), 'error' (vermelho + botão retry).

**Critério de conclusão:** Enter envia mensagem. Shift+Enter cria nova linha. Enviar imagem mostra preview, confirmar envia. Typing indicator aparece quando agente está processando e desaparece quando resposta chega.

---

#### TASK-14 · chiara · 🟡 Normal
**Ação:** Implementar os componentes de mídia do FBR CHAT: AudioPlayer com play/pause, barra de progresso e tempo (para mensagens de áudio enviadas por usuários e para respostas TTS de agentes), VideoPlayer embutido para vídeos enviados, e exibição de imagens com lightbox ao clicar.

**Contexto:** O FBR CHAT suporta envio de áudio, vídeo e imagem nas conversas. O AudioPlayer é usado tanto para áudios enviados por usuários quanto para os áudios TTS gerados pelos agentes — é o mesmo componente, só muda a fonte. O player não deve auto-reproduzir (usuário controla quando ouvir).

**Input esperado:** Upload implementado (TASK-09). MessageBubble implementado (TASK-12). Estrutura de mensagem com campos media_url, media_type e tts_audio_url.

**Output esperado:** Componentes `src/components/Media/AudioPlayer.jsx`, `src/components/Media/VideoPlayer.jsx`, `src/components/Media/ImageLightbox.jsx`. AudioPlayer integrado ao MessageBubble para mensagens com media_type='audio' e para mensagens de agente com tts_audio_url.

**Critério de conclusão:** Áudio de 30s reproduz completamente sem buffering. Barra de progresso funcional. Clicar em imagem abre lightbox. Fechar lightbox com Escape.

---

## SPRINT 4 — Orquestrador de Memória (Fase 2)

### Raciocínio
> A memória é o diferencial mais complexo do FBR CHAT. Ela requer um serviço independente (o orquestrador) que roda em background sem afetar a entrega de mensagens. A ordem é: estrutura dos arquivos → worker de atualização do MEMORY.md → worker do HISTORY.md → ContextRouter que lê e filtra os arquivos → integração com o fluxo de PVT.

---

#### TASK-15 · david · 🔴 Alta
**Ação:** Criar o serviço orquestrador de memória do FBR CHAT como worker independente que escuta o canal Redis 'memory:update_requested', processa mensagens de grupos para extrair informações relevantes do usuário via OpenClaw (modelo leve), e atualiza o MEMORY.md do usuário com append incremental, respeitando a estrutura de seções por grupo e as regras de não-duplicação.

**Contexto:** O orquestrador é um processo separado do backend principal — se ele cair, o chat continua funcionando normalmente. Ele usa Redis pub/sub para receber notificações de novas mensagens em grupos. Usa OpenClaw com modelo leve para extrair informações estruturadas (JSON com categorias: decisoes, perguntas, infos, tom). O MEMORY.md segue a estrutura definida no PRD seção 4 Módulo 2.1.

**Input esperado:** Redis configurado (TASK-02). Docker Compose com serviço 'orchestrator' configurado. PRD seção 4 Módulo 2.1 com estrutura completa do MEMORY.md, processo de atualização e regras (máximo 50 itens por categoria, não sobrescrever, criar se não existe).

**Output esperado:** Serviço em `orchestrator/src/workers/memory_worker.py` (ou .js). Função `update_memory_md(user_id, group_id, new_items)` com lógica de append e verificação de duplicatas. Testes unitários: adicionar item novo, detectar item duplicado, criar arquivo novo, atingir limite de 50 itens.

**Critério de conclusão:** Usuário envia mensagem no grupo → em até 30s o MEMORY.md está atualizado com informações extraídas. Worker reinicia automaticamente se cair (via Docker restart policy). Falha no OpenClaw do orquestrador logada mas não propaga erro.

---

#### TASK-16 · david · 🔴 Alta
**Ação:** Implementar o worker de atualização do HISTORY.md no orquestrador do FBR CHAT, que detecta inatividade de 30 minutos em PVTs, resume a sessão em JSON estruturado (tema, resumo, conclusoes) via OpenClaw, e faz append no HISTORY.md do usuário com a estrutura de sessão definida no PRD.

**Contexto:** O HISTORY.md preserva o contexto histórico de todas as conversas PVT do usuário com cada agente. Isso permite que o agente lembre de promessas feitas em sessões anteriores, temas já discutidos e preferências demonstradas. A detecção de inatividade de 30min é o trigger de fechamento de sessão.

**Input esperado:** Orquestrador com worker de memória (TASK-15). PRD seção 4 Módulo 2.1 com estrutura do HISTORY.md e processo de atualização. Redis com chaves de last_activity por PVT.

**Output esperado:** Função `close_pvt_session(user_id, pvt_id, messages)` com chamada ao OpenClaw e append ao HISTORY.md. Cron job a cada 5 minutos verificando PVTs com inatividade > 30min. Estrutura de HISTORY.md validada.

**Critério de conclusão:** PVT inativo por 30min → HISTORY.md atualizado com resumo da sessão em até 5min. Teste com 10 mensagens de uma sessão de vendas → resumo gerado corretamente com tema, resumo e conclusões.

---

#### TASK-17 · david · 🔴 Alta
**Ação:** Implementar o ContextRouter do FBR CHAT — módulo que, ao iniciar um PVT, lê o MEMORY.md e o HISTORY.md do usuário, tenta identificar o tema da mensagem por busca de palavras-chave, filtra o conteúdo relevante para o tema, e retorna a string de contexto formatada para injeção no prompt do OpenClaw, com limite de 2000 tokens.

**Contexto:** O ContextRouter é o que faz o agente "lembrar" do usuário sem precisar de memória nativa do LLM. Ele monta o contexto sob demanda, filtrando apenas o que é relevante para o assunto em pauta. Isso evita injetar 10.000 tokens de contexto em toda resposta. O limite de 2000 tokens garante compatibilidade com janelas de contexto menores.

**Input esperado:** MEMORY.md e HISTORY.md sendo gerados (TASKs 15 e 16). PRD seção 4 Módulo 2.2 com algoritmo completo do build_pvt_context e filtro por palavras-chave.

**Output esperado:** Módulo `backend/src/services/context_router.js` com funções: `identify_tema(message)`, `filter_by_tema(memory_content, tema)`, `build_pvt_context(user_id, agent_id, message)`. Config de temas conhecidos em `backend/src/config/topics.json`.

**Critério de conclusão:** Teste: usuário com MEMORY.md sobre "vendas" envia "quero falar sobre meu pipeline" → contexto de vendas injetado. Teste: mensagem ambígua → função retorna null → agente pergunta o tema. Contexto nunca excede 2000 tokens.

---

#### TASK-18 · david · 🟡 Normal
**Ação:** Integrar o ContextRouter ao fluxo de PVT do WebSocket do FBR CHAT, substituindo o contexto simples de Fase 1 (só histórico do PVT) pelo contexto enriquecido (MEMORY.md + HISTORY.md filtrados), e implementar o prompt especial de clarificação de tema quando identify_tema() retorna null.

**Contexto:** Na Fase 1, o PVT usava apenas as últimas 20 mensagens como contexto. Na Fase 2, o ContextRouter enriquece esse contexto com a memória do usuário nos grupos e histórico de PVTs anteriores. A integração precisa ser feita de forma que a Fase 1 continue funcionando como fallback se o MEMORY.md não existir.

**Input esperado:** ContextRouter implementado (TASK-17). Fluxo de PVT do WebSocket (TASK-08). PRD seção 4 Módulo 2.2 com o prompt de clarificação exato.

**Output esperado:** Atualização em `backend/src/services/agent-router.js` para chamar ContextRouter antes de montar o prompt. Prompt de clarificação injetado quando tema não identificado. Fallback para contexto simples quando MEMORY.md não existe.

**Critério de conclusão:** Usuário abre PVT após ter discutido "relatórios" no grupo → agente usa esse contexto. Usuário sem MEMORY.md → PVT funciona normalmente sem erro. Mensagem ambígua → agente pergunta o tema antes de responder.

---

## SPRINT 5 — Voz: STT + TTS (Fase 2)

### Raciocínio
> STT e TTS são independentes entre si mas dependem da infraestrutura de upload e do WebSocket. STT transforma entrada de voz em texto (processado pelo agente normalmente). TTS transforma saída de texto do agente em áudio. A ordem é: STT → TTS → integração com gravação no frontend.

---

#### TASK-19 · david · 🟡 Normal
**Ação:** Implementar a integração com Whisper API (OpenAI) no FBR CHAT para transcrição de áudios enviados pelos usuários, incluindo: chamada à API com language='pt', exibição da transcrição abaixo do player de áudio na UI, tratamento de falha com mensagem de erro específica no chat (não silêncio), e rejeição de áudios maiores que 25MB antes de chamar a API.

**Contexto:** Usuários podem enviar mensagens de voz no FBR CHAT. O áudio é enviado ao MinIO via /api/upload e então o backend chama Whisper para transcrever. O texto transcrito é o que o agente recebe (não o áudio). A transcrição é exibida no chat para que o usuário confirme o que foi entendido. Falhas na Whisper API não devem travar o chat.

**Input esperado:** Upload de mídia funcionando (TASK-09). WebSocket de mensagens (TASK-07). PRD seção 4 Módulo 2.3 com fluxo completo de transcrição.

**Output esperado:** Serviço `backend/src/services/stt.js` com função `transcribeAudio(audio_url)`. Integração no handler de mensagens para processar áudios recebidos. Evento WebSocket `message_updated { message_id, transcription }` para atualizar a UI após transcrição.

**Critério de conclusão:** Enviar áudio de 30s em português → transcrição aparece no chat em < 8s. Whisper API indisponível → mensagem "Transcrição indisponível. O agente não receberá o áudio." aparece no chat.

---

#### TASK-20 · david · 🟡 Normal
**Ação:** Implementar a integração com ElevenLabs TTS no FBR CHAT para geração de áudio das respostas de agentes com tts_enabled=true, incluindo: chamada à API com modelo eleven_multilingual_v2, salvamento do MP3 no MinIO, atualização da mensagem com tts_audio_url via evento WebSocket message_updated, e fallback silencioso quando ElevenLabs estiver indisponível (texto entregue sem áudio, sem erro visível).

**Contexto:** Agentes com TTS habilitado respondem em texto E em voz. O áudio é gerado APÓS o texto (o texto já foi entregue via WebSocket). O áudio é salvo no MinIO e a mensagem é atualizada com a URL via um segundo evento WebSocket. O fallback silencioso é obrigatório: a indisponibilidade do TTS não deve nunca bloquear a entrega do texto.

**Input esperado:** Upload e MinIO funcionando (TASK-09). WebSocket (TASK-07). Agentes com campo tts_voice_id configurado (TASK-05). PRD seção 4 Módulo 2.4 com fluxo completo.

**Output esperado:** Serviço `backend/src/services/tts.js` com função `generateAudio(text, voice_id)`. Evento WebSocket `message_updated { message_id, tts_audio_url }`. Integração assíncrona no fluxo de resposta do agente (texto primeiro, áudio depois).

**Critério de conclusão:** Agente com TTS responde → texto aparece imediatamente → áudio aparece em < 5s. ElevenLabs fora do ar → texto entregue normalmente, sem mensagem de erro para o usuário.

---

#### TASK-21 · chiara · 🟡 Normal
**Ação:** Implementar o botão de gravação de áudio no input do FBR CHAT usando MediaRecorder API do browser, com: feedback visual durante gravação (ondas animadas + timer), cancelamento de gravação, preview do áudio antes de enviar, integração com o endpoint /api/upload e exibição da transcrição na UI quando recebida via WebSocket.

**Contexto:** Usuários do FBR CHAT podem enviar mensagens de voz como alternativa à digitação. A gravação acontece diretamente no browser via MediaRecorder (sem plugin). O fluxo é: pressionar → gravar → soltar → preview → confirmar envio. A transcrição aparece automaticamente abaixo do áudio após ser processada pelo Whisper (TASK-19).

**Input esperado:** STT implementado (TASK-19). Input de mensagens (TASK-13). AudioPlayer (TASK-14). Evento WebSocket message_updated.

**Output esperado:** Componente `src/components/Chat/AudioRecorder.jsx` integrado ao MessageInput. Estado visual de gravação com timer em segundos. Preview do áudio gravado com player antes do envio. Integração com evento `message_updated` para exibir transcrição.

**Critério de conclusão:** Gravar áudio de 10s → preview aparece → confirmar → áudio e transcrição aparecem no chat. Cancelar gravação não envia nada.

---

## SPRINT 6 — Admin Panel + Busca + Relatórios (Fase 3)

### Raciocínio
> A Fase 3 eleva o sistema para produção completa. O admin panel é necessário para gestão sem acesso direto ao banco. A busca melhora significativamente a usabilidade para históricos longos. Os relatórios permitem monitorar custo e uso. A sumarização de MEMORY.md é um componente de saúde do sistema que previne degradação ao longo do tempo.

---

#### TASK-22 · chiara · 🔴 Alta
**Ação:** Criar o painel de administração web do FBR CHAT em /admin com: dashboard de métricas (usuários ativos, mensagens por dia, agentes mais usados nos últimos 30 dias), CRUD visual de usuários (incluindo visualização do MEMORY.md e HISTORY.md), CRUD visual de agentes com preview da openclaw_config, filtro visível de agentes por empresa, lista de grupos com membros e volume de mensagens, log de chamadas ao OpenClaw com latência e tokens, e tela de settings globais persistidos.

**Contexto:** Administradores do FBR CHAT precisam de uma interface para gestão sem acesso direto ao banco de dados ou à linha de comando. O dashboard de métricas permite monitorar uso e custo. A visualização do MEMORY.md e HISTORY.md por usuário é essencial para debugging e suporte. O log de OpenClaw permite identificar agentes lentos ou com alto consumo de tokens.

**Input esperado:** Endpoints de admin implementados (TASK-05). Endpoints de relatórios (TASK-23). PRD seção 5 Módulo 3.1 com todas as seções do admin panel.

**Output esperado:** Páginas React em `frontend/src/pages/admin/`: Dashboard.jsx, Users.jsx, Agents.jsx, Groups.jsx, Logs.jsx, Settings.jsx. Componente de visualização de Markdown para MEMORY.md e HISTORY.md.

**Critério de conclusão:** Dashboard carrega dados dos últimos 30 dias em < 3s. Admin visualiza MEMORY.md de qualquer usuário. Admin cria novo agente e configura openclaw_config pelo formulário. Cards/tabela de agentes podem ser filtrados por empresa sem recarregar a página. Log de OpenClaw mostra últimas 100 chamadas com filtro por agente. Tela de settings altera valores globais persistidos e reflete o estado salvo pelo backend.

---

#### TASK-23 · david · 🟡 Normal
**Ação:** Implementar os endpoints de relatórios, busca, settings globais e logs operacionais do FBR CHAT: GET /api/admin/reports/usage com métricas agregadas por período (7d/30d/90d) usando cache Redis de 1h, GET /api/search com full-text search em PostgreSQL usando tsvector/tsquery em português, exportação de relatório em CSV, GET/PUT /api/admin/settings e GET /api/admin/logs/openclaw.

**Contexto:** Relatórios permitem monitorar custo (tokens TTS, minutos STT, chamadas OpenClaw) e uso (mensagens, usuários ativos, agentes mais usados). Cache de 1h evita queries pesadas a cada acesso ao dashboard. Full-text search com tsvector em português (stemming) garante que buscar "vendendo" encontre "vendas". Isolamento: usuário só busca em suas próprias conversas. O admin panel aprovado no PRD também depende de backend para settings persistidos e logs navegáveis; sem isso, a interface ficaria sem contrato real.

**Input esperado:** Schema do banco (TASK-01). PRD seção 5 Módulos 3.2 e 3.3 com estrutura dos responses e requisitos de performance.

**Output esperado:** Rotas `backend/src/routes/reports.js`, `backend/src/routes/search.js`, `backend/src/routes/admin/settings.js` e `backend/src/routes/admin/logs.js`. Migration adicionando coluna `search_vector TSVECTOR` na tabela messages com trigger de atualização automática. Persistência de `system_settings` em banco. Filtros por `agent_id`, `status` e limite em logs OpenClaw. Teste de performance: search em base com 100k mensagens retorna em < 2s.

**Critério de conclusão:** Busca por "pipeline de vendas" retorna mensagens contendo variações da expressão. Relatório de 30 dias gerado em < 3s. CSV exportado contém todas as colunas do response. Setting alterado por admin persiste no banco e reaparece após restart. Logs OpenClaw listam pelo menos timestamp, agente, tokens, latência, custo e status.

---

#### TASK-24 · david · 🟡 Normal
**Ação:** Implementar o worker de sumarização periódica do MEMORY.md no orquestrador do FBR CHAT, que detecta arquivos com mais de 10.000 caracteres ou mais de 50 itens em qualquer categoria, sumariza itens com mais de 60 dias via OpenClaw, e substitui os itens antigos pelo sumário preservando as informações mais críticas (priorizando decisões e posições).

**Contexto:** Sem sumarização, o MEMORY.md cresce indefinidamente com o uso. Em 6 meses de uso intenso, um arquivo de MEMORY.md pode chegar a centenas de kilobytes, tornando o contexto injetável no prompt excessivamente grande. A sumarização garante que o arquivo nunca exceda 15.000 caracteres, mantendo o histórico relevante mais recente.

**Input esperado:** Worker de memória (TASK-15). PRD seção 5 Módulo 3.4 com regras de sumarização, trigger e limite máximo.

**Output esperado:** Função `summarize_memory_md(user_id)` no orquestrador. Cron job semanal verificando todos os MEMORY.md. Log de sumarizações em `orchestrator/logs/summarizations.log`. Teste: MEMORY.md com 60 itens de 90 dias atrás → sumarizado para 3 frases preservando decisões.

**Critério de conclusão:** MEMORY.md de 12.000 caracteres reduzido para < 8.000 após sumarização. Itens de "decisões e posições" preservados na íntegra. Log registra data, user_id e tamanho antes/depois.

---

## SPRINT 7 — Qualidade, Segurança e Go-Live

### Raciocínio
> O último sprint não adiciona features mas garante que o sistema está pronto para uso real. Segurança (CORS, validações, rate limiting), testes de carga, monitoramento e documentação de API são pré-requisitos para colocar 100 usuários no sistema.

---

#### TASK-25 · david · 🔴 Alta
**Ação:** Implementar todas as medidas de segurança do FBR CHAT: configuração de CORS restritivo para domínio específico (não wildcard), rate limiting global (100 requests/min por IP), validação de MIME type real em uploads, sanitização de inputs em todos os endpoints para prevenir XSS, headers de segurança via Nginx (X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security), e auditoria de que nenhum endpoint loga tokens, senhas ou conteúdo de mensagens privadas.

**Contexto:** O FBR CHAT armazena conversas privadas e dados de usuários. Uma vulnerabilidade de XSS poderia comprometer tokens JWT. CORS wildcard em produção permitiria qualquer site fazer requisições autenticadas. Logs com dados sensíveis criam risco de vazamento em caso de acesso não autorizado aos logs.

**Input esperado:** Backend completo (TASKs 03-09). Nginx configurado (TASK-02). PRD seção 7.2 com lista completa de requisitos de segurança.

**Output esperado:** Arquivo `nginx/security-headers.conf` com todos os headers. Middleware de sanitização aplicado globalmente. Auditoria de logs documentada. Relatório de segurança em `docs/SECURITY.md`.

**Critério de conclusão:** Teste CORS: requisição de domínio não autorizado retorna 403. Rate limit: 101ª requisição no mesmo minuto retorna 429. Upload de arquivo malicioso rejeitado. Nenhum log contém password ou authorization header.

---

#### TASK-26 · erick · 🔴 Alta
**Ação:** Executar testes de carga e aceitação do FBR CHAT simulando o cenário de produção: 30 usuários WebSocket simultâneos enviando mensagens a cada 30 segundos durante 10 minutos, validar que latência P95 de entrega de mensagens permanece < 500ms, que a API mantém P95 < 300ms, e documentar os resultados com gráficos.

**Contexto:** O FBR CHAT precisa suportar 100 usuários com ~30 simultâneos no pico. O teste de carga valida que a infraestrutura KVM de 8GB suporta a carga prevista antes de abrir para usuários reais. Resultados precisam ser documentados para referência futura quando o crescimento exigir scaling.

**Input esperado:** Sistema completo deployado no KVM (TASK-04). Ferramenta de teste de carga (k6 ou Artillery). Cenário de teste definido no PRD seção 7.1.

**Output esperado:** Script de teste em `tests/load/scenario.js`. Relatório em `docs/LOAD_TEST_RESULTS.md` com: latência P50/P95/P99, throughput de mensagens, uso de CPU/RAM durante o teste, gargalos identificados.

**Critério de conclusão:** P95 de entrega de mensagens < 500ms com 30 usuários simultâneos. Uso de RAM do KVM < 6GB durante o teste. Nenhum crash ou reinício de serviço durante os 10 minutos.

---

#### TASK-27 · gabe · 🟡 Normal
**Ação:** Documentar a API completa do FBR CHAT em formato OpenAPI 3.0 (Swagger), criar guia de onboarding para novos usuários da plataforma (como acessar, criar grupos, adicionar agentes, usar PVT), e criar guia de administração (como criar usuários, configurar agentes, monitorar uso).

**Contexto:** Documentação de API permite que novos desenvolvedores integrem o FBR CHAT sem precisar ler o código. O guia de onboarding reduz a barreira de adoção para os primeiros 100 usuários. Documentação clara de administração evita que o admin precise acionar suporte técnico para operações rotineiras.

**Input esperado:** API completa implementada. Admin panel funcionando. Todas as features de Fase 1, 2 e 3 implementadas.

**Output esperado:** Arquivo `docs/api/openapi.yaml` com todos os endpoints documentados. Documento `docs/ONBOARDING.md` com guia visual (screenshots) passo a passo para usuários. Documento `docs/ADMIN_GUIDE.md` para administradores.

**Critério de conclusão:** OpenAPI válido (sem erros no Swagger UI). Usuário novo consegue acessar e enviar primeira mensagem seguindo apenas o ONBOARDING.md. Admin consegue criar usuário e agente seguindo apenas o ADMIN_GUIDE.md.

---

## Mapa de Dependências

```
TASK-01 (Schema DB)
  └── TASK-02 (Docker) ─────────────────────────────┐
  └── TASK-03 (Auth JWT)                             │
       └── TASK-05 (Admin CRUD)                      │
       └── TASK-06 (Grupos + PVTs)                   │
            └── TASK-07 (WebSocket)                  │
                 └── TASK-08 (OpenClaw Integration)  │
                 └── TASK-09 (Upload) ───────────────┤
                      └── TASK-10 (React Base)       │
                           └── TASK-11 (Sidebar)     │
                                └── TASK-12 (Chat)   │
                                     └── TASK-13 (Input)
                                     └── TASK-14 (Media)
TASK-04 (DevOps) ─────────────────────────────────────┘
  └── TASK-15 (MEMORY.md Worker)
       └── TASK-16 (HISTORY.md Worker)
       └── TASK-17 (ContextRouter)
            └── TASK-18 (PVT Integration)
TASK-09 + TASK-07
  └── TASK-19 (STT Whisper)
  └── TASK-20 (TTS ElevenLabs)
       └── TASK-21 (AudioRecorder Frontend)
TASK-05 + TASK-23
  └── TASK-22 (Admin Panel Frontend)
TASK-15 → TASK-24 (Sumarização)
TASK-25 (Segurança) → TASK-26 (Load Test) → TASK-27 (Docs)
```

---

## Ordem de Execução Sugerida

### Sprint 1 (Semanas 1–2): Fundação
TASK-01 → TASK-02 (paralelo) → TASK-03 → TASK-04

### Sprint 2 (Semanas 3–6): Backend Core
TASK-05 → TASK-06 → TASK-07 → TASK-08 (paralelo com TASK-09)

### Sprint 3 (Semanas 5–8): Frontend
TASK-10 → TASK-11 → TASK-12 → TASK-13 + TASK-14 (paralelo)

### Sprint 4 (Semanas 9–14): Memória
TASK-15 → TASK-16 (paralelo) → TASK-17 → TASK-18

### Sprint 5 (Semanas 13–16): Voz
TASK-19 → TASK-20 (paralelo com TASK-21)

### Sprint 6 (Semanas 17–22): Maturidade
TASK-22 → TASK-23 (paralelo) → TASK-24

### Sprint 7 (Semanas 23–24): Go-Live
TASK-25 → TASK-26 → TASK-27

---

## Resumo por Agente

| Agente | Tarefas | Área |
|---|---|---|
| david | 01, 03, 05, 06, 07, 08, 09, 15, 16, 17, 18, 19, 20, 23, 24, 25 | Backend, banco, integrações, workers |
| chiara | 10, 11, 12, 13, 14, 21, 22 | Frontend React, componentes, UX |
| erick | 04, 26 | DevOps, documentação operacional, testes de carga |
| gabe | 27 | Documentação, onboarding, guias |

---

## Payload JSON para Sprint API

```json
{
  "sprintName": "FBR CHAT — Sprint 1: Fundação & Infraestrutura",
  "context": "O FBR CHAT é uma plataforma proprietária de mensageria com agentes virtuais configurados via OpenClaw. Roda em KVM de 8GB RAM com PostgreSQL, Redis, MinIO e Nginx em Docker Compose. O backend é um roteador de mensagens leve — sem LLM local. Este sprint estabelece banco de dados, autenticação JWT e infraestrutura Docker como base para todo o desenvolvimento subsequente.",
  "tasks": [
    {
      "agent": "david",
      "action": "Criar o schema completo do banco de dados PostgreSQL com todas as tabelas do FBR CHAT (users, agents, groups, group_members, messages, pvt_conversations, refresh_tokens) conforme especificação do PRD, incluindo índices de performance e constraints de integridade.",
      "priority": "high",
      "due_date": "2026-05-07"
    },
    {
      "agent": "david",
      "action": "Configurar o ambiente Docker completo do FBR CHAT com docker-compose.yml orquestrando todos os serviços (PostgreSQL, Redis, MinIO, Nginx, Backend API, Orquestrador), com variáveis de ambiente separadas por arquivo .env e healthchecks em cada serviço.",
      "priority": "high",
      "due_date": "2026-05-07"
    },
    {
      "agent": "david",
      "action": "Implementar o sistema completo de autenticação JWT do FBR CHAT com os endpoints POST /api/auth/login, POST /api/auth/refresh, POST /api/auth/logout e GET /api/auth/me, incluindo middleware de autenticação reutilizável, bcrypt para senhas (salt rounds 12), rate limiting no login (5 tentativas/minuto/IP) e rotação de refresh tokens.",
      "priority": "high",
      "due_date": "2026-05-14"
    },
    {
      "agent": "erick",
      "action": "Documentar o processo de deploy do FBR CHAT no KVM, criar checklist de go-live e definir procedimento de backup do banco de dados PostgreSQL com retenção de 7 dias e scripts de restore testados.",
      "priority": "normal",
      "due_date": "2026-05-14"
    }
  ]
}
```
