import React, { useEffect } from "react";
import useJoinGameCommand from "../../hooks/useJoinGameCommand";
import PlayerJoinList from "../shared/PlayerJoinList"; // Importando o novo componente
import ChatDisplay from "../ChatDisplay";
import "./VeryEggs.scss";

const VeryEggs: React.FC = () => {
  const {
    joinedPlayers,
    startListening,
    stopListening,
    resetPlayers,
  } = useJoinGameCommand({ command: "!jogar" });

  useEffect(() => {
    startListening();
    return () => {
      stopListening();
      resetPlayers();
    };
  }, [startListening, stopListening, resetPlayers]);

  return (
    <div className="very-eggs-container">
      <div className="game-area">
        <h2>Very Eggs Challenge!</h2>
        <PlayerJoinList 
          players={joinedPlayers} 
          title="Quem quer jogar Very Eggs? Digite !jogar no chat!"
          // Opcional: waitingMessage="Ninguém por aqui para os ovos..."
        />
        {/* Área do jogo em si virá aqui */}
        {/* Por exemplo, um botão para iniciar o jogo quando houver jogadores suficientes */}
        {/* {joinedPlayers.length > 0 && <button>Iniciar Jogo!</button>} */}
      </div>
      <div className="chat-area">
        <ChatDisplay />
      </div>
    </div>
  );
};

export default VeryEggs;
