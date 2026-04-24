# PRD — FBR CHAT · Plataforma de Mensageria com Agentes Virtuais
> Versão 1.0 · Abril 2026  
> Status: Aprovado para desenvolvimento  
> Responsável: Time FBR

> Atualização 1.1 · Abril 2026  
> Ajustes pré-codificação para fechar lacunas de modelagem, segurança e contratos entre módulos.

---

## 1. Visão Geral do Produto

### 1.1 Problema
As plataformas de chat comerciais (WhatsApp Business, Telegram) impõem restrições severas à orquestração de agentes virtuais: limite de bots por conta, ausência de memória compartilhada entre grupos e PVTs, impossibilidade de configurar o modelo LLM por agente individualmente, e dependência de APIs de terceiros com termos de uso restritivos.

### 1.2 Solução
O FBR CHAT é uma plataforma proprietária de mensageria que permite integrar agentes virtuais de forma irrestrita. Cada agente tem modelo LLM configurado individualmente via OpenClaw. A plataforma mantém memória contextual persistente por usuário e suporta grupos temáticos e conversas privadas (PVT).

### 1.3 Público-alvo
Times internos da FBR interagindo com agentes virtuais especializados por função (vendas, RH, produto, onboarding). Universo inicial: 100 usuários, ~30 simultâneos no pico.

### 1.4 Infraestrutura disponível
- Servidor KVM: 8GB RAM, 100GB disco
- OpenClaw configurado por agente (LLM externo)
- Sem necessidade de cloud adicional na fase inicial

### 1.5 Não está no escopo
- Chamadas de vídeo (continuam via WhatsApp)
- Modelos LLM rodando localmente
- WebRTC / streaming de vídeo em tempo real
- Aplicativo mobile nativo (fase 1 e 2 são web only)

---

## 2. Arquitetura Técnica

### 2.1 Stack definida

| Camada | Tecnologia | Versão mínima |
|---|---|---|
| Frontend | React.js + Socket.io-client | React 18, Socket.io 4 |
| Backend API | Node.js (Express) ou Python (FastAPI) | Node 20 / Python 3.11 |
| WebSocket | Socket.io | 4.x |
| Banco relacional | PostgreSQL | 15+ |
| Cache / sessões | Redis | 7+ |
| Storage de mídia | MinIO (self-hosted) | RELEASE.2024 |
| Containerização | Docker + Docker Compose | Docker 24+ |
| Proxy / SSL | Nginx | 1.25+ |
| LLMs | OpenClaw API (por agente) | Conforme config |
| TTS | ElevenLabs API ou Google Cloud TTS | API v1 |
| STT | OpenAI Whisper API | v1 |
| Autenticação | JWT (access token 24h + refresh token 30d) | — |

### 2.2 Estrutura de diretórios do projeto

```
fbr-chat/
├── frontend/          # React app
├── backend/           # API + WebSocket server
├── orchestrator/      # Motor de contexto (background worker)
├── memoria/           # Arquivos de memória por usuário
│   └── usuarios/
│       └── {user_id}/
│           ├── MEMORY.md
│           └── HISTORY.md
├── storage/           # MinIO volumes
├── nginx/             # Config do proxy
└── docker-compose.yml
```

### 2.3 Modelo de dados principal

```sql
-- Usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deactivated_at TIMESTAMPTZ
);

-- Agentes virtuais
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  avatar_url TEXT,
  openclaw_config JSONB NOT NULL,  -- model, system_prompt, temperature, etc.
  tts_enabled BOOLEAN DEFAULT FALSE,
  tts_voice_id VARCHAR(100),       -- ElevenLabs voice ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Grupos
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  topic VARCHAR(200),              -- assunto principal do grupo
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Membros de grupos (humanos e agentes)
CREATE TABLE group_members (
  group_id UUID REFERENCES groups(id),
  member_type VARCHAR(10) CHECK (member_type IN ('user', 'agent')),
  member_id UUID NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, member_type, member_id)
);

-- Mensagens
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,   -- group_id ou pvt_id
  conversation_type VARCHAR(5) CHECK (conversation_type IN ('group', 'pvt')),
  sender_type VARCHAR(10) CHECK (sender_type IN ('user', 'agent')),
  sender_id UUID NOT NULL,
  content TEXT,                    -- texto da mensagem
  media_url TEXT,                  -- URL no MinIO (áudio, vídeo)
  media_type VARCHAR(20),          -- 'audio', 'video', 'image'
  tts_audio_url TEXT,              -- URL do áudio TTS gerado
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_by JSONB DEFAULT '[]'       -- array de user_ids que leram
);

-- PVTs 1-a-1 (par canônico para garantir idempotência)
CREATE TABLE pvt_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a_type VARCHAR(10) NOT NULL CHECK (participant_a_type IN ('user', 'agent')),
  participant_a_id UUID NOT NULL,
  participant_b_type VARCHAR(10) NOT NULL CHECK (participant_b_type IN ('user', 'agent')),
  participant_b_id UUID NOT NULL,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (participant_a_type, participant_a_id::text) <> (participant_b_type, participant_b_id::text)
  ),
  CHECK (
    (participant_a_type, participant_a_id::text) < (participant_b_type, participant_b_id::text)
  ),
  UNIQUE (participant_a_type, participant_a_id, participant_b_type, participant_b_id)
);

-- Sessões JWT
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Observações normativas sobre modelagem

- `users.role` define autorização de rotas administrativas.
- `users.is_active = false` representa soft delete; mensagens e vínculos históricos são preservados.
- PVT é sempre representado por um único registro canônico em `pvt_conversations`, inclusive em conversas `user-user`.
- O backend deve ordenar os participantes antes de inserir ou buscar PVT para garantir idempotência simétrica:
  - `participant_a` = menor tupla lexicográfica entre `(type, id)`
  - `participant_b` = maior tupla lexicográfica entre `(type, id)`

---

## 3. FASE 1 — MVP: Interface + Roteamento de Agentes

**Duração:** 6–8 semanas  
**Objetivo:** Sistema funcional para validação com primeiros usuários. Texto em tempo real, grupos, PVT, agentes roteados via OpenClaw.

---

### MÓDULO 1.1 — Autenticação e Sessão

#### Descrição
Sistema de login com email/senha. JWT com access token de 24h e refresh token de 30 dias. Sem cadastro público — usuários criados pelo admin.

#### Endpoints a implementar

```
POST /api/auth/login
  Body: { email, password }
  Response 200: { access_token, refresh_token, user: { id, name, email, avatar_url } }
  Response 401: { error: "Credenciais inválidas" }

