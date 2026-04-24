import test, { beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createApp } from "../src/app.js";
import { createMessageGateway } from "../src/socket/message-gateway.js";
import { buildContextPacket } from "../src/services/context-router.js";
import {
  getMemoryRoot,
  materializeUserMemory,
  readUserMemoryFiles
} from "../src/services/memory-files.js";
import { memoryStore } from "../src/store/memory-store.js";

let server;
let baseUrl;

beforeEach(async () => {
  memoryStore.reset();
  await fs.rm(getMemoryRoot(), { recursive: true, force: true });

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

test("context router does not leak another user's private thread", async () => {
  const result = memoryStore.createOrGetPvt(
    "9cfcd0a6-44d8-4b79-81e9-bf0dd91df2c1",
    "agent",
    "a5b40509-4ff7-4ff5-a1df-a1eea9d776cb"
  );

  memoryStore.createMessage({
    conversationId: result.pvt.id,
    conversationType: "pvt",
    senderType: "user",
    senderId: "9cfcd0a6-44d8-4b79-81e9-bf0dd91df2c1",
    content: "SEGREDO ADMINISTRATIVO GLOBAL TECH"
  });

  const packet = await buildContextPacket({
    userId: "f01ab565-86a7-4f30-9ea6-f83f13f63b43",
    roomType: "group",
    roomId: "25365af7-7204-4786-9151-b0bfcf2e3e44"
  });

  assert.ok(packet.context.includes("Joao Duarte"));
  assert.equal(packet.context.includes("SEGREDO ADMINISTRATIVO GLOBAL TECH"), false);
});

test("missing memory files fall back without crashing", async () => {
  const files = await readUserMemoryFiles("f01ab565-86a7-4f30-9ea6-f83f13f63b43");
  assert.equal(files.memory, null);
  assert.equal(files.history, null);

  const packet = await buildContextPacket({
    userId: "f01ab565-86a7-4f30-9ea6-f83f13f63b43",
    roomType: "group",
    roomId: "25365af7-7204-4786-9151-b0bfcf2e3e44",
    materialize: false
  });

  assert.ok(packet.context.includes("## MEMORY\nmissing"));
  assert.ok(packet.context.includes("## HISTORY\nmissing"));
});

test("memory materialization writes MEMORY and HISTORY files", async () => {
  const output = await materializeUserMemory("f01ab565-86a7-4f30-9ea6-f83f13f63b43");
  const memoryExists = await fs
    .access(output.memoryPath)
    .then(() => true)
    .catch(() => false);
  const historyExists = await fs
    .access(output.historyPath)
    .then(() => true)
    .catch(() => false);

  assert.equal(memoryExists, true);
  assert.equal(historyExists, true);
});

test("upload descriptor endpoint validates local media payloads", async () => {
  const loginResponse = await login("joao@fbr.local", "user123");

  const response = await fetch(`${baseUrl}/api/uploads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${loginResponse.body.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      filename: "voice-note.webm",
      mime_type: "audio/webm",
      size_bytes: 4096
    })
  });

  const body = await response.json();

  assert.equal(response.status, 201);
  assert.ok(body.storage_path.includes("voice-note.webm"));
});

test("security headers are attached to health responses", async () => {
  const response = await fetch(`${baseUrl}/health`);

  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
});
