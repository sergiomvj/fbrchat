import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate-body.js";
import { memoryStore } from "../store/memory-store.js";

function publicAgent(agent) {
  const company = memoryStore.findCompanyById(agent.company_id);

  return {
    id: agent.id,
    name: agent.name,
    slug: agent.slug,
    company_id: agent.company_id,
    company_slug: company?.slug ?? null,
    company_name: company?.name ?? null,
    avatar_url: agent.avatar_url,
    openclaw_config: agent.openclaw_config,
    tts_enabled: agent.tts_enabled,
    tts_voice_id: agent.tts_voice_id,
    is_active: agent.is_active,
    created_at: agent.created_at
  };
}

export const adminAgentsRouter = Router();

adminAgentsRouter.use(authenticate, requireAdmin);

function validateAgentConfig(config) {
  return Boolean(
    config &&
      typeof config.model === "string" &&
      typeof config.system_prompt === "string" &&
      typeof config.api_key_ref === "string"
  );
}

adminAgentsRouter.get("/", (_req, res) => {
  const companyId = _req.query.company_id?.toString();
  const companySlug = _req.query.company_slug?.toString();

  res.json(
    memoryStore
      .listAgentsByCompany({ companyId, companySlug })
      .map(publicAgent)
  );
});

adminAgentsRouter.post(
  "/",
  validateBody(["name", "slug", "company_id", "openclaw_config"]),
  (req, res) => {
    const slugInUse = memoryStore.listAgents().some((agent) => agent.slug === req.body.slug);

    if (slugInUse) {
      return res.status(409).json({ error: "Slug ja cadastrado" });
    }

    const config = req.body.openclaw_config || {};

    if (!validateAgentConfig(config)) {
      return res.status(400).json({ error: "openclaw_config incompleto" });
    }

    if (!memoryStore.findCompanyById(req.body.company_id)) {
      return res.status(400).json({ error: "company_id invalido" });
    }

    const agent = memoryStore.createAgent(req.body);
    return res.status(201).json(publicAgent(agent));
  }
);

adminAgentsRouter.patch("/:id", (req, res) => {
  if (
    req.body.openclaw_config !== undefined &&
    !validateAgentConfig(req.body.openclaw_config)
  ) {
    return res.status(400).json({ error: "openclaw_config incompleto" });
  }

  if (
    req.body.company_id !== undefined &&
    !memoryStore.findCompanyById(req.body.company_id)
  ) {
    return res.status(400).json({ error: "company_id invalido" });
  }

  const agent = memoryStore.updateAgent(req.params.id, req.body);

  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }

  return res.json(publicAgent(agent));
});

adminAgentsRouter.delete("/:id", (req, res) => {
  const agent = memoryStore.deactivateAgent(req.params.id);

  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }

  return res.json({ success: true, agent: publicAgent(agent) });
});
