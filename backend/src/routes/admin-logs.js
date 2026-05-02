import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/authenticate.js";
import { prismaStore as appStore } from "../store/prisma-store.js";

export const adminLogsRouter = Router();

adminLogsRouter.use(authenticate, requireAdmin);

adminLogsRouter.get("/openclaw", async (req, res) => {
  const agentId = req.query.agent_id?.toString();
  const status = req.query.status?.toString();
  const limit = Number(req.query.limit ?? 100);

  const logs = await appStore.listOpenclawLogs({ agentId, status });
  res.json(logs.slice(0, limit));
});
