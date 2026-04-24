import { materializeUserMemory } from "../../backend/src/services/memory-files.js";
import { memoryStore } from "../../backend/src/store/memory-store.js";

const port = Number(process.env.ORCHESTRATOR_PORT || 3001);

async function refreshMemoryArtifacts() {
  const users = memoryStore.listUsers().filter((user) => user.is_active);

  for (const user of users) {
    await materializeUserMemory(user.id);
  }

  console.log(
    `[orchestrator] refreshed memory artifacts for ${users.length} active users`
  );
}

console.log(`[orchestrator] booting on logical port ${port}`);
console.log("[orchestrator] worker shell ready for memory and context jobs");

refreshMemoryArtifacts().catch((error) => {
  console.error("[orchestrator] initial refresh failed", error);
});

setInterval(() => {
  refreshMemoryArtifacts().catch((error) => {
    console.error("[orchestrator] heartbeat refresh failed", error);
  });
}, 60000);
