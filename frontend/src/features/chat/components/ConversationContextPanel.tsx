import type { BootstrapUser, ChatMessage, RoomRef } from "../chat-types";

type ConversationContextPanelProps = {
  me: BootstrapUser | null;
  activeRoom: RoomRef | null;
  messages: ChatMessage[];
  connectionState: "connecting" | "online" | "offline";
};

export function ConversationContextPanel({
  me,
  activeRoom,
  messages,
  connectionState
}: ConversationContextPanelProps) {
  const lastAgentMessage = [...messages]
    .reverse()
    .find((message) => message.sender_type === "agent");

  return (
    <aside className="context-panel">
      <section className="context-panel__section">
        <h3>Conversation Intelligence</h3>
        <dl className="context-metrics">
          <div>
            <dt>Mensagens</dt>
            <dd>{messages.length}</dd>
          </div>
          <div>
            <dt>Estado do canal</dt>
            <dd>{connectionState === "online" ? "Estavel" : "Sincronizando"}</dd>
          </div>
        </dl>
      </section>

      <section className="context-panel__section">
        <h4>Active Nodes</h4>
        <div className="context-member">
          <span className="context-member__avatar">JD</span>
          <div>
            <strong>{me?.name || "Usuario"}</strong>
            <p>{me?.role === "admin" ? "Administrador" : "Operacao"}</p>
          </div>
        </div>
        {lastAgentMessage ? (
          <div className="context-member">
            <img src="/avatars/default_agent.png" className="context-member__avatar context-member__avatar--accent" alt="Agent" style={{ objectFit: "cover" }} />
            <div>
              <strong>{lastAgentMessage.sender_name}</strong>
              <p>Agente ativo neste contexto</p>
            </div>
          </div>
        ) : null}
      </section>

      <section className="context-panel__section context-panel__section--card">
        <h4>Agent Knowledge Base</h4>
        <p>
          Room ativo: {activeRoom?.type === "group" ? "Grupo operacional" : "PVT"}.
          Ultimo resumo de agente: {lastAgentMessage?.content || "aguardando inferencia"}.
        </p>
        <button 
          className="button" 
          type="button"
          onClick={() => alert("Abrindo visualizador de sessão do agente...")}
        >
          View Last Training Session
        </button>
        <button 
          className="button button--primary" 
          type="button"
          onClick={() => alert("Sincronizando cache local de contexto do AI Pipeline...")}
        >
          Sync Pipeline Data
        </button>
      </section>
    </aside>
  );
}
