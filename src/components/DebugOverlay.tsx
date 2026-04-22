import React, { useEffect, useMemo, useState } from 'react';
import { WebSocketMessage } from '../types/game';

interface DebugOverlayProps {
  isConnected: boolean;
  backendConnected: boolean;
}

function formatMs(ms: number) {
  try {
    return new Date(ms).toLocaleTimeString();
  } catch {
    return String(ms);
  }
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({ isConnected, backendConnected }) => {
  const enabled = (import.meta.env.VITE_HUD_DEBUG || '') === '1';
  const [lastMsg, setLastMsg] = useState<WebSocketMessage | null>(null);
  const [lastAt, setLastAt] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent<WebSocketMessage>).detail;
      if (!detail) return;
      setLastMsg(detail);
      setLastAt(Date.now());
    };

    window.addEventListener('advenx:ws_message', handler);
    return () => window.removeEventListener('advenx:ws_message', handler);
  }, [enabled]);

  const envSummary = useMemo(() => {
    const engineTarget = String(import.meta.env.VITE_WS_TARGET || 'relay');
    const engineUrl = String(import.meta.env.VITE_WS_URL || import.meta.env.VITE_PI_WS_URL || '');
    const adminTarget = String(import.meta.env.VITE_ADMIN_WS_TARGET || 'backend');
    const adminUrl = String(import.meta.env.VITE_ADMIN_WS_URL || import.meta.env.VITE_BACKEND_WS_URL || '');
    const room = String(import.meta.env.VITE_ROOM_ID || 'arena');
    return { engineTarget, engineUrl, adminTarget, adminUrl, room };
  }, []);

  if (!enabled) return null;

  const payloadKeys =
    lastMsg && lastMsg.payload && typeof lastMsg.payload === 'object'
      ? Object.keys(lastMsg.payload as Record<string, unknown>).slice(0, 10)
      : [];

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 999,
        padding: '10px 12px',
        background: 'rgba(0,0,0,0.72)',
        border: '1px solid rgba(255,255,255,0.12)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: '10px',
        lineHeight: 1.4,
        color: 'rgba(255,255,255,0.8)',
        maxWidth: '46vw',
      }}
    >
      <div>ws: {isConnected ? 'connected' : 'disconnected'} | backend: {backendConnected ? 'ok' : 'down'}</div>
      <div>engineTarget={envSummary.engineTarget} room={envSummary.room}</div>
      <div>engineUrl={envSummary.engineUrl || '(default)'}</div>
      <div>adminTarget={envSummary.adminTarget}</div>
      <div>adminUrl={envSummary.adminUrl || '(default)'}</div>
      <div>
        last={lastMsg?.event || '(none)'} {lastAt ? `@ ${formatMs(lastAt)}` : ''}
      </div>
      {payloadKeys.length ? <div>payloadKeys={payloadKeys.join(',')}</div> : <div>payloadKeys=(none)</div>}
    </div>
  );
};

