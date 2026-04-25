import { SectionHeader } from "../../../components/shell/SectionHeader";
import type { ConversationSummary, RoomRef } from "../chat-types";

type ChatSidebarProps = {
  groups: ConversationSummary[];
  pvts: ConversationSummary[];
  activeRoom: RoomRef | null;
  onSelectRoom: (room: RoomRef) => void;
};

function formatRelativeTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function ChatSidebar({
  groups,
  pvts,
  activeRoom,
  onSelectRoom
}: ChatSidebarProps) {
  return (
    <div className="chat-sidebar">
      <section className="chat-sidebar__section">
        <SectionHeader title="Grupos" />
        <div className="conversation-list">
          {groups.map((group) => (
            <button
              key={group.id}
              className={
                activeRoom?.id === group.id && activeRoom.type === "group"
                  ? "conversation-item conversation-item--active"
                  : "conversation-item"
              }
              onClick={() =>
                onSelectRoom({
                  id: group.id,
                  type: "group",
                  name: group.name,
                  topic: group.topic
                })
              }
              type="button"
            >
              <div className="conversation-item__icon">
                {group.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="conversation-item__body">
                <div className="conversation-item__row">
                  <strong>{group.name}</strong>
                  <span>{formatRelativeTime(group.latest_message_at)}</span>
                </div>
                <p>{group.latest_message || group.topic || "Sem atividade recente"}</p>
              </div>
              {group.unread_count > 0 ? (
                <span className="conversation-item__badge">{group.unread_count}</span>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      <section className="chat-sidebar__section">
        <SectionHeader title="PVTs" />
        <div className="agent-list">
          {pvts.map((pvt) => (
            <button
              key={pvt.id}
              className="agent-list__item"
              onClick={() =>
                onSelectRoom({
                  id: pvt.id,
                  type: "pvt",
                  name: pvt.name,
                  participantType: pvt.participant_type
                })
              }
              type="button"
            >
              <img 
                className="agent-list__avatar" 
                src="/avatars/default_agent.png" 
                alt="Agent Avatar" 
                style={{ objectFit: "cover" }}
              />
              <div>
                <strong>{pvt.name}</strong>
                <p>
                  {pvt.participant_type === "agent" ? "Agente conectado" : "Conversa privada"}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
