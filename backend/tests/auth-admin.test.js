import test, { beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { memoryStore } from "../src/store/memory-store.js";
import { createMessageGateway } from "../src/socket/message-gateway.js";

let server;
let baseUrl;
const originalFetch = global.fetch;

beforeEach(async () => {
  memoryStore.reset();

  if (!server) {
    const io = {
      events: [],
      to(room) {
        return {
          emit(event, payload) {
            io.events.push({ room, event, payload });
          }
        };
      }
    };

    server = createApp(createMessageGateway(io)).listen(0);
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

async function login(email, password) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  return {
    status: response.status,
    body: await response.json()
  };
}

test("login succeeds for seeded admin", async () => {
  const response = await login("admin@fbr.local", "admin123");

  assert.equal(response.status, 200);
  assert.equal(response.body.user.role, "admin");
  assert.ok(response.body.access_token);
  assert.ok(response.body.refresh_token);
});

test("invalid login is rejected", async () => {
  const response = await login("admin@fbr.local", "wrong-password");

  assert.equal(response.status, 401);
  assert.equal(response.body.error, "Credenciais invalidas");
});

test("non-admin cannot access admin routes", async () => {
  const loginResponse = await login("joao@fbr.local", "user123");

  const response = await fetch(`${baseUrl}/api/admin/users`, {
    headers: {
      Authorization: `Bearer ${loginResponse.body.access_token}`
    }
  });

  const body = await response.json();

  assert.equal(response.status, 403);
  assert.equal(body.error, "Admin access required");
});

test("admin can list users", async () => {
  const loginResponse = await login("admin@fbr.local", "admin123");

  const response = await fetch(`${baseUrl}/api/admin/users`, {
    headers: {
      Authorization: `Bearer ${loginResponse.body.access_token}`
    }
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.length, 2);
});

test("creating user with duplicate email is rejected", async () => {
  const loginResponse = await login("admin@fbr.local", "admin123");

  const response = await fetch(`${baseUrl}/api/admin/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${loginResponse.body.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: "Another Admin",
      email: "admin@fbr.local",
      password: "admin123",
      role: "admin"
    })
  });

  const body = await response.json();

  assert.equal(response.status, 409);
  assert.equal(body.error, "Email ja cadastrado");
});

test("creating agent with incomplete config is rejected", async () => {
  const loginResponse = await login("admin@fbr.local", "admin123");

  const response = await fetch(`${baseUrl}/api/admin/agents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${loginResponse.body.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: "Agente Incompleto",
      slug: "incompleto",
      company_id: "11111111-1111-1111-1111-111111111111",
      openclaw_config: {
        model: "claude-3-5-sonnet"
      }
    })
  });

  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, "openclaw_config incompleto");
});

test("admin can filter agents by company", async () => {
  const loginResponse = await login("admin@fbr.local", "admin123");

  const response = await fetch(
    `${baseUrl}/api/admin/agents?company_slug=fbr-holding`,
    {
      headers: {
        Authorization: `Bearer ${loginResponse.body.access_token}`
      }
    }
  );

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.length, 2);
  assert.ok(body.every((agent) => agent.company_slug === "fbr-holding"));
});

test("admin can include agent by fbrchat_id with defaults", async () => {
  const loginResponse = await login("admin@fbr.local", "admin123");

  const response = await fetch(`${baseUrl}/api/admin/agents/include-by-id`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${loginResponse.body.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      fbrchat_id: "agt_37402cbba8fc461fa9ed23ec8a4532d0"
    })
  });

  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.status, "created");
  assert.equal(body.agent.id, "agt_37402cbba8fc461fa9ed23ec8a4532d0");
  assert.equal(body.agent.provider_agent_id, "agt_37402cbba8fc461fa9ed23ec8a4532d0");
  assert.equal(body.agent.company_slug, "fbr-holding");
});

