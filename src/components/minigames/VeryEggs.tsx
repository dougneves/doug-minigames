import React, { useState, useEffect } from 'react';
import useYouTubeChat from '../../hooks/useYouTubeChat';
import type { ChatMessageAuthorDetails } from '../../store/chatStore';
import ChatDisplay from '../ChatDisplay';
import './VeryEggs.scss';

interface PotentialOpponent extends ChatMessageAuthorDetails {
  // Adicionar mais campos específicos do oponente se necessário no futuro
}

const VeryEggs: React.FC = () => {
  const { messages, isPollingActive } = useYouTubeChat(); // Adicionado isPollingActive para lógica futura
  const [potentialOpponents, setPotentialOpponents] = useState<PotentialOpponent[]>([]);

  useEffect(() => {
    // Processa todas as mensagens para encontrar o comando !jogar
    messages.forEach(message => {
      if (message.snippet?.displayMessage?.trim().toLowerCase() === '!jogar') {
        if (message.authorDetails) {
          const author = message.authorDetails;
          setPotentialOpponents((prevOpponents) => {
            if (!prevOpponents.find(op => op.channelId === author.channelId)) {
              // console.log(`Adicionando ${author.displayName} à lista de oponentes.`); // Para debug
              return [...prevOpponents, author];
            }
            return prevOpponents;
          });
        }
      }
    });
  }, [messages]); // Re-executa sempre que 'messages' mudar

  // Lógica para limpar oponentes se o chat parar ou o componente for desmontado (opcional)
  // useEffect(() => {
  //   if (!isPollingActive) {
  //     // Poderia limpar a lista de oponentes aqui se desejado quando o chat para
  //     // setPotentialOpponents([]);
  //   }
  // }, [isPollingActive]);

  return (
    <div className="very-eggs-container">
      <div className="game-area">
        <h2>Very Eggs Challenge!</h2>
        <div className="opponent-selection-area">
          <h3>Quem quer jogar? Digite !jogar no chat!</h3>
          {potentialOpponents.length === 0 && <p>Aguardando desafiantes...</p>}
          <ul className="opponent-list">
            {potentialOpponents.map((opponent) => (
              <li key={opponent.channelId} className="opponent-item">
                <img src={opponent.profileImageUrl} alt={opponent.displayName} className="opponent-avatar" />
                <span className="opponent-name">{opponent.displayName}</span>
                {/* Botão para o streamer selecionar - Implementar no futuro */}
                {/* <button onClick={() => console.log('Selecionar oponente:', opponent.displayName)}>Selecionar</button> */}
              </li>
            ))}
          </ul>
        </div>
        {/* Área do jogo em si virá aqui */}
      </div>
      <div className="chat-area">
        <ChatDisplay />
      </div>
    </div>
  );
};

export default VeryEggs;
