import React from 'react';
import { GamePhase } from '../types/game';
import { TimerDisplay } from './TimerDisplay';
import { EventTimer } from './EventTimer';
import { WinScreen } from './WinScreen';

interface StatusDisplayProps {
  phase: GamePhase;
  statusMessage: string;
  currentRound: number;
  timeRemaining: number;
  plantTimer: number;
  plantTotal: number | null;
  spikeTimer: number;
  defuseTimer: number;
  defuseTotal: number | null;
  roundStartRemaining: number;
  attackersReady: boolean;
  defendersReady: boolean;
}

// Phases where the event ring is the primary focus
const EVENT_TIMER_PHASES: GamePhase[] = ['spike_planting', 'spike_planted', 'defusing'];
// Phases where main timer is big and alone
const PRIMARY_TIMER_PHASES:   GamePhase[] = ['round_active'];

export const StatusDisplay: React.FC<StatusDisplayProps> = ({
  phase,
  statusMessage,
  currentRound,
  timeRemaining,
  plantTimer,
  plantTotal,
  spikeTimer,
  defuseTimer,
  defuseTotal,
  roundStartRemaining,
  attackersReady,
  defendersReady,
}) => {
  const isWin        = phase === 'attackers_win' || phase === 'defenders_win';
  const isAwaiting   = phase === 'awaiting';
  const isStarting   = phase === 'round_starting';
  const isRoundOver  = phase === 'round_over';
  const showMainBig  = PRIMARY_TIMER_PHASES.includes(phase);
  const showMainSmall= false;
  const showEvent    = EVENT_TIMER_PHASES.includes(phase);

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
          {!isAwaiting && !isStarting && (
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
              <div style={{ display: 'flex', gap: '24px' }}>
                <TeamReadyPill label="ATTACKERS" ready={attackersReady} color="red" />
                <TeamReadyPill label="DEFENDERS" ready={defendersReady} color="cyan" />
              </div>
              {attackersReady && defendersReady && (
                <div style={{
                  fontFamily: 'var(--font-hud)', fontSize: '11px', letterSpacing: '4px',
                  color: 'var(--clr-white)', marginTop: '8px', animation: 'blink 1s step-end infinite',
                }}>
                  AUTO STARTING ROUND...
                </div>
              )}
            </div>
          )}

          {/* ROUND STARTING state */}
          {isStarting && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px, 2vh, 18px)' }}>
              <div style={{
                fontFamily: 'var(--font-hud)',
                fontSize: 'clamp(26px, 4.5vw, 52px)',
                fontWeight: 700,
                letterSpacing: 'clamp(5px, 1vw, 10px)',
                color: 'var(--clr-white)',
                textAlign: 'center',
                textShadow: '0 0 18px rgba(255,255,255,0.18)',
              }}>
                {`ROUND ${currentRound}`}
              </div>
              <div style={{
                fontFamily: 'var(--font-hud)',
                fontSize: 'clamp(12px, 2vw, 20px)',
                fontWeight: 700,
                letterSpacing: 'clamp(4px, 0.8vw, 8px)',
                color: 'var(--clr-grey)',
                textAlign: 'center',
              }}>
                STARTING IN
              </div>
              <div style={{
                fontFamily: 'var(--font-timer)',
                fontSize: 'clamp(64px, 12vw, 140px)',
                color: 'var(--clr-white)',
                textShadow: '0 0 30px rgba(255,255,255,0.35)',
                letterSpacing: 'clamp(4px, 1vw, 10px)',
                lineHeight: 1,
                animation: 'timerGlitch 0.8s infinite',
              }}>
                {Math.max(0, roundStartRemaining)}
              </div>
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
                plantTimer={plantTimer}
                plantTotal={plantTotal}
                spikeTimer={spikeTimer}
                defuseTimer={defuseTimer}
                defuseTotal={defuseTotal}
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

const TeamReadyPill: React.FC<{ label: string; ready: boolean; color: 'red' | 'cyan' }> = ({ label, ready, color }) => {
  const c     = color === 'red' ? 'var(--clr-red)'      : 'var(--clr-cyan)';
  const cDim  = color === 'red' ? 'var(--clr-red-dim)'  : 'var(--clr-cyan-dim)';
  const cSoft = color === 'red' ? 'var(--clr-red-soft)' : 'var(--clr-cyan-soft)';
  const glow  = color === 'red' ? 'var(--clr-red-glow)' : 'var(--clr-cyan-glow)';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
      padding: '16px 24px',
      border: `1px solid ${ready ? c : cDim}`,
      background: ready ? cSoft : 'transparent',
      boxShadow: ready ? `0 0 24px ${glow}` : 'none',
      transition: 'all 0.4s ease',
      minWidth: '120px',
    }}>
      <div style={{ fontFamily: 'var(--font-hud)', fontSize: '10px', letterSpacing: '3px', color: ready ? c : '#444' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: ready ? c : '#222',
          boxShadow: ready ? `0 0 10px ${glow}` : 'none',
          animation: ready ? `${color === 'red' ? 'pulseRed' : 'pulseCyan'} 1.5s infinite` : 'none',
        }} />
        <span style={{ fontFamily: 'var(--font-hud)', fontSize: '11px', letterSpacing: '2px', color: ready ? c : '#333' }}>
          {ready ? 'READY' : 'NOT READY'}
        </span>
      </div>
    </div>
  );
};
