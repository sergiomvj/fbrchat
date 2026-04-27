# RFC: Integracao ARVA -> FBR CHAT para Provisionamento e Abertura de Chat de Agentes

## Status

Proposta para alinhamento entre os times ARVA e FBR CHAT.

## Objetivo

Definir o contrato oficial para:

1. identificar agentes do ARVA dentro do FBR CHAT
2. provisionar e sincronizar agentes por `fbrchat_id`
3. abrir o chat correto do agente a partir dos cards do ARVA
4. preparar a base para extensoes futuras no chat, como tarefas, agendamentos e acoes contextuais

---

## 1. Decisao principal de identidade

### Proposta

Cada agente do ARVA tera um `fbrchat_id`, tratado como identificador canonico no FBR CHAT.

### Regra

- `fbrchat_id` deve ser:
  - estavel
  - unico
  - permanente
  - nao reutilizavel
  - imutavel apos provisionamento
- no FBR CHAT:
  - `agents.id = fbrchat_id`

### Motivacao

Essa decisao elimina ambiguidade por `name`, `slug` ou `provider_agent_id` e cria uma base solida para:
- PVTs persistentes
- memoria
- logs
- tarefas
- agendamentos
- automacoes futuras

---

## 2. Modelo de integracao desejado

Queremos suportar dois fluxos complementares.

### 2.1. Fluxo oficial de sincronizacao

O ARVA envia os dados do agente ao FBR CHAT por API.

Endpoint atual no FBR CHAT:

```http
POST /api/integrations/arva/agents/upsert
```

Esse fluxo deve ser usado para:
- criacao de agente
- alteracao de metadados
- ativacao/desativacao
- sincronizacao oficial do estado do agente

### 2.2. Fluxo de inclusao por ID

Queremos suportar no FBR CHAT um fluxo simples de admin:

- o usuario informa um `fbrchat_id`
- o FBR CHAT resolve os dados do agente
- o agente e materializado localmente

Para isso, precisamos definir com o time do ARVA uma forma oficial de resolucao por ID.

### Proposta preferida

O ARVA expoe um endpoint que devolve o retrato completo do agente a partir do `fbrchat_id`.

Exemplo:

```http
POST /api/integrations/fbrchat/resolve-agent
Content-Type: application/json

{
  "fbrchat_id": "agt_..."
}
```

Resposta:

```json
{
  "fbrchat_id": "agt_...",
  "arva_agent_id": "...",
  "provider": "openclaw",
  "provider_agent_id": "...",
  "status": "active",
  "identity": { ... },
  "persona": { ... },
  "runtime": { ... },
  "performance": { ... }
}
```

### Motivo da preferencia

Esse desenho evita que o FBR CHAT dependa diretamente do schema interno do banco do ARVA e permite que o ARVA mantenha controle total da composicao dos dados.

---

## 3. Payload canonico do agente

Recebemos a proposta de payload rico estruturado em quatro blocos:

- `identity`
- `persona`
- `runtime`
- `performance`

Consideramos essa direcao correta.

### 3.1. Campos obrigatorios na v1

Propomos como obrigatorios:

- `fbrchat_id`
- `arva_agent_id`
- `provider`
- `provider_agent_id`
- `status`
- `identity.name`
- `identity.slug`
- `identity.company_slug`
- `identity.owner_company_id`
- `identity.owner_company_name`
- `persona.short_description`
- `persona.perfil_geral`
- `persona.objetivo`
- `persona.responsabilidades`
- `persona.competencias_centrais`
- `persona.tom`
- `persona.tags`
- `runtime.model`
- `runtime.system_prompt`
- `runtime.openclaw_config.api_key_ref`

### 3.2. Campos desejaveis logo em seguida

- `identity.avatar_url`
- `identity.role`
- `persona.nao_responsavel_por`
- `persona.assuntos_domina`
- `persona.sob_pressao`
- `persona.jamais_faria`
- `runtime.fallback_model`
- `runtime.skills_enabled`
- `runtime.channels`
- `runtime.tts_enabled`
- `runtime.tts_voice_id`
- `runtime.the_call_version_id`
- `runtime.memory_files_version`
- `performance.score`
- `performance.tier`
- `performance.badges`
- `performance.strengths`
- `performance.risks`

