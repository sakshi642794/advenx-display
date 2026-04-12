export type GameEvent =
  | 'game_update'
  | 'round_starting'
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
  | 'attackers_ready'
  | 'defenders_ready'
  | 'reset_game'
  | 'sync';

export type OperatorEvent =
  | 'attackers_ready'
  | 'defenders_ready'
  | 'start_game'
  | 'start_plant'
  | 'cancel_plant'
  | 'start_defuse'
  | 'cancel_defuse'
  | 'reset_game';

export type GamePhase =
  | 'awaiting'
  | 'round_starting'
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
    currentRound?: number;
    totalRounds?: number;
    endTime?: number;       // Unix ms timestamp - used for all timers
    seconds?: number;       // round start countdown seconds
    serverTime?: number;    // For clock sync
    state?: string;         // Engine state (game_update)
    roundRemaining?: number | null;
    plantRemaining?: number | null;
    spikeRemaining?: number | null;
    defuseRemaining?: number | null;
    roundTotal?: number | null;
    plantTotal?: number | null;
    spikeTotal?: number | null;
    defuseTotal?: number | null;
    attackersScore?: number;
    defendersScore?: number;
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
  defuseTimer: number;
  endTime: number | null;       // active countdown end timestamp (ms)
  spikeEndTime: number | null;  // spike detonation end timestamp (ms)
  roundStartEndTime: number | null;
  roundStartRemaining: number;
  clockOffset: number;          // ms offset vs server clock (for sync)
  statusMessage: string;
  attackersScore: number;
  defendersScore: number;
  attackersReady: boolean;
  defendersReady: boolean;
  roundTotal: number | null;
  plantTimer: number;
  plantTotal: number | null;
  spikeTotal: number | null;
  defuseTotal: number | null;
}

