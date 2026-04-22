import React from 'react';

interface ConnectionOverlayProps {
  isConnected: boolean;
  backendConnected: boolean;
}

const ConnectionOverlay: React.FC<ConnectionOverlayProps> = ({ isConnected, backendConnected }) => {
  if (isConnected && backendConnected) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '120px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      background: 'rgba(10,10,10,0.95)',
      border: '1px solid #2a2a2a',
      padding: '10px 20px',
      zIndex: 100,
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: '#444',
        animation: 'blink 1s infinite',
      }} />
      <span style={{
        fontFamily: 'var(--font-hud)',
        fontSize: '11px',
        letterSpacing: '3px',
        color: 'var(--clr-grey)',
      }}>
        {isConnected ? 'WAITING FOR ADMIN WS...' : 'CONNECTING TO PI WS...'}
      </span>
    </div>
  );
};
export default ConnectionOverlay;
