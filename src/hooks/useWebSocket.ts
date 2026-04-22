import { useEffect, useRef, useCallback } from 'react';
import { WebSocketMessage, OperatorMessage } from '../types/game';

const DEFAULT_ROOM_ID = 'arena';
const DEFAULT_ENGINE_WS_BASE_URL = 'ws://localhost:8080';
const DEFAULT_ADMIN_WS_BASE_URL = 'ws://localhost:8000';

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

const RECONNECT_DELAY_MS = 3000;

interface UseWebSocketOptions {
  url: string;
  onMessage: (msg: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  label?: string;
  canSend?: boolean;
}

export function getConfiguredWsUrl(kind: 'engine' | 'admin') {
  const roomId = import.meta.env.VITE_ROOM_ID || DEFAULT_ROOM_ID;

  if (kind === 'admin') {
    const rawTarget = String(import.meta.env.VITE_ADMIN_WS_TARGET || 'backend').toLowerCase();
    const target: WsTarget = rawTarget === 'relay' ? 'relay' : 'backend';
    const rawUrl = import.meta.env.VITE_ADMIN_WS_URL || import.meta.env.VITE_BACKEND_WS_URL || DEFAULT_ADMIN_WS_BASE_URL;
    return buildWsUrl(rawUrl, roomId, target);
  }

  const rawTarget = String(import.meta.env.VITE_WS_TARGET || 'relay').toLowerCase();
  const target: WsTarget = rawTarget === 'backend' ? 'backend' : 'relay';
  const rawUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_PI_WS_URL || DEFAULT_ENGINE_WS_BASE_URL;
  return buildWsUrl(rawUrl, roomId, target);
}

export function useWebSocket({
  url,
  onMessage,
  onConnect,
  onDisconnect,
  label = 'ADVENX',
  canSend = true,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const send = useCallback((msg: OperatorMessage) => {
    if (!canSend) {
      console.warn(`[${label}] Cannot send - socket is receive-only`);
      return;
    }
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    } else {
      console.warn(`[${label}] Cannot send - WebSocket not open`);
    }
  }, [canSend, label]);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`[${label}] WebSocket connected to`, url);
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
        console.warn(`[${label}] Disconnected. Reconnecting in`, RECONNECT_DELAY_MS, 'ms...');
        onDisconnect?.();
        if (mountedRef.current) {
          reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };

      ws.onerror = (err) => {
        console.error(`[${label}] WebSocket error:`, err);
        ws.close();
      };
    } catch (err) {
      console.error(`[${label}] Failed to create WebSocket:`, err);
      if (mountedRef.current) {
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    }
  }, [label, onMessage, onConnect, onDisconnect, url]);

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

