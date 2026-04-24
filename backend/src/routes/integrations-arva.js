import { Router } from "express";
import { authenticateArva } from "../middleware/authenticate-integration.js";
import { memoryStore } from "../store/memory-store.js";

function validateAgentConfig(config) {
  return Boolean(
    config &&
      typeof config.model === "string" &&
      typeof config.system_prompt === "string" &&
      typeof config.api_key_ref === "string"
  );
}

export const integrationsArvaRouter = Router();

integrationsArvaRouter.use(authenticateArva);

integrationsArvaRouter.post("/agents/upsert", (req, res) => {
  const {
    fbrchat_id,
    arva_agent_id,
    provider,
    provider_agent_id,
    company_slug,
    name,
    slug,
    avatar_url,
    description,
    status,
    tts_enabled,
    tts_voice_id,
    openclaw_config
  } = req.body ?? {};

  if (
    !fbrchat_id ||
    !arva_agent_id ||
    !provider ||
    !provider_agent_id ||
    !company_slug ||
    !name ||
    !slug ||
    !status
  ) {
    return res.status(400).json({ error: "Payload incompleto para provisionamento ARVA" });
  }

  if (!validateAgentConfig(openclaw_config)) {
    return res.status(400).json({ error: "openclaw_config incompleto" });
  }

  const company = memoryStore.findCompanyBySlug(company_slug);

  if (!company) {
    return res.status(400).json({ error: "company_slug invalido" });
  }

  const conflictingSlug = memoryStore
    .listAgents()
    .find((agent) => agent.slug === slug && agent.id !== fbrchat_id);

  if (conflictingSlug) {
    return res.status(409).json({ error: "Slug ja cadastrado" });
  }

  const result = memoryStore.upsertAgentFromArva({
    id: fbrchat_id,
    arva_agent_id,
    provider,
    provider_agent_id,
    company_id: company.id,
    name,
    slug,
    avatar_url: avatar_url ?? null,
    description: description ?? null,
    is_active: status === "active",
    tts_enabled: tts_enabled ?? false,
    tts_voice_id: tts_voice_id ?? null,
    openclaw_config
  });

  return res.json({
    agent_id: result.agent.id,
    status: result.status
  });
});

integrationsArvaRouter.post("/chat/open", (req, res) => {
  const { fbrchat_id, human_user_id } = req.body ?? {};

  if (!fbrchat_id || !human_user_id) {
    return res.status(400).json({ error: "fbrchat_id e human_user_id sao obrigatorios" });
  }

  const agent = memoryStore.findAgentById(fbrchat_id);
  if (!agent || !agent.is_active) {
    return res.status(404).json({ error: "Agent not found" });
  }

  const user = memoryStore.findUserById(human_user_id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const result = memoryStore.createOrGetPvt(user.id, "agent", agent.id);

  return res.json({
    agent_id: agent.id,
    pvt_id: result.pvt.id,
    is_new: result.isNew
  });
});
