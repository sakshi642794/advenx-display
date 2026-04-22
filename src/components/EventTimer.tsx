import React from 'react';
import { GamePhase } from '../types/game';
import { SpikePulse } from './SpikePulse';

interface EventTimerProps {
  phase: GamePhase;
  plantTimer: number;
  plantTotal: number | null;
  spikeTimer: number;
  defuseTimer: number;
  defuseTotal: number | null;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

const GlowHalo: React.FC<{ color: string; size: number; intensity?: number }> = ({ color, size, intensity = 0.5 }) => {
  const inset = Math.max(8, size * 0.06);
  return (
    <div
      style={{
        position: 'absolute',
        inset: `${inset}px`,
        borderRadius: '50%',
        boxShadow: `0 0 ${Math.round(size * 0.08)}px ${color}, inset 0 0 ${Math.round(size * 0.05)}px ${color}`,
        opacity: intensity,
        pointerEvents: 'none',
      }}
    />
  );
};

const SpinRing: React.FC<{ color: string; size: number }> = ({ color, size }) => {
  const radius = size / 2 - 7;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray={`${circumference * 0.3} ${circumference * 0.7}`}
        strokeLinecap="round"
        style={{
          transformOrigin: `${size / 2}px ${size / 2}px`,
          animation: 'spinRing 1.2s linear infinite',
          filter: `drop-shadow(0 0 2px ${color})`,
        }}
      />
    </svg>
  );
};

const DrainRing: React.FC<{ progress: number; color: string; size: number; isLow: boolean }> = ({ progress, color, size, isLow }) => {
  const radius = size / 2 - 7;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0.001, Math.min(1, progress));
  const offset = circumference * (1 - clamped);

  return (
    <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)', overflow: 'visible' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={`${offset}`}
        strokeLinecap="round"
        style={{
          filter: `drop-shadow(0 0 ${isLow ? '4px' : '2px'} ${color})`,
          transition: 'stroke 0.35s ease',
        }}
      />
    </svg>
  );
};

export const EventTimer: React.FC<EventTimerProps> = ({
  phase,
  plantTimer,
  plantTotal,
  spikeTimer,
  defuseTimer,
  defuseTotal,
}) => {
  const ringSize = 180;

  if (phase === 'spike_planting') {
    const total = plantTotal ?? 60;
    const progress = Math.max(0, Math.min(1, plantTimer / total));
    const isLow = plantTimer <= 10;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1.5vh, 12px)' }}>
        <div style={{ position: 'relative', width: ringSize, height: ringSize, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <GlowHalo color="rgba(255,106,0,0.24)" size={ringSize} intensity={isLow ? 0.78 : 0.48} />
          <DrainRing progress={progress} color="#ff6a00" size={ringSize} isLow={isLow} />
          <div
            style={{
              fontFamily: 'var(--font-timer)',
              fontSize: 'clamp(26px, 4vw, 38px)',
              color: '#ff6a00',
              textShadow: '0 0 16px rgba(255,106,0,0.45)',
              letterSpacing: '3px',
              lineHeight: 1,
              zIndex: 1,
              animation: isLow ? 'timerGlitch 0.8s infinite' : 'none',
            }}
          >
            {fmt(plantTimer)}
          </div>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-hud)',
            fontSize: 'clamp(10px, 1.5vw, 13px)',
            letterSpacing: '4px',
            color: 'var(--clr-spike)',
            animation: 'blink 1.2s step-end infinite',
          }}
        >
          PLANTING...
        </div>
      </div>
    );
  }

  if (phase === 'spike_planted' || phase === 'defusing') {
    const isDefuse = phase === 'defusing';
    const total = isDefuse ? (defuseTotal ?? 60) : 40;
    const current = isDefuse ? defuseTimer : spikeTimer;
    const progress = Math.max(0, Math.min(1, current / total));
    const isLow = current <= 10;
    const color = isDefuse ? 'var(--clr-cyan)' : isLow ? 'var(--clr-red)' : 'var(--clr-spike)';
    const rawColor = isDefuse ? '#00d4f0' : isLow ? '#e8392a' : '#ff6a00';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1.5vh, 12px)' }}>
        <div style={{ position: 'relative', width: ringSize, height: ringSize, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <GlowHalo
            color={isDefuse ? 'rgba(0,212,240,0.22)' : isLow ? 'rgba(232,57,42,0.24)' : 'rgba(255,106,0,0.22)'}
            size={ringSize}
            intensity={isLow ? 0.82 : 0.48}
          />
          <DrainRing progress={progress} color={rawColor} size={ringSize} isLow={isLow} />
          {isDefuse && <SpinRing color="#00d4f0" size={ringSize} />}
          {!isDefuse && <SpikePulse size={96} opacity={0.42} />}

          {isDefuse && (
            <svg width={ringSize} height={ringSize} style={{ position: 'absolute', top: 0, left: 0 }}>
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringSize / 2 - 7}
                fill="none"
                stroke="#00d4f0"
                strokeWidth="1"
                strokeDasharray="6 14"
                style={{
                  transformOrigin: `${ringSize / 2}px ${ringSize / 2}px`,
                  animation: 'spinRing 2s linear infinite',
                  opacity: 0.25,
                }}
              />
            </svg>
          )}

          <div
            style={{
              fontFamily: 'var(--font-timer)',
              fontSize: 'clamp(28px, 4vw, 40px)',
              color,
              textShadow: `0 0 14px ${rawColor}66, 0 0 26px ${rawColor}33`,
              letterSpacing: '3px',
              lineHeight: 1,
              zIndex: 1,
              animation: isLow ? 'timerGlitch 0.8s infinite' : 'none',
              transition: 'color 0.3s ease, text-shadow 0.3s ease',
            }}
          >
            {fmt(current)}
          </div>
        </div>

        <div
          style={{
            fontFamily: 'var(--font-hud)',
            fontSize: 'clamp(9px, 1.3vw, 12px)',
            letterSpacing: '4px',
            color: isDefuse ? 'var(--clr-grey)' : isLow ? 'var(--clr-red)' : 'var(--clr-spike)',
            animation: isDefuse ? 'none' : isLow ? 'pulseRed 0.5s infinite' : 'none',
          }}
        >
          {isDefuse ? 'SPIKE PAUSED' : 'DETONATION'}
        </div>
      </div>
    );
  }

  return null;
};
