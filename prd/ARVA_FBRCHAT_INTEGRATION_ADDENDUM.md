# ARVA -> FBR CHAT Addendum

## Decisao de Arquitetura

- O ARVA gera o `fbrchat_id` do agente.
- O FBR CHAT usa `fbrchat_id` como `agents.id`.
- Usuarios humanos continuam no fluxo normal de cadastro em `users`.
- Agentes virtuais nao criam registros em `users`.

## Provisionamento

Endpoint de provisionamento idempotente:

- `POST /api/integrations/arva/agents/upsert`

Responsabilidade:

- criar ou atualizar o registro do agente em `agents`
- persistir referencias externas como `arva_agent_id` e `provider_agent_id`
- manter `api_key_ref` como referencia, nunca como segredo bruto

## Abertura de Chat

Endpoint para o botao de chat no ARVA:

- `POST /api/integrations/arva/chat/open`

Responsabilidade:

- localizar o agente por `fbrchat_id`
- localizar o usuario humano por `human_user_id`
- criar ou reaproveitar o PVT canonico entre humano e agente
- retornar `pvt_id`
