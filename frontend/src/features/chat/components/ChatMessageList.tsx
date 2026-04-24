import type { ChatMessage } from "../chat-types";

type ChatMessageListProps = {
  messages: ChatMessage[];
};

function formatClock(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function ChatMessageList({ messages }: ChatMessageListProps) {
  return (
    <div className="message-list">
      <div className="message-list__date">Hoje</div>
      {messages.map((message) => (
        <article
          key={message.id}
          className={
            message.sender_type === "agent"
              ? "message-row message-row--agent"
              : message.sender_type === "system"
                ? "message-row message-row--system"
                : "message-row"
          }
        >
          <div className="message-row__avatar">
            {message.sender_name.slice(0, 2).toUpperCase()}
          </div>
          <div className="message-row__content">
            <div className="message-row__meta">
              <strong>{message.sender_name}</strong>
              {message.sender_type === "agent" ? (
                <span className="message-row__badge">OPENCLAW</span>
              ) : null}
              <span>{formatClock(message.created_at)}</span>
            </div>
            {message.media_type === "audio" ? (
              <div className="message-card message-card--audio">
                <div className="audio-player">
                  <button className="audio-player__button" type="button">
                    Play
                  </button>
                  <div className="audio-player__wave">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="audio-player__time">0:45</span>
                </div>
                <p>{message.transcription || message.content || "Audio em processamento"}</p>
              </div>
            ) : message.media_type === "image" ? (
              <div className="message-card message-card--image">
                <div className="message-card__image">CRM Screenshot</div>
                <p>{message.content || "Imagem enviada para o thread"}</p>
              </div>
            ) : (
              <div className="message-card">
                <p>{message.content}</p>
                {message.status === "failed" ? (
                  <div className="message-card__actions">
                    <button className="button" type="button">
                      Falha no envio
                    </button>
                  </div>
                ) : null}
                {message.tts_audio_url ? (
                  <div className="message-card__actions">
                    <button className="button button--primary" type="button">
                      Player TTS
                    </button>
                    <button className="button" type="button">
                      Copy Log
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
