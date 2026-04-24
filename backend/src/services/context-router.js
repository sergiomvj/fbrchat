import { memoryStore } from "../store/memory-store.js";
import { materializeUserMemory, readUserMemoryFiles } from "./memory-files.js";

const MAX_CONTEXT_CHARS = 8000;

function truncateToBudget(input, remainingBudget) {
  return input.length <= remainingBudget ? input : input.slice(0, remainingBudget);
}

export async function buildContextPacket({
  userId,
  roomType,
  roomId,
  materialize = true
}) {
  if (materialize) {
    await materializeUserMemory(userId);
  }

  const { memory, history, memoryPath, historyPath } = await readUserMemoryFiles(userId);
  const visibleMessages = memoryStore
    .listMessages({
      conversationType: roomType,
      conversationId: roomId,
      limit: 8
    })
    .reverse()
    .map(
      (message) =>
        `${message.created_at} | ${message.sender_type}:${message.sender_id ?? "system"} | ${message.content || message.transcription || "[media]"}`
    )
    .join("\n");

  let remainingBudget = MAX_CONTEXT_CHARS;
  const memorySection = memory ? truncateToBudget(memory, remainingBudget) : "";
  remainingBudget -= memorySection.length;
  const historySection = history ? truncateToBudget(history, remainingBudget) : "";
  remainingBudget -= historySection.length;
  const threadSection = truncateToBudget(visibleMessages, Math.max(remainingBudget, 0));

  const context = [
    memorySection ? `## MEMORY\n${memorySection}` : "## MEMORY\nmissing",
    historySection ? `## HISTORY\n${historySection}` : "## HISTORY\nmissing",
    `## THREAD\n${threadSection}`
  ].join("\n\n");

  return {
    context,
    files: {
      memoryPath,
      historyPath
    },
    token_budget: 2000
  };
}
