import React, { useEffect, useRef } from "react";
import useChatStore from "../store/chatStore";
import "./ChatDisplay.scss";

const ChatDisplay: React.FC = () => {
  const messages = useChatStore((state) => state.messages);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!messages) {
    return null;
  }

  return (
    <div className="chat-display-container">
      <div className="chat-header">
        <h4>Chat da Live</h4>
      </div>

      <div className="chat-messages-list">
        {messages.length === 0 ? (
          <p>
            <em>Nenhuma mensagem ainda. Aguardando...</em>
          </p>
        ) : (
          messages.map((msg) => {
            // Renderiza o item apenas se authorDetails e snippet existirem
            if (msg.authorDetails && msg.snippet) {
              return (
                <div key={msg.id} className="chat-message">
                  <img
                    src={msg.authorDetails.profileImageUrl}
                    alt={msg.authorDetails.displayName}
                    className="author-avatar"
                  />
                  <div className="message-content">
                    <span className="author-name">
                      {msg.authorDetails.displayName}:
                    </span>
                    <span className="message-text">
                      {msg.snippet.displayMessage}
                    </span>
                  </div>
                </div>
              );
            }
            return null; // Não renderiza nada se os dados estiverem incompletos
          })
        )}
        <div className="chat-scroll-spacer" ref={messagesEndRef}>
          .
        </div>
      </div>
    </div>
  );
};

export default ChatDisplay;