POST /api/auth/refresh
  Body: { refresh_token }
  Response 200: { access_token }
  Response 401: { error: "Token inválido ou expirado" }

POST /api/auth/logout
  Header: Authorization: Bearer {access_token}
  Body: { refresh_token }
  Response 200: { success: true }

GET /api/auth/me
  Header: Authorization: Bearer {access_token}
  Response 200: { id, name, email, avatar_url, last_seen }
```

#### Critérios de aceite
- [ ] Login com email/senha retorna JWT válido
- [ ] Access token expira exatamente em 24h
- [ ] Refresh token é invalidado após uso (rotação)
- [ ] Refresh token expirado retorna 401 com mensagem clara
- [ ] Logout invalida o refresh token no banco
- [ ] Endpoint /me retorna 401 se token inválido ou expirado
- [ ] Senha armazenada com bcrypt (salt rounds ≥ 12)
- [ ] Rate limiting no /login: máximo 5 tentativas por IP por minuto

#### Definição de Pronto
- Todos os critérios de aceite passando
- Testes de integração cobrindo fluxo completo login → refresh → logout
- Middleware de autenticação reutilizável documentado

---

### MÓDULO 1.2 — Gestão de Usuários e Agentes (Admin)

#### Descrição
CRUD de usuários e agentes acessível apenas por usuários com role `admin`. Interface web simples ou via API direta.

#### Endpoints a implementar

```
# Usuários
GET    /api/admin/users              → lista todos os usuários
POST   /api/admin/users              → cria usuário { name, email, password, role }
PATCH  /api/admin/users/:id          → atualiza nome, avatar, role
DELETE /api/admin/users/:id          → desativa (soft delete)

# Agentes
GET    /api/admin/agents             → lista todos os agentes
POST   /api/admin/agents             → cria agente
PATCH  /api/admin/agents/:id         → atualiza config
DELETE /api/admin/agents/:id         → desativa agente

# Configuração de agente (POST/PATCH body):
{
  "name": "Agente de Vendas",
  "slug": "vendas",
  "avatar_url": "https://...",
  "openclaw_config": {
    "model": "claude-3-5-sonnet",
    "system_prompt": "Você é...",
    "temperature": 0.7,
    "max_tokens": 1000,
    "api_key_ref": "OPENCLAW_VENDAS_KEY"  // referência a variável de ambiente
  },
  "tts_enabled": true,
  "tts_voice_id": "EXAVITQu4vr4xnSDxMaL"
}
```

Regra de segurança: a chave real do provedor nunca é persistida no banco nem retornada pela API. O backend resolve `api_key_ref` em tempo de execução consultando variáveis de ambiente ou secret store local.

#### Critérios de aceite
- [ ] Apenas usuários com `role = 'admin'` acessam rotas /admin
- [ ] Criação de usuário valida email único
- [ ] `openclaw_config` é validado (campos obrigatórios: model, system_prompt)
- [ ] Deleção é soft delete (campo `is_active = false`), não apaga dados
- [ ] Agente desativado não aparece na lista de membros disponíveis
- [ ] `slug` do agente é único e usado para menção (@slug)

#### Definição de Pronto
- CRUD completo funcionando via API
- Validações de schema implementadas
- Testes unitários nas validações

---

### MÓDULO 1.3 — Grupos: Criação e Membros

#### Descrição
Grupos são canais temáticos com múltiplos participantes (humanos e agentes). Um usuário admin pode criar grupos, definir o assunto/tópico e adicionar membros.

#### Endpoints a implementar

```
GET    /api/groups                   → lista grupos do usuário autenticado
POST   /api/groups                   → cria grupo { name, description, topic }
GET    /api/groups/:id               → detalhes do grupo + membros
PATCH  /api/groups/:id               → atualiza nome, descrição, topic
DELETE /api/groups/:id               → arquiva grupo

POST   /api/groups/:id/members       → adiciona membro { member_type, member_id }
DELETE /api/groups/:id/members/:member_type/:member_id  → remove membro

