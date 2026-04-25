import { useState, useRef, useEffect } from "react";
import type { ChatMessage, RoomRef } from "./chat-types";
import "../../styles/mobile-layout.css";

type MobileChatLayoutProps = {
  activeRoom: RoomRef | null;
  messages: ChatMessage[];
  onSendMessage?: (input: string) => Promise<void>;
};

export function MobileChatLayout({ activeRoom, messages, onSendMessage }: MobileChatLayoutProps) {
  const [inputValue, setInputValue] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue);
      setInputValue("");
    }
  };

  const isTyping = inputValue.length > 0;

  return (
    <div className="mobile-root">
      {/* Top AppBar (WhatsApp Style Header) */}
      <header className="mobile-topbar">
        <div className="mobile-topbar__left" onClick={() => alert("Voltando para a lista de conversas!")}>
          <button className="mobile-icon-btn">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <img className="mobile-avatar" src="/avatars/default_agent.png" alt="Profile avatar" />
          <div className="mobile-topbar__title-group">
            <h1 className="mobile-topbar__title">{activeRoom?.name || "Pipeline Vendas"}</h1>
            <div className="mobile-topbar__subtitle">
              online
            </div>
          </div>
        </div>
        <div className="mobile-topbar__right">
          <button className="mobile-icon-btn">
            <span className="material-symbols-outlined">videocam</span>
          </button>
          <button className="mobile-icon-btn">
            <span className="material-symbols-outlined">call</span>
          </button>
          <button className="mobile-icon-btn">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>
      </header>

      {/* Main Chat Canvas with WP Wallpaper */}
      <main className="mobile-chat-canvas">
        <div className="mobile-date-divider">
          <span>HOJE</span>
        </div>

        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`mobile-msg-row ${message.sender_type === "agent" ? "mobile-msg-row--agent" : "mobile-msg-row--user"}`}
          >
            <div className="mobile-msg-bubble">
               {(message.sender_type === "agent") && (
                 <span className="mobile-msg-name">{message.sender_name}</span>
               )}
               
               <div className="mobile-msg-content-wrap">
                 {message.media_type === "image" ? (
                   <img src="/media/crm_screenshot.png" alt="Anexo" style={{width: "100%", borderRadius: 6, marginBottom: 4}} />
                 ) : (
                   <div className="mobile-msg-content-text">{message.content}</div>
                 )}
                 <div className="mobile-msg-time-inline">
                   {new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.created_at))}
                   {message.sender_type !== "agent" && (
                      <span className="material-symbols-outlined" style={{fontSize: 12, marginLeft: 2, verticalAlign: "-2px", color: "#53bdeb"}}>done_all</span>
                   )}
                 </div>
               </div>
            </div>
          </div>
        ))}
        {/* Helper to scroll to bottom */}
        <div ref={endOfMessagesRef} style={{ height: "40px" }} />
      </main>

      {/* WhatsApp style Interaction Pill + Circle Button */}
      <div className="mobile-interaction-dock">
        <div className="mobile-interaction-pill">
          <button className="mobile-tool-btn">
            <span className="material-symbols-outlined">sentiment_satisfied</span>
          </button>
          <textarea 
            className="mobile-interaction-input"
            rows={1}
            placeholder="Mensagem"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button className="mobile-tool-btn" style={{transform: "rotate(-45deg)"}}>
            <span className="material-symbols-outlined">attach_file</span>
          </button>
          {!isTyping && (
            <button className="mobile-tool-btn">
              <span className="material-symbols-outlined">photo_camera</span>
            </button>
          )}
        </div>
        
        <button className="mobile-send-circle-btn" onClick={handleSend}>
          <span className="material-symbols-outlined">
            {isTyping ? "send" : "mic"}
          </span>
        </button>
      </div>
    </div>
  );
}