test("admin can include agent by fbrchat_id using ARVA resolve-agent payload", async () => {
  const loginResponse = await login("admin@fbr.local", "admin123");
  const previousApiUrl = process.env.ARVA_API_URL;
  const previousToken = process.env.ARVA_FBRCHAT_SHARED_TOKEN;

  process.env.ARVA_API_URL = "https://arva.example.com";
  process.env.ARVA_FBRCHAT_SHARED_TOKEN = "sync-token";

  global.fetch = async (url, options = {}) => {
    if (url === "https://arva.example.com/api/integrations/fbrchat/resolve-agent") {
      assert.equal(options.method, "POST");
      assert.equal(options.headers.Authorization, "Bearer sync-token");
      return new Response(
        JSON.stringify({
          fbrchat_id: "agt_sync_001",
          arva_agent_id: "arva_sync_001",
          provider: "openclaw",
          provider_agent_id: "provider_sync_001",
          status: "active",
          identity: {
            name: "Raissa Almenda",
            slug: "raissa-almenda",
            avatar_url: "https://example.com/raissa.png",
            role: "SDR Senior",
            company_slug: "arva-platform",
            owner_company_id: "owner-001",
            owner_company_name: "FBR Leads"
          },
          persona: {
            short_description: "Agente comercial focada em pipeline.",
            perfil_geral: "Objetiva e analitica.",
            objetivo: "Gerar oportunidades qualificadas.",
            responsabilidades: ["qualificar leads"],
            competencias_centrais: ["follow-up"],
            tom: "profissional",
            tags: ["comercial"]
          },
          runtime: {
            model: "z-ai/glm-4.7",
            system_prompt: "Voce e a Raissa.",
            tts_enabled: true,
            tts_voice_id: "pt-br-01",
            openclaw_config: {
              model: "z-ai/glm-4.7",
              api_key_ref: "OPENCLAW_RAISSA_KEY"
            }
          },
          performance: {
            score: 87,
            tier: "A"
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return originalFetch(url, options);
  };

  try {
    const response = await fetch(`${baseUrl}/api/admin/agents/include-by-id`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${loginResponse.body.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fbrchat_id: "agt_sync_001"
      })
    });

    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.status, "created");
    assert.equal(body.agent.id, "agt_sync_001");
    assert.equal(body.agent.name, "Raissa Almenda");
    assert.equal(body.agent.company_slug, "arva-platform");
    assert.equal(body.agent.sync_source, "arva");
    assert.equal(body.agent.role, "SDR Senior");
    assert.equal(body.agent.runtime_profile.model, "z-ai/glm-4.7");
    assert.equal(body.agent.performance_profile.tier, "A");
  } finally {
    global.fetch = originalFetch;
    if (previousApiUrl === undefined) {
      delete process.env.ARVA_API_URL;
    } else {
      process.env.ARVA_API_URL = previousApiUrl;
    }
    if (previousToken === undefined) {
      delete process.env.ARVA_FBRCHAT_SHARED_TOKEN;
    } else {
      process.env.ARVA_FBRCHAT_SHARED_TOKEN = previousToken;
    }
  }
});

test("including same fbrchat_id twice returns existing agent", async () => {
  const loginResponse = await login("admin@fbr.local", "admin123");

  await fetch(`${baseUrl}/api/admin/agents/include-by-id`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${loginResponse.body.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      fbrchat_id: "agt_37402cbba8fc461fa9ed23ec8a4532d0"
    })
  });

  const response = await fetch(`${baseUrl}/api/admin/agents/include-by-id`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${loginResponse.body.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      fbrchat_id: "agt_37402cbba8fc461fa9ed23ec8a4532d0"
    })
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, "existing");
  assert.equal(body.agent.id, "agt_37402cbba8fc461fa9ed23ec8a4532d0");
});

test("refresh rotates token", async () => {
  const loginResponse = await login("admin@fbr.local", "admin123");

  const refreshResponse = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      refresh_token: loginResponse.body.refresh_token
    })
  });

  const refreshBody = await refreshResponse.json();

  assert.equal(refreshResponse.status, 200);
  assert.ok(refreshBody.access_token);
  assert.ok(refreshBody.refresh_token);
  assert.notEqual(refreshBody.refresh_token, loginResponse.body.refresh_token);

  const reusedResponse = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      refresh_token: loginResponse.body.refresh_token
    })
  });

  assert.equal(reusedResponse.status, 401);
});

test("admin can read and update system settings", async () => {
  const loginResponse = await login("admin@fbr.local", "admin123");

  const readResponse = await fetch(`${baseUrl}/api/admin/settings`, {
    headers: {
      Authorization: `Bearer ${loginResponse.body.access_token}`
    }
  });
  const currentSettings = await readResponse.json();

  assert.equal(readResponse.status, 200);
  assert.equal(currentSettings.stt_enabled, true);

  const updateResponse = await fetch(`${baseUrl}/api/admin/settings`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${loginResponse.body.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      tts_enabled: false,
      inference_rate_limit: 320
    })
  });
  const updated = await updateResponse.json();

  assert.equal(updateResponse.status, 200);
  assert.equal(updated.tts_enabled, false);
  assert.equal(updated.inference_rate_limit, 320);
});

test("admin can inspect openclaw logs after agent response", async () => {
  const loginResponse = await login("admin@fbr.local", "admin123");

  await fetch(`${baseUrl}/api/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${loginResponse.body.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      room_type: "group",
      room_id: "25365af7-7204-4786-9151-b0bfcf2e3e44",
      content: "Atualiza a Global Tech"
    })
  });

  const response = await fetch(`${baseUrl}/api/admin/logs/openclaw?status=success`, {
    headers: {
      Authorization: `Bearer ${loginResponse.body.access_token}`
    }
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.ok(body.length >= 1);
  assert.equal(body[0].status, "success");
});
