import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/authenticate.js";
import { memoryStore } from "../store/memory-store.js";

export const adminLogsRouter = Router();

adminLogsRouter.use(authenticate, requireAdmin);

adminLogsRouter.get("/openclaw", (req, res) => {
  const agentId = req.query.agent_id?.toString();
  const status = req.query.status?.toString();
  const limit = Number(req.query.limit ?? 100);

  res.json(memoryStore.listOpenclawLogs({ agentId, status }).slice(0, limit));
});
