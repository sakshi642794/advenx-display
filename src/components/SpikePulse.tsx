import React from 'react';

interface SpikePulseProps {
  size?: number;
  opacity?: number;
}

export const SpikePulse: React.FC<SpikePulseProps> = ({ size = 96, opacity = 0.55 }) => {
  const iconSize = size * 0.58;

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
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px solid rgba(255,106,0,0.55)',
            animation: `ringExpand 1.8s ease-out ${i * 0.6}s infinite`,
            opacity: 0,
          }}
        />
      ))}

      <div
        style={{
          width: `${iconSize}px`,
          height: `${iconSize}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'spikeBeep 1s ease-in-out infinite',
        }}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 80 80">
          <polygon points="40,8 62,20 62,44 40,56 18,44 18,20" fill="rgba(255,106,0,0.12)" stroke="#e09762" strokeWidth="1.5" />
          <polygon points="40,18 53,25 53,39 40,46 27,39 27,25" fill="rgba(255,106,0,0.2)" stroke="#e09762" strokeWidth="1" />
          <circle cx="40" cy="32" r="6" fill="#e09762" style={{ filter: 'drop-shadow(0 0 6px #e09762)' }} />
        </svg>
      </div>
    </div>
  );
};
