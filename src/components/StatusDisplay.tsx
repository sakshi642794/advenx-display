import React from 'react';
import { GamePhase } from '../types/game';
import { TimerDisplay } from './TimerDisplay';
import { SpikePulse } from './SpikePulse';
import { WinScreen } from './WinScreen';

interface StatusDisplayProps {
  phase: GamePhase; statusMessage: string;
  timeRemaining: number; spikeTimer: number; defuseTimer: number;
  roundTotal: number | null; spikeTotal: number | null; defuseTotal: number | null;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({
  phase, statusMessage, timeRemaining, spikeTimer, defuseTimer, roundTotal, spikeTotal, defuseTotal,
}) => {
  const isWin   = phase === 'attackers_win' || phase === 'defenders_win';
  const showTimer = ['round_active','spike_planted','defusing'].includes(phase);
  const showSpike = ['spike_planting','spike_planted','defusing'].includes(phase);
  const isDefusing= phase === 'defusing';
  const isAwaiting= phase === 'awaiting';
  const defuseProgress = defuseTotal
    ? Math.max(0, Math.min(1, (defuseTotal - defuseTimer) / defuseTotal))
    : 0;

  const statusColor =
    phase === 'attackers_win'  ? 'var(--clr-red)'
    : phase === 'defenders_win'? 'var(--clr-cyan)'
    : ['spike_planted','spike_planting'].includes(phase) ? 'var(--clr-spike)'
    : phase === 'defusing'     ? 'var(--clr-cyan)'
    : 'var(--clr-white)';

  const statusSize = isWin ? '0px' : isAwaiting ? 'clamp(28px,5vw,52px)' : 'clamp(18px,3vw,28px)';

  return (
    <div style={{
      flex:1, display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', position:'relative', gap:'12px',
      padding:'20px', overflow:'hidden',
    }}>
      {/* Win screen takes over */}
      {phase === 'attackers_win' && <WinScreen team="attacker" />}
      {phase === 'defenders_win' && <WinScreen team="defender" />}

      {!isWin && (
        <>
          {/* Spike icon */}
          {showSpike && <SpikePulse />}

          {/* Status message */}
          <div style={{
            fontFamily:'var(--font-hud)', fontSize:statusSize, fontWeight:700,
            color:statusColor, letterSpacing:'6px', textAlign:'center',
            animation:'fadeIn 0.35s ease',
          }}>
            {statusMessage}
          </div>

          {/* Awaiting blink */}
          {isAwaiting && (
            <div style={{ fontFamily:'var(--font-timer)', fontSize:'32px', color:'var(--clr-red)', animation:'blink 1.2s step-end infinite' }}>_</div>
          )}

          {/* Timer ring */}
          {showTimer && (
            <TimerDisplay
              phase={phase}
              timeRemaining={timeRemaining}
              spikeTimer={spikeTimer}
              defuseTimer={defuseTimer}
              roundTotal={roundTotal}
              spikeTotal={spikeTotal}
              defuseTotal={defuseTotal}
            />
          )}

          {/* Defuse bar */}
          {isDefusing && (
            <div style={{ width:'260px', marginTop:'4px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px', fontFamily:'var(--font-hud)', fontSize:'9px', letterSpacing:'3px', color:'var(--clr-cyan)' }}>
                <span>DEFUSING</span><span>IN PROGRESS</span>
              </div>
              <div style={{ height:'3px', background:'var(--clr-grey2)', position:'relative', overflow:'hidden' }}>
                <div style={{
                  position:'absolute', left:0, top:0, bottom:0,
                  width: `${defuseProgress * 100}%`,
                  background:'var(--clr-cyan)',
                  boxShadow:'0 0 10px var(--clr-cyan-glow)',
                  transition:'width 0.2s linear',
                }}/>
              </div>
            </div>
          )}

          {/* Subtext for spike states */}
          {phase === 'spike_planted' && (
            <div style={{ fontFamily:'var(--font-hud)', fontSize:'11px', letterSpacing:'4px', color:'rgba(255,106,0,0.6)', textAlign:'center', marginTop:'4px' }}>
              DEFUSE BEFORE DETONATION
            </div>
          )}
          {phase === 'spike_planting' && (
            <div style={{ fontFamily:'var(--font-hud)', fontSize:'11px', letterSpacing:'4px', color:'rgba(232,57,42,0.5)', textAlign:'center', marginTop:'4px' }}>
              ATTACKERS ARE PLANTING
            </div>
          )}
        </>
      )}
    </div>
  );
};
