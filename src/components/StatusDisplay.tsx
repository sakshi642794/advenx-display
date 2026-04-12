import React from 'react';
import { GamePhase } from '../types/game';
import { TimerDisplay } from './TimerDisplay';
import { EventTimer } from './EventTimer';
import { WinScreen } from './WinScreen';

interface StatusDisplayProps {
  phase: GamePhase;
  statusMessage: string;
  timeRemaining: number;
  spikeTimer: number;
}

// Phases where main round timer shrinks but stays visible
const SECONDARY_TIMER_PHASES: GamePhase[] = ['spike_planting', 'spike_planted', 'defusing'];
// Phases where main timer is big and alone
const PRIMARY_TIMER_PHASES:   GamePhase[] = ['round_active'];

export const StatusDisplay: React.FC<StatusDisplayProps> = ({
  phase, statusMessage, timeRemaining, spikeTimer,
}) => {
  const isWin        = phase === 'attackers_win' || phase === 'defenders_win';
  const isAwaiting   = phase === 'awaiting';
  const isRoundOver  = phase === 'round_over';
  const showMainBig  = PRIMARY_TIMER_PHASES.includes(phase);
  const showMainSmall= SECONDARY_TIMER_PHASES.includes(phase);
  const showEvent    = SECONDARY_TIMER_PHASES.includes(phase);

  const statusColor =
    phase === 'attackers_win'    ? 'var(--clr-red)'
    : phase === 'defenders_win'  ? 'var(--clr-cyan)'
    : phase === 'spike_planted' || phase === 'spike_planting' ? 'var(--clr-spike)'
    : phase === 'defusing'       ? 'var(--clr-cyan)'
    : 'var(--clr-white)';

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: 'clamp(8px, 2vh, 24px) clamp(8px, 2vw, 24px)',
      gap: 'clamp(6px, 1.5vh, 16px)',
      minHeight: 0,
    }}>

      {/* Win screen overlay */}
      {phase === 'attackers_win' && <WinScreen team="attacker" />}
      {phase === 'defenders_win' && <WinScreen team="defender" />}

      {!isWin && (
        <>
          {/* Status label */}
          {!isAwaiting && (
            <div style={{
              fontFamily: 'var(--font-hud)',
              fontSize: 'clamp(11px, 2vw, 22px)',
              fontWeight: 700,
              color: statusColor,
              letterSpacing: 'clamp(3px, 0.8vw, 7px)',
              textAlign: 'center',
              animation: 'fadeIn 0.3s ease',
              flexShrink: 0,
            }}>
              {statusMessage}
            </div>
          )}

          {/* AWAITING state */}
          {isAwaiting && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(8px, 2vh, 16px)' }}>
              <div style={{
                fontFamily: 'var(--font-hud)',
                fontSize: 'clamp(20px, 4.5vw, 52px)',
                fontWeight: 700, letterSpacing: 'clamp(4px, 1vw, 8px)',
                color: 'var(--clr-white)', textAlign: 'center',
              }}>
                AWAITING TEAMS
              </div>
              <div style={{
                fontFamily: 'var(--font-timer)', fontSize: 'clamp(22px, 4vw, 36px)',
                color: 'var(--clr-red)', animation: 'blink 1.2s step-end infinite',
              }}>_</div>
            </div>
          )}

          {/* ROUND OVER state */}
          {isRoundOver && (
            <div style={{
              fontFamily: 'var(--font-hud)',
              fontSize: 'clamp(20px, 4vw, 44px)',
              fontWeight: 700, letterSpacing: 'clamp(4px, 1vw, 8px)',
              color: 'var(--clr-grey)', textAlign: 'center',
            }}>
              {statusMessage}
            </div>
          )}

          {/* ── MAIN BIG TIMER (round_active only) ── */}
          {showMainBig && (
            <TimerDisplay
              phase={phase}
              timeRemaining={timeRemaining}
              spikeTimer={spikeTimer}
            />
          )}

          {/* ── SPLIT VIEW: Event timer big + main timer small ── */}
          {showEvent && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'clamp(8px, 2vh, 20px)',
              width: '100%',
            }}>
              {/* Event ring timer (spike/defuse countdown) — primary */}
              <EventTimer
                phase={phase}
                spikeTimer={spikeTimer}
                timeRemaining={timeRemaining}
              />

              {/* Main round timer — secondary, dimmed, small */}
              {showMainSmall && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: 0.5,
                  flexShrink: 0,
                }}>
                  <div style={{
                    fontFamily: 'var(--font-hud)',
                    fontSize: 'clamp(7px, 1vw, 10px)',
                    letterSpacing: '3px',
                    color: 'var(--clr-grey)',
                  }}>
                    ROUND TIME
                  </div>
                  <TimerDisplay
                    phase="round_active"          // force white/normal colour
                    timeRemaining={timeRemaining}
                    spikeTimer={spikeTimer}
                    compact
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
