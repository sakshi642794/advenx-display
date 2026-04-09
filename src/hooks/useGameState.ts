import { useState, useCallback, useRef, useEffect } from "react";

export const useGameState = () => {
  const [isConnected, setIsConnected] = useState(false);

  const [gameState, setGameState] = useState({
    phase: "idle",
    statusMessage: "WAITING",
    attackersScore: 0,
    defendersScore: 0,
    timeRemaining: 0,
    spikeTimer: 0,
  });

  const phaseRef = useRef("idle");

  const clearTimer = () => {
    // optional (if you later add interval timers)
  };

  const handleMessage = useCallback((msg: any) => {
    console.log("[WS MESSAGE]", msg);

    setGameState((prev) => {
      switch (msg.type) {
        case "round_started":
          phaseRef.current = "round_running";
          return {
            ...prev,
            phase: "round_running",
            statusMessage: "ROUND LIVE",
          };

        case "spike_planted":
          phaseRef.current = "spike_planted";
          return {
            ...prev,
            phase: "spike_planted",
            statusMessage: "SPIKE PLANTED",
          };

        case "defusing":
          phaseRef.current = "defusing";
          return {
            ...prev,
            phase: "defusing",
            statusMessage: "DEFUSING...",
          };

        case "round_ended":
          phaseRef.current = "round_over";
          clearTimer();
          return {
            ...prev,
            phase: "round_over",
            statusMessage: "ROUND ENDED",
          };

        case "tick":
          return {
            ...prev,
            timeRemaining: msg.value,
          };

        default:
          return prev;
      }
    });
  }, []);

  const handleConnect = useCallback(() => {
    console.log("CONNECTED");
    setIsConnected(true);
  }, []);

  const handleDisconnect = useCallback(() => {
    console.log("DISCONNECTED");
    setIsConnected(false);
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, []);

  return {
    gameState,
    isConnected,
    handleMessage,
    handleConnect,
    handleDisconnect,
  };
};
