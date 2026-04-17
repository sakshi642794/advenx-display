import React, { useState, useRef } from 'react';
import { GameState, OperatorMessage } from '../types/game';

interface OperatorPanelProps {
  gameState: GameState;
  isConnected: boolean;
  onSend: (msg: OperatorMessage) => void;
  onAttackersReady: () => void;
  onDefendersReady: () => void;
  onReset: () => void;
}

export const OperatorPanel: React.FC<OperatorPanelProps> = ({
  gameState, isConnected, onSend, onAttackersReady, onDefendersReady, onReset,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<number | null>(null);

  const handleSecretToggle = () => {
    clickCountRef.current += 1;

    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
    }

    clickTimerRef.current = window.setTimeout(() => {
      clickCountRef.current = 0;
      clickTimerRef.current = null;
    }, 1200);

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      if (clickTimerRef.current) {
        window.clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      setIsVisible(v => !v);
    }
  };

  const isAwaiting = gameState.phase === 'awaiting' || gameState.phase === 'round_over';
  const open = isAwaiting && isVisible;

  const bothReady = gameState.attackersReady && gameState.defendersReady;
  const handleAttackersReady = () => {
    onAttackersReady();
    onSend({ event: 'attackers_ready' });
  };

  const handleDefendersReady = () => {
    onDefendersReady();
    onSend({ event: 'defenders_ready' });
  };

  const handleStartGame = () => {
    onSend({ event: 'start_game' });
  };

  const handleReset = () => {
    onReset();
    onSend({ event: 'reset_game' });
  };

  return (
    <>
      {/* Hidden toggle hotspot (bottom-right) */}
      <div
        onClick={handleSecretToggle}
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: '48px',
          height: '48px',
          zIndex: 250,
          cursor: 'pointer',
          background: 'transparent',
        }}
      />

      {/* -- Slide-up panel -- */}
      {isVisible && (
      <div style={{
        position: 'fixed', bottom: 0, right: 0,
        width: '300px',
        background: '#0c0c0c',
        border: '1px solid #222',
        borderBottom: 'none',
        borderRight: 'none',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 199,
        padding: '20px',
        boxShadow: open ? '-4px -4px 40px rgba(0,0,0,0.8)' : 'none',
      }}>
        {/* Panel header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontFamily: 'var(--font-hud)', fontSize: '11px', letterSpacing: '3px', color: 'var(--clr-grey)' }}>
            OPERATOR PANEL
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: isConnected ? 'var(--clr-red)' : '#333',
              boxShadow: isConnected ? '0 0 6px var(--clr-red-glow)' : 'none',
            }} />
            <span style={{ fontFamily: 'var(--font-hud)', fontSize: '9px', letterSpacing: '2px', color: '#444' }}>
              {isConnected ? 'WS LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: '#1c1c1c', marginBottom: '20px' }} />

        {/* Ready buttons - only shown in awaiting/round_over */}
        {isAwaiting && (
          <>
            <div style={{ fontFamily: 'var(--font-hud)', fontSize: '9px', letterSpacing: '3px', color: '#444', marginBottom: '12px' }}>
              TEAM READY STATUS
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {/* Attackers ready */}
              <button
                onClick={handleAttackersReady}
                disabled={gameState.attackersReady || !isConnected}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', border: '1px solid',
                  borderColor: gameState.attackersReady ? 'var(--clr-red)' : 'var(--clr-red-dim)',
                  background: gameState.attackersReady ? 'var(--clr-red-soft)' : 'transparent',
                  color: gameState.attackersReady ? 'var(--clr-red)' : '#555',
                  fontFamily: 'var(--font-hud)', fontSize: '11px', letterSpacing: '3px',
                  cursor: gameState.attackersReady ? 'default' : 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: gameState.attackersReady ? '0 0 16px var(--clr-red-glow), inset 0 0 16px rgba(232,57,42,0.05)' : 'none',
                }}
              >
                <span>ATTACKERS</span>
                <ReadyBadge ready={gameState.attackersReady} color="red" />
              </button>

              {/* Defenders ready */}
              <button
                onClick={handleDefendersReady}
                disabled={gameState.defendersReady || !isConnected}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', border: '1px solid',
                  borderColor: gameState.defendersReady ? 'var(--clr-cyan)' : 'var(--clr-cyan-dim)',
                  background: gameState.defendersReady ? 'var(--clr-cyan-soft)' : 'transparent',
                  color: gameState.defendersReady ? 'var(--clr-cyan)' : '#555',
                  fontFamily: 'var(--font-hud)', fontSize: '11px', letterSpacing: '3px',
                  cursor: gameState.defendersReady ? 'default' : 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: gameState.defendersReady ? '0 0 16px var(--clr-cyan-glow), inset 0 0 16px rgba(0,212,240,0.05)' : 'none',
                }}
              >
                <span>DEFENDERS</span>
                <ReadyBadge ready={gameState.defendersReady} color="cyan" />
              </button>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: '#1c1c1c', marginBottom: '16px' }} />

            {/* Start game button - only active when both ready */}
            <button
              onClick={handleStartGame}
              disabled={!bothReady || !isConnected}
              style={{
                width: '100%', padding: '14px',
                border: '1px solid',
                borderColor: bothReady && isConnected ? 'var(--clr-white)' : '#222',
                background: bothReady && isConnected ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: bothReady && isConnected ? 'var(--clr-white)' : '#333',
                fontFamily: 'var(--font-hud)', fontSize: '12px', letterSpacing: '4px',
                cursor: bothReady && isConnected ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                boxShadow: bothReady && isConnected ? '0 0 20px rgba(255,255,255,0.08)' : 'none',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Animated background when both ready */}
              {bothReady && isConnected && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
                  animation: 'scanSweep 2s linear infinite',
                }} />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>START GAME</span>
            </button>
          </>
        )}

        {/* Reset - always available */}
        <button
          onClick={handleReset}
          style={{
            width: '100%', padding: '10px', marginTop: isAwaiting ? '10px' : '0',
            border: '1px solid #222', background: 'transparent',
            color: '#444', fontFamily: 'var(--font-hud)',
            fontSize: '10px', letterSpacing: '3px', cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#444';
            (e.currentTarget as HTMLButtonElement).style.color = '#888';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#222';
            (e.currentTarget as HTMLButtonElement).style.color = '#444';
          }}
        >
          RESET GAME
        </button>
      </div>
      )}

    </>
  );
};

/* -- Sub-components -- */

const ReadyBadge: React.FC<{ ready: boolean; color: 'red' | 'cyan' }> = ({ ready, color }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '6px',
    fontFamily: 'var(--font-hud)', fontSize: '9px', letterSpacing: '2px',
  }}>
    <div style={{
      width: '6px', height: '6px', borderRadius: '50%',
      background: ready
        ? (color === 'red' ? 'var(--clr-red)' : 'var(--clr-cyan)')
        : '#2a2a2a',
      boxShadow: ready
        ? `0 0 8px ${color === 'red' ? 'var(--clr-red-glow)' : 'var(--clr-cyan-glow)'}`
        : 'none',
      transition: 'all 0.3s ease',
    }} />
    <span>{ready ? 'READY' : 'WAITING'}</span>
  </div>
);


