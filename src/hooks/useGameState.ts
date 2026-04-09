import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, WebSocketMessage } from '../types/game';

const INITIAL_STATE: GameState = {
  phase: 'awaiting',
  currentRound: 1,
  totalRounds: 3,
  timeRemaining: 600,
  spikeTimer: 40,
  endTime: null,
  spikeEndTime: null,
  clockOffset: 0,
  statusMessage: 'AWAITING TEAMS',
  attackersScore: 0,
  defendersScore: 0,
  attackersReady: false,
  defendersReady: false,
};

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [isConnected, setIsConnected] = useState(false);
  // Keep offset in a ref so the interval always reads the latest value
  const offsetRef = useRef(0);

  // ── Local timer loop — runs every 200ms, no backend dependency ──
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prev => {
        const now = Date.now() + offsetRef.current;
        let updated = { ...prev };
        let changed = false;

        // Round / defuse countdown
        if (prev.endTime !== null) {
          const remaining = Math.max(0, Math.floor((prev.endTime - now) / 1000));
          if (remaining !== prev.timeRemaining) {
            updated.timeRemaining = remaining;
            changed = true;
          }
        }

        // Spike detonation countdown
        if (prev.spikeEndTime !== null) {
          const remaining = Math.max(0, Math.floor((prev.spikeEndTime - now) / 1000));
          if (remaining !== prev.spikeTimer) {
            updated.spikeTimer = remaining;
            changed = true;
          }
        }

        return changed ? updated : prev;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []); // runs once — interval always reads latest state via setter callback

  const handleMessage = useCallback((msg: WebSocketMessage) => {
    const { event, payload } = msg;

    setGameState(prev => {
      const round       = payload?.round        ?? prev.currentRound;
      const totalRounds = payload?.total_rounds ?? prev.totalRounds;
      const endTime     = payload?.endTime      ?? null;

      switch (event) {

        // ── Server clock sync (optional but recommended) ──
        case 'sync': {
          if (payload?.serverTime) {
            const offset = payload.serverTime - Date.now();
            offsetRef.current = offset;
            return { ...prev, clockOffset: offset };
          }
          return prev;
        }

        case 'round_started':
          return {
            ...prev,
            phase: 'round_active',
            currentRound: round,
            totalRounds,
            endTime,                    // store server-provided endTime
            spikeEndTime: null,
            statusMessage: 'ROUND IN PROGRESS',
            attackersReady: false,
            defendersReady: false,
          };

        case 'spike_planting':
          return {
            ...prev,
            phase: 'spike_planting',
            statusMessage: 'SPIKE PLANTING...',
            // round timer pauses visually — we just stop updating endTime
            endTime: null,
          };

        case 'plant_canceled':
        case 'round_resumed':
          return {
            ...prev,
            phase: 'round_active',
            statusMessage: 'ROUND IN PROGRESS',
            // backend should re-send endTime on resume; fall back to prev
            endTime: endTime ?? prev.endTime,
          };

        case 'spike_planted':
          return {
            ...prev,
            phase: 'spike_planted',
            statusMessage: 'SPIKE PLANTED',
            endTime: null,              // round timer no longer relevant
            spikeEndTime: endTime,      // detonation countdown
          };

        case 'defuse_start':
          return {
            ...prev,
            phase: 'defusing',
            statusMessage: 'DEFUSING...',
            // spikeEndTime keeps counting during defuse attempt
          };

        case 'defuse_canceled':
          return {
            ...prev,
            phase: 'spike_planted',
            statusMessage: 'SPIKE PLANTED',
          };

        case 'defuse_success':
          return {
            ...prev,
            phase: 'round_over',
            statusMessage: 'SPIKE DEFUSED',
            spikeEndTime: null,
          };

        case 'round_end':
          return {
            ...prev,
            phase: 'round_over',
            statusMessage: 'ROUND ENDED',
            endTime: null,
            spikeEndTime: null,
          };

        case 'attackers_win':
          return {
            ...prev,
            phase: 'attackers_win',
            statusMessage: 'ATTACKERS WIN',
            endTime: null,
            spikeEndTime: null,
            attackersScore: prev.attackersScore + 1,
          };

        case 'defenders_win':
          return {
            ...prev,
            phase: 'defenders_win',
            statusMessage: 'DEFENDERS WIN',
            endTime: null,
            spikeEndTime: null,
            defendersScore: prev.defendersScore + 1,
          };

        default:
          return prev;
      }
    });
  }, []);

  const markAttackersReady = useCallback(() => {
    setGameState(prev => ({ ...prev, attackersReady: true }));
  }, []);

  const markDefendersReady = useCallback(() => {
    setGameState(prev => ({ ...prev, defendersReady: true }));
  }, []);

  const resetGame = useCallback(() => {
    offsetRef.current = 0;
    setGameState(INITIAL_STATE);
  }, []);

  const handleConnect    = useCallback(() => setIsConnected(true),  []);
  const handleDisconnect = useCallback(() => setIsConnected(false), []);

  return {
    gameState, isConnected,
    handleMessage, handleConnect, handleDisconnect,
    markAttackersReady, markDefendersReady, resetGame,
  };
}
