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

test("user only sees groups where they are a member", async () => {
  const loginResponse = await login("joao@fbr.local", "user123");

  const response = await fetch(`${baseUrl}/api/groups`, {
    headers: { Authorization: `Bearer ${loginResponse.body.access_token}` }
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.length, 1);
  assert.equal(body[0].name, "Pipeline Vendas");
});

test("group history supports cursor pagination", async () => {
  const loginResponse = await login("joao@fbr.local", "user123");

  const firstPageResponse = await fetch(`${baseUrl}/api/groups/25365af7-7204-4786-9151-b0bfcf2e3e44/messages?limit=1`, {
    headers: { Authorization: `Bearer ${loginResponse.body.access_token}` }
  });
  const firstPage = await firstPageResponse.json();

  const secondPageResponse = await fetch(
    `${baseUrl}/api/groups/25365af7-7204-4786-9151-b0bfcf2e3e44/messages?limit=1&before=${firstPage[0].id}`,
    {
      headers: { Authorization: `Bearer ${loginResponse.body.access_token}` }
    }
  );
  const secondPage = await secondPageResponse.json();

  assert.equal(firstPageResponse.status, 200);
  assert.equal(secondPageResponse.status, 200);
  assert.equal(firstPage.length, 1);
  assert.equal(secondPage.length, 1);
  assert.notEqual(firstPage[0].id, secondPage[0].id);
  assert.equal(firstPage[0].room_type, "group");
});

test("pvt creation is idempotent regardless of initiator direction", async () => {
  const adminLogin = await login("admin@fbr.local", "admin123");
  const userLogin = await login("joao@fbr.local", "user123");

  const adminCreate = await fetch(`${baseUrl}/api/pvt`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminLogin.body.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      participant_type: "user",
      participant_id: "f01ab565-86a7-4f30-9ea6-f83f13f63b43"
    })
  });
  const adminBody = await adminCreate.json();

  const userCreate = await fetch(`${baseUrl}/api/pvt`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${userLogin.body.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      participant_type: "user",
      participant_id: "9cfcd0a6-44d8-4b79-81e9-bf0dd91df2c1"
    })
  });
  const userBody = await userCreate.json();

  assert.equal(adminBody.pvt_id, userBody.pvt_id);
  assert.equal(userBody.is_new, false);
});

test("user cannot access another user's pvt", async () => {
  const adminLogin = await login("admin@fbr.local", "admin123");
  const pvtId = memoryStore.listPvtsForUser("f01ab565-86a7-4f30-9ea6-f83f13f63b43").find(
    (entry) =>
      entry.participant_a_type === "agent" || entry.participant_b_type === "agent"
  ).id;

  const response = await fetch(`${baseUrl}/api/pvt/${pvtId}`, {
    headers: { Authorization: `Bearer ${adminLogin.body.access_token}` }
  });

  const body = await response.json();

  assert.equal(response.status, 403);
  assert.equal(body.error, "PVT access denied");
});

test("bootstrap returns user snapshot with groups and pvts", async () => {
  const loginResponse = await login("joao@fbr.local", "user123");

  const response = await fetch(`${baseUrl}/api/bootstrap`, {
    headers: { Authorization: `Bearer ${loginResponse.body.access_token}` }
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.me.email, "joao@fbr.local");
  assert.equal(body.groups.length, 1);
  assert.ok(body.pvts.length >= 1);
});

test("http message endpoint creates message and agent follow-up log", async () => {
  const loginResponse = await login("joao@fbr.local", "user123");

  const response = await fetch(`${baseUrl}/api/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${loginResponse.body.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      room_type: "group",
      room_id: "25365af7-7204-4786-9151-b0bfcf2e3e44",
      content: "Checa a Global Tech para mim"
    })
  });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.sender_type, "user");
  assert.equal(body.room_type, "group");
  assert.ok(
    memoryStore.listOpenclawLogs({ status: "success" }).length >= 1
  );
});

test("audio message triggers transcription update data", async () => {
  const loginResponse = await login("joao@fbr.local", "user123");

  const response = await fetch(`${baseUrl}/api/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${loginResponse.body.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      room_type: "group",
      room_id: "25365af7-7204-4786-9151-b0bfcf2e3e44",
      content: null,
      media_type: "audio",
      media_url: "/mock-media/audio-1.webm"
    })
  });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.media_type, "audio");
  assert.equal(body.transcription, "Transcricao local do audio audio-1.webm.");
});
