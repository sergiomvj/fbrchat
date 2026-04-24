# ARVA -> FBR CHAT Integration Contract

## Objetivo

Permitir que o ARVA provisione agentes automaticamente no FBR CHAT e abra um chat direto com o agente a partir do card do ARVA.

## Regra Central

- O ARVA gera o `fbrchat_id` do agente.
- O FBR CHAT usa esse `fbrchat_id` como `agents.id`.
- Usuarios humanos continuam seguindo o fluxo normal de cadastro em `users`.
- Agentes virtuais nao criam usuarios humanos fake. Eles existem apenas em `agents`.

## O que o ARVA precisa fazer

### 1. Gerar um identificador estavel por agente

Cada agente do ARVA deve possuir um `fbrchat_id` estavel e permanente.

Regras:

- nao reutilizar `fbrchat_id`
- nao mudar `fbrchat_id` depois de provisionado
- usar formato string/UUID compativel com o contrato interno do FBR CHAT

### 2. Provisionar ou atualizar o agente no FBR CHAT

Endpoint esperado:

`POST /api/integrations/arva/agents/upsert`

Headers:

- `Authorization: Bearer <ARVA_SHARED_TOKEN>`
- `X-Idempotency-Key: <valor-unico-por-requisicao>`

Payload minimo:

```json
{
  "fbrchat_id": "agt_01jsh8m8m3j5l8x2p9k4n7qz1r",
  "arva_agent_id": "arva_92341",
  "provider": "openclaw",
  "provider_agent_id": "oclw_agent_987",
  "company_slug": "fbr-holding",
  "name": "Agente ARVA",
  "slug": "agente-arva",
  "avatar_url": null,
  "description": "Agente comercial integrado ao ARVA",
  "tts_enabled": true,
  "tts_voice_id": "pt-br-01",
  "status": "active",
  "openclaw_config": {
    "model": "claude-3-5-sonnet",
    "system_prompt": "Voce e o agente ARVA...",
    "temperature": 0.3,
    "max_tokens": 1200,
    "api_key_ref": "OPENCLAW_ARVA_KEY"
  }
}
```

Comportamento esperado:

- se `fbrchat_id` nao existir, o FBR CHAT cria o agente com esse ID
- se `fbrchat_id` ja existir, o FBR CHAT faz update dos campos mutaveis
- o endpoint deve ser idempotente

Resposta esperada:

```json
{
  "agent_id": "agt_01jsh8m8m3j5l8x2p9k4n7qz1r",
  "status": "created"
}
```

ou

```json
{
  "agent_id": "agt_01jsh8m8m3j5l8x2p9k4n7qz1r",
  "status": "updated"
}
```

### 3. Abrir chat direto com o agente a partir do card do ARVA

Endpoint esperado:

`POST /api/integrations/arva/chat/open`

Headers:

- `Authorization: Bearer <ARVA_SHARED_TOKEN>`
- `X-Idempotency-Key: <valor-unico-por-requisicao>`

Payload:

```json
{
  "fbrchat_id": "agt_01jsh8m8m3j5l8x2p9k4n7qz1r",
  "human_user_id": "f01ab565-86a7-4f30-9ea6-f83f13f63b43"
}
```

Comportamento esperado:

- localizar o agente em `agents.id = fbrchat_id`
- localizar o usuario humano por `human_user_id`
- criar ou reaproveitar o PVT canonico entre o humano e o agente
- retornar `pvt_id`

Resposta esperada:

```json
{
  "agent_id": "agt_01jsh8m8m3j5l8x2p9k4n7qz1r",
  "pvt_id": "0fdd3dd8-fcd3-455e-9246-109c0b1538d6",
  "is_new": false
}
```

### 4. Sincronizacao recomendada

O ARVA deve chamar o endpoint de upsert:

- quando um agente for criado
- quando nome, slug, empresa ou configuracao forem alterados
- quando o agente for desativado

## Campos que o ARVA deve tratar como obrigatorios

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

## Regras de seguranca

- o ARVA nunca envia a chave real do provedor
- o ARVA envia apenas `api_key_ref`
- a autenticacao entre ARVA e FBR CHAT deve ser server-to-server com token compartilhado

## Regras de UX para o botao Chat

- antes de abrir o chat, o ARVA deve garantir que o agente ja foi provisionado no FBR CHAT
- se o upsert falhar, nao redirecionar para o chat
- se o `chat/open` retornar sucesso, redirecionar o usuario para o chat do FBR CHAT com o `pvt_id` retornado
