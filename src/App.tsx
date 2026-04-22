import React from 'react';
import { GameScreen } from './components/GameScreen';
import { useGameState } from './hooks/useGameState';
import { getConfiguredWsUrl, useWebSocket } from './hooks/useWebSocket';
import './styles/globals.css';

const App: React.FC = () => {
  const {
    gameState, isConnected,
    handleMessage, handleAdminMessage, handleConnect, handleDisconnect,
    markAttackersReady, markDefendersReady, resetGame,
  } = useGameState();
  const [isAdminConnected, setIsAdminConnected] = React.useState(false);
  const handleAdminConnect = React.useCallback(() => setIsAdminConnected(true), []);
  const handleAdminDisconnect = React.useCallback(() => setIsAdminConnected(false), []);

  const engineWsUrl = getConfiguredWsUrl('engine');
  const adminWsUrl = getConfiguredWsUrl('admin');

  const { send } = useWebSocket({
    url: engineWsUrl,
    onMessage: handleMessage,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    label: 'ADVENX ENGINE WS',
  });

  useWebSocket({
    url: adminWsUrl,
    onMessage: handleAdminMessage,
    onConnect: handleAdminConnect,
    onDisconnect: handleAdminDisconnect,
    label: 'ADVENX ADMIN WS',
    canSend: false,
  });

  return (
    <>
      <GameScreen
        gameState={gameState}
        isConnected={isConnected}
        isAdminConnected={isAdminConnected}
        onSend={send}
        onAttackersReady={markAttackersReady}
        onDefendersReady={markDefendersReady}
        onReset={resetGame}
      />
    </>
  );
};

export default App;
