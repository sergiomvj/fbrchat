import { useAdminRuntime } from "../AdminRuntime";
import { AdminPageLayout } from "../components/AdminPageLayout";

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium"
  }).format(new Date(value));
}

export function AdminLogsPage() {
  const { logs, agents } = useAdminRuntime();

  return (
    <AdminPageLayout
      title="OpenClaw Logs"
      subtitle="Auditoria de latencia, custo e status das chamadas."
    >
      <table className="data-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Agente</th>
            <th>Latencia</th>
            <th>Tokens</th>
            <th>Custo</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{formatTimestamp(log.created_at)}</td>
              <td>{agents.find((agent) => agent.id === log.agent_id)?.name || log.agent_id}</td>
              <td>{log.latency_ms}ms</td>
              <td>{log.prompt_tokens + log.completion_tokens}</td>
              <td>${log.estimated_cost_usd.toFixed(3)}</td>
              <td>
                <span className={`log-status log-status--${log.status}`}>{log.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminPageLayout>
  );
}
