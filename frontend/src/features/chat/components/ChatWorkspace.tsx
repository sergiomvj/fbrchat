import type { ChatMessage, RoomRef, TypingIndicator } from "../chat-types";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { MessageComposer } from "./MessageComposer";

type ChatWorkspaceProps = {
  activeRoom: RoomRef | null;
  messages: ChatMessage[];
  typing: TypingIndicator | null;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  onSendMessage: (
    input: string,
    media?: { media_type: string; media_url: string; content?: string | null }
  ) => Promise<void>;
};

export function ChatWorkspace({
  activeRoom,
  messages,
  typing,
  isLoading,
  isSending,
  error,
  onSendMessage
}: ChatWorkspaceProps) {
  return (
    <section className="chat-workspace">
      <ChatHeader activeRoom={activeRoom} typing={typing} />
      {error ? <div className="chat-workspace__notice">{error}</div> : null}
      {isLoading ? <div className="chat-workspace__notice">Carregando thread...</div> : null}
      <ChatMessageList messages={messages} />
      <MessageComposer
        isOffline={Boolean(error)}
        isSending={isSending}
        onSendMessage={onSendMessage}
      />
    </section>
  );
}
