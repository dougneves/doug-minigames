import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';
import './HomePage.scss';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const setCredentials = useAppStore((state) => state.setCredentials);
  const storedApiKey = useAppStore((state) => state.apiKey);
  const storedLiveId = useAppStore((state) => state.liveId);
  const isLoadingLiveChatId = useAppStore((state) => state.isLoadingLiveChatId);
  const liveChatIdError = useAppStore((state) => state.liveChatIdError);
  const [apiKey, setApiKey] = useState(storedApiKey || '');
  const [liveId, setLiveId] = useState(storedLiveId || '');

  useEffect(() => {
    setApiKey(storedApiKey || '');
    setLiveId(storedLiveId || '');
  }, [storedApiKey, storedLiveId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!apiKey || !liveId) return; // Validação básica
    // A navegação será tratada pelo useEffect abaixo
    await setCredentials(apiKey, liveId);
    navigate('/select-minigame');
  };

  return (
    <div className="home-page">
      <div className="panel">
        <h2>Configuração da Live do YouTube</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="apiKey">Chave de API do YouTube:</label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
              placeholder="Sua chave de API"
              required
              disabled={isLoadingLiveChatId}
            />
          </div>
          <div className="input-group">
            <label htmlFor="liveId">ID da Live:</label>
            <input
              type="text"
              id="liveId"
              value={liveId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLiveId(e.target.value)}
              placeholder="ID da sua transmissão ao vivo"
              required
              disabled={isLoadingLiveChatId}
            />
          </div>
          <button type="submit" disabled={isLoadingLiveChatId}>
            {isLoadingLiveChatId ? 'Conectando...' : 'Conectar'}
          </button>
          {isLoadingLiveChatId && <p className="loading-message">Buscando ID do chat ao vivo...</p>}
          {liveChatIdError && <p className="error-message">{liveChatIdError}</p>}
        </form>
      </div>
    </div>
  );
}

export default HomePage;