GET    /api/groups/:id/messages      → histórico (paginado, 50 por página)
  Query: ?before={message_id}&limit=50
```

#### Critérios de aceite
- [ ] Usuário só vê grupos dos quais é membro
- [ ] Admin pode adicionar usuários e agentes a qualquer grupo
- [ ] Histórico de mensagens paginado, cursor-based (não offset)
- [ ] Grupos retornam lista de membros com tipo (user/agent) e dados básicos
- [ ] Campo `topic` é string livre — usado pelo orquestrador de contexto (Fase 2)

#### Definição de Pronto
- Todos endpoints funcionando
- Testes de integração para criação e gestão de membros
- Paginação de histórico validada com dataset de 500+ mensagens

---

### MÓDULO 1.4 — PVT: Conversas Privadas

#### Descrição
Conversa 1-a-1 entre um usuário e outro usuário, ou entre um usuário e um agente. O PVT é criado automaticamente na primeira mensagem trocada.

#### Endpoints a implementar

```
GET    /api/pvt                      → lista PVTs do usuário autenticado
POST   /api/pvt                      → inicia ou recupera PVT existente
  Body: { participant_type: 'user'|'agent', participant_id: UUID }
  Response: { pvt_id, is_new: bool }

GET    /api/pvt/:id                  → detalhes do PVT + participantes
GET    /api/pvt/:id/messages         → histórico (paginado, 50 por página)
  Query: ?before={message_id}&limit=50
```

#### Critérios de aceite
- [ ] POST /pvt é idempotente — dois POSTs com os mesmos params retornam o mesmo pvt_id
- [ ] PVT entre usuário A e usuário B gera o mesmo `pvt_id` independentemente de quem iniciou a conversa
- [ ] Usuário só acessa PVTs dos quais é participante
- [ ] Lista de PVTs ordenada por `last_message_at DESC`
- [ ] PVT com agente e PVT com usuário compartilham a mesma estrutura de dados

#### Definição de Pronto
- Idempotência validada por teste
- Isolamento de dados validado (usuário não acessa PVT de outro)

---

### MÓDULO 1.5 — Mensageria em Tempo Real (WebSocket)

#### Descrição
Core do sistema. Mensagens enviadas via WebSocket com fallback HTTP. Entrega em tempo real para todos os membros conectados. Agentes recebem mensagens e respondem via OpenClaw.

#### Eventos WebSocket a implementar

```javascript
// CLIENTE → SERVIDOR
socket.emit('join_room', { room_type: 'group'|'pvt', room_id: UUID })
socket.emit('leave_room', { room_id: UUID })
socket.emit('send_message', {
  room_type: 'group'|'pvt',
  room_id: UUID,
  content: String,          // texto da mensagem
  media_url: String|null,   // URL de mídia já enviada via /api/upload
  media_type: String|null   // 'audio'|'video'|'image'
})
socket.emit('typing_start', { room_id: UUID })
socket.emit('typing_stop', { room_id: UUID })
socket.emit('read_messages', { room_id: UUID, up_to_message_id: UUID })

// SERVIDOR → CLIENTE
socket.on('message_received', {
  id: UUID,
  room_id: UUID,
  room_type: String,
  sender_type: 'user'|'agent',
  sender_id: UUID,
  sender_name: String,
  sender_avatar: String,
  content: String,
  media_url: String|null,
  media_type: String|null,
  tts_audio_url: String|null,
  created_at: ISO8601
})
socket.on('agent_typing', { room_id: UUID, agent_id: UUID, agent_name: String })
socket.on('agent_done_typing', { room_id: UUID, agent_id: UUID })
socket.on('user_typing', { room_id: UUID, user_id: UUID, user_name: String })
socket.on('messages_read', { room_id: UUID, user_id: UUID, up_to_message_id: UUID })
socket.on('message_updated', {
  message_id: UUID,
  room_id: UUID,
  transcription: String|null,
  tts_audio_url: String|null,
  status: 'sent'|'processing'|'failed'
})
socket.on('error', { code: String, message: String })
```

#### Fallback HTTP obrigatório

Quando o WebSocket estiver indisponível ou em reconexão, o cliente deve conseguir enviar mensagens por HTTP:

```
POST /api/messages
  Header: Authorization: Bearer {token}
  Body: {
    room_type: 'group'|'pvt',
    room_id: UUID,
    content: String|null,
    media_url: String|null,
    media_type: String|null
  }
  Response 201: {
    id, room_id, room_type, sender_type, sender_id, content,
    media_url, media_type, tts_audio_url, created_at, status: 'sent'
  }
```

Regra: o backend deve publicar a mesma mensagem persistida no mesmo pipeline de entrega do WebSocket, para evitar divergência entre os dois canais.

#### Fluxo de mensagem com agente (grupo)

```
1. Usuário emite send_message no grupo
2. Backend persiste a mensagem no PostgreSQL
3. Backend emite message_received para todos os membros conectados
4. Backend verifica se algum agente é membro do grupo
5. Se agente é membro:
   a. Emite agent_typing para o grupo
   b. Busca últimas 20 mensagens do grupo como contexto
   c. Chama OpenClaw com system_prompt do agente + contexto + mensagem
   d. Persiste resposta do agente
   e. Emite message_received com sender_type='agent'
   f. Emite agent_done_typing
