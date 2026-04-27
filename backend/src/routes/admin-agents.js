import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate-body.js";
import {
  mapNormalizedPayloadToAgent,
  normalizeArvaAgentPayload,
  resolveAgentFromArvaById,
  validateNormalizedArvaAgentPayload
} from "../services/arva-agent-sync.js";
import { memoryStore } from "../store/memory-store.js";

function slugifyAgentId(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

function createQuickIncludePayload(fbrchatId) {
  const preferredCompany =
    memoryStore.findCompanyBySlug("fbr-holding") ??
    memoryStore.listCompanies().find((company) => company.is_active);

  if (!preferredCompany) {
    return null;
  }

  const suffix = fbrchatId.slice(-8);

  return {
    id: fbrchatId,
    name: `Agente ${suffix}`,
    slug: slugifyAgentId(fbrchatId),
    provider: "openclaw",
    provider_agent_id: fbrchatId,
    arva_agent_id: fbrchatId,
    company_id: preferredCompany.id,
    description: "Incluido rapidamente pelo painel admin a partir do fbrchat_id.",
    avatar_url: null,
    tts_enabled: true,
    tts_voice_id: "pt-br-01",
    is_active: true,
    openclaw_config: {
      model: "claude-3-5-sonnet",
      system_prompt: `Voce e o agente ${fbrchatId}. Responda com contexto operacional claro e objetivo.`,
      temperature: 0.3,
      max_tokens: 1200,
      api_key_ref: "OPENCLAW_ARVA_KEY"
    }
  };
}

function publicAgent(agent) {
  const company = memoryStore.findCompanyById(agent.company_id);

  return {
    id: agent.id,
    name: agent.name,
    slug: agent.slug,
    provider: agent.provider ?? null,
    provider_agent_id: agent.provider_agent_id ?? null,
    arva_agent_id: agent.arva_agent_id ?? null,
    company_id: agent.company_id,
    company_slug: company?.slug ?? null,
    company_name: company?.name ?? null,
    role: agent.role ?? null,
    owner_company_id: agent.owner_company_id ?? null,
    owner_company_name: agent.owner_company_name ?? null,
    avatar_url: agent.avatar_url,
    description: agent.description ?? null,
    sync_source: agent.sync_source ?? null,
    last_synced_at: agent.last_synced_at ?? null,
    persona_profile: agent.persona_profile ?? null,
    runtime_profile: agent.runtime_profile ?? null,
    performance_profile: agent.performance_profile ?? null,
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

adminAgentsRouter.post(
  "/include-by-id",
  validateBody(["fbrchat_id"]),
  async (req, res) => {
    const fbrchatId = req.body.fbrchat_id?.toString().trim();

    if (!fbrchatId) {
      return res.status(400).json({ error: "fbrchat_id invalido" });
    }

    const existing = memoryStore.findAgentById(fbrchatId);

    if (existing) {
      return res.json({
        status: "existing",
        agent: publicAgent(existing)
      });
    }

    try {
      const resolvedAgent = await resolveAgentFromArvaById(fbrchatId);

      if (resolvedAgent) {
        if (!validateNormalizedArvaAgentPayload(resolvedAgent)) {
          return res.status(502).json({ error: "Payload retornado pelo ARVA esta incompleto" });
        }

        const payload = mapNormalizedPayloadToAgent(normalizeArvaAgentPayload(resolvedAgent));
        const slugInUse = memoryStore
          .listAgents()
          .some((agent) => agent.slug === payload.slug && agent.id !== fbrchatId);

        if (slugInUse) {
          return res.status(409).json({ error: "Slug retornado pelo ARVA ja esta em uso" });
        }

        const result = memoryStore.upsertAgentFromArva(payload);

        return res.status(201).json({
          status: result.status,
          agent: publicAgent(result.agent)
        });
      }
    } catch (error) {
      return res.status(502).json({
        error: "Falha ao sincronizar agente com o ARVA",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }

    const payload = createQuickIncludePayload(fbrchatId);

    if (!payload) {
      return res.status(500).json({ error: "Nenhuma empresa ativa disponivel para incluir agente" });
    }

    const slugInUse = memoryStore
      .listAgents()
      .some((agent) => agent.slug === payload.slug && agent.id !== fbrchatId);

    if (slugInUse) {
      payload.slug = `${payload.slug.slice(0, 42)}-${Date.now().toString().slice(-6)}`;
    }

    const agent = memoryStore.createAgent(payload);

    return res.status(201).json({
      status: "created",
      agent: publicAgent(agent)
    });
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
