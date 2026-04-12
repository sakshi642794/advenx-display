import React from 'react';
import { GamePhase } from '../types/game';

interface EventTimerProps {
  phase: GamePhase;
  spikeTimer: number;
  timeRemaining: number;
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
  const dash = circ * progress;
  const gap  = circ - dash;
  return (
    <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
      <circle
        cx={size/2} cy={size/2} r={R} fill="none"
        stroke={color} strokeWidth="3"
        strokeDasharray={`${dash} ${gap}`}
        strokeLinecap="round"
        style={{
          filter: `drop-shadow(0 0 ${isLow ? '8px' : '4px'} ${color})`,
          transition: 'stroke-dasharray 0.22s linear, stroke 0.4s ease',
        }}
      />
    </svg>
  );
};

export const EventTimer: React.FC<EventTimerProps> = ({ phase, spikeTimer, timeRemaining }) => {
  const RING_SIZE = 180;

  if (phase === 'spike_planting') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1.5vh, 12px)' }}>
        {/* Spinning ring with spike icon */}
        <div style={{ position: 'relative', width: RING_SIZE, height: RING_SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <SpinRing color="#ff6a00" size={RING_SIZE} />
          {/* Spike hex icon */}
          <div style={{ animation: 'spikeBeep 1s ease-in-out infinite', zIndex: 1 }}>
            <svg width="60" height="60" viewBox="0 0 60 60">
              <polygon points="30,5 55,17.5 55,42.5 30,55 5,42.5 5,17.5" fill="rgba(255,106,0,0.1)" stroke="#ff6a00" strokeWidth="1.5"/>
              <polygon points="30,14 46,23 46,37 30,46 14,37 14,23" fill="rgba(255,106,0,0.15)" stroke="#ff6a00" strokeWidth="1"/>
              <circle cx="30" cy="30" r="7" fill="#ff6a00" style={{ filter: 'drop-shadow(0 0 6px #ff6a00)' }}/>
            </svg>
          </div>
          {/* Expanding rings */}
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '1.5px solid rgba(255,106,0,0.5)',
              animation: `ringExpand 1.8s ease-out ${i * 0.6}s infinite`,
              pointerEvents: 'none',
            }} />
          ))}
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
    const TOTAL    = 40;
    const progress = Math.max(0, Math.min(1, spikeTimer / TOTAL));
    const isLow    = spikeTimer <= 10;
    const isMid    = !isLow && spikeTimer <= 20;
    const color    = phase === 'defusing'
      ? 'var(--clr-cyan)'
      : isLow ? '#e8392a' : isMid ? '#ff6a00' : '#ff6a00';
    const rawColor = phase === 'defusing'
      ? '#00d4f0'
      : isLow ? '#e8392a' : '#ff6a00';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 1.5vh, 12px)' }}>
        <div style={{ position: 'relative', width: RING_SIZE, height: RING_SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <DrainRing progress={progress} color={rawColor} size={RING_SIZE} isLow={isLow} />

          {/* Defusing spinner overlay on top of drain ring */}
          {phase === 'defusing' && (
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
            {fmt(spikeTimer)}
          </div>
        </div>

        <div style={{
          fontFamily: 'var(--font-hud)',
          fontSize: 'clamp(9px, 1.3vw, 12px)',
          letterSpacing: '4px',
          color: phase === 'defusing' ? 'var(--clr-cyan)' : isLow ? 'var(--clr-red)' : 'var(--clr-spike)',
          animation: phase === 'defusing' ? 'pulseCyan 1s infinite' : isLow ? 'pulseRed 0.5s infinite' : 'none',
        }}>
          {phase === 'defusing' ? 'DEFUSING' : 'DETONATION'}
        </div>
      </div>
    );
  }

  return null;
};
