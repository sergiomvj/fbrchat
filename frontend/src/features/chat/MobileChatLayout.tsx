import { useState, useRef, useEffect } from "react";
import type { ChatMessage, RoomRef } from "./chat-types";
import "../../styles/mobile-layout.css";
import { BottomNavBar } from "../../components/shell/BottomNavBar";

type MobileChatLayoutProps = {
  activeRoom: RoomRef | null;
  messages: ChatMessage[];
  onSendMessage?: (input: string) => Promise<void>;
};

export function MobileChatLayout({ activeRoom, messages, onSendMessage }: MobileChatLayoutProps) {
  const [inputValue, setInputValue] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue);
      setInputValue("");
    }
  };

  return (
    <div className="mobile-root">
      {/* Top AppBar */}
      <header className="mobile-topbar">
        <div className="mobile-topbar__left">
          <button className="mobile-icon-btn">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="mobile-topbar__title-group">
            <h1 className="mobile-topbar__title">{activeRoom?.name || "Pipeline Vendas"}</h1>
            <div className="mobile-topbar__subtitle">
              <span className="mobile-topbar__subtitle-dot"></span>
              <span>Active • 4 Agents</span>
            </div>
          </div>
        </div>
        <div className="mobile-topbar__right">
          <button className="mobile-icon-btn">
            <span className="material-symbols-outlined">search</span>
          </button>
          <img className="mobile-avatar" src="/avatars/default_agent.png" alt="Profile avatar" />
        </div>
      </header>

      {/* Main Canvas */}
      <main className="mobile-chat-canvas">
        <div style={{ display: "flex", justifyContent: "center", padding: "16px 0", color: "#707979", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>
          Today
        </div>

        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`mobile-msg-row ${message.sender_type === "agent" ? "mobile-msg-row--agent" : "mobile-msg-row--user"}`}
          >
           <div className="mobile-msg-meta">
              {message.sender_type === "agent" && (
                <div className="mobile-msg-avatar">
                   <span className="material-symbols-outlined" style={{fontSize: 14}}>smart_toy</span>
                </div>
              )}
              <span className="mobile-msg-name">{message.sender_name}</span>
              <span className="mobile-msg-time">
                {new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.created_at))}
              </span>
           </div>
           {message.media_type === "image" ? (
             <img src="/media/crm_screenshot.png" alt="Screenshot" style={{width: "100%", borderRadius: 8, marginTop: 4}} />
           ) : (
             <div className="mobile-msg-bubble">
               {message.content}
             </div>
           )}
          </div>
        ))}
        {/* Helper to scroll to bottom */}
        <div ref={endOfMessagesRef} />
      </main>

      {/* Interaction Dock (Floating) */}
      <div className="mobile-interaction-dock">
        <div className="mobile-interaction-inner">
          <button className="mobile-tool-btn">
            <span className="material-symbols-outlined">add_circle</span>
          </button>
          <textarea 
            className="mobile-interaction-input"
            rows={1}
            placeholder="Type command or log..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button className="mobile-tool-btn">
            <span className="material-symbols-outlined">mic</span>
          </button>
          <button className="mobile-send-btn" onClick={handleSend}>
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>

      <BottomNavBar />
    </div>
  );
}
