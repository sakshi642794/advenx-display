import { useEffect, useRef, useCallback } from 'react';
import { WebSocketMessage } from '../types/game';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://raspberrypi.local:8080';
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
          onMessage(data);
        } catch (err) {
          console.error('[ADVENX] Failed to parse message:', err);
        }
      };

      ws.onclose = () => {
        console.warn('[ADVENX] WebSocket disconnected. Reconnecting in', RECONNECT_DELAY_MS, 'ms...');
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
}
