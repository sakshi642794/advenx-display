import React from 'react';
import { Header } from './Header';
import { StatusDisplay } from './StatusDisplay';
import { TeamRow } from './TeamRow';
import { ConnectionOverlay } from './ConnectionOverlay';
import { HudBrackets } from './HudBrackets';
import { GameState } from '../types/game';

interface GameScreenProps { gameState: GameState; isConnected: boolean; }

export const GameScreen: React.FC<GameScreenProps> = ({ gameState, isConnected }) => {
  const { phase } = gameState;

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

      {/* Hairline */}
      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--clr-red), transparent)', opacity: 0.3, flexShrink: 0 }} />

      {/* Main area — takes all remaining space */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <StatusDisplay
          phase={phase}
          statusMessage={gameState.statusMessage}
          timeRemaining={gameState.timeRemaining}
          spikeTimer={gameState.spikeTimer}
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
        <TeamRow team="attacker" score={gameState.attackersScore} phase={phase} />
        <TeamRow team="defender" score={gameState.defendersScore} phase={phase} />
      </div>

      <ConnectionOverlay isConnected={isConnected} />
    </div>
  );
};
