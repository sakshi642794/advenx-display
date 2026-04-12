import React from 'react';
import { GamePhase } from '../types/game';

interface TimerDisplayProps {
  phase: GamePhase;
  timeRemaining: number;
  spikeTimer: number;
  compact?: boolean;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ phase, timeRemaining, spikeTimer, compact = false }) => {
  const isSpikeActive = phase === 'spike_planted' || phase === 'defusing';
  const current  = isSpikeActive ? spikeTimer : timeRemaining;
  const isLow    = isSpikeActive ? current <= 10 : current <= 60;
  const isMid    = !isLow && (isSpikeActive ? current <= 20 : current <= 120);

  const timerColor =
    isLow ? 'var(--clr-red)'
    : isMid || isSpikeActive ? 'var(--clr-spike)'
    : 'var(--clr-white)';

  const glowColor =
    isLow ? 'var(--clr-red-glow)'
    : isMid || isSpikeActive ? 'var(--clr-spike-glow)'
    : 'rgba(240,240,240,0.15)';

  if (compact) {
    return (
      <div style={{
        fontFamily: 'var(--font-timer)',
        fontSize: 'clamp(18px, 2.5vw, 28px)',
        color: 'rgba(240,240,240,0.35)',
        letterSpacing: '3px',
        lineHeight: 1,
        transition: 'color 0.5s ease',
      }}>
        {fmt(timeRemaining)}
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: 'var(--font-timer)',
      fontSize: 'clamp(64px, 12vw, 130px)',
      color: timerColor,
      textShadow: `0 0 30px ${glowColor}, 0 0 60px ${glowColor}`,
      letterSpacing: 'clamp(4px, 1vw, 10px)',
      lineHeight: 1,
      animation: isLow ? 'timerGlitch 0.8s infinite' : 'none',
      transition: 'color 0.5s ease, text-shadow 0.5s ease, font-size 0.4s ease',
    }}>
      {fmt(current)}
    </div>
  );
};
