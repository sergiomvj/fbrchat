import { Router } from "express";
import { authenticateArva } from "../middleware/authenticate-integration.js";
import {
  mapNormalizedPayloadToAgent,
  normalizeArvaAgentPayload,
  validateNormalizedArvaAgentPayload
} from "../services/arva-agent-sync.js";
import { prismaStore as appStore } from "../store/prisma-store.js";

export const integrationsArvaRouter = Router();

integrationsArvaRouter.use(authenticateArva);

integrationsArvaRouter.post("/agents/upsert", async (req, res) => {
  const normalizedPayload = normalizeArvaAgentPayload(req.body ?? {});

  if (!validateNormalizedArvaAgentPayload(normalizedPayload)) {
    return res.status(400).json({ error: "Payload incompleto para provisionamento ARVA" });
  }

  const agentPayload = mapNormalizedPayloadToAgent(normalizedPayload);
  const { fbrchat_id } = normalizedPayload;

  const agents = await appStore.listAgents();
  const conflictingSlug = agents.find((agent) => agent.slug === agentPayload.slug && agent.id !== fbrchat_id);

  if (conflictingSlug) {
    return res.status(409).json({ error: "Slug ja cadastrado" });
  }

  const result = await appStore.upsertAgentFromArva(agentPayload);

  return res.json({
    agent_id: result.agent.id,
    status: result.status
  });
});

integrationsArvaRouter.post("/chat/open", async (req, res) => {
  const { fbrchat_id, human_user_id } = req.body ?? {};

  if (!fbrchat_id || !human_user_id) {
    return res.status(400).json({ error: "fbrchat_id e human_user_id sao obrigatorios" });
  }

  const agent = await appStore.findAgentById(fbrchat_id);
  if (!agent || !agent.is_active) {
    return res.status(404).json({ error: "Agent not found" });
  }

  const user = await appStore.findUserById(human_user_id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const result = await appStore.createOrGetPvt(user.id, "agent", agent.id);

  return res.json({
    agent_id: agent.id,
    pvt_id: result.pvt.id,
    is_new: result.isNew
  });
});
