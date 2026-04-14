import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, GamePhase, WebSocketMessage } from '../types/game';

const INITIAL_STATE: GameState = {
  phase: 'awaiting',
  currentRound: 1,
  totalRounds: 3,
  timeRemaining: 600,
  plantTimer: 60,
  spikeTimer: 40,
  defuseTimer: 0,
  endTime: null,
  spikeEndTime: null,
  roundStartEndTime: null,
  roundStartRemaining: 0,
  backendConnected: false,
  winEndTime: null,
  clockOffset: 0,
  statusMessage: 'AWAITING TEAMS',
  attackersScore: 0,
  defendersScore: 0,
  attackersReady: false,
  defendersReady: false,
  roundTotal: null,
  plantTotal: null,
  spikeTotal: null,
  defuseTotal: null,
};

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [isConnected, setIsConnected] = useState(false);
  // Keep offset in a ref so the interval always reads the latest value
  const offsetRef = useRef(0);

  // -- Local timer loop - runs every 200ms, no backend dependency --
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

        // Round start countdown
        if (prev.roundStartEndTime !== null) {
          const remaining = Math.max(0, Math.ceil((prev.roundStartEndTime - now) / 1000));
          if (remaining !== prev.roundStartRemaining) {
            updated.roundStartRemaining = remaining;
            changed = true;
          }
        }

        // Win screen timeout (10s)
        if (prev.winEndTime !== null && now >= prev.winEndTime) {
          updated.phase = 'awaiting';
          updated.statusMessage = 'AWAITING TEAMS';
          updated.winEndTime = null;
          updated.attackersReady = false;
          updated.defendersReady = false;
          changed = true;
        }

        return changed ? updated : prev;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []); // runs once - interval always reads latest state via setter callback

  const handleMessage = useCallback((msg: WebSocketMessage) => {
    const { event, payload } = msg;

    setGameState(prev => {
      const round       = payload?.round ?? payload?.currentRound ?? prev.currentRound;
      const totalRounds = payload?.total_rounds ?? payload?.totalRounds ?? prev.totalRounds;
      const endTime     = payload?.endTime      ?? null;

      switch (event) {

        // -- Server clock sync (optional but recommended) --
        case 'sync': {
          if (payload?.serverTime) {
            const offset = payload.serverTime - Date.now();
            offsetRef.current = offset;
            return { ...prev, clockOffset: offset };
          }
          return prev;
        }

        case 'game_update': {
          const state = payload?.state;
          const roundRemaining = payload?.roundRemaining;
          const plantRemaining = payload?.plantRemaining;
          const spikeRemaining = payload?.spikeRemaining;
          const defuseRemaining = payload?.defuseRemaining;
          const roundTotal = payload?.roundTotal ?? null;
          const plantTotal = payload?.plantTotal ?? null;
          const spikeTotal = payload?.spikeTotal ?? null;
          const defuseTotal = payload?.defuseTotal ?? null;
          const attackersScore = typeof payload?.attackersScore === 'number' ? payload?.attackersScore : prev.attackersScore;
          const defendersScore = typeof payload?.defendersScore === 'number' ? payload?.defendersScore : prev.defendersScore;

          const phaseMap: Record<string, GamePhase> = {
            IDLE: 'awaiting',
            ROUND_RUNNING: 'round_active',
            PLANTING: 'spike_planting',
            SPIKE_PLANTED: 'spike_planted',
            DEFUSING: 'defusing',
            ROUND_ENDED: 'round_over',
          };

          const nextPhase = state && phaseMap[state] ? phaseMap[state] : prev.phase;

          return {
            ...prev,
            phase: nextPhase,
            currentRound: round,
            totalRounds,
            timeRemaining: typeof roundRemaining === 'number' ? roundRemaining : prev.timeRemaining,
            plantTimer: typeof plantRemaining === 'number' ? plantRemaining : prev.plantTimer,
            spikeTimer: typeof spikeRemaining === 'number' ? spikeRemaining : prev.spikeTimer,
            defuseTimer: typeof defuseRemaining === 'number' ? defuseRemaining : prev.defuseTimer,
            endTime: null,
            spikeEndTime: null,
            roundStartEndTime: null,
            roundStartRemaining: 0,
            roundTotal,
            plantTotal,
            spikeTotal,
            defuseTotal,
            attackersScore,
            defendersScore,
            statusMessage: nextPhase === 'round_active'
              ? 'ROUND IN PROGRESS'
              : nextPhase === 'spike_planting'
                ? 'SPIKE PLANTING...'
                : nextPhase === 'spike_planted'
                  ? 'SPIKE PLANTED'
                  : nextPhase === 'defusing'
                    ? 'DEFUSING...'
                    : nextPhase === 'round_over'
                      ? 'ROUND ENDED'
                      : 'AWAITING TEAMS',
          };
        }

        case 'round_starting':
          return {
            ...prev,
            phase: 'round_starting',
            statusMessage: 'ROUND STARTING',
            roundStartEndTime: endTime ?? (Date.now() + 3000),
            roundStartRemaining: payload?.seconds ?? 3,
          };

        case 'round_started':
          return {
            ...prev,
            phase: 'round_active',
            currentRound: round,
            totalRounds,
            endTime,                    // store server-provided endTime
            spikeEndTime: null,
            roundStartEndTime: null,
            roundStartRemaining: 0,
            statusMessage: 'ROUND IN PROGRESS',
            attackersReady: false,
            defendersReady: false,
          };

        case 'spike_planting':
          return {
            ...prev,
            phase: 'spike_planting',
            statusMessage: 'SPIKE PLANTING...',
            // round timer pauses visually - we just stop updating endTime
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
            spikeEndTime: null,
            endTime: null,
            defuseTimer: typeof payload?.defuseRemaining === 'number' ? payload.defuseRemaining : prev.defuseTimer,
            // spikeEndTime keeps counting during defuse attempt
          };

        case 'defuse_canceled':
          return {
            ...prev,
            phase: 'spike_planted',
            statusMessage: 'SPIKE PLANTED',
            spikeEndTime: endTime ?? prev.spikeEndTime,
            defuseTimer: 0,
          };

        case 'defuse_success':
          return {
            ...prev,
            phase: 'round_over',
            statusMessage: 'SPIKE DEFUSED',
            spikeEndTime: null,
            defuseTimer: 0,
          };

        case 'round_end':
          return {
            ...prev,
            phase: 'round_over',
            statusMessage: 'ROUND ENDED',
            endTime: null,
            spikeEndTime: null,
            roundStartEndTime: null,
            roundStartRemaining: 0,
            defuseTimer: 0,
            attackersReady: false,
            defendersReady: false,
          };

        case 'attackers_win':
          return {
            ...prev,
            phase: 'attackers_win',
            statusMessage: 'ATTACKERS WIN',
            endTime: null,
            spikeEndTime: null,
            roundStartEndTime: null,
            roundStartRemaining: 0,
            attackersScore: typeof payload?.attackersScore === 'number' ? payload.attackersScore : prev.attackersScore + 1,
            defendersScore: typeof payload?.defendersScore === 'number' ? payload.defendersScore : prev.defendersScore,
            defuseTimer: 0,
            attackersReady: false,
            defendersReady: false,
            winEndTime: Date.now() + 10000,
          };

        case 'defenders_win':
          return {
            ...prev,
            phase: 'defenders_win',
            statusMessage: 'DEFENDERS WIN',
            endTime: null,
            spikeEndTime: null,
            roundStartEndTime: null,
            roundStartRemaining: 0,
            attackersScore: typeof payload?.attackersScore === 'number' ? payload.attackersScore : prev.attackersScore,
            defendersScore: typeof payload?.defendersScore === 'number' ? payload.defendersScore : prev.defendersScore + 1,
            defuseTimer: 0,
            attackersReady: false,
            defendersReady: false,
            winEndTime: Date.now() + 10000,
          };

        case 'attackers_ready':
          return { ...prev, attackersReady: true };

        case 'defenders_ready':
          return { ...prev, defendersReady: true };

        case 'attackers_not_ready':
          return { ...prev, attackersReady: false };

        case 'defenders_not_ready':
          return { ...prev, defendersReady: false };

        case 'teams_ready': {
          const aReady = payload?.attackersReady;
          const dReady = payload?.defendersReady;
          return {
            ...prev,
            attackersReady: typeof aReady === 'boolean' ? aReady : prev.attackersReady,
            defendersReady: typeof dReady === 'boolean' ? dReady : prev.defendersReady,
          };
        }

        case 'backend_status':
          return {
            ...prev,
            backendConnected: typeof payload?.connected === 'boolean' ? payload.connected : prev.backendConnected,
          };

        case 'reset_game':
          offsetRef.current = 0;
          return INITIAL_STATE;

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