6. Se TTS habilitado no agente:
   a. Chama API TTS com o texto da resposta
   b. Salva áudio no MinIO
   c. Atualiza a mensagem com tts_audio_url
   d. Emite message_updated { message_id, tts_audio_url }
```

#### Fluxo de mensagem com agente (PVT)

```
1. Usuário emite send_message no PVT
2. Backend persiste a mensagem
3. Emite message_received para o usuário
4. Emite agent_typing
5. Chama ContextRouter.build_pvt_context(user_id, agent_id, message)
   → Lê MEMORY.md do usuário e filtra por tema (Fase 2 — na Fase 1 usa só histórico do PVT)
   → Lê últimas 20 mensagens do PVT como histórico
6. Chama OpenClaw com contexto montado
7. Persiste e emite resposta
8. Se TTS: gera áudio e atualiza mensagem
```

#### Critérios de aceite
- [ ] Mensagem enviada aparece para todos os membros conectados em < 500ms
- [ ] Indicador de "digitando" do agente aparece antes da resposta
- [ ] Agente responde em até 10s (timeout com mensagem de erro após esse limite)
- [ ] Usuário desconectado recebe mensagens pendentes ao reconectar
- [ ] Cliente consegue enviar mensagem por HTTP enquanto o WebSocket está offline
- [ ] Múltiplos agentes no mesmo grupo respondem sequencialmente (não em paralelo para evitar caos)
- [ ] Erros do OpenClaw retornam mensagem de erro legível no chat (não silêncio)
- [ ] Reconexão automática do WebSocket com exponential backoff

#### Definição de Pronto
- Teste de carga: 30 WebSockets simultâneos sem degradação
- Teste de reconexão: cliente desconecta e reconecta, recebe mensagens perdidas
- Teste de timeout: OpenClaw demorando >10s gera mensagem de erro no chat

---

### MÓDULO 1.6 — Upload de Mídia

#### Descrição
Usuários podem enviar arquivos de áudio, vídeo e imagem. Arquivos são enviados via HTTP multipart para o backend, que salva no MinIO e retorna a URL pública.

#### Endpoints a implementar

```
POST /api/upload
  Header: Authorization: Bearer {token}
  Header: Content-Type: multipart/form-data
  Body: { file: File, type: 'audio'|'video'|'image' }
  Response 200: { url: String, media_type: String, size_bytes: Number }
  Response 413: { error: "Arquivo muito grande" }  // limite: 50MB
  Response 415: { error: "Tipo não suportado" }
```

#### Tipos e limites aceitos

| Tipo | Formatos | Tamanho máximo |
|---|---|---|
| audio | .mp3, .m4a, .ogg, .webm | 25MB |
| video | .mp4, .webm, .mov | 50MB |
| image | .jpg, .png, .gif, .webp | 10MB |

#### Critérios de aceite
- [ ] Arquivo salvo no MinIO com path `/{type}/{year}/{month}/{uuid}.{ext}`
- [ ] URL retornada é pública e acessível sem autenticação
- [ ] Tipos não suportados rejeitados com 415
- [ ] Arquivos acima do limite rejeitados com 413
- [ ] Arquivo de áudio enviado por usuário pode ser transcrito via STT (Fase 2 — na Fase 1 só armazena)

#### Definição de Pronto
- Upload de arquivo de 20MB completa em < 5s na rede local
- Arquivo acessível via URL retornada imediatamente após upload

---

### MÓDULO 1.7 — Interface Frontend (React)

#### Descrição
Interface de chat estilo Telegram. Sidebar com lista de grupos e PVTs. Painel central com histórico de mensagens e input. Responsivo para desktop e tablet.

#### Componentes principais

```
App
├── AuthProvider (contexto de autenticação)
├── SocketProvider (contexto WebSocket)
└── ChatLayout
    ├── Sidebar
    │   ├── UserProfile (avatar, nome, status)
    │   ├── SearchBar (busca em conversas — Fase 3)
    │   ├── GroupList
    │   │   └── GroupItem (nome, último texto, badge de não-lidos)
    │   └── PvtList
    │       └── PvtItem (avatar, nome, último texto, badge)
    └── ChatPanel
        ├── ChatHeader (nome da conversa, membros, info)
        ├── MessageList (virtualizado para performance)
        │   ├── MessageBubble (user)
        │   ├── MessageBubble (agent — com label do agente)
        │   ├── AudioPlayer (para mensagens de áudio)
        │   └── TypingIndicator (animação "...")
        └── MessageInput
            ├── TextArea (suporte Enter para enviar)
            ├── AudioRecorder (botão de gravar — Fase 2)
            ├── FileAttach (upload de mídia)
            └── SendButton
