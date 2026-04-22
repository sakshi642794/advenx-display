import React from 'react';

interface SpikePulseProps {
  size?: number;
  opacity?: number;
}

export const SpikePulse: React.FC<SpikePulseProps> = ({ size = 96, opacity = 0.55 }) => {
  const coreSize = size * 0.52;

  return (
    <div
      style={{
        position: 'absolute',
        inset: '50% auto auto 50%',
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        opacity,
      }}
    >
      {[0, 1].map(i => (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: `${10 + i * 10}px`,
            borderRadius: '50%',
            border: '1px solid rgba(255,106,0,0.28)',
            boxShadow: '0 0 10px rgba(255,106,0,0.16)',
            animation: `pulseRed 1.6s ${i * 0.2}s infinite`,
            opacity: 0.5 - i * 0.15,
          }}
        />
      ))}

      <div
        style={{
          width: `${coreSize}px`,
          height: `${coreSize}px`,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,106,0,0.26) 0%, rgba(255,106,0,0.08) 55%, transparent 72%)',
          boxShadow: '0 0 24px rgba(255,106,0,0.18)',
          animation: 'spikeBeep 1s ease-in-out infinite',
        }}
      />
    </div>
  );
};
