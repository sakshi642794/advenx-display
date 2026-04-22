import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, GamePhase, WebSocketMessage, WebSocketSource } from '../types/game';

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
  timerSpeedMultiplier: 1,
  timerSpeedMode: 'normal',
  timerSpeedFastCount: 0,
  timerSpeedSlowCount: 0,
  timerSpeedNextExpiryAt: null,
  globalAnnouncement: null,
  announcementTone: 'neutral',
  announcementEndTime: null,
  deadPlayers: {},
  reviveFx: {},
};

function deriveScaledEndTime(remainingSeconds: number, speedMultiplier: number, now: number) {
  if (remainingSeconds <= 0) return now;
  return now + (remainingSeconds * 1000) / speedMultiplier;
}

function getPreciseRemainingSeconds(endTime: number | null, speedMultiplier: number, now: number) {
  if (endTime === null) return 0;
  return Math.max(0, ((endTime - now) * speedMultiplier) / 1000);
}

function getDisplayedRemainingSeconds(endTime: number | null, speedMultiplier: number, now: number) {
  return Math.max(0, Math.floor(getPreciseRemainingSeconds(endTime, speedMultiplier, now)));
}

function deriveWinnerFromReason(reason: unknown) {
  if (typeof reason !== 'string') return null;
  if (reason === 'ATTACKER_WIN_EXPLODE') return 'attackers_win' as const;
  if (reason === 'DEFENDER_WIN_TIME' || reason === 'DEFENDER_WIN_DEFUSE') return 'defenders_win' as const;
  return null;
}

function parsePlayerCommand(raw: string) {
  const s = raw.trim();

  const killed = s.match(/^([ad][1-5])[-_ ]?killed$/i);
  if (killed) return { kind: 'killed' as const, playerId: killed[1].toUpperCase() };

  const revive = s.match(/^revive-([ad][1-5])$/i);
  if (revive) return { kind: 'revive' as const, playerId: revive[1].toUpperCase() };

  return null;
}

function normalizePlayerId(raw: unknown) {
  if (typeof raw !== 'string') return null;
  const pid = raw.trim().toUpperCase();
  if (!/^[AD][1-5]$/.test(pid)) return null;
  return pid;
}

function normalizeAdminMessage(msg: WebSocketMessage): WebSocketMessage {
  const event = typeof msg?.event === 'string' ? msg.event.trim() : '';
  const lowerEvent = event.toLowerCase();
  const payload = msg?.payload;

  if (lowerEvent === 'kill' || lowerEvent === 'revive') {
    const playerId = normalizePlayerId(payload?.playerId ?? payload?.player ?? payload?.id);
    if (!playerId) return msg;
    return {
      event: lowerEvent === 'kill' ? `${playerId}-killed` : `revive-${playerId}`,
      payload,
    };
  }

  if (lowerEvent === 'fast' || lowerEvent === 'slow') {
    const fastCount = lowerEvent === 'fast' ? 1 : 0;
    const slowCount = lowerEvent === 'slow' ? 1 : 0;
    return {
      event: 'timer_speed_update',
      payload: {
        ...payload,
        effectiveMode: lowerEvent,
        speedMultiplier: lowerEvent === 'fast' ? 2 : 0.5,
        fastCount: typeof payload?.fastCount === 'number' ? payload.fastCount : fastCount,
        slowCount: typeof payload?.slowCount === 'number' ? payload.slowCount : slowCount,
        announcement:
          typeof payload?.announcement === 'string'
            ? payload.announcement
            : lowerEvent === 'fast'
              ? 'TIME SHIFT ACTIVATED - FAST MODE'
              : 'TIME SHIFT ACTIVATED - SLOW MODE',
      },
    };
  }

  if (lowerEvent === 'both_teams_ready') {
    return {
      event: 'teams_ready',
      payload: {
        ...payload,
        attackersReady: true,
        defendersReady: true,
      },
    };
  }

  if (lowerEvent === 'no_team_ready') {
    return {
      event: 'teams_ready',
      payload: {
        ...payload,
        attackersReady: false,
        defendersReady: false,
      },
    };
  }

  return msg;
}

function isAdminControlledMessage(msg: WebSocketMessage) {
  const event = typeof msg?.event === 'string' ? msg.event.trim().toLowerCase() : '';
  if (
    event === 'attackers_ready' ||
    event === 'defenders_ready' ||
    event === 'attackers_not_ready' ||
    event === 'defenders_not_ready' ||
    event === 'teams_ready' ||
    event === 'both_teams_ready' ||
    event === 'no_team_ready' ||
    event === 'kill' ||
    event === 'revive' ||
    event === 'fast' ||
    event === 'slow' ||
    event === 'timer_speed_update'
  ) {
    return true;
  }

  return /^([ad][1-5])[-_ ]?killed$/i.test(event) || /^revive-([ad][1-5])$/i.test(event);
}