```

#### Comportamentos de UX obrigatórios

| Comportamento | Especificação |
|---|---|
| Scroll automático | Lista scrolla para o final ao receber nova mensagem, exceto se usuário rolou para cima (scroll lock) |
| Carregamento de histórico | Scroll para o topo carrega 50 mensagens anteriores (infinite scroll reverso) |
| Indicador de não-lidos | Badge numérico na sidebar, desaparece ao abrir a conversa |
| Typing indicator | Aparece em 500ms após início da digitação do agente, desaparece ao receber a mensagem |
| Erro de envio | Mensagem com estado "falhou" + botão de reenviar |
| Offline | Banner amarelo no topo "Sem conexão — tentando reconectar..." |
| Menção @agente | No grupo, @ abre autocomplete com agentes membros (visual apenas — Fase 1) |
| Data separador | Linha com data entre mensagens de dias diferentes |

#### Critérios de aceite
- [ ] Login → lista de grupos/PVTs carrega em < 2s
- [ ] Enviar mensagem e ver resposta completa (texto) em < 12s total
- [ ] Histórico de 500 mensagens renderiza sem travar (lista virtualizada)
- [ ] Interface funcional em Chrome, Firefox, Safari (desktop)
- [ ] Layout não quebra em telas de 1024px a 1920px
- [ ] Áudio enviado tem player com play/pause e barra de progresso

#### Definição de Pronto
- Teste manual do fluxo completo: login → grupo → mensagem → resposta do agente → PVT → mensagem → resposta
- Performance: Lighthouse score ≥ 80 em Performance

---

## 4. FASE 2 — Memória Contextual + Voz

**Duração:** 6–8 semanas  
**Pré-requisito:** Fase 1 completa e validada com usuários reais  
**Objetivo:** Agentes com memória persistente entre sessões. Comunicação por voz (STT entrada + TTS saída).

---

### MÓDULO 2.1 — Motor de Contexto (Orquestrador)

#### Descrição
Serviço background que monitora mensagens dos grupos e mantém o MEMORY.md de cada usuário atualizado. Roda como worker separado via cron ou fila.

#### Estrutura dos arquivos de memória

```markdown
<!-- MEMORY.md — gerado e mantido automaticamente -->
# Memória de {user_name} — Grupos

## Grupo: {group_name} | Topic: {topic}
_Última atualização: {ISO8601}_

### Decisões e posições
- [2026-04-10] Confirmou interesse em migrar para o novo sistema de CRM

### Perguntas frequentes
- [2026-04-08] Perguntou sobre prazo de entrega do módulo de relatórios

### Informações compartilhadas
- [2026-04-05] Mencionou que sua equipe tem 8 pessoas

### Tom e preferências
- Prefere respostas objetivas e com exemplos práticos

---

## Grupo: {outro_grupo}
...
```

```markdown
<!-- HISTORY.md — gerado e mantido automaticamente -->
# Histórico de PVTs de {user_name}

## PVT com Agente: {agent_name} | {agent_slug}

### Sessão: {ISO8601}
**Tema identificado:** {tema}
**Resumo:** {resumo em 2-3 frases do que foi tratado}
**Conclusões/outcomes:** {o que ficou definido ou prometido}

---

### Sessão: {ISO8601}
...
```

#### Processo de atualização do MEMORY.md

```
TRIGGER: Nova mensagem salva no grupo (sender_type = 'user')
DELAY: 5 segundos após a mensagem (para agrupar mensagens consecutivas do mesmo usuário)

1. Ler as últimas 10 mensagens do usuário naquele grupo
2. Chamar OpenClaw (modelo leve) com prompt:
   "Analise estas mensagens e extraia informações relevantes sobre o usuário 
    para categorizar em: decisões/posições, perguntas frequentes, 
    informações compartilhadas, tom/preferências.
    Responda APENAS com JSON: { decisoes: [], perguntas: [], infos: [], tom: [] }
    Retorne somente itens novos que ainda não estão no contexto atual."
3. Ler MEMORY.md atual do usuário
4. Fazer append dos novos itens na seção do grupo correto
5. Salvar MEMORY.md atualizado

REGRA: Nunca sobrescrever entradas existentes. Apenas fazer append.
REGRA: Se MEMORY.md não existe, criar com estrutura base.
REGRA: Máximo 50 itens por categoria por grupo — itens mais antigos são sumarizados.
```

#### Processo de atualização do HISTORY.md

```
TRIGGER: PVT encerrado (sem mensagem por 30 minutos)

1. Ler todas as mensagens da sessão de PVT
2. Chamar OpenClaw com prompt:
   "Resuma esta conversa em 3 campos: 
    tema (1 frase), resumo (2-3 frases), conclusoes (bullet points).
    Responda APENAS com JSON: { tema, resumo, conclusoes: [] }"
