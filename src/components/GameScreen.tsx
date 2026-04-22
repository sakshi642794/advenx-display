import React from 'react';
import { Header } from './Header';
import { StatusDisplay } from './StatusDisplay';
import { TeamRow } from './TeamRow';
import ConnectionOverlay from './ConnectionOverlay';
import { HudBrackets } from './HudBrackets';
import { OperatorPanel } from './OperatorPanel';
import { DebugOverlay } from './DebugOverlay';
import { GameState, OperatorMessage } from '../types/game';

interface GameScreenProps {
  gameState: GameState;
  isConnected: boolean;
  isAdminConnected: boolean;
  onSend: (msg: OperatorMessage) => void;
  onAttackersReady: () => void;
  onDefendersReady: () => void;
  onReset: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  gameState,
  isConnected,
  isAdminConnected,
  onSend,
  onAttackersReady,
  onDefendersReady,
  onReset,
}) => {
  const { phase } = gameState;
  const announcementColor =
    gameState.announcementTone === 'fast' ? 'var(--clr-red)'
    : gameState.announcementTone === 'slow' ? 'var(--clr-cyan)'
    : 'var(--clr-white)';
  const announcementGlow =
    gameState.announcementTone === 'fast' ? 'var(--clr-red-glow)'
    : gameState.announcementTone === 'slow' ? 'var(--clr-cyan-glow)'
    : 'rgba(255,255,255,0.18)';

  const ambientColor =
    phase === 'spike_planted' || phase === 'attackers_win' ? 'rgba(255,106,0,0.04)'
    : phase === 'defusing'    || phase === 'defenders_win' ? 'rgba(0,212,240,0.04)'
    : phase === 'spike_planting' ? 'rgba(232,57,42,0.03)'
    : 'transparent';

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column',
      background: 'var(--clr-bg)', overflow: 'hidden', position: 'relative',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 50% 45%, ${ambientColor} 0%, transparent 65%)`,
        transition: 'background 1.2s ease',
      }} />

      <HudBrackets phase={phase} />
      <Header gameState={gameState} isConnected={isConnected} />

      {gameState.globalAnnouncement && (
        <div style={{
          position: 'absolute',
          top: '66px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          maxWidth: 'min(88vw, 920px)',
          padding: '10px 18px',
          border: `1px solid ${announcementColor}`,
          background: 'rgba(10,10,10,0.88)',
          color: announcementColor,
          fontFamily: 'var(--font-hud)',
          fontSize: 'clamp(10px, 1.2vw, 13px)',
          letterSpacing: '3px',
          textAlign: 'center',
          textShadow: `0 0 12px ${announcementGlow}`,
          boxShadow: `0 0 24px ${announcementGlow}`,
          animation: 'fadeIn 0.25s ease',
          pointerEvents: 'none',
        }}>
          {gameState.globalAnnouncement}
        </div>
      )}

      {/* Hairline */}
      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--clr-red), transparent)', opacity: 0.3, flexShrink: 0 }} />

      {/* Main area — takes all remaining space */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <StatusDisplay
          phase={phase}
          statusMessage={gameState.statusMessage}
          currentRound={gameState.currentRound}
          timeRemaining={gameState.timeRemaining}
          plantTimer={gameState.plantTimer}
          plantTotal={gameState.plantTotal}
          spikeTimer={gameState.spikeTimer}
          defuseTimer={gameState.defuseTimer}
          defuseTotal={gameState.defuseTotal}
          roundStartRemaining={gameState.roundStartRemaining}
          attackersReady={gameState.attackersReady}
          defendersReady={gameState.defendersReady}
        />
      </div>

      {/* Gradient line above footer */}
      <div style={{ height: '1px', background: 'linear-gradient(90deg, var(--clr-red-dim), transparent 40%, transparent 60%, var(--clr-cyan-dim))', flexShrink: 0 }} />

      {/* Footer — player cards */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        padding: 'clamp(8px, 1.5vh, 14px) clamp(12px, 2vw, 24px) clamp(10px, 1.8vh, 18px)',
        background: 'var(--clr-bg2)',
        borderTop: '1px solid #111',
        flexShrink: 0,
      }}>
        <TeamRow team="attacker" score={gameState.attackersScore} phase={phase} deadPlayers={gameState.deadPlayers} reviveFx={gameState.reviveFx} />
        <TeamRow team="defender" score={gameState.defendersScore} phase={phase} deadPlayers={gameState.deadPlayers} reviveFx={gameState.reviveFx} />
      </div>

      <ConnectionOverlay
        isConnected={isConnected}
        backendConnected={isAdminConnected}
      />

      <OperatorPanel
        gameState={gameState}
        isConnected={isConnected}
        onSend={onSend}
        onAttackersReady={onAttackersReady}
        onDefendersReady={onDefendersReady}
        onReset={onReset}
      />

      <DebugOverlay isConnected={isConnected} backendConnected={isAdminConnected} />
    </div>
  );
};
