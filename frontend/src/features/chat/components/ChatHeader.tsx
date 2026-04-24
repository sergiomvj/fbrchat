import type { RoomRef, TypingIndicator } from "../chat-types";

type ChatHeaderProps = {
  activeRoom: RoomRef | null;
  typing: TypingIndicator | null;
};

export function ChatHeader({ activeRoom, typing }: ChatHeaderProps) {
  return (
    <header className="chat-header">
      <div>
        <h2>{activeRoom?.name || "Chat Workspace"}</h2>
        <p>
          {typing?.agent_name
            ? `${typing.agent_name} digitando agora`
            : activeRoom?.topic || "Thread operacional com contexto em tempo real"}
        </p>
      </div>
      <nav className="chat-header__nav">
        <span className="chat-header__nav-item chat-header__nav-item--active">Thread</span>
        <span className="chat-header__nav-item">Registry</span>
        <span className="chat-header__nav-item">Memory</span>
        <span className="chat-header__nav-item">Telemetry</span>
      </nav>
    </header>
  );
}
