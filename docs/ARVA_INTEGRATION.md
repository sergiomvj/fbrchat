# ARVA <-> FBR CHAT Integration Specification

## Objetivo

Permitir que o ARVA:

1. provisione agentes no FBR CHAT usando o identificador oficial do agente
2. mantenha esses agentes sincronizados com seus metadados reais
3. abra o chat direto do agente a partir dos cards do ARVA
4. preserve uma base técnica sólida para evoluir o chat com tarefas, agendamentos, ações estruturadas e integrações futuras

## Decisão de arquitetura

### Identidade canônica do agente

- O ARVA gera e controla o `fbrchat_id` do agente.
- O FBR CHAT usa esse `fbrchat_id` como `agents.id`.
- O `fbrchat_id` é a identidade canônica do agente dentro do FBR CHAT.
- Usuários humanos continuam no fluxo normal de cadastro e autenticação em `users`.
- Agentes virtuais não criam registros em `users`. Eles existem apenas em `agents`.

### Por que esse desenho é o correto

Esse desenho evita mapeamentos frágeis por `name`, `slug` ou `provider_agent_id`.

Ele também prepara o sistema para evoluir o chat além de texto, porque tudo passa a orbitar uma entidade estável:

- tarefas podem ser atribuídas ao `agent_id`
- agendamentos podem ser vinculados ao `agent_id`
- automações de follow-up podem ser disparadas por `agent_id`
- logs, memória e histórico continuam coerentes mesmo se nome, slug ou provider mudarem

Em outras palavras: o card do ARVA não deve “inventar” a conversa. Ele deve sempre resolver o agente oficial e abrir o PVT oficial.

---

## Fluxo recomendado de integração

### Fluxo 1: provisionamento do agente

Sempre que um agente for criado ou alterado no ARVA:

1. o ARVA chama `POST /api/integrations/arva/agents/upsert`
2. o FBR CHAT cria ou atualiza o agente local
3. o ARVA guarda que esse agente já está provisionado no chat

### Fluxo 2: abertura do chat pelo card

Quando o usuário clicar em `Chat` no card do agente no ARVA:

1. o ARVA garante que o agente está provisionado
2. o ARVA chama `POST /api/integrations/arva/chat/open`
3. o FBR CHAT cria ou reaproveita o PVT canônico
4. o ARVA redireciona o usuário para a URL do chat com o `pvt_id`

Esse é o fluxo ideal porque separa:

- provisionamento de identidade e metadados
- resolução da conversa correta
- navegação do usuário

---

## Endpoint 1: provisionar ou atualizar agente

### Rota

`POST /api/integrations/arva/agents/upsert`

### Autenticação

Headers obrigatórios:

- `Authorization: Bearer <ARVA_SHARED_TOKEN>`
- `X-Idempotency-Key: <request-id-unico>`

### Payload recomendado

```json
{
  "fbrchat_id": "agt_37402cbba8fc461fa9ed23ec8a4532d0",
  "arva_agent_id": "arva_92341",
  "provider": "openclaw",
  "provider_agent_id": "oclw_agent_987",
  "company_slug": "fbr-holding",
  "name": "Raissa Almenda",
  "slug": "raissa-almenda",
  "avatar_url": "https://arva.example/avatar/raissa.png",
  "description": "Agente comercial especializada em follow-up e pipeline.",
  "status": "active",
  "tts_enabled": true,
  "tts_voice_id": "pt-br-01",
  "openclaw_config": {
    "model": "claude-3-5-sonnet",
    "system_prompt": "Voce e a agente Raissa Almenda.",
    "temperature": 0.3,
    "max_tokens": 1200,
    "api_key_ref": "OPENCLAW_RAISSA_KEY"
  }
}
```

### Regras do payload

Campos obrigatórios:

- `fbrchat_id`
- `arva_agent_id`
- `provider`
- `provider_agent_id`
- `company_slug`
- `name`
- `slug`
- `status`
- `openclaw_config.model`
- `openclaw_config.system_prompt`
- `openclaw_config.api_key_ref`

Campos opcionais:

- `avatar_url`
- `description`
- `tts_enabled`
- `tts_voice_id`
- `openclaw_config.temperature`
- `openclaw_config.max_tokens`

### Comportamento esperado

- se `fbrchat_id` não existir, o FBR CHAT cria o agente com esse ID
- se `fbrchat_id` já existir, o FBR CHAT atualiza os campos mutáveis
- se o `slug` já estiver em uso por outro agente, o FBR CHAT retorna conflito
- a operação deve ser idempotente do ponto de vista funcional

### Resposta esperada

```json
{
  "agent_id": "agt_37402cbba8fc461fa9ed23ec8a4532d0",
  "status": "created"
}
```

ou

```json
{
  "agent_id": "agt_37402cbba8fc461fa9ed23ec8a4532d0",
  "status": "updated"
}
```

### Quando o ARVA deve chamar esse endpoint

