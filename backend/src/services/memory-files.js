import fs from "node:fs/promises";
import path from "node:path";
import { memoryStore } from "../store/memory-store.js";

const memoryRoot = path.resolve(process.cwd(), "runtime", "memory");

async function ensureDirectory(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
}

function buildUserMemory(userId) {
  const user = memoryStore.findUserById(userId);
  const visibleGroups = memoryStore.listVisibleGroupsForUser(userId);
  const pvts = memoryStore.listPvtsForUser(userId);

  return `# User Preferences
- user_id: ${userId}
- name: ${user?.name || "Unknown"}
- role: ${user?.role || "user"}
- visible_groups: ${visibleGroups.map((group) => group.name).join(", ") || "none"}
- visible_pvts: ${pvts.length}
`;
}

function buildUserHistory(userId) {
  const relevantMessages = memoryStore.messages
    .filter((message) => {
      if (message.sender_type === "user" && message.sender_id === userId) {
        return true;
      }

      if (message.conversation_type === "group") {
        return memoryStore.userCanAccessGroup(userId, message.conversation_id);
      }

      if (message.conversation_type === "pvt") {
        return memoryStore.userCanAccessPvt(userId, message.conversation_id);
      }

      return false;
    })
    .slice(-10);

  const lines = relevantMessages.map(
    (message) =>
      `${message.created_at} | ${message.conversation_type}:${message.conversation_id} | ${message.sender_type}:${message.sender_id ?? "system"} | ${message.content || message.transcription || "[media]"}`
  );

  return `# HISTORY\n${lines.join("\n")}\n`;
}

export async function materializeUserMemory(userId) {
  const targetDir = path.join(memoryRoot, "users", userId);
  await ensureDirectory(targetDir);

  const memoryPath = path.join(targetDir, "MEMORY.md");
  const historyPath = path.join(targetDir, "HISTORY.md");

  await fs.writeFile(memoryPath, buildUserMemory(userId), "utf8");
  await fs.writeFile(historyPath, buildUserHistory(userId), "utf8");

  return { memoryPath, historyPath };
}

export async function readUserMemoryFiles(userId) {
  const targetDir = path.join(memoryRoot, "users", userId);
  const memoryPath = path.join(targetDir, "MEMORY.md");
  const historyPath = path.join(targetDir, "HISTORY.md");

  const [memory, history] = await Promise.all([
    fs.readFile(memoryPath, "utf8").catch(() => null),
    fs.readFile(historyPath, "utf8").catch(() => null)
  ]);

  return {
    memory,
    history,
    memoryPath,
    historyPath
  };
}

export function getMemoryRoot() {
  return memoryRoot;
}
