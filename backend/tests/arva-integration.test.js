import test, { beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { memoryStore } from "../src/store/memory-store.js";

let server;
let baseUrl;

beforeEach(async () => {
  memoryStore.reset();

  if (!server) {
    server = createApp().listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  }
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
});

function integrationHeaders() {
  return {
    Authorization: "Bearer replace-me-arva",
    "Content-Type": "application/json",
    "X-Idempotency-Key": crypto.randomUUID()
  };
}

function richAgentPayload(overrides = {}) {
  return {
    fbrchat_id: "33333333-3333-3333-3333-333333333333",
    arva_agent_id: "arva_001",
    provider: "openclaw",
    provider_agent_id: "oclw_arva_001",
    status: "active",
    identity: {
      name: "Agente ARVA",
      slug: "agente-arva",
      avatar_url: null,
      role: "SDR Senior",
      company_slug: "fbr-holding",
      owner_company_id: "owner-001",
      owner_company_name: "FBR Leads"
    },
    persona: {
      short_description: "Provisionado pelo ARVA",
      perfil_geral: "Agente comercial experiente.",
      objetivo: "Qualificar oportunidades.",
      responsabilidades: ["qualificar leads"],
      competencias_centrais: ["follow-up"],
      tom: "profissional",
      tags: ["comercial"]
    },
    runtime: {
      model: "claude-3-5-sonnet",
      system_prompt: "Voce e o agente ARVA",
      tts_enabled: true,
      tts_voice_id: "pt-br-01",
      openclaw_config: {
        model: "claude-3-5-sonnet",
        system_prompt: "Voce e o agente ARVA",
        temperature: 0.3,
        max_tokens: 1200,
        api_key_ref: "OPENCLAW_ARVA_KEY"
      }
    },
    performance: {
      score: 87,
      tier: "A"
    },
    ...overrides
  };
}

test("ARVA can provision a new agent using fbrchat_id as canonical id", async () => {
  const response = await fetch(`${baseUrl}/api/integrations/arva/agents/upsert`, {
    method: "POST",
    headers: integrationHeaders(),
    body: JSON.stringify(richAgentPayload())
  });

  const body = await response.json();
  const agent = memoryStore.findAgentById(body.agent_id);

  assert.equal(response.status, 200);
  assert.equal(body.agent_id, "33333333-3333-3333-3333-333333333333");
  assert.equal(body.status, "created");
  assert.equal(agent?.arva_agent_id, "arva_001");
  assert.equal(agent?.role, "SDR Senior");
  assert.equal(agent?.performance_profile?.tier, "A");
});

test("ARVA upsert updates an existing provisioned agent", async () => {
  await fetch(`${baseUrl}/api/integrations/arva/agents/upsert`, {
    method: "POST",
    headers: integrationHeaders(),
    body: JSON.stringify(richAgentPayload({
      fbrchat_id: "44444444-4444-4444-4444-444444444444",
      arva_agent_id: "arva_002",
      provider_agent_id: "oclw_arva_002",
      identity: {
        name: "Agente ARVA 2",
        slug: "agente-arva-2",
        avatar_url: null,
        role: "SDR",
        company_slug: "fbr-holding",
        owner_company_id: "owner-001",
        owner_company_name: "FBR Leads"
      },
      runtime: {
        model: "claude-3-5-sonnet",
        system_prompt: "Inicial",
        tts_enabled: false,
        tts_voice_id: null,
        openclaw_config: {
          model: "claude-3-5-sonnet",
          system_prompt: "Inicial",
          api_key_ref: "OPENCLAW_ARVA_KEY"
        }
      }
    }))
  });

  const response = await fetch(`${baseUrl}/api/integrations/arva/agents/upsert`, {
    method: "POST",
    headers: integrationHeaders(),
    body: JSON.stringify(richAgentPayload({
      fbrchat_id: "44444444-4444-4444-4444-444444444444",
      arva_agent_id: "arva_002",
      provider_agent_id: "oclw_arva_002",
      status: "inactive",
      identity: {
        name: "Agente ARVA 2 Atualizado",
        slug: "agente-arva-2",
        avatar_url: null,
        role: "Closer",
        company_slug: "global-tech",
        owner_company_id: "owner-002",
        owner_company_name: "Global Tech"
      },
      runtime: {
        model: "claude-3-5-sonnet",
        system_prompt: "Atualizado",
        tts_enabled: true,
        tts_voice_id: "voice-002",
        openclaw_config: {
          model: "claude-3-5-sonnet",
          system_prompt: "Atualizado",
          api_key_ref: "OPENCLAW_ARVA_KEY"
        }
      }
    }))
  });

  const body = await response.json();
  const agent = memoryStore.findAgentById("44444444-4444-4444-4444-444444444444");

  assert.equal(response.status, 200);
  assert.equal(body.status, "updated");
  assert.equal(agent?.name, "Agente ARVA 2 Atualizado");
  assert.equal(agent?.is_active, false);
  assert.equal(agent?.company_id, "22222222-2222-2222-2222-222222222222");
  assert.equal(agent?.role, "Closer");
});

test("ARVA can open direct chat with provisioned agent and receives canonical pvt", async () => {
  await fetch(`${baseUrl}/api/integrations/arva/agents/upsert`, {
    method: "POST",
    headers: integrationHeaders(),
    body: JSON.stringify({
      fbrchat_id: "55555555-5555-5555-5555-555555555555",
      arva_agent_id: "arva_003",
      provider: "openclaw",
      provider_agent_id: "oclw_arva_003",
      company_slug: "fbr-holding",
      name: "Agente ARVA Chat",
      slug: "agente-arva-chat",
      status: "active",
      tts_enabled: false,
      tts_voice_id: null,
      openclaw_config: {
        model: "claude-3-5-sonnet",
        system_prompt: "Chat",
        api_key_ref: "OPENCLAW_ARVA_KEY"
      }
    })
  });

  const firstResponse = await fetch(`${baseUrl}/api/integrations/arva/chat/open`, {
    method: "POST",
    headers: integrationHeaders(),
    body: JSON.stringify({
      fbrchat_id: "55555555-5555-5555-5555-555555555555",
      human_user_id: "f01ab565-86a7-4f30-9ea6-f83f13f63b43"
    })
  });
  const firstBody = await firstResponse.json();

  const secondResponse = await fetch(`${baseUrl}/api/integrations/arva/chat/open`, {
    method: "POST",
    headers: integrationHeaders(),
    body: JSON.stringify({
      fbrchat_id: "55555555-5555-5555-5555-555555555555",
      human_user_id: "f01ab565-86a7-4f30-9ea6-f83f13f63b43"
    })
  });
  const secondBody = await secondResponse.json();

  assert.equal(firstResponse.status, 200);
  assert.equal(secondResponse.status, 200);
  assert.equal(firstBody.agent_id, "55555555-5555-5555-5555-555555555555");
  assert.equal(firstBody.is_new, true);
  assert.equal(secondBody.is_new, false);
  assert.equal(firstBody.pvt_id, secondBody.pvt_id);
});