- criação do agente
- mudança de nome
- mudança de slug
- mudança de empresa
- mudança de avatar
- mudança de configuração do provider
- ativação ou desativação do agente

Esse endpoint deve ser tratado pelo ARVA como a fonte oficial de sincronização do agente no FBR CHAT.

---

## Endpoint 2: abrir chat do agente

### Rota

`POST /api/integrations/arva/chat/open`

### Autenticação

Headers obrigatórios:

- `Authorization: Bearer <ARVA_SHARED_TOKEN>`
- `X-Idempotency-Key: <request-id-unico>`

### Payload

```json
{
  "fbrchat_id": "agt_37402cbba8fc461fa9ed23ec8a4532d0",
  "human_user_id": "f01ab565-86a7-4f30-9ea6-f83f13f63b43"
}
```

### Comportamento esperado

- localizar o agente em `agents.id = fbrchat_id`
- localizar o usuário humano por `human_user_id`
- criar ou reaproveitar o PVT canônico entre o humano e o agente
- retornar o `pvt_id`

### Resposta esperada

```json
{
  "agent_id": "agt_37402cbba8fc461fa9ed23ec8a4532d0",
  "pvt_id": "4cd5381c-fffc-401d-b10c-89dea57946ae",
  "is_new": false
}
```

### Regra importante

O card do ARVA não deve montar a conversa sozinho por heurística.

O ARVA deve sempre:

1. resolver o PVT via API
2. usar o `pvt_id` retornado

Isso garante que:

- a conversa aberta é a correta
- a idempotência é preservada
- a mesma conversa será reutilizada em reaberturas futuras

---

## URL ideal para o card do ARVA

### Regra

O ARVA não deve montar a URL usando `fbrchat_id` diretamente.

O ARVA deve:

1. chamar `POST /api/integrations/arva/chat/open`
2. ler o `pvt_id` retornado
3. redirecionar o usuário para:

```text
/chat?pvt_id=<pvt_id>
```

### Exemplo

Se o retorno for:

```json
{
  "agent_id": "agt_37402cbba8fc461fa9ed23ec8a4532d0",
  "pvt_id": "4cd5381c-fffc-401d-b10c-89dea57946ae",
  "is_new": false
}
```

o redirect ideal é:

```text
https://fbrchat.seudominio.com/chat?pvt_id=4cd5381c-fffc-401d-b10c-89dea57946ae
```

### Por que essa URL é a melhor

- desacopla o frontend do conceito de “resolver agente por ID”
- deixa o FBR CHAT responsável pela conversa canônica
- permite mudar a lógica de roteamento interno sem quebrar os cards do ARVA
- facilita incluir contexto, permissões, ações futuras e deep-links mais ricos

---

## Por que integrar “do jeito difícil” agora

Essa escolha é tecnicamente correta porque o chat não vai ficar restrito a mensagens.

Se vocês querem evoluir para:

- tarefas
- agendamentos
- lembretes
- comandos estruturados
- follow-ups automáticos
- ações contextuais dentro do chat

então o ARVA precisa integrar com o FBR CHAT em nível de identidade e conversa, e não apenas com um link superficial.

Com o fluxo proposto:

- o agente tem identidade oficial no FBR CHAT
- o PVT tem identidade oficial no FBR CHAT
- o card do ARVA passa a apontar para uma conversa persistente
- a conversa vira um contêiner natural para tarefas, agendas, ações e histórico

Essa é a base correta para transformar o chat em uma superfície operacional real, e não apenas uma janela de texto.

---

## Regras de segurança

- o ARVA nunca envia segredo bruto do provedor
- o ARVA envia apenas `api_key_ref`
- a autenticação deve ser server-to-server com token compartilhado
- o ARVA não deve expor esse token no navegador
- o ideal é que a chamada para `upsert` e `chat/open` seja feita no backend do ARVA

---

## Regras de UX para o botão Chat no ARVA

- antes de abrir o chat, garantir que o agente está provisionado
- se o `upsert` falhar, não redirecionar
- se o `chat/open` falhar, mostrar erro operacional claro
- se o `chat/open` funcionar, redirecionar para `/chat?pvt_id=...`

Fluxo recomendado no card:

1. `agents/upsert`
2. `chat/open`
3. redirect para `/chat?pvt_id=...`

---

## Fluxo resumido para o time do ARVA

### Provisionar agente

```text
POST /api/integrations/arva/agents/upsert
```

### Abrir chat

```text
POST /api/integrations/arva/chat/open
```

### Redirecionar

```text
/chat?pvt_id=<pvt_id>
```

---

## Situação atual no projeto

Hoje o backend do FBR CHAT já implementa:

- `POST /api/integrations/arva/agents/upsert`
- `POST /api/integrations/arva/chat/open`

Além disso, o frontend já aceita abertura direta por:

```text
/chat?pvt_id=<pvt_id>
```

Ou seja: o contrato principal já existe e já pode ser consumido pelo ARVA.
