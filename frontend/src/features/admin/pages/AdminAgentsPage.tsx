import { useMemo, useState } from "react";
import { useAdminRuntime } from "../AdminRuntime";
import { AdminPageLayout } from "../components/AdminPageLayout";

export function AdminAgentsPage() {
  const { agents, companies, includeAgentById } = useAdminRuntime();
  const [company, setCompany] = useState("all");
  const [fbrchatId, setFbrchatId] = useState("");
  const [includeStatus, setIncludeStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const visibleAgents =
    company === "all"
      ? agents
      : agents.filter((agent) => agent.company_slug === company);

  const sortedCompanies = useMemo(
    () => [{ id: "all", name: "Todas" }, ...companies],
    [companies]
  );

  async function handleIncludeAgent() {
    const normalizedId = fbrchatId.trim();

    if (!normalizedId) {
      setIncludeStatus("Informe um fbrchat_id valido.");
      return;
    }

    setIsSubmitting(true);
    setIncludeStatus(null);

    try {
      const response = await includeAgentById(normalizedId);
      setIncludeStatus(
        response.status === "created"
          ? `Agente ${response.agent.name} incluido com sucesso.`
          : `Agente ${response.agent.name} ja existia e foi carregado.`
      );
      setFbrchatId("");
    } catch (error) {
      setIncludeStatus(error instanceof Error ? error.message : "Falha ao incluir agente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminPageLayout
      title="Agents"
      subtitle="Catalogo de agentes com filtro por empresa e inclusao rapida por fbrchat_id."
      actions={
        <button className="button button--primary" type="button">
          Novo Agente
        </button>
      }
    >
      <section className="inline-create-panel">
        <div className="inline-create-panel__copy">
          <strong>Incluir agente</strong>
          <p>Cole o `fbrchat_id` do ARVA e o sistema cria o agente com defaults seguros.</p>
        </div>
        <div className="inline-create-panel__form">
          <input
            className="inline-create-panel__input"
            onChange={(event) => setFbrchatId(event.target.value)}
            placeholder="agt_37402cbba8fc461fa9ed23ec8a4532d0"
            value={fbrchatId}
          />
          <button
            className="button button--primary"
            disabled={isSubmitting}
            onClick={handleIncludeAgent}
            type="button"
          >
            {isSubmitting ? "Incluindo..." : "Incluir agente"}
          </button>
        </div>
        {includeStatus ? <p className="inline-create-panel__status">{includeStatus}</p> : null}
      </section>

      <div className="filter-pills">
        {sortedCompanies.map((entry) => (
          <button
            key={entry.id}
            className={company === entry.id ? "filter-pill filter-pill--active" : "filter-pill"}
            onClick={() => setCompany(entry.id)}
            type="button"
          >
            {entry.name}
          </button>
        ))}
      </div>

      <div className="agent-cards">
        {visibleAgents.map((agent) => (
          <article key={agent.id} className="agent-card">
            <div className="agent-card__top">
              <strong>{agent.name}</strong>
              <span>@{agent.slug}</span>
            </div>
            <p>{agent.openclaw_config.model}</p>
            <div className="agent-card__meta">
              <span>ID: {agent.id}</span>
              <span>Provider ID: {agent.provider_agent_id || "n/a"}</span>
            </div>
            <div className="agent-card__footer">
              <span>{agent.company_name}</span>
              <button className="button" type="button">
                Editar
              </button>
            </div>
          </article>
        ))}
      </div>
    </AdminPageLayout>
  );
}