---

## 4. Regras de contrato que precisam ser alinhadas

### 4.1. Fonte canonica do `system_prompt`

Hoje a proposta contem:
- `runtime.system_prompt`
- `runtime.openclaw_config.system_prompt`

Precisamos alinhar uma unica fonte canonica.

### Recomendacao

Usar:
- `runtime.system_prompt` como campo canonico
- `openclaw_config` como bloco tecnico de execucao

### 4.2. Semantica de campos proximos

Precisamos de confirmacao do time do ARVA sobre a diferenca entre:
- `identity.role`
- `persona.arva_line`

E tambem sobre:
- `identity.company_slug`
- `identity.owner_company_id`
- `identity.owner_company_name`

Queremos garantir que o FBR CHAT nao consuma esses campos com interpretacao errada.

---

## 5. Abertura do chat a partir do card do ARVA

### Regra

O card do ARVA nao deve construir a conversa diretamente a partir do `fbrchat_id`.

O fluxo correto deve ser:

1. garantir que o agente esta provisionado/sincronizado
2. chamar o endpoint do FBR CHAT:

```http
POST /api/integrations/arva/chat/open
```

3. receber:

```json
{
  "agent_id": "agt_...",
  "pvt_id": "uuid-ou-id-do-pvt",
  "is_new": false
}
```

4. redirecionar o usuario para:

```text
/chat?pvt_id=<pvt_id>
```

### Motivacao

Esse fluxo:
- preserva idempotencia
- garante o PVT canonico
- desacopla o frontend do ARVA da logica interna de conversa do FBR CHAT
- facilita a evolucao futura da entidade "conversa"

---

## 6. Motivo arquitetural para aprofundar a integracao agora

A decisao de fazer uma integracao mais rica neste momento nao e cosmetica.

Ela e necessaria porque o FBR CHAT devera evoluir para suportar, por conversa e por agente:
- tarefas
- agendamentos
- lembretes
- acoes estruturadas
- automacoes
- handoff operacional
- memoria contextual

Para isso, o agente precisa existir no FBR CHAT como entidade real, com identidade estavel e metadados suficientes para operacao.

---

## 7. O que ja existe hoje no FBR CHAT

Atualmente o FBR CHAT ja suporta:
- `POST /api/integrations/arva/agents/upsert`
- `POST /api/integrations/arva/chat/open`
- abertura do frontend por:

```text
/chat?pvt_id=<pvt_id>
```

Tambem ja existe fluxo de inclusao manual por `fbrchat_id` no admin, mas hoje ele cria defaults locais. A evolucao desejada e que esse fluxo possa resolver os dados reais do ARVA.

---

## 8. Decisoes que precisamos do time do ARVA

Precisamos de confirmacao explicita sobre:

1. `fbrchat_id` pode ser tratado como ID canonico e imutavel?
2. qual endpoint o ARVA prefere expor para resolucao por `fbrchat_id`?
3. quais campos do payload rico sao obrigatorios na primeira versao?
4. qual e a fonte canonica do `system_prompt`?
5. qual e a semantica oficial de:
   - `role`
   - `arva_line`
   - `company_slug`
   - `owner_company_id`
   - `owner_company_name`

---

## 9. Recomendacao final do time FBR CHAT

Nossa recomendacao e:

- adotar `fbrchat_id` como identidade canonica do agente
- manter `agents/upsert` como fluxo oficial de sincronizacao
- expor no ARVA um endpoint de resolucao por `fbrchat_id`
- usar `chat/open` como resolvedor oficial de conversa
- usar `/chat?pvt_id=<pvt_id>` como URL final para os cards

---

Se voce quiser, eu tambem posso te devolver isso em uma segunda versao ainda mais curta, em tom de mensagem de alinhamento executivo para WhatsApp ou Slack.
