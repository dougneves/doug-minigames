import React from 'react';
import type { JoinedPlayer } from '../../hooks/useJoinGameCommand';
import './PlayerJoinList.scss'; // Vamos criar este arquivo SCSS depois

interface PlayerJoinListProps {
  players: JoinedPlayer[];
  title?: string;
  waitingMessage?: string;
}

const DEFAULT_TITLE = "Quem quer jogar? Digite o comando no chat!";
const DEFAULT_WAITING_MESSAGE = "Aguardando desafiantes...";

const PlayerJoinList: React.FC<PlayerJoinListProps> = ({
  players,
  title = DEFAULT_TITLE,
  waitingMessage = DEFAULT_WAITING_MESSAGE,
}) => {
  return (
    <div className="player-join-list-container"> {/* Alterado de opponent-selection-area para ser mais genérico */}
      <h3>{title}</h3>
      {players.length === 0 && <p>{waitingMessage}</p>}
      <ul className="player-list"> {/* Alterado de opponent-list */}
        {players.map((player) => (
          <li key={player.channelId} className="player-item"> {/* Alterado de opponent-item */}
            <img
              src={player.profileImageUrl}
              alt={player.displayName}
              className="player-avatar" /* Alterado de opponent-avatar */
            />
            <span className="player-name">{player.displayName}</span> {/* Alterado de opponent-name */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayerJoinList;
