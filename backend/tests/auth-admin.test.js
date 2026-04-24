import test, { beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { memoryStore } from "../src/store/memory-store.js";
import { createMessageGateway } from "../src/socket/message-gateway.js";

let server;
let baseUrl;

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
