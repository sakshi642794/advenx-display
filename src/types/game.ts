export type GameEvent =
  | 'round_started'
  | 'spike_planting'
  | 'plant_canceled'
  | 'round_resumed'
  | 'spike_planted'
  | 'defuse_start'
  | 'defuse_canceled'
  | 'defuse_success'
  | 'round_end'
  | 'attackers_win'
  | 'defenders_win'
  | 'sync';

export type OperatorEvent =
  | 'attackers_ready'
  | 'defenders_ready'
  | 'start_game'
  | 'reset_game';

export type GamePhase =
  | 'awaiting'
  | 'round_active'
  | 'spike_planting'
  | 'spike_planted'
  | 'defusing'
  | 'round_over'
  | 'attackers_win'
  | 'defenders_win';

export interface WebSocketMessage {
  event: GameEvent;
  payload?: {
    round?: number;
    total_rounds?: number;
    endTime?: number;       // Unix ms timestamp — used for all timers
    serverTime?: number;    // For clock sync
  };
}

export interface OperatorMessage {
  event: OperatorEvent;
  payload?: Record<string, unknown>;
}

export interface GameState {
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  timeRemaining: number;
  spikeTimer: number;
  endTime: number | null;       // active countdown end timestamp (ms)
  spikeEndTime: number | null;  // spike detonation end timestamp (ms)
  clockOffset: number;          // ms offset vs server clock (for sync)
  statusMessage: string;
  attackersScore: number;
  defendersScore: number;
  attackersReady: boolean;
  defendersReady: boolean;
}
