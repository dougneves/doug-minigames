import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import SelectMinigamePage from './components/SelectMinigamePage';
import VeryEggs from './components/minigames/VeryEggs'; // Importa o novo componente
// Se você tiver um CSS global para App ou um layout, importe aqui
// import './App.scss'; 

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/select-minigame" element={<SelectMinigamePage />} />
      <Route path="/minigames/very-eggs" element={<VeryEggs />} /> {/* Rota para o VeryEggs */}
      {/* Adicione outras rotas aqui conforme necessário */}
    </Routes>
  );
}

export default App;
