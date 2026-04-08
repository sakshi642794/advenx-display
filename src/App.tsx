import React from 'react';
import { GameScreen } from './components/GameScreen';
import { useGameState } from './hooks/useGameState';
import { useWebSocket } from './hooks/useWebSocket';
import './styles/globals.css';

const App: React.FC = () => {
  const { gameState, isConnected, handleMessage, handleConnect, handleDisconnect } = useGameState();

  useWebSocket({
    onMessage: handleMessage,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
  });

  return <GameScreen gameState={gameState} isConnected={isConnected} />;
};

export default App;
