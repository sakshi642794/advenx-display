import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, WebSocketMessage, GamePhase } from '../types/game';

const INITIAL_ROUND_TIME = 600; // 10 minutes
const SPIKE_PLANT_TIME = 40;    // 40 seconds after plant

const INITIAL_STATE: GameState = {
  phase: 'awaiting',
  currentRound: 1,
  totalRounds: 3,
  timeRemaining: INITIAL_ROUND_TIME,
  spikeTimer: SPIKE_PLANT_TIME,
  statusMessage: 'AWAITING TEAMS',
  attackersScore: 0,
  defendersScore: 0,
};

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [isConnected, setIsConnected] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<GamePhase>('awaiting');

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startCountdown = useCallback((
    field: 'timeRemaining' | 'spikeTimer',
    fromValue: number
  ) => {
    clearTimer();
    setGameState(prev => ({ ...prev, [field]: fromValue }));

    timerRef.current = setInterval(() => {
      setGameState(prev => {
        const next = prev[field] - 1;
        if (next <= 0) {
          clearTimer();
          return { ...prev, [field]: 0 };
        }
        return { ...prev, [field]: next };
      });
    }, 1000);
  }, []);

  const handleMessage = useCallback((msg: WebSocketMessage) => {
    const { event, payload } = msg;

    setGameState(prev => {
      const round = payload?.round ?? prev.currentRound;
      const totalRounds = payload?.total_rounds ?? prev.totalRounds;

      switch (event) {
        case 'round_started':
          phaseRef.current = 'round_active';
          startCountdown('timeRemaining', payload?.time_remaining ?? INITIAL_ROUND_TIME);
          return {
            ...prev,
            phase: 'round_active',
            currentRound: round,
            totalRounds,
            statusMessage: 'ROUND IN PROGRESS',
          };

        case 'spike_planting':
          phaseRef.current = 'spike_planting';
          clearTimer();
          return {
            ...prev,
            phase: 'spike_planting',
            statusMessage: 'SPIKE PLANTING...',
          };

        case 'plant_canceled':
        case 'round_resumed':
          phaseRef.current = 'round_active';
          startCountdown('timeRemaining', prev.timeRemaining);
          return {
            ...prev,
            phase: 'round_active',
            statusMessage: 'ROUND IN PROGRESS',
          };

        case 'spike_planted':
          phaseRef.current = 'spike_planted';
          startCountdown('spikeTimer', payload?.plant_time ?? SPIKE_PLANT_TIME);
          return {
            ...prev,
            phase: 'spike_planted',
            statusMessage: 'SPIKE PLANTED',
          };

        case 'defuse_start':
          phaseRef.current = 'defusing';
          return {
            ...prev,
            phase: 'defusing',
            statusMessage: 'DEFUSING...',
          };

        case 'defuse_canceled':
          phaseRef.current = 'spike_planted';
          return {
            ...prev,
            phase: 'spike_planted',
            statusMessage: 'SPIKE PLANTED',
          };

        case 'defuse_success':
          phaseRef.current = 'round_over';
          clearTimer();
          return {
            ...prev,
            phase: 'round_over',
            statusMessage: 'SPIKE DEFUSED',
          };

        case 'round_end':
          phaseRef.current = 'round_over';
          clearTimer();
          return {
            ...prev,
            phase: 'round_over',
            statusMessage: 'ROUND ENDED',
          };

        case 'attackers_win':
          phaseRef.current = 'attackers_win';
          clearTimer();
          return {
            ...prev,
            phase: 'attackers_win',
            statusMessage: 'ATTACKERS WIN',
            attackersScore: prev.attackersScore + 1,
          };

        case 'defenders_win':
          phaseRef.current = 'defenders_win';
          clearTimer();
          return {
            ...prev,
            phase: 'defenders_win',
            statusMessage: 'DEFENDERS WIN',
            defendersScore: prev.defendersScore + 1,
          };

        default:
          return prev;
      }
    });
  }, [startCountdown]);

  useEffect(() => {
    return () => clearTimer();
  }, []);

  const handleConnect = useCallback(() => setIsConnected(true), []);
  const handleDisconnect = useCallback(() => setIsConnected(false), []);

  return { gameState, isConnected, handleMessage, handleConnect, handleDisconnect };
}
