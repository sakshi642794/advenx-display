import React from 'react';
import { GameScreen } from './components/GameScreen';
import { useGameState } from './hooks/useGameState';
import { useWebSocket } from './hooks/useWebSocket';
import './styles/globals.css';

const App: React.FC = () => {
  const {
    gameState, isConnected,
    handleMessage, handleConnect, handleDisconnect,
    markAttackersReady, markDefendersReady, resetGame,
  } = useGameState();

  const { send } = useWebSocket({
    onMessage: handleMessage,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
  });

  return (
    <>
      <GameScreen
        gameState={gameState}
        isConnected={isConnected}
        onSend={send}
        onAttackersReady={markAttackersReady}
        onDefendersReady={markDefendersReady}
        onReset={resetGame}
      />
    </>
  );
};

export default App;
