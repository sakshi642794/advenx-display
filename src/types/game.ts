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
  | 'defenders_win';

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
    time_remaining?: number;
    plant_time?: number;
    defuse_time?: number;
  };
}

export interface GameState {
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  timeRemaining: number;
  spikeTimer: number;
  statusMessage: string;
  attackersScore: number;
  defendersScore: number;
}
