import { useEffect, useRef, useCallback } from "react";

const RECONNECT_DELAY_MS = 2000;

export const useWebSocket = ({
  onMessage,
  onConnect,
  onDisconnect,
}: any) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<any>(null);
  const mountedRef = useRef(false);

  const WS_URL = `ws://${window.location.hostname}:8080`;

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[ADVENX] Connected to engine:", WS_URL);
        if (onConnect) onConnect();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          const mappedEvent = {
            type: data.type,
            ...data.payload,
          };

          if (mappedEvent && typeof onMessage === "function") {
            onMessage(mappedEvent);
          }

        } catch (err) {
          console.error("[ADVENX] Parse error:", err);
        }
      };

      ws.onclose = () => {
        console.warn("[ADVENX] Disconnected. Reconnecting...");
        if (onDisconnect) onDisconnect();

        if (mountedRef.current) {
          reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };

      ws.onerror = (err) => {
        console.error("[ADVENX] WS error:", err);
        ws.close();
      };

    } catch (err) {
      console.error("[ADVENX] WS creation failed:", err);

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
};
