import React from 'react';
import { GamePhase } from '../types/game';

interface PlayerCardProps {
  label: string;
  num: number;
  team: 'attacker' | 'defender';
  index: number;
  phase: GamePhase;
  isDead?: boolean;
  reviveActive?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ label, num, team, index, phase, isDead = false, reviveActive = false }) => {
  const isAtk = team === 'attacker';
  const color    = isAtk ? 'var(--clr-red)'      : 'var(--clr-cyan)';
  const dimColor = isAtk ? 'var(--clr-red-dim)'  : 'var(--clr-cyan-dim)';
  const softBg   = isAtk ? 'var(--clr-red-soft)' : 'var(--clr-cyan-soft)';
  const glowColor= isAtk ? 'var(--clr-red-glow)' : 'var(--clr-cyan-glow)';

  const spikePlanted = phase === 'spike_planted' || phase === 'defusing';
  const pulsing = spikePlanted;
  const atkPulse = isAtk && pulsing;
  const defPulse = !isAtk && (phase === 'defusing');

  const deadBorder = 'rgba(160,160,160,0.18)';
  const deadText = 'rgba(220,220,220,0.28)';

  return (
    <div style={{
      width:'68px', height:'80px', position:'relative',
      animation:`slideUp 0.35s ease ${index * 0.07}s both`,
    }}>
      {/* Pulse halo behind card when spike active */}
      {(atkPulse || defPulse) && (
        <div style={{
          position:'absolute', inset:0, borderRadius:'2px',
          border:`1px solid ${color}`,
          animation:`haloExpand 1.4s ease-out ${index * 0.15}s infinite`,
          pointerEvents:'none',
        }} />
      )}

      {/* Card body */}
      <div style={{
        width:'100%', height:'100%', display:'flex', flexDirection:'column',
        border:`1px solid ${isDead ? deadBorder : dimColor}`,
        background:'var(--clr-bg3)',
        position:'relative', overflow:'hidden',
        animation: isDead ? 'none' : atkPulse ? 'cardPulseRed 1.2s ease infinite' : defPulse ? 'cardPulseCyan 1.2s ease infinite' : 'none',
        transition:'all 0.3s ease',
        filter: isDead ? 'grayscale(1) saturate(0.2)' : 'none',
        opacity: isDead ? 0.42 : 1,
      }}>
        {/* Top accent bar */}
        <div style={{
          height:'3px',
          background: isDead ? 'rgba(210,210,210,0.25)' : color,
          boxShadow: isDead ? 'none' : `0 0 8px ${glowColor}`,
          flexShrink:0,
        }} />

        {/* Inner glow */}
        {!isDead && (
          <div style={{
            position:'absolute', top:0, left:0, right:0, height:'50%',
            background:`linear-gradient(to bottom, ${softBg}, transparent)`,
            pointerEvents:'none',
          }} />
        )}

        {/* Player number — big */}
        <div style={{
          flex:1, display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:'var(--font-hud)', fontSize:'22px', fontWeight:900,
          color: isDead ? deadText : color,
          letterSpacing:'1px',
          textShadow: isDead ? 'none' : `0 0 14px ${glowColor}`,
          position:'relative', zIndex:1,
        }}>
          {num < 10 ? `0${num}` : num}
        </div>

        {/* Label row at bottom */}
        <div style={{
          background: isDead ? 'rgba(120,120,120,0.08)' : softBg,
          borderTop:`1px solid ${isDead ? deadBorder : dimColor}`,
          textAlign:'center', padding:'3px 0',
          fontFamily:'var(--font-hud)', fontSize:'9px',
          letterSpacing:'2px',
          color: isDead ? deadText : color,
          flexShrink:0,
        }}>
          {label}
        </div>

        {/* Corner accents */}
        {[['top:4px','left:4px','borderTop','borderLeft'],['bottom:4px','right:4px','borderBottom','borderRight']].map(([p1,p2,b1,b2],i)=>(
          <div key={i} style={{
            position:'absolute', ...Object.fromEntries([[p1.split(':')[0],p1.split(':')[1]],[p2.split(':')[0],p2.split(':')[1]]]),
            width:'8px', height:'8px',
            [b1]:`1px solid ${isDead ? 'rgba(210,210,210,0.22)' : color}`,
            [b2]:`1px solid ${isDead ? 'rgba(210,210,210,0.22)' : color}`,
            opacity: 0.6,
          }} />
        ))}

        {/* Revive FX overlay */}
        {reviveActive && (
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex: 5 }}>
            {[
              { left: '14px', top: '16px', delay: '0s' },
              { left: '40px', top: '28px', delay: '0.08s' },
              { left: '26px', top: '42px', delay: '0.14s' },
            ].map((p, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: p.left,
                  top: p.top,
                  color: 'var(--clr-green)',
                  textShadow: '0 0 10px var(--clr-green-glow)',
                  fontFamily: 'var(--font-hud)',
                  fontWeight: 900,
                  fontSize: '16px',
                  animation: `revivePlus 0.9s ease-out ${p.delay} both`,
                }}
              >
                +
              </div>
            ))}
            <div style={{
              position:'absolute',
              inset:'-8px',
              border:'1px solid rgba(77,255,122,0.45)',
              boxShadow:'0 0 18px rgba(77,255,122,0.35)',
              animation:'reviveGlow 0.9s ease-out both',
            }} />
          </div>
        )}
      </div>
    </div>
  );
};
