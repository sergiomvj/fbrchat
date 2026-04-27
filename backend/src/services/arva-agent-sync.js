import { memoryStore } from "../store/memory-store.js";

function validateAgentConfig(config) {
  return Boolean(
    config &&
      typeof config.model === "string" &&
      typeof config.system_prompt === "string" &&
      typeof config.api_key_ref === "string"
  );
}

function normalizeOpenclawConfig(runtime = {}) {
  const config = runtime.openclaw_config ?? {};
  const model = runtime.model ?? config.model;
  const systemPrompt = runtime.system_prompt ?? config.system_prompt;

  return {
    model,
    system_prompt: systemPrompt,
    temperature: config.temperature ?? 0.3,
    max_tokens: config.max_tokens ?? 1200,
    api_key_ref: config.api_key_ref
  };
}

function parseLegacyPayload(payload = {}) {
  return {
    fbrchat_id: payload.fbrchat_id,
    arva_agent_id: payload.arva_agent_id,
    provider: payload.provider,
    provider_agent_id: payload.provider_agent_id,
    status: payload.status,
    identity: {
      name: payload.name,
      slug: payload.slug,
      avatar_url: payload.avatar_url ?? null,
      company_slug: payload.company_slug
    },
    persona: {
      short_description: payload.description ?? null
    },
    runtime: {
      model: payload.openclaw_config?.model,
      system_prompt: payload.openclaw_config?.system_prompt,
      tts_enabled: payload.tts_enabled ?? false,
      tts_voice_id: payload.tts_voice_id ?? null,
      openclaw_config: payload.openclaw_config
    },
    performance: null
  };
}

export function normalizeArvaAgentPayload(payload = {}) {
  if (payload.identity || payload.persona || payload.runtime || payload.performance) {
    const runtime = payload.runtime ?? {};
    return {
      fbrchat_id: payload.fbrchat_id,
      arva_agent_id: payload.arva_agent_id,
      provider: payload.provider,
      provider_agent_id: payload.provider_agent_id,
      status: payload.status,
      identity: payload.identity ?? {},
      persona: payload.persona ?? {},
      runtime: {
        ...runtime,
        openclaw_config: normalizeOpenclawConfig(runtime)
      },
      performance: payload.performance ?? null
    };
  }

  return normalizeArvaAgentPayload(parseLegacyPayload(payload));
}

export function validateNormalizedArvaAgentPayload(payload) {
  if (
    !payload?.fbrchat_id ||
    !payload?.arva_agent_id ||
    !payload?.provider ||
    !payload?.provider_agent_id ||
    !payload?.status ||
    !payload?.identity?.name ||
    !payload?.identity?.slug ||
    !payload?.identity?.company_slug ||
    !payload?.runtime?.model ||
    !payload?.runtime?.system_prompt ||
    !validateAgentConfig(payload?.runtime?.openclaw_config)
  ) {
    return false;
  }

  return true;
}

function ensureCompany(payload) {
  const slug = payload.identity.company_slug;
  let company = memoryStore.findCompanyBySlug(slug);

  if (company) {
    return company;
  }

  const companyName =
    payload.identity.owner_company_name ??
    payload.identity.company_name ??
    slug;

  return memoryStore.createCompany({
    name: companyName,
    slug
  });
}

export function mapNormalizedPayloadToAgent(normalizedPayload) {
  const company = ensureCompany(normalizedPayload);

  return {
    id: normalizedPayload.fbrchat_id,
    arva_agent_id: normalizedPayload.arva_agent_id,
    provider: normalizedPayload.provider,
    provider_agent_id: normalizedPayload.provider_agent_id,
    company_id: company.id,
    name: normalizedPayload.identity.name,
    slug: normalizedPayload.identity.slug,
    role: normalizedPayload.identity.role ?? null,
    owner_company_id: normalizedPayload.identity.owner_company_id ?? null,
    owner_company_name: normalizedPayload.identity.owner_company_name ?? null,
    avatar_url: normalizedPayload.identity.avatar_url ?? null,
    description:
      normalizedPayload.persona.short_description ??
      normalizedPayload.identity.description ??
      null,
    openclaw_config: normalizedPayload.runtime.openclaw_config,
    tts_enabled: normalizedPayload.runtime.tts_enabled ?? false,
    tts_voice_id: normalizedPayload.runtime.tts_voice_id ?? null,
    is_active: normalizedPayload.status === "active",
    persona_profile: normalizedPayload.persona,
    runtime_profile: normalizedPayload.runtime,
    performance_profile: normalizedPayload.performance,
    sync_source: "arva",
    last_synced_at: new Date().toISOString()
  };
}

export function getArvaResolveAgentUrl() {
  const explicitUrl = process.env.ARVA_RESOLVE_AGENT_URL?.trim();
  if (explicitUrl) {
    return explicitUrl;
  }

  const apiBaseUrl = process.env.ARVA_API_URL?.trim();
  if (!apiBaseUrl) {
    return null;
  }

  return `${apiBaseUrl.replace(/\/$/, "")}/api/integrations/fbrchat/resolve-agent`;
}

export function getArvaResolveAgentToken() {
  return (
    process.env.ARVA_FBRCHAT_SHARED_TOKEN?.trim() ||
    process.env.FBRCHAT_SHARED_TOKEN?.trim() ||
    null
  );
}

export async function resolveAgentFromArvaById(fbrchatId) {
  const endpoint = getArvaResolveAgentUrl();
  const token = getArvaResolveAgentToken();

  if (!endpoint || !token) {
    return null;
  }

  const timeoutMs = Number.parseInt(process.env.ARVA_RESOLVE_AGENT_TIMEOUT_MS ?? "6000", 10);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fbrchat_id: fbrchatId }),
      signal: controller.signal
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const bodyText = await response.text();
      throw new Error(`Falha ao resolver agente no ARVA (${response.status}): ${bodyText}`);
    }

    return normalizeArvaAgentPayload(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}

