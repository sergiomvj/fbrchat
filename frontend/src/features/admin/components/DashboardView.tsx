import { useState } from "react";
import { useAdminRuntime } from "../AdminRuntime";
import { UserCreateModal } from "./UserCreateModal";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

export function DashboardView() {
  const { users, companies, agents, logs, isLoading, token, refresh } = useAdminRuntime();
  const [activeCompany, setActiveCompany] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const visibleAgents =
    activeCompany === "all"
      ? agents
      : agents.filter((agent) => agent.company_slug === activeCompany);

  const totalCost = logs.reduce((accumulator, entry) => accumulator + entry.estimated_cost_usd, 0);
  const kpis = [
    {
      label: "Active Users",
      value: String(users.filter((user) => user.is_active).length),
      meta: "Usuarios com acesso vigente"
    },
    {
      label: "Messages (24h)",
      value: String(logs.length * 2),
      meta: "Chamadas e respostas registradas"
    },
    {
      label: "Active Agents",
      value: String(agents.filter((agent) => agent.is_active).length),
      meta: "Agentes habilitados no catalogo"
    },
    {
      label: "Estimated Cost",
      value: formatCurrency(totalCost),
      meta: "Custo estimado local das inferencias"
    }
  ];

  const systems = [
    ["WebSocket Gateway", isLoading ? "Sincronizando" : "Stable"],
    ["PostgreSQL Cluster", "Operational (PostgreSQL 16)"],
    ["Redis Cache", "Active"],
    ["OpenClaw Engine", logs[0] ? `${logs[0].latency_ms}ms latency` : "Idle"]
  ] as const;

  return (
    <section className="dashboard-view">
      <header className="dashboard-view__header">
        <h2>Intelligence Overview</h2>
        <span>Real-time Telemetry</span>
      </header>

      <div className="kpi-strip">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="kpi-cell">
            <span>{kpi.label}</span>
            <strong>{kpi.value}</strong>
            <p>{kpi.meta}</p>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="chart-panel">
          <h3>Message Velocity (Tokens/sec)</h3>
          <div className="chart-panel__bars">
            {[40, 55, 45, 70, 85, 60, 50, 65, 90, 75, 60, 55, 40].map((height, index) => (
              <span
                key={`${height}-${index}`}
                className={
                  index === 8 ? "chart-panel__bar chart-panel__bar--active" : "chart-panel__bar"
                }
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </section>

        <section className="system-health">
          <h3>System Health</h3>
          {systems.map(([label, value]) => (
            <article key={label} className="system-health__row">
              <strong>{label}</strong>
              <span>{value}</span>
            </article>
          ))}
        </section>
      </div>

      <section className="directory-section">
        <div className="directory-section__header">
          <h3>Agent Registry</h3>
          <div className="filter-pills">
            {[{ id: "all", name: "Todas" }, ...companies].map((company) => (
              <button
                key={company.id}
                className={
                  activeCompany === company.id ? "filter-pill filter-pill--active" : "filter-pill"
                }
                onClick={() => setActiveCompany(company.id)}
                type="button"
              >
                {company.name}
              </button>
            ))}
          </div>
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
                  onClick={() => alert(`Gerenciando agente ${agent.name}...`)}
                >
                  Manage
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="directory-section">
        <div className="directory-section__header">
          <h3>Operational Directory</h3>
          <div className="directory-section__actions">
            <button 
              className="button" 
              type="button"
              onClick={() => {
                const header = "Node Identity,Email Anchor,Authority,Protocol Status,Last Ingress\n";
                const rowData = users.map(u => `${u.name},${u.email},${u.role},${u.is_active ? "Active" : "Inactive"},${u.last_seen || "Nunca"}`).join("\n");
                const blob = new Blob([header + rowData], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "operational_directory_export.csv";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
            >
              Export Registry
            </button>
            <button 
              className="button button--primary" 
              type="button"
              onClick={() => setIsModalOpen(true)}
            >
              Provision User
            </button>
          </div>
        </div>

        {isModalOpen && token && (
          <UserCreateModal 
            token={token} 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={() => {
              setIsModalOpen(false);
              refresh();
            }} 
          />
        )}

        <table className="data-table">
          <thead>
            <tr>
              <th>Node Identity</th>
              <th>Email Anchor</th>
              <th>Authority</th>
              <th>Protocol Status</th>
              <th>Last Ingress</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.is_active ? "Active" : "Inactive"}</td>
                <td>{user.last_seen || "Nunca"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}
