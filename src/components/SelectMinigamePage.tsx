import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';
import ChatDisplay from './ChatDisplay'; // Importa o novo componente
import './SelectMinigamePage.scss';

// Definindo a interface para os objetos de minigame
interface Minigame {
  id: number;
  name: string;
  description: string;
}

const SelectMinigamePage: React.FC = () => {
  const navigate = useNavigate();
  const apiKey = useAppStore((state) => state.apiKey);
  const liveId = useAppStore((state) => state.liveId);
  const setAllowHomePageRedirect = useAppStore((state) => state.setAllowHomePageRedirect);

  // Exemplo de minigames
  const minigames: Minigame[] = [
    { id: 1, name: 'Quiz Interativo', description: 'Perguntas e respostas com o chat.' },
    { id: 2, name: 'Sorteio Rápido', description: 'Sorteie um vencedor entre os viewers.' },
    { id: 3, name: 'Caça ao Tesouro', description: 'Desafios e pistas no chat.' },
    { id: 4, name: 'Votação', description: 'Deixe o chat decidir algo.' },
    { id: 5, name: 'Very Eggs', description: 'Buckshot Roulette com ovos contra o chat!' },
  ];

  if (!apiKey || !liveId) {
    return (
      <div className="select-minigame-page">
        <div className="container">
          <h2>Erro!</h2>
          <p>Chave de API ou ID da Live não configurados.</p>
          <Link to="/" className="back-to-home-link">Voltar para a página inicial</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="select-minigame-page">
      <div className="container">
        <div className="page-header">
          <h2>Selecione um Minigame</h2>
          <button 
            onClick={() => {
              setAllowHomePageRedirect(false);
              navigate('/');
            }}
            className="button-link back-to-home-button"
          >
            Alterar Configurações
          </button>
        </div>
        <div className="api-info">
          <p>API Key: {apiKey ? '******' : 'Não definida'}</p>
          <p>Live ID: {liveId || 'Não definido'}</p>
        </div>
        <div className="minigame-grid">
          {minigames.map((game) => (
            <div key={game.id} className="minigame-panel">
              <h3>{game.name}</h3>
              <p>{game.description}</p>
              <button onClick={() => {
                if (game.id === 5) { // ID do Very Eggs
                  navigate('/minigames/very-eggs');
                } else {
                  alert(`Iniciando ${game.name}... (Rota não implementada)`);
                }
              }}>
                Selecionar
              </button>
            </div>
          ))}
        </div>
        <ChatDisplay /> {/* Adiciona o componente de chat aqui */}
      </div>
    </div>
  );
}

export default SelectMinigamePage;
