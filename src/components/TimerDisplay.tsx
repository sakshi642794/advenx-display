import React from 'react';
import { GamePhase } from '../types/game';

interface TimerDisplayProps {
  phase: GamePhase;
  timeRemaining: number;
  spikeTimer: number;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ phase, timeRemaining, spikeTimer }) => {
  const isSpikeActive = phase === 'spike_planted' || phase === 'defusing';
  const current  = isSpikeActive ? spikeTimer : timeRemaining;
  const total    = isSpikeActive ? 40 : 600;
  const progress = Math.max(0, Math.min(1, current / total));
  const isLow    = isSpikeActive ? current <= 10 : current <= 60;
  const isMid    = !isLow && (isSpikeActive ? current <= 20 : current <= 120);

  const timerColor =
    isLow ? 'var(--clr-red)'
    : isMid ? 'var(--clr-spike)'
    : isSpikeActive ? 'var(--clr-spike)'
    : 'var(--clr-white)';

  const glowColor =
    isLow ? 'var(--clr-red-glow)'
    : isMid || isSpikeActive ? 'var(--clr-spike-glow)'
    : 'transparent';

  const ringColor =
    isLow ? '#e8392a'
    : isMid || isSpikeActive ? '#ff6a00'
    : '#00d4f0';

  const R = 110, cx = 160, cy = 160;
  const circumference = 2 * Math.PI * R;
  const dash = circumference * progress;
  const gap  = circumference - dash;

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '320px', height: '320px' }}>

      {/* SVG ring */}
      <svg width="320" height="320" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        {/* Background track */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
        {/* Progress arc */}
        <circle
          cx={cx} cy={cy} r={R} fill="none"
          stroke={ringColor} strokeWidth="3"
          strokeDasharray={`${dash} ${gap}`}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 6px ${ringColor})`,
            transition: 'stroke-dasharray 0.2s linear, stroke 0.5s ease',
          }}
        />
        {/* Tick marks */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle  = (i / 12) * 2 * Math.PI - Math.PI / 2;
          const filled = (i / 12) <= progress;
          const x1 = cx + (R - 10) * Math.cos(angle), y1 = cy + (R - 10) * Math.sin(angle);
          const x2 = cx + (R + 2)  * Math.cos(angle), y2 = cy + (R + 2)  * Math.sin(angle);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={filled ? ringColor : 'rgba(255,255,255,0.08)'} strokeWidth="2" strokeLinecap="round" />;
        })}
      </svg>

      {/* Outer dashed decoration ring */}
      <svg width="320" height="320" style={{ position: 'absolute', top: 0, left: 0 }}>
        <circle cx={cx} cy={cy} r={R + 16} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="4 8" />
        <circle cx={cx} cy={cy} r={R - 16} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      </svg>

      {/* Timer digits */}
      <div style={{
        fontFamily: 'var(--font-timer)',
        fontSize: 'clamp(52px, 9vw, 72px)',
        color: timerColor,
        textShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}`,
        letterSpacing: '6px',
        zIndex: 1, lineHeight: 1,
        animation: isLow ? 'timerGlitch 0.8s infinite' : 'none',
        transition: 'color 0.5s ease, text-shadow 0.5s ease',
      }}>
        {fmt(current)}
      </div>

      {/* Inner label */}
      <div style={{
        position: 'absolute', bottom: '72px', left: '50%', transform: 'translateX(-50%)',
        fontFamily: 'var(--font-hud)', fontSize: '9px', letterSpacing: '3px',
        color: 'var(--clr-grey)', whiteSpace: 'nowrap',
      }}>
        {isSpikeActive ? 'DETONATION' : 'ROUND TIME'}
      </div>

      {/* Low-time warning dots */}
      {isLow && (
        <div style={{
          position: 'absolute', top: '68px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: '5px',
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: '5px', height: '5px', borderRadius: '50%',
              background: 'var(--clr-red)',
              animation: `blink ${0.5 + i * 0.1}s step-end infinite ${i * 0.15}s`,
            }} />
          ))}
        </div>
      )}
    </div>
  );
};
