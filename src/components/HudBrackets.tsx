import React from 'react';
import { GamePhase } from '../types/game';

interface HudBracketsProps { phase: GamePhase; }

export const HudBrackets: React.FC<HudBracketsProps> = ({ phase }) => {
  const color =
    phase === 'attackers_win' || phase === 'spike_planted' || phase === 'spike_planting' ? 'var(--clr-red)'
    : phase === 'defenders_win' || phase === 'defusing' ? 'var(--clr-cyan)'
    : 'rgba(255,255,255,0.15)';

  const size = 28;
  const thickness = 2;
  const cornerStyle = (top?: boolean, left?: boolean): React.CSSProperties => ({
    position:'absolute',
    top:  top    ? '12px' : 'auto',
    bottom: !top ? '12px' : 'auto',
    left:  left  ? '12px' : 'auto',
    right: !left ? '12px' : 'auto',
    width:`${size}px`, height:`${size}px`,
    borderTop:    top    ? `${thickness}px solid ${color}` : 'none',
    borderBottom: !top   ? `${thickness}px solid ${color}` : 'none',
    borderLeft:   left   ? `${thickness}px solid ${color}` : 'none',
    borderRight:  !left  ? `${thickness}px solid ${color}` : 'none',
    boxShadow: `0 0 8px ${color === 'rgba(255,255,255,0.15)' ? 'transparent' : color}`,
    transition:'all 0.5s ease, border-color 0.4s ease, box-shadow 0.4s ease',
    pointerEvents:'none',
  });

  return (
    <>
      <div style={cornerStyle(true, true)} />
      <div style={cornerStyle(true, false)} />
      <div style={cornerStyle(false, true)} />
      <div style={cornerStyle(false, false)} />
    </>
  );
};
