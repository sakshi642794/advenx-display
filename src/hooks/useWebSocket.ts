import { useEffect, useRef, useCallback } from 'react';
import { WebSocketMessage, OperatorMessage } from '../types/game';

const DEFAULT_ROOM_ID = 'arena';
const DEFAULT_WS_BASE_URL = 'ws://localhost:8080';

type WsTarget = 'relay' | 'backend';

function buildWsUrl(raw: string, roomId: string, target: WsTarget) {
  const trimmed = raw.trim().replace(/\/+$/, '');

  // If user already provided the full endpoint (includes /ws/<room>), trust it.
  if (/\/ws\/[^/]+$/i.test(trimmed)) return trimmed;

  // Allow http(s) base URLs in env and convert to ws(s).
  const normalized = trimmed
    .replace(/^https:\/\//i, 'wss://')
    .replace(/^http:\/\//i, 'ws://');

  // Relay is a plain WS server (no path). Backend uses /ws/<room>.
  if (target === 'backend') return `${normalized}/ws/${roomId}`;
  return normalized;
}

const ROOM_ID = import.meta.env.VITE_ROOM_ID || DEFAULT_ROOM_ID;
const rawTarget = String(import.meta.env.VITE_WS_TARGET || 'relay').toLowerCase();
const WS_TARGET: WsTarget = rawTarget === 'backend' ? 'backend' : 'relay';
const WS_URL = buildWsUrl(import.meta.env.VITE_WS_URL || DEFAULT_WS_BASE_URL, ROOM_ID, WS_TARGET);
const RECONNECT_DELAY_MS = 3000;

interface UseWebSocketOptions {
  onMessage: (msg: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useWebSocket({ onMessage, onConnect, onDisconnect }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const send = useCallback((msg: OperatorMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    } else {
      console.warn('[ADVENX] Cannot send - WebSocket not open');
    }
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[ADVENX] WebSocket connected to', WS_URL);
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          try {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('advenx:ws_message', { detail: data }));
            }
          } catch {
            // ignore (older browsers / custom event restrictions)
          }
          onMessage(data);
        } catch (err) {
          console.error('[ADVENX] Failed to parse message:', err);
        }
      };

      ws.onclose = () => {
        console.warn('[ADVENX] Disconnected. Reconnecting in', RECONNECT_DELAY_MS, 'ms...');
        onDisconnect?.();
        if (mountedRef.current) {
          reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };

      ws.onerror = (err) => {
        console.error('[ADVENX] WebSocket error:', err);
        ws.close();
      };
    } catch (err) {
      console.error('[ADVENX] Failed to create WebSocket:', err);
      if (mountedRef.current) {
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    }
  }, [onMessage, onConnect, onDisconnect]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { send };
}

