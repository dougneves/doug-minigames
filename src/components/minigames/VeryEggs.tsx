import React, { useEffect, useState, useRef, useCallback } from "react";
import useChatStore, { ChatMessage } from "../../store/chatStore";
import useJoinGameCommand, { JoinedPlayer } from "../../hooks/useJoinGameCommand";
import PlayerJoinList from "../shared/PlayerJoinList";
import ChatDisplay from "../ChatDisplay";
import "./VeryEggs.scss";

interface Egg {
  id: string;
  isFull: boolean;
  // originalIndex: number; // Poderia ser útil para mecânicas mais complexas no futuro
}


const VeryEggs: React.FC = () => {
  const { lastFetchedMessages } = useChatStore();

  const {
    joinedPlayers,
    startListening,
    stopListening,
    resetPlayers,
  } = useJoinGameCommand({ command: "!jogar" });

  const [selectedPlayer, setSelectedPlayer] = useState<JoinedPlayer | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [eggs, setEggs] = useState<Egg[]>([]);
  const [emptyEggCount, setEmptyEggCount] = useState(0);
  const [rottenEggCount, setRottenEggCount] = useState(0);
  const [currentPlayerTurn, setCurrentPlayerTurn] = useState<'streamer' | 'viewer' | null>(null);
  const [streamerLives, setStreamerLives] = useState(3);
  const [viewerLives, setViewerLives] = useState(3);
  const [gameMessage, setGameMessage] = useState<string>("");
  const [gameOverMessage, setGameOverMessage] = useState<string>("");
  const lastProcessedMessageId = useRef<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const turnDelayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs to get the latest lives value inside setTimeout
  const streamerLivesRef = useRef(streamerLives);
  const viewerLivesRef = useRef(viewerLives);
  useEffect(() => { streamerLivesRef.current = streamerLives; }, [streamerLives]);
  useEffect(() => { viewerLivesRef.current = viewerLives; }, [viewerLives]);

  useEffect(() => {
    // Só escuta por jogadores se o jogo não começou
    if (!gameStarted) {
      startListening();
    }
    return () => {
      // Garante que para de escutar e reseta se o componente desmontar
      // ou se o jogo começar e essas funções não tiverem sido chamadas explicitamente
      if (!gameStarted) { // Só chama stop e reset se o jogo não tiver começado explicitamente
        stopListening();
        resetPlayers();
      }
    };
  }, [startListening, stopListening, resetPlayers, gameStarted]);

  useEffect(() => {
    // Cleanup timeout on component unmount
    return () => {
      if (turnDelayTimeoutRef.current) {
        clearTimeout(turnDelayTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to generate an array of eggs
  const generateEggsArray = useCallback((numEggsToGenerate: number): Egg[] => {
    const newEggs: Egg[] = [];
    // Garante pelo menos um ovo podre se houver mais de 1 ovo, e no máximo numEggsToGenerate - 1 podres
    const minRotten = numEggsToGenerate > 1 ? 1 : 0;
    const maxRotten = numEggsToGenerate > 0 ? numEggsToGenerate -1 : 0;
    let rottenCount = Math.floor(Math.random() * (maxRotten - minRotten + 1)) + minRotten;

    for (let i = 0; i < numEggsToGenerate; i++) {
      const isFull = rottenCount > 0;
      newEggs.push({ id: `egg-${Date.now()}-${i}`, isFull });
      if (isFull) rottenCount--;
    }

    // Embaralha os ovos
    for (let i = newEggs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newEggs[i], newEggs[j]] = [newEggs[j], newEggs[i]];
    }
    return newEggs;
  }, []);

  // Function to generate and set eggs, can be for initial setup or resupply
  const generateAndSetEggs = useCallback((isResupply: boolean = false) => {
    const numEggs = isResupply
      ? Math.floor(Math.random() * 3) + 5 // 5, 6, ou 7 ovos para reabastecimento
      : 10; // Número inicial padrão de ovos
    
    const newGeneratedEggs = generateEggsArray(numEggs);
    setEggs(newGeneratedEggs);

    let emptyC = 0;
    let rottenC = 0;
    newGeneratedEggs.forEach(egg => {
      if (egg.isFull) rottenC++;
      else emptyC++;
    });
    setEmptyEggCount(emptyC);
    setRottenEggCount(rottenC);

    console.log(`Ovos Gerados (${isResupply ? 'Reabastecimento' : 'Iniciais'} - ${numEggs} ovos):`, newGeneratedEggs);
    console.log(`Contagem: ${emptyC} vazios, ${rottenC} podres.`);
  }, [generateEggsArray, setEggs, setEmptyEggCount, setRottenEggCount]);

  const processRoundActionCb = useCallback((targetChoice: 'self' | 'opponent') => {
    if (gameOverMessage || isProcessingAction) return; 

    setIsProcessingAction(true);
    if (gameOverMessage) return; // Não processa ações se o jogo acabou
    // 'self' significa que o jogador atual (streamer ou viewer) usou o ovo em si mesmo.
    // 'opponent' significa que o jogador atual usou o ovo no oponente.

    if (!selectedPlayer || eggs.length === 0) {
      console.error("Erro: Tentativa de processar ação sem jogador selecionado ou sem ovos restantes.");
      return;
    }

    const currentEgg = eggs[0];
    const isStreamerTurn = currentPlayerTurn === 'streamer';
    let actualTargetName: string;
    let effectOnSelf: boolean;
    let message = "";

    if (isStreamerTurn) {
      effectOnSelf = targetChoice === 'self';
      actualTargetName = effectOnSelf ? 'Streamer' : selectedPlayer.displayName;
    } else { // Viewer's turn
      effectOnSelf = targetChoice === 'self';
      actualTargetName = effectOnSelf ? selectedPlayer.displayName : 'Streamer';
    }

    const actualChosenEgg = currentEgg;

    console.log(
      `Ação: Próximo ovo (ID: ${actualChosenEgg.id}, ${actualChosenEgg.isFull ? 'PODRE' : 'VAZIO'}) usado em ${actualTargetName}`
    );

    // Lógica do efeito do ovo
    const actingPlayerName = isStreamerTurn ? 'Streamer' : selectedPlayer.displayName;
    const opponentPlayerName = isStreamerTurn ? selectedPlayer.displayName : 'Streamer';

    if (effectOnSelf) { // Jogador atual usou em si mesmo
      message = `${actingPlayerName} usou o ovo em si mesmo. Era ${actualChosenEgg.isFull ? 'PODRE' : 'VAZIO'}.`;
      if (actualChosenEgg.isFull) {
        if (isStreamerTurn) {
          setStreamerLives(prev => prev - 1);
          message += ` Streamer perdeu uma vida!`;
        } else {
          setViewerLives(prev => prev - 1);
          message += ` ${actingPlayerName} perdeu uma vida!`;
        }
      } else {
        message += ` Nenhuma vida perdida.`;
      }
    } else { // Jogador atual usou no oponente
      message = `${actingPlayerName} jogou o ovo em ${opponentPlayerName}. Era ${actualChosenEgg.isFull ? 'PODRE' : 'VAZIO'}.`;
      if (actualChosenEgg.isFull) {
        if (isStreamerTurn) { // Streamer jogou no viewer
          setViewerLives(prev => prev - 1);
          message += ` ${opponentPlayerName} perdeu uma vida!`;
        } else { // Viewer jogou no streamer
          setStreamerLives(prev => prev - 1);
          message += ` Streamer perdeu uma vida!`;
        }
      } else {
        message += ` Nenhuma vida perdida.`;
      }
    }
    console.log(message);
    setGameMessage(message);

    const remainingEggs = eggs.filter(egg => egg.id !== actualChosenEgg.id);
    setEggs(remainingEggs);

    let emptyC = 0;
    let rottenC = 0;
    remainingEggs.forEach(egg => {
      if (egg.isFull) rottenC++;
      else emptyC++;
    });
    setEmptyEggCount(emptyC);
    setRottenEggCount(rottenC);

    // Lógica de continuação do jogo / regeneração de ovos
    // As vidas já foram atualizadas, o useEffect de gameOverMessage cuidará do fim de jogo por vidas.

    const sLives = isStreamerTurn && effectOnSelf && actualChosenEgg.isFull ? streamerLives -1 : streamerLives;
    const vLives = ((isStreamerTurn && !effectOnSelf && actualChosenEgg.isFull) || (!isStreamerTurn && effectOnSelf && actualChosenEgg.isFull)) ? viewerLives -1 : viewerLives;

    // Delay before changing turn or ending game due to no lives
    turnDelayTimeoutRef.current = setTimeout(() => {
      const currentStreamerLives = streamerLivesRef.current;
      const currentViewerLives = viewerLivesRef.current;

      if (currentStreamerLives <= 0 || currentViewerLives <= 0) {
        // Game over logic is handled by the useEffect watching lives. Just ensure no further turn processing.
        setCurrentPlayerTurn(null);
      } else if (remainingEggs.length === 0) {
        setGameMessage(prev => prev + "\nAcabaram os ovos! Gerando uma nova leva...");
        generateAndSetEggs(true); // Pass true for resupply
        setCurrentPlayerTurn(isStreamerTurn ? 'viewer' : 'streamer');
      } else {
        setCurrentPlayerTurn(isStreamerTurn ? 'viewer' : 'streamer');
      }
      setIsProcessingAction(false);
      turnDelayTimeoutRef.current = null;
    }, 5000); // 5 segundos de delay

  }, [eggs, selectedPlayer, currentPlayerTurn, gameOverMessage, streamerLives, viewerLives, generateAndSetEggs, setEggs, setCurrentPlayerTurn, setGameMessage, setEmptyEggCount, setRottenEggCount, setStreamerLives, setViewerLives, isProcessingAction]);

  // Efeito para verificar fim de jogo (APENAS vidas)
  useEffect(() => {
    if (!gameStarted || gameOverMessage) return; // Não faz nada se o jogo não começou ou já acabou

    let newGameOverMessage = "";
    if (streamerLives <= 0) {
      newGameOverMessage = `${selectedPlayer?.displayName || 'O Viewer'} venceu! Streamer ficou sem vidas.`;
    } else if (viewerLives <= 0) {
      newGameOverMessage = `Streamer venceu! ${selectedPlayer?.displayName || 'O Viewer'} ficou sem vidas.`;
    }

    if (newGameOverMessage) {
      setGameOverMessage(newGameOverMessage);
      setGameMessage(prev => prev + "\n" + newGameOverMessage);
      setCurrentPlayerTurn(null); // Para o jogo
    }
    // A condição de eggs.length === 0 foi removida daqui.
    // A regeneração de ovos é tratada em processRoundActionCb.
  }, [streamerLives, viewerLives, gameStarted, selectedPlayer, gameOverMessage, setGameOverMessage, setGameMessage, setCurrentPlayerTurn]);

  // Efeito para processar comandos do viewer (!jogar ou !quebrar)
  useEffect(() => {
    if (isProcessingAction || currentPlayerTurn !== 'viewer' || !selectedPlayer || eggs.length === 0 || lastFetchedMessages.length === 0) {
      return;
    }
    // O restante da lógica permanece o mesmo, mas a condição de guarda acima é mais robusta
    const latestMessage: ChatMessage = lastFetchedMessages[lastFetchedMessages.length - 1];

    // Evita processar a mesma mensagem múltiplas vezes
    if (latestMessage.id === lastProcessedMessageId.current) {
      return;
    }

    if (latestMessage.authorDetails && latestMessage.authorDetails.channelId === selectedPlayer.channelId) {
      const commandText = latestMessage.snippet?.displayMessage?.toLowerCase().trim();
      if (commandText) {
        lastProcessedMessageId.current = latestMessage.id;

        if (commandText === '!quebrar') { // Viewer usa o ovo em si mesmo
          console.log(`${selectedPlayer.displayName} comandou: !quebrar`);
          processRoundActionCb('self'); 
        } else if (commandText === '!jogar') { // Viewer usa o ovo no streamer (oponente)
          console.log(`${selectedPlayer.displayName} comandou: !jogar`);
          processRoundActionCb('opponent');
        }
      }
    }
  }, [lastFetchedMessages, currentPlayerTurn, selectedPlayer, eggs, processRoundActionCb]);

  const handlePlayerSelect = (player: JoinedPlayer) => {
    if (!gameStarted) { // Só permite selecionar se o jogo não começou
      setSelectedPlayer(player);
    }
  };

  const handleStartGame = () => {
    if (turnDelayTimeoutRef.current) {
      clearTimeout(turnDelayTimeoutRef.current);
      turnDelayTimeoutRef.current = null;
    }
    setIsProcessingAction(false);
    if (!selectedPlayer) return;

    setGameStarted(true);
    setStreamerLives(3);
    setViewerLives(3);
    setGameMessage("Nova rodada começando!");
    setGameOverMessage("");
    console.log(`Iniciando jogo com ${selectedPlayer.displayName}!`);
    generateAndSetEggs(false); // Chamada correta para início de jogo
    setCurrentPlayerTurn('streamer'); // Streamer começa
    lastProcessedMessageId.current = null; // Reseta o ID da última msg processada
  };

  const resetGameToSelection = () => {
    if (turnDelayTimeoutRef.current) {
      clearTimeout(turnDelayTimeoutRef.current);
      turnDelayTimeoutRef.current = null;
    }
    setIsProcessingAction(false);

    setGameStarted(false); // Isso acionará o useEffect para startListening
    setSelectedPlayer(null);
    setEggs([]);
    setStreamerLives(3);
    setViewerLives(3);
    setGameMessage(""); // Limpa a mensagem do jogo, PlayerJoinList tem seu próprio título
    setGameOverMessage("");
    setCurrentPlayerTurn(null);
    setEmptyEggCount(0);
    setRottenEggCount(0);
    lastProcessedMessageId.current = null;

    console.log("Jogo resetado. Voltando para a tela de seleção de jogador.");
  };

  const handleRestartGame = () => {
    if (turnDelayTimeoutRef.current) {
      clearTimeout(turnDelayTimeoutRef.current);
      turnDelayTimeoutRef.current = null;
    }
    setIsProcessingAction(false);
    // handleStartGame will be called which already clears timeout and resets states
    handleStartGame(); // Reutiliza a lógica de início de jogo para reiniciar
  };

  return (
    <div className="very-eggs-container">
      <div className="game-area">
        <h2>Very Eggs Challenge!</h2>
        {!gameStarted && (
          <PlayerJoinList 
            players={joinedPlayers} 
            title="Quem quer jogar Very Eggs? Digite !jogar no chat!"
            onPlayerSelect={handlePlayerSelect}
            selectedPlayerId={selectedPlayer?.channelId}
          />
        )}
        {selectedPlayer && !gameStarted && (
          <button 
            onClick={handleStartGame} 
            disabled={!selectedPlayer || gameStarted}
            className="start-game-button"
          >
            Iniciar Jogo com {selectedPlayer.displayName}
          </button>
        )}
        {gameStarted && selectedPlayer && (
          <div className="game-in-progress-area">
            <h3>Very Eggs Challenge!</h3>
            <div className="player-display-container">
              <div className="player-area streamer-area">
                <h4>Streamer</h4>
                <div className="avatar-placeholder">Seu Avatar/Câmera Aqui</div>
                <div className="lives-display">
                  {Array.from({ length: streamerLives }, (_, i) => <span key={`s-life-${i}`} role="img" aria-label="life">❤️</span>)}
                  {Array.from({ length: Math.max(0, 3 - streamerLives) }, (_, i) => <span key={`s-lostlife-${i}`} role="img" aria-label="lost life">🖤</span>)}
                </div>
              </div>
              <div className="player-area viewer-area">
                <h4>{selectedPlayer.displayName}</h4>
                <img src={selectedPlayer.profileImageUrl || 'https://via.placeholder.com/80'} alt={`${selectedPlayer.displayName} avatar`} className="viewer-avatar" />
                <div className="lives-display">
                  {Array.from({ length: viewerLives }, (_, i) => <span key={`v-life-${i}`} role="img" aria-label="life">❤️</span>)}
                  {Array.from({ length: Math.max(0, 3 - viewerLives) }, (_, i) => <span key={`v-lostlife-${i}`} role="img" aria-label="lost life">🖤</span>)}
                </div>
              </div>
            </div>

            {gameMessage && <p className="game-message">{gameMessage.split('\n').map((line, idx) => <React.Fragment key={idx}>{line}<br/></React.Fragment>)}</p>}
            {isProcessingAction && !gameOverMessage && <p className="turn-transition-message">Aguardando próximo turno...</p>}
            {gameOverMessage && (
              <div className="game-over-message">
                <h4>Fim de Jogo!</h4>
                <p>{gameOverMessage}</p>
                <button onClick={resetGameToSelection} className="start-game-button">Jogar Novamente</button>
              </div>
            )}

            {!gameOverMessage && (
              <>
                <div className="turn-info">
                  <p><strong>Vez de:</strong> {currentPlayerTurn === 'streamer' ? 'Streamer' : (currentPlayerTurn === 'viewer' ? selectedPlayer.displayName : 'Aguardando...')}</p>
                </div>
                <div className="egg-counts">
                  <p>Ovos Vazios Iniciais: <span className="count-display">{emptyEggCount}</span></p>
                  <p>Ovos Podres Iniciais: <span className="count-display">{rottenEggCount}</span></p>
                </div>
                <div className="eggs-display-area">
                  <h4>Próximos Ovos na Fila: ({eggs.length} restantes)</h4>
                  {eggs.length > 0 ? (
                    <div className="egg-queue">
                      {eggs.map((egg, index) => (
                        <div key={egg.id} className={`egg-item ${index === 0 ? 'next-egg' : ''}`}>
                          Ovo ? {index === 0 && "(Próximo)"}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>Nenhum ovo restante.</p>
                  )}
                </div>

                {currentPlayerTurn === 'streamer' && eggs.length > 0 && (
                  <div className="streamer-actions">
                    <p>Sua vez, Streamer! O próximo ovo será usado.</p>
                    <button onClick={() => processRoundActionCb('self')} className="action-button" disabled={isProcessingAction}>Si Mesmo</button>
                    <button onClick={() => processRoundActionCb('opponent')} className="action-button" disabled={isProcessingAction}>{selectedPlayer.displayName}</button>
                  </div>
                )}
                {currentPlayerTurn === 'viewer' && eggs.length > 0 && (
                  <div className="viewer-instructions">
                    <p>Sua vez, {selectedPlayer?.displayName}! O próximo ovo será usado. Digite no chat:</p>
                    <ul>
                      <li><code>!jogar</code> (para usar o ovo no Streamer)</li>
                      <li><code>!quebrar</code> (para usar o ovo em você mesmo)</li>
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {/* Área do jogo em si virá aqui */}
      </div>
      <div className="chat-area">
        <ChatDisplay />
      </div>
    </div>
  );
};

export default VeryEggs;
