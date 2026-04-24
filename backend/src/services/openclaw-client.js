import { resolveSecret } from "./resolve-secret.js";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatMockResponse(agent, prompt) {
  const normalizedPrompt = (prompt || "").toLowerCase();

  if (normalizedPrompt.includes("timeout")) {
    return {
      status: "timeout",
      latency_ms: 1200,
      content:
        "Nao consegui concluir a inferencia dentro da janela local. Tente novamente em seguida."
    };
  }

  if (normalizedPrompt.includes("erro") || normalizedPrompt.includes("error")) {
    return {
      status: "error",
      latency_ms: 320,
      content:
        "Houve uma falha simulada do provedor. O time pode reenviar a mensagem sem perder contexto."
    };
  }

  if (normalizedPrompt.includes("global tech")) {
    return {
      status: "success",
      latency_ms: 680,
      content:
        "Analisei a conta Global Tech. Status atual: proposta enviada, probabilidade 85%, follow-up agendado para amanha as 09:00."
    };
  }

  if (normalizedPrompt.includes("onboarding")) {
    return {
      status: "success",
      latency_ms: 540,
      content:
        "Posso ajudar com onboarding. Sugiro revisar acesso, trilha inicial e pontos de ativacao nas primeiras 24 horas."
    };
  }

  return {
    status: "success",
    latency_ms: 460,
    content: `${agent.name}: recebi sua mensagem e gerei um resumo operacional para prosseguir sem ambiguidades.`
  };
}

export async function callOpenClaw({ agent, prompt, context }) {
  const apiKey = resolveSecret(agent.openclaw_config.api_key_ref);

  if (!apiKey) {
    return {
      status: "error",
      latency_ms: 0,
      content: "A referencia da chave nao foi resolvida para este agente.",
      error_code: "MISSING_SECRET",
      prompt_tokens: 0,
      completion_tokens: 0,
      estimated_cost_usd: 0
    };
  }

  const mock = formatMockResponse(agent, prompt);
  await delay(mock.latency_ms);

  return {
    status: mock.status,
    latency_ms: mock.latency_ms,
    content: mock.content,
    error_code:
      mock.status === "timeout"
        ? "TIMEOUT"
        : mock.status === "error"
          ? "PROVIDER_ERROR"
          : null,
    prompt_tokens: Math.max(80, Math.ceil(((prompt?.length || 0) + context.length) / 4)),
    completion_tokens: Math.max(40, Math.ceil(mock.content.length / 4)),
    estimated_cost_usd: mock.status === "success" ? 0.01 : 0
  };
}