3. Fazer append no HISTORY.md do usuário
4. Salvar HISTORY.md atualizado
```

#### Critérios de aceite
- [ ] MEMORY.md atualizado em até 30s após mensagem do usuário no grupo
- [ ] HISTORY.md atualizado em até 5min após inatividade de 30min no PVT
- [ ] Arquivo MEMORY.md criado automaticamente na primeira mensagem do usuário
- [ ] Falha no OpenClaw do orquestrador não afeta a entrega de mensagens (processo independente)
- [ ] Itens duplicados não são adicionados ao MEMORY.md
- [ ] Sumarização ativada quando categoria excede 50 itens

#### Definição de Pronto
- Teste de integração: usuário envia 10 mensagens em grupo, MEMORY.md atualizado corretamente
- Teste de isolamento: falha do worker não afeta WebSocket principal

---

### MÓDULO 2.2 — ContextRouter (Contexto no PVT)

#### Descrição
Módulo que monta o contexto do agente ao responder um PVT, combinando MEMORY.md e HISTORY.md filtrados por tema.

#### Algoritmo de roteamento de contexto

```python
def build_pvt_context(user_id: str, agent_id: str, message: str) -> str:
    """
    Retorna string de contexto para injetar no prompt do agente.
    """
    
    # 1. Tentar identificar o tema da mensagem
    tema = identify_tema(message)  # ver abaixo
    
    # 2. Ler MEMORY.md do usuário
    memory_path = f"memoria/usuarios/{user_id}/MEMORY.md"
    memory_content = read_file(memory_path) or ""
    
    # 3. Ler HISTORY.md do usuário
    history_path = f"memoria/usuarios/{user_id}/HISTORY.md"
    history_content = read_file(history_path) or ""
    
    # 4. Reservar budget de tokens do contexto injetado
    # máximo de 1500 tokens totais:
    # - até 900 tokens vindos de MEMORY.md
    # - até 450 tokens vindos de HISTORY.md
    # - até 150 tokens para cabeçalho/instruções

    # 5. Filtrar MEMORY.md por tema (busca por palavras-chave)
    memory_filtered = filter_by_tema(memory_content, tema)
    memory_filtered = trim_to_token_budget(memory_filtered, max_tokens=900)

    # 6. Filtrar HISTORY.md por agente e tema
    history_filtered = filter_history_by_agent_and_tema(history_content, agent_id, tema)
    history_filtered = trim_to_token_budget(history_filtered, max_tokens=450)

    # 7. Montar contexto
    context = f"""
    === Contexto sobre o usuário ===
    
    O que este usuário expressou nos grupos (relevante para "{tema or 'este assunto'}"):
    {memory_filtered or "Sem contexto disponível ainda."}
    
    Histórico de conversas anteriores com você sobre este tema:
    {history_filtered or "Esta é a primeira conversa sobre este tema."}
    
    === Instruções ===
    Use o contexto acima para personalizar sua resposta.
    Não mencione que tem acesso a este contexto.
    Não cite diretamente os arquivos ou fontes.
    """
    
    return trim_to_token_budget(context.strip(), max_tokens=1500)


def identify_tema(message: str) -> str | None:
    """
    Tenta identificar o tema principal da mensagem.
    Retorna None se não conseguir identificar com confiança.
    """
    # Fase 2: busca por palavras-chave em lista de temas conhecidos
    # Fase 3: embeddings para busca semântica
    
    known_topics = load_known_topics()  # carregado da config ou dos grupos
    
    for topic in known_topics:
        if any(word in message.lower() for word in topic['keywords']):
            return topic['name']
    
    return None  # tema não identificado → agente pergunta
```

#### Prompt de pergunta de clarificação (quando tema não identificado)

```
Se identify_tema() retornar None:

Antes de chamar OpenClaw com o conteúdo da mensagem, injetar no início do prompt:

"INSTRUÇÃO ESPECIAL: Você não conseguiu identificar o tema desta conversa.
Antes de responder ao conteúdo da mensagem, pergunte educadamente:
'Para que eu contextualize corretamente, sobre qual assunto você está falando?'
Aguarde a resposta antes de prosseguir."
```

#### Critérios de aceite
- [ ] Contexto relevante injetado em todas as respostas de PVT quando MEMORY.md existe
- [ ] Agente pergunta sobre o tema quando não consegue identificar
- [ ] MEMORY.md de um usuário nunca é injetado em PVT de outro usuário
- [ ] Contexto de PVT privado nunca vaza para respostas em grupo
- [ ] Filtro por palavras-chave funciona para temas em português
- [ ] Contexto injetado não excede 1500 tokens totais, com budget explícito por fonte

#### Definição de Pronto
- Teste: usuário A discute "vendas" no grupo → abre PVT → agente usa contexto de vendas
- Teste: usuário B (sem MEMORY.md) abre PVT → agente não alucina contexto
- Teste: tema ambíguo → agente pergunta antes de responder

---

### MÓDULO 2.3 — STT: Transcrição de Áudio

#### Descrição
Usuário grava ou envia áudio. Sistema transcreve via Whisper API antes de passar ao agente. A transcrição é exibida junto da mensagem de áudio.

#### Fluxo de transcrição

```
1. Usuário grava áudio no frontend (MediaRecorder API, formato webm)
2. Frontend envia via POST /api/upload (já existente)
3. Backend recebe URL do MinIO
4. Backend chama Whisper API:
   POST https://api.openai.com/v1/audio/transcriptions
   {
     file: <audio file>,
     model: "whisper-1",
     language: "pt",
     response_format: "text"
   }
5. Transcrição retornada em < 5s para áudios de até 60s
6. Mensagem salva com:
   - media_url: URL do áudio original
   - content: transcrição do áudio  ← o agente processa isso
   - media_type: 'audio'
