import { useState } from "react";

type MessageComposerProps = {
  isSending: boolean;
  isOffline: boolean;
  onSendMessage: (
    input: string,
    media?: { media_type: string; media_url: string; content?: string | null }
  ) => Promise<void>;
};

export function MessageComposer({
  isSending,
  isOffline,
  onSendMessage
}: MessageComposerProps) {
  const [value, setValue] = useState("");

  async function handleSubmit() {
    await onSendMessage(value);
    setValue("");
  }

  return (
    <footer className="composer">
      {isOffline ? (
        <div className="composer__offline">Sem conexao - tentando reconectar...</div>
      ) : null}
      <textarea
        className="composer__input"
        onChange={(event) => setValue(event.target.value)}
        placeholder="Digite uma mensagem, mencione um agente ou envie um contexto rapido..."
        rows={4}
        value={value}
      />
      <div className="composer__actions">
        <div className="composer__tools">
          <button
            className="composer__tool"
            onClick={() =>
              onSendMessage("Screenshot do pipeline no CRM", {
                media_type: "image",
                media_url: "/mock-media/pipeline.png"
              })
            }
            type="button"
          >
            IMG
          </button>
          <button
            className="composer__tool"
            onClick={() =>
              onSendMessage("", {
                media_type: "audio",
                media_url: "/mock-media/audio-1.webm",
                content: "Mensagem de audio enviada"
              })
            }
            type="button"
          >
            MIC
          </button>
          <button className="composer__tool" type="button">
            @
          </button>
        </div>
        <button
          className="button button--primary"
          disabled={isSending}
          onClick={handleSubmit}
          type="button"
        >
          {isSending ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </footer>
  );
}