function teamAllDead(deadPlayers: Record<string, boolean>, teamPrefix: 'A' | 'D') {
  for (let i = 1; i <= 5; i += 1) {
    if (!deadPlayers[`${teamPrefix}${i}`]) return false;
  }
  return true;
}

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
          const remaining = getDisplayedRemainingSeconds(prev.endTime, prev.timerSpeedMultiplier, now);
          if (remaining !== prev.timeRemaining) {
            updated.timeRemaining = remaining;
            changed = true;
          }
        }

        // Spike detonation countdown
        if (prev.spikeEndTime !== null) {
          const remaining = getDisplayedRemainingSeconds(prev.spikeEndTime, prev.timerSpeedMultiplier, now);
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
          updated.deadPlayers = {};
          updated.reviveFx = {};
          changed = true;
        }

        if (prev.announcementEndTime !== null && now >= prev.announcementEndTime) {
          updated.globalAnnouncement = null;
          updated.announcementEndTime = null;
          updated.announcementTone = 'neutral';
          changed = true;
        }

        // Clear expired revive FX
        const reviveKeys = Object.keys(prev.reviveFx);
        if (reviveKeys.length) {
          let nextReviveFx: Record<string, number> | null = null;
          for (const key of reviveKeys) {
            if (prev.reviveFx[key] <= now) {
              if (!nextReviveFx) nextReviveFx = { ...prev.reviveFx };
              delete nextReviveFx[key];
            }
          }
          if (nextReviveFx) {
            updated.reviveFx = nextReviveFx;
            changed = true;
          }
        }

        return changed ? updated : prev;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []); // runs once - interval always reads latest state via setter callback

  const handleMessage = useCallback((rawMsg: WebSocketMessage, source: WebSocketSource = 'engine') => {
    const msg = source === 'admin' ? normalizeAdminMessage(rawMsg) : rawMsg;
    const { event, payload } = msg;

    setGameState(prev => {
      if (source === 'engine' && isAdminControlledMessage(msg)) {
        return prev;
      }

      const now = Date.now() + offsetRef.current;
      const commandRaw = typeof payload?.command === 'string' ? payload.command : String(event ?? '');
      const parsedCommand = parsePlayerCommand(commandRaw);
      const round       = payload?.round ?? payload?.currentRound ?? prev.currentRound;
      const totalRounds = payload?.total_rounds ?? payload?.totalRounds ?? prev.totalRounds;
      const endTime     = payload?.endTime      ?? null;
      const effectiveSpeed = prev.timerSpeedMultiplier || 1;

      const allowPlayerCommands = true;
      const allowAutoWin =
        prev.phase === 'round_starting' ||
        prev.phase === 'round_active' ||
        prev.phase === 'spike_planting' ||
        prev.phase === 'spike_planted' ||
        prev.phase === 'defusing';

      if (parsedCommand && allowPlayerCommands && prev.phase !== 'attackers_win' && prev.phase !== 'defenders_win') {
        if (parsedCommand.kind === 'killed') {
          const deadPlayers = { ...prev.deadPlayers, [parsedCommand.playerId]: true };
          const reviveFx = { ...prev.reviveFx };
          delete reviveFx[parsedCommand.playerId];

          // If a full team is eliminated, the other team wins immediately.
          const attackersDead = allowAutoWin ? teamAllDead(deadPlayers, 'A') : false;
          const defendersDead = allowAutoWin ? teamAllDead(deadPlayers, 'D') : false;
          if (allowAutoWin && (attackersDead || defendersDead)) {
            const winner = attackersDead ? 'defenders' : 'attackers';
            return {
              ...prev,
              phase: winner === 'defenders' ? 'defenders_win' : 'attackers_win',
              statusMessage: winner === 'defenders' ? 'DEFENDERS WIN' : 'ATTACKERS WIN',
              endTime: null,
              spikeEndTime: null,
              roundStartEndTime: null,
              roundStartRemaining: 0,
              defuseTimer: 0,
              attackersScore: winner === 'attackers' ? prev.attackersScore + 1 : prev.attackersScore,
              defendersScore: winner === 'defenders' ? prev.defendersScore + 1 : prev.defendersScore,
              winEndTime: now + 10000,
              deadPlayers,
              reviveFx,
            };
          }

          return { ...prev, deadPlayers, reviveFx };
        }

        if (parsedCommand.kind === 'revive') {
          const deadPlayers = { ...prev.deadPlayers };
          delete deadPlayers[parsedCommand.playerId];
          return {
            ...prev,
            deadPlayers,
            reviveFx: { ...prev.reviveFx, [parsedCommand.playerId]: now + 900 },
          };
        }
      }

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

          const mappedPhase = state && phaseMap[state] ? phaseMap[state] : prev.phase;
          const nextPhase =
            mappedPhase === 'round_over' && (prev.phase === 'attackers_win' || prev.phase === 'defenders_win')
              ? prev.phase
              : mappedPhase;

          // Preserve endTime/spikeEndTime if no new remaining value is provided and phase hasn't changed.
          let nextRoundEndTime = prev.endTime;
          if (typeof roundRemaining === 'number') {
            nextRoundEndTime = nextPhase === 'round_active' ? deriveScaledEndTime(roundRemaining, effectiveSpeed, now) : null;
          } else if (nextPhase !== prev.phase && nextPhase !== 'round_active') {
            nextRoundEndTime = null;
          }

          let nextSpikeEndTime = prev.spikeEndTime;
          if (typeof spikeRemaining === 'number') {
            nextSpikeEndTime = nextPhase === 'spike_planted' ? deriveScaledEndTime(spikeRemaining, effectiveSpeed, now) : null;
          } else if (nextPhase !== prev.phase && nextPhase !== 'spike_planted') {
            nextSpikeEndTime = null;
          }

          return {
            ...prev,
            phase: nextPhase,
            currentRound: round,
            totalRounds,
            timeRemaining: typeof roundRemaining === 'number' ? roundRemaining : prev.timeRemaining,
            plantTimer: typeof plantRemaining === 'number' ? plantRemaining : prev.plantTimer,
            spikeTimer: typeof spikeRemaining === 'number' ? spikeRemaining : prev.spikeTimer,
            defuseTimer: typeof defuseRemaining === 'number' ? defuseRemaining : prev.defuseTimer,
            endTime: nextRoundEndTime,
            spikeEndTime: nextSpikeEndTime,
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
            roundStartEndTime: endTime ?? (now + 5000),
            roundStartRemaining: payload?.seconds ?? 5,
            deadPlayers: {},
            reviveFx: {},
          };

        case 'round_started':
          {
          const startedRemaining = endTime !== null
            ? Math.max(0, Math.floor((endTime - now) / 1000))
            : prev.timeRemaining;
          return {
            ...prev,
            phase: 'round_active',
            currentRound: round,
            totalRounds,
            endTime: endTime !== null
              ? deriveScaledEndTime(startedRemaining, effectiveSpeed, now)
              : prev.endTime,
            spikeEndTime: null,
            roundStartEndTime: null,
            roundStartRemaining: 0,
            statusMessage: 'ROUND IN PROGRESS',
            attackersReady: false,
            defendersReady: false,
            deadPlayers: {},
            reviveFx: {},
          };
          }

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
          {
          const resumedRemaining = endTime !== null
            ? Math.max(0, Math.floor((endTime - now) / 1000))
            : prev.timeRemaining;
          return {
            ...prev,
            phase: 'round_active',
            statusMessage: 'ROUND IN PROGRESS',
            // Recalculate endTime if not provided in payload (important for resumption after plant/defuse)
            endTime: endTime !== null
              ? deriveScaledEndTime(resumedRemaining, effectiveSpeed, now)
              : deriveScaledEndTime(prev.timeRemaining, effectiveSpeed, now),
          };
          }

        case 'spike_planted':
          {
          const plantedRemaining = endTime !== null
            ? Math.max(0, Math.floor((endTime - now) / 1000))
            : prev.spikeTimer;
          return {
            ...prev,
            phase: 'spike_planted',
            statusMessage: 'SPIKE PLANTED',
            endTime: null,              // round timer no longer relevant
            spikeEndTime: endTime !== null
              ? deriveScaledEndTime(plantedRemaining, effectiveSpeed, now)
              : prev.spikeEndTime,
          };
          }

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
          {
          const resumedSpikeRemaining = endTime !== null
            ? Math.max(0, Math.floor((endTime - now) / 1000))
            : prev.spikeTimer;
          return {
            ...prev,
            phase: 'spike_planted',
            statusMessage: 'SPIKE PLANTED',
            spikeEndTime: endTime !== null
              ? deriveScaledEndTime(resumedSpikeRemaining, effectiveSpeed, now)
              : deriveScaledEndTime(prev.spikeTimer, effectiveSpeed, now),
            defuseTimer: 0,
          };
          }

        case 'defuse_success':
          return {
            ...prev,
            phase: 'round_over',
            statusMessage: 'SPIKE DEFUSED',
            spikeEndTime: null,
            defuseTimer: 0,
            deadPlayers: {},
            reviveFx: {},
          };

        case 'round_end':
          {
          const winnerPhase = deriveWinnerFromReason(payload?.reason);
          if (winnerPhase === 'attackers_win' || winnerPhase === 'defenders_win') {
            return {
              ...prev,
              phase: winnerPhase,
              statusMessage: winnerPhase === 'attackers_win' ? 'ATTACKERS WIN' : 'DEFENDERS WIN',
              endTime: null,
              spikeEndTime: null,
              roundStartEndTime: null,
              roundStartRemaining: 0,
              attackersScore: typeof payload?.attackersScore === 'number' ? payload.attackersScore : prev.attackersScore,
              defendersScore: typeof payload?.defendersScore === 'number' ? payload.defendersScore : prev.defendersScore,
              defuseTimer: 0,
              attackersReady: false,
              defendersReady: false,
              winEndTime: prev.winEndTime ?? (now + 10000),
              deadPlayers: {},
              reviveFx: {},
            };
          }
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
            deadPlayers: {},
            reviveFx: {},
          };
          }

        case 'attackers_win':
          if (prev.phase === 'attackers_win') {
            return {
              ...prev,
              attackersScore: typeof payload?.attackersScore === 'number' ? payload.attackersScore : prev.attackersScore,
              defendersScore: typeof payload?.defendersScore === 'number' ? payload.defendersScore : prev.defendersScore,
              winEndTime: prev.winEndTime ?? (now + 10000),
            };
          }
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
            winEndTime: now + 10000,
            deadPlayers: {},
            reviveFx: {},
          };

        case 'defenders_win':
          if (prev.phase === 'defenders_win') {
            return {
              ...prev,
              attackersScore: typeof payload?.attackersScore === 'number' ? payload.attackersScore : prev.attackersScore,
              defendersScore: typeof payload?.defendersScore === 'number' ? payload.defendersScore : prev.defendersScore,
              winEndTime: prev.winEndTime ?? (now + 10000),
            };
          }
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
            winEndTime: now + 10000,
            deadPlayers: {},
            reviveFx: {},
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

        case 'timer_speed_update': {
          const nextMultiplier = typeof payload?.speedMultiplier === 'number' ? payload.speedMultiplier : prev.timerSpeedMultiplier;
          const nextMode = payload?.effectiveMode ?? prev.timerSpeedMode;
          const nextAnnouncement = typeof payload?.announcement === 'string' ? payload.announcement : null;
          const nextTone =
            nextMode === 'fast' ? 'fast'
            : nextMode === 'slow' ? 'slow'
            : 'neutral';

          const roundRemaining = prev.endTime !== null
            ? getPreciseRemainingSeconds(prev.endTime, prev.timerSpeedMultiplier, now)
            : prev.phase === 'round_active'
              ? prev.timeRemaining
              : 0;

          const spikeRemaining = prev.spikeEndTime !== null
            ? getPreciseRemainingSeconds(prev.spikeEndTime, prev.timerSpeedMultiplier, now)
            : prev.phase === 'spike_planted'
              ? prev.spikeTimer
              : 0;

          return {
            ...prev,
            timerSpeedMultiplier: nextMultiplier,
            timerSpeedMode: nextMode,
            timerSpeedFastCount: typeof payload?.fastCount === 'number' ? payload.fastCount : prev.timerSpeedFastCount,
            timerSpeedSlowCount: typeof payload?.slowCount === 'number' ? payload.slowCount : prev.timerSpeedSlowCount,
            timerSpeedNextExpiryAt: typeof payload?.nextExpiryAt === 'number' ? payload.nextExpiryAt : null,
            globalAnnouncement: nextAnnouncement ?? prev.globalAnnouncement,
            announcementTone: nextAnnouncement ? nextTone : prev.announcementTone,
            announcementEndTime: nextAnnouncement ? (now + 6500) : prev.announcementEndTime,
            timeRemaining: prev.phase === 'round_active' && roundRemaining > 0
              ? Math.max(0, Math.floor(roundRemaining))
              : prev.timeRemaining,
            spikeTimer: prev.phase === 'spike_planted' && spikeRemaining > 0
              ? Math.max(0, Math.floor(spikeRemaining))
              : prev.spikeTimer,
            endTime: prev.phase === 'round_active' && roundRemaining > 0
              ? deriveScaledEndTime(roundRemaining, nextMultiplier, now)
              : prev.endTime,
            spikeEndTime: prev.phase === 'spike_planted' && spikeRemaining > 0
              ? deriveScaledEndTime(spikeRemaining, nextMultiplier, now)
              : prev.spikeEndTime,
          };
        }

        default:
          return prev;
      }
    });
  }, []);

  const handleEngineMessage = useCallback((msg: WebSocketMessage) => {
    handleMessage(msg, 'engine');
  }, [handleMessage]);

  const handleAdminMessage = useCallback((msg: WebSocketMessage) => {
    handleMessage(msg, 'admin');
  }, [handleMessage]);

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
    handleMessage: handleEngineMessage, handleAdminMessage, handleConnect, handleDisconnect,
    markAttackersReady, markDefendersReady, resetGame,
  };
}