7. No frontend: exibe player de áudio + texto da transcrição abaixo
8. Agente responde ao texto transcrito (não ao áudio)
```

#### Critérios de aceite
- [ ] Áudio de 30s transcrito em < 8s
- [ ] Transcrição exibida abaixo do player de áudio na UI
- [ ] Falha na transcrição retorna mensagem de erro ("Não foi possível transcrever o áudio") sem travar o chat
- [ ] Suporte a português (language: "pt" na chamada Whisper)
- [ ] Áudios maiores que 25MB rejeitados antes de chamar Whisper

#### Definição de Pronto
- Teste com áudio de 30s em português, transcrição com > 90% de acurácia em condição normal
- Teste de falha: API Whisper indisponível → mensagem de erro no chat, não silêncio

---

### MÓDULO 2.4 — TTS: Resposta em Voz

#### Descrição
Agentes com `tts_enabled = true` geram áudio com suas respostas. O áudio é gerado via ElevenLabs ou Google TTS após o texto ser gerado, salvo no MinIO e exibido no chat.

#### Fluxo de geração TTS

```
1. OpenClaw retorna texto da resposta do agente
2. Backend verifica: agente tem tts_enabled = true?
3. Se sim:
   a. Chamar ElevenLabs:
      POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
      Body: { text: response_text, model_id: "eleven_multilingual_v2" }
   b. Receber stream de áudio MP3
   c. Salvar em MinIO: /tts/{year}/{month}/{message_id}.mp3
   d. Atualizar mensagem: SET tts_audio_url = {url}
   e. Emitir WebSocket evento: message_updated { message_id, tts_audio_url }
4. Frontend recebe message_updated e adiciona player de áudio à mensagem
```

#### Critérios de aceite
- [ ] Áudio TTS gerado em < 5s para respostas de até 500 caracteres
- [ ] Áudio aparece na mensagem sem precisar recarregar a página (via WebSocket)
- [ ] TTS desabilitado por padrão — só ativo quando `tts_enabled = true` no agente
- [ ] Falha no TTS não impede entrega da mensagem de texto
- [ ] Usuário pode optar por não ouvir (player não auto-reproduz)

#### Definição de Pronto
- Teste: agente com TTS responde → texto aparece imediatamente → áudio aparece em < 5s
- Teste: ElevenLabs fora do ar → texto entregue normalmente, sem erro visível para usuário

---

## 5. FASE 3 — Maturidade Operacional

**Duração:** 6–8 semanas  
**Pré-requisito:** Fase 2 completa e estável  
**Objetivo:** Sistema pronto para produção completa. Admin panel, busca, relatórios, monitoramento.

---

### MÓDULO 3.1 — Painel de Administração

#### Descrição
Interface web dedicada para gestão da plataforma. Separada da interface de chat. Acessível apenas por admins.

#### Seções do admin panel

```
/admin
├── /dashboard      → métricas gerais (usuários ativos, mensagens/dia, agentes mais usados)
├── /users          → CRUD de usuários + visualizar MEMORY.md e HISTORY.md
├── /agents         → CRUD de agentes + preview da configuração OpenClaw
├── /groups         → lista de grupos + membros + métricas de uso
├── /logs           → log de chamadas ao OpenClaw (agente, latência, tokens, custo estimado)
└── /settings       → configurações globais (STT on/off, TTS on/off, rate limits)
```

#### Critérios de aceite
- [ ] Dashboard carrega em < 3s com dados dos últimos 30 dias
- [ ] Admin pode visualizar MEMORY.md e HISTORY.md de qualquer usuário
- [ ] Log de chamadas OpenClaw mostra: timestamp, agente, tokens usados, latência, status
- [ ] Configurações globais persistidas no banco (não em variáveis de ambiente)

---

### MÓDULO 3.2 — Busca no Histórico

#### Descrição
Usuário pode buscar por palavras-chave em suas conversas (grupos e PVTs).

#### Endpoints

```
GET /api/search?q={query}&type=group|pvt|all&limit=20
Response: [
  {
    message_id: UUID,
    conversation_id: UUID,
    conversation_type: 'group'|'pvt',
    conversation_name: String,
    content: String,          // trecho com highlight da palavra
    sender_name: String,
    created_at: ISO8601
  }
]
```

#### Critérios de aceite
- [ ] Busca retorna resultados em < 2s para histórico de 100k mensagens
- [ ] Full-text search via PostgreSQL `tsvector` + `tsquery` (português)
- [ ] Resultados ordenados por relevância e depois por data DESC
- [ ] Usuário só vê mensagens de suas próprias conversas

---

### MÓDULO 3.3 — Relatórios de Uso

#### Descrição
Relatórios automáticos para o admin sobre uso da plataforma e custo estimado.

#### Relatórios disponíveis

```
GET /api/admin/reports/usage?period=7d|30d|90d
Response: {
  messages_total: Number,
  messages_by_type: { text: N, audio: N, video: N },
  active_users: Number,
  active_agents: Number,
  agent_ranking: [{ agent_name, messages_sent, avg_latency_ms }],
  tts_characters_generated: Number,
  stt_minutes_transcribed: Number,
  estimated_cost_usd: Number
}
```

#### Critérios de aceite
- [ ] Custo estimado calculado com base em tarifas configuráveis
- [ ] Relatório exportável em CSV
- [ ] Dados atualizados a cada 1h (cache Redis)

---

### MÓDULO 3.4 — Sumarização do MEMORY.md

#### Descrição
Worker periódico que sumariza MEMORY.md de usuários com arquivos muito grandes, mantendo contexto relevante sem crescimento ilimitado.

#### Regras de sumarização

```
TRIGGER: MEMORY.md > 10.000 caracteres OU > 50 itens em qualquer categoria

