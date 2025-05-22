import React, { useEffect, useRef } from "react";
import useYouTubeChat from "../hooks/useYouTubeChat";
import useAppStore from "../store/appStore"; // Ainda precisamos para o liveChatId inicial
import "./ChatDisplay.scss";

const ChatDisplay: React.FC = () => {
  const liveChatId = useAppStore((state) => state.liveChatId); // Para decidir se o chat pode iniciar
  const apiKey = useAppStore((state) => state.apiKey); // Necessário para o hook

  const {
    messages,
    isPollingActive,
    isLoadingMessages,
    chatError,
    isChatDisabled,
    startPolling,
    stopPolling,
  } = useYouTubeChat(); // apiKey e liveChatId não são mais passados

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

  // Inicia o polling automaticamente se tivermos liveChatId e apiKey
  // e para o polling ao desmontar
  useEffect(() => {
    if (liveChatId && apiKey) {
      console.log('[ChatDisplay Effect] Conditions met (apiKey & liveChatId present). Calling startPolling.');
      startPolling();
    } else {
      console.log('[ChatDisplay Effect] Conditions NOT met (apiKey or liveChatId missing).');
    }
    return () => {
      console.log('[ChatDisplay Effect Cleanup] Reached cleanup function.');
      console.log('[ChatDisplay Effect Cleanup] About to call stopPolling.');
      console.log('[ChatDisplay Effect] Cleanup. Calling stopPolling.');
      stopPolling();
    };
  }, [liveChatId, apiKey, startPolling, stopPolling]); // startPolling/stopPolling são estáveis devido ao useCallback no hook

  const handleStartChat = () => {
    if (liveChatId && apiKey) {
      startPolling();
    }
  };

  const handleStopChat = () => {
    stopPolling();
  };

  if (!liveChatId || !apiKey) {
    return (
      <div className="chat-display-container">
        <h4>Chat da Live</h4>
        <p>
          Chat não disponível. Verifique as configurações de API Key e Live ID
          na página inicial.
        </p>
      </div>
    );
  }

  return (
    <div className="chat-display-container">
      <div className="chat-header">
        <h4>Chat da Live</h4>
        <div className="chat-controls">
          {!isPollingActive && !isChatDisabled && (
            <button
              onClick={handleStartChat}
              disabled={isLoadingMessages || !liveChatId}
            >
              {isLoadingMessages ? "Carregando..." : "Iniciar Chat"}
            </button>
          )}
          {isPollingActive && (
            <button onClick={handleStopChat} disabled={isLoadingMessages}>
              {isLoadingMessages ? "Carregando..." : "Parar Chat"}
            </button>
          )}
        </div>
      </div>

      {isChatDisabled && (
        <p className="error-message">
          O chat para esta live está desabilitado ou não foi encontrado.
        </p>
      )}
      {chatError && !isChatDisabled && (
        <p className="error-message">Erro no chat: {chatError}</p>
      )}

      <div className="chat-messages-list">
        {messages.length === 0 &&
          !isLoadingMessages &&
          !chatError &&
          !isChatDisabled && (
            <p>
              <em>Nenhuma mensagem ainda. Aguardando...</em>
            </p>
          )}
        {messages.map((msg) => {
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
        })}
        <div className="chat-scroll-spacer" ref={messagesEndRef}>
          .
        </div>
      </div>
      {isLoadingMessages && (
        <p className="loading-text">Carregando novas mensagens...</p>
      )}
    </div>
  );
};

export default ChatDisplay;
