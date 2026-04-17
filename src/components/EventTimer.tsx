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

// Spinning ring loader for planting / defusing
const SpinRing: React.FC<{ color: string; size: number }> = ({ color, size }) => {
  const R = size / 2 - 6;
  const circ = 2 * Math.PI * R;
  return (
    <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, animation: 'none' }}>
      {/* Track */}
      <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
      {/* Spinning arc — 30% of circumference */}
      <circle
        cx={size/2} cy={size/2} r={R} fill="none"
        stroke={color} strokeWidth="3"
        strokeDasharray={`${circ * 0.3} ${circ * 0.7}`}
        strokeLinecap="round"
        style={{
          transformOrigin: `${size/2}px ${size/2}px`,
          animation: 'spinRing 1.2s linear infinite',
          filter: `drop-shadow(0 0 4px ${color})`,
        }}
      />
    </svg>
  );
};

// Draining ring for spike countdown
const DrainRing: React.FC<{ progress: number; color: string; size: number; isLow: boolean }> = ({ progress, color, size, isLow }) => {
  const R = size / 2 - 6;
  const circ = 2 * Math.PI * R;
  const clamped = Math.max(0.001, Math.min(1, progress));
  const offset = circ * (1 - clamped);
  return (
    <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
      <circle
        cx={size/2} cy={size/2} r={R} fill="none"
        stroke={color} strokeWidth="3"
        strokeDasharray={`${circ}`}
        strokeDashoffset={`${offset}`}
        strokeLinecap="round"
        style={{
          filter: `drop-shadow(0 0 ${isLow ? '8px' : '4px'} ${color})`,
          transition: 'stroke-dashoffset 0.22s linear, stroke 0.4s ease',
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
  const RING_SIZE = 180;

  if (phase === 'spike_planting') {
    const TOTAL = plantTotal ?? 60;
    const progress = Math.max(0, Math.min(1, plantTimer / TOTAL));
    const isLow = plantTimer <= 10;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1.5vh, 12px)' }}>
        {/* Plant timer ring with spike icon */}
        <div style={{ position: 'relative', width: RING_SIZE, height: RING_SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <DrainRing progress={progress} color="#ff6a00" size={RING_SIZE} isLow={isLow} />
          <SpinRing color="#ff6a00" size={RING_SIZE} />
          {/* Spike hex icon */}
          <div style={{ animation: 'spikeBeep 1s ease-in-out infinite', zIndex: 1 }}>
            <svg width="58" height="58" viewBox="0 0 60 60">
              <polygon points="30,5 55,17.5 55,42.5 30,55 5,42.5 5,17.5" fill="rgba(255,106,0,0.1)" stroke="#ff6a00" strokeWidth="1.5"/>
              <polygon points="30,14 46,23 46,37 30,46 14,37 14,23" fill="rgba(255,106,0,0.15)" stroke="#ff6a00" strokeWidth="1"/>
              <circle cx="30" cy="30" r="7" fill="#ff6a00" style={{ filter: 'drop-shadow(0 0 6px #ff6a00)' }}/>
            </svg>
          </div>

          {/* Timer digits inside ring */}
          <div style={{
            fontFamily: 'var(--font-timer)',
            fontSize: 'clamp(26px, 4vw, 38px)',
            color: '#ff6a00',
            textShadow: '0 0 16px rgba(255,106,0,0.5)',
            letterSpacing: '3px',
            lineHeight: 1,
            zIndex: 1,
            animation: isLow ? 'timerGlitch 0.8s infinite' : 'none',
          }}>
            {fmt(plantTimer)}
          </div>
        </div>
        <div style={{
          fontFamily: 'var(--font-hud)', fontSize: 'clamp(10px, 1.5vw, 13px)',
          letterSpacing: '4px', color: 'var(--clr-spike)',
          animation: 'blink 1.2s step-end infinite',
        }}>PLANTING...</div>
      </div>
    );
  }

  if (phase === 'spike_planted' || phase === 'defusing') {
    const isDefuse = phase === 'defusing';
    const TOTAL = isDefuse ? (defuseTotal ?? 60) : 40;
    const current = isDefuse ? defuseTimer : spikeTimer;
    const progress = Math.max(0, Math.min(1, current / TOTAL));
    const isLow    = current <= 10;
    const isMid    = !isLow && current <= (isDefuse ? 20 : 20);
    const color    = isDefuse
      ? 'var(--clr-cyan)'
      : isLow ? '#e8392a' : isMid ? '#ff6a00' : '#ff6a00';
    const rawColor = isDefuse
      ? '#00d4f0'
      : isLow ? '#e8392a' : '#ff6a00';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1.5vh, 12px)' }}>
        <div style={{ position: 'relative', width: RING_SIZE, height: RING_SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <DrainRing progress={progress} color={rawColor} size={RING_SIZE} isLow={isLow} />
          {isDefuse && <SpinRing color="#00d4f0" size={RING_SIZE} />}
          {!isDefuse && <SpikePulse size={96} opacity={0.5} />}

          {/* Defusing spinner overlay on top of drain ring */}
          {isDefuse && (
            <svg width={RING_SIZE} height={RING_SIZE} style={{ position: 'absolute', top: 0, left: 0 }}>
              <circle
                cx={RING_SIZE/2} cy={RING_SIZE/2} r={RING_SIZE/2 - 6}
                fill="none" stroke="#00d4f0" strokeWidth="1"
                strokeDasharray="6 14"
                style={{
                  transformOrigin: `${RING_SIZE/2}px ${RING_SIZE/2}px`,
                  animation: 'spinRing 2s linear infinite',
                  opacity: 0.4,
                }}
              />
            </svg>
          )}

          {/* Timer digits inside ring */}
          <div style={{
            fontFamily: 'var(--font-timer)',
            fontSize: 'clamp(28px, 4vw, 40px)',
            color,
            textShadow: `0 0 16px ${rawColor}80, 0 0 32px ${rawColor}40`,
            letterSpacing: '3px',
            lineHeight: 1,
            zIndex: 1,
            animation: isLow ? 'timerGlitch 0.8s infinite' : 'none',
            transition: 'color 0.4s ease',
          }}>
            {fmt(current)}
          </div>
        </div>

        <div style={{
          fontFamily: 'var(--font-hud)',
          fontSize: 'clamp(9px, 1.3vw, 12px)',
          letterSpacing: '4px',
          color: isDefuse ? 'var(--clr-grey)' : isLow ? 'var(--clr-red)' : 'var(--clr-spike)',
          animation: isDefuse ? 'none' : isLow ? 'pulseRed 0.5s infinite' : 'none',
        }}>
          {isDefuse ? 'SPIKE PAUSED' : 'DETONATION'}
        </div>
      </div>
    );
  }

  return null;
};
