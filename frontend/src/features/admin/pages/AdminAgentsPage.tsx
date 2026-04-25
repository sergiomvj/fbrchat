import { useState } from "react";
import { useAdminRuntime } from "../AdminRuntime";
import { AdminPageLayout } from "../components/AdminPageLayout";

export function AdminAgentsPage() {
  const { agents, companies } = useAdminRuntime();
  const [company, setCompany] = useState("all");

  const visibleAgents =
    company === "all"
      ? agents
      : agents.filter((agent) => agent.company_slug === company);

  return (
    <AdminPageLayout
      title="Agents"
      subtitle="Catalogo de agentes com filtro por empresa para facilitar a gestao."
      actions={<button className="button button--primary" onClick={() => alert("Abrindo modal de novo Agente. Formulario ainda nao criado.")}>Novo Agente</button>}
    >
      <div className="filter-pills">
        {[{ id: "all", name: "Todas" }, ...companies].map((entry) => (
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
              <img src="/avatars/default_agent.png" alt="Agent Icon" style={{ width: 24, height: 24, borderRadius: "50%", marginRight: 8, display: "inline-block" }} />
              <strong>{agent.name}</strong>
              <span>@{agent.slug}</span>
            </div>
            <p>{agent.openclaw_config.model}</p>
            <div className="agent-card__footer">
              <span>{agent.company_name}</span>
              <button 
                className="button" 
                type="button"
                onClick={() => alert(`Carregando menu de edição para ${agent.name}...`)}
              >
                Editar
              </button>
            </div>
          </article>
        ))}
      </div>
    </AdminPageLayout>
  );
}