PROCESSO:
1. Ler MEMORY.md completo
2. Para cada grupo, pegar itens com > 60 dias
3. Chamar OpenClaw:
   "Sumarize estes itens em no máximo 3 frases preservando as informações
    mais relevantes sobre o usuário. Responda apenas com o texto sumarizado."
4. Substituir os itens antigos pelo sumário
5. Adicionar nota: "_(sumarizado em {data})_"

LIMITE: MEMORY.md nunca deve exceder 15.000 caracteres
```

#### Critérios de aceite
- [ ] Sumarização não perde informações críticas (decisões e posições são priorizadas)
- [ ] Processo roda em background sem afetar performance do chat
- [ ] Log de sumarizações salvo para auditoria

---

## 6. Contratos de Interface entre Módulos

### 6.1 Backend → OpenClaw

```javascript
// Estrutura padrão de chamada ao OpenClaw
async function callOpenClaw(agent, messages, pvt_context = null) {
  const apiKey = resolveSecret(agent.openclaw_config.api_key_ref);
  const system_prompt = pvt_context
    ? `${agent.openclaw_config.system_prompt}\n\n${pvt_context}`
    : agent.openclaw_config.system_prompt;
  
  const response = await fetch(OPENCLAW_ENDPOINT, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: agent.openclaw_config.model,
      system: system_prompt,
      messages: messages,  // últimas 20 mensagens da conversa
      max_tokens: agent.openclaw_config.max_tokens || 1000,
      temperature: agent.openclaw_config.temperature || 0.7
    })
  });
  
  // Timeout de 10s — se exceder, lança TimeoutError
  // TimeoutError → mensagem de erro no chat: "O agente demorou para responder. Tente novamente."
}
```

Contrato obrigatório:

- `api_key_ref` é o único identificador persistido no banco para credenciais de agente.
- `resolveSecret(ref)` deve falhar de forma explícita e auditável se a variável não existir.
- A API administrativa nunca retorna a chave resolvida, apenas a referência.

### 6.2 Orquestrador → Backend (eventos)

O orquestrador se comunica com o backend via Redis pub/sub:

```
Canal: "memory:updated"
Payload: { user_id: UUID, file: "MEMORY"|"HISTORY", updated_at: ISO8601 }

Canal: "context:requested"  
Payload: { user_id, agent_id, message, request_id }

Canal: "context:ready"
Payload: { request_id, context: String }
```

### 6.3 Admin Settings e Logs Operacionais

Configurações globais e logs operacionais são requisitos de backend, não apenas de interface.

Persistência mínima obrigatória:

```sql
CREATE TABLE system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

CREATE TABLE openclaw_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  conversation_type VARCHAR(5) CHECK (conversation_type IN ('group', 'pvt')),
  conversation_id UUID,
  request_id UUID NOT NULL,
  model VARCHAR(100) NOT NULL,
  latency_ms INTEGER,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  estimated_cost_usd NUMERIC(12, 6),
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'timeout', 'error')),
  error_code VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Endpoints mínimos obrigatórios:

```
GET    /api/admin/settings
PUT    /api/admin/settings
GET    /api/admin/logs/openclaw?agent_id=&status=&limit=100
```

---

## 7. Critérios de Qualidade Globais

### 7.1 Performance
- API endpoints: P95 < 300ms (exceto chamadas que envolvem OpenClaw)
- WebSocket: mensagem entregue em < 500ms entre usuários
- Frontend: First Contentful Paint < 2s em conexão de 10Mbps

### 7.2 Segurança
- Todas as rotas autenticadas com JWT (exceto /auth/login)
- CORS configurado para domínios específicos (não wildcard em produção)
- Uploads: validação de MIME type real (não só extensão)
- SQL: queries parametrizadas, sem concatenação de strings
- Logs: nunca logar tokens, senhas ou conteúdo de mensagens privadas

### 7.3 Resiliência
- OpenClaw fora do ar: mensagem de erro no chat, sistema continua funcionando
- ElevenLabs fora do ar: texto entregue sem áudio, sem erro visível
- Whisper fora do ar: mensagem de erro específico ("Transcrição indisponível")
- MinIO fora do ar: uploads bloqueados com mensagem, mensagens de texto continuam

### 7.4 Observabilidade
- Logs estruturados em JSON (timestamp, level, service, event, metadata)
- Métricas de latência por endpoint e por agente
- Alertas quando OpenClaw retorna erro > 5 vezes em 1 minuto

---

## 8. Casos de Borda Documentados

| Cenário | Comportamento esperado |
|---|---|
| Agente mencionado em grupo sem @slug | Agente não responde (aguarda menção explícita) — configurável por grupo |
| Dois usuários enviam mensagem ao mesmo tempo | Ambas processadas; agente responde sequencialmente |
| Usuário envia 10 mensagens seguidas rapidamente | Agente agrupa e responde uma vez (debounce de 3s) |
| MEMORY.md corrompido | Orquestrador cria novo arquivo limpo, loga o erro |
| OpenClaw retorna resposta vazia | Mensagem de erro: "O agente não conseguiu gerar uma resposta" |
| Upload de arquivo com MIME forjado | Rejeitado com 415 após validação real do conteúdo |
| Usuário deletado com mensagens no grupo | Mensagens preservadas, sender_name = "Usuário removido" |
| Agente desativado com PVTs abertos | PVT exibe banner: "Este agente está temporariamente indisponível" |

---
