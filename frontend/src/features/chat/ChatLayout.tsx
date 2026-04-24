import { SearchField } from "../../components/shell/SearchField";
import { TopBar } from "../../components/shell/TopBar";
import { useChatRuntime } from "./useChatRuntime";
import { ChatSidebar } from "./components/ChatSidebar";
import { ChatWorkspace } from "./components/ChatWorkspace";
import { ConversationContextPanel } from "./components/ConversationContextPanel";

export function ChatLayout() {
  const {
    bootstrap,
    activeRoom,
    messages,
    typing,
    isLoading,
    isSending,
    connectionState,
    error,
    selectRoom,
    submitMessage
  } = useChatRuntime();

  return (
    <div className="shell chat-layout">
      <aside className="shell__sidebar">
        <div className="shell__brand">
          <h1 className="shell__brand-title">FBR CHAT</h1>
          <p className="shell__brand-subtitle">Operational Node 01</p>
        </div>
        <div className="shell__nav">
          <SearchField placeholder="Buscar conversas..." />
          <ChatSidebar
            activeRoom={activeRoom}
            groups={bootstrap?.groups ?? []}
            onSelectRoom={selectRoom}
            pvts={bootstrap?.pvts ?? []}
          />
          <button className="button button--primary" type="button">
            + Execute New
          </button>
        </div>
      </aside>

      <main className="shell__main">
        <TopBar
          title="Chat Workspace"
          search={<SearchField placeholder="Buscar no thread..." />}
          statusLabel={connectionState === "online" ? "Online" : "Reconectando"}
        />
        <div className="chat-layout__body">
          <ChatWorkspace
            activeRoom={activeRoom}
            error={error}
            isLoading={isLoading}
            isSending={isSending}
            messages={messages}
            onSendMessage={submitMessage}
            typing={typing}
          />
          <ConversationContextPanel
            activeRoom={activeRoom}
            connectionState={connectionState}
            me={bootstrap?.me ?? null}
            messages={messages}
          />
        </div>
      </main>
    </div>
  );
}
