import React from 'react';
import { GamePhase } from '../types/game';

interface PlayerCardProps {
  label: string;
  num: number;
  team: 'attacker' | 'defender';
  index: number;
  phase: GamePhase;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ label, num, team, index, phase }) => {
  const isAtk = team === 'attacker';
  const color    = isAtk ? 'var(--clr-red)'      : 'var(--clr-cyan)';
  const dimColor = isAtk ? 'var(--clr-red-dim)'  : 'var(--clr-cyan-dim)';
  const softBg   = isAtk ? 'var(--clr-red-soft)' : 'var(--clr-cyan-soft)';
  const glowColor= isAtk ? 'var(--clr-red-glow)' : 'var(--clr-cyan-glow)';

  const spikePlanted = phase === 'spike_planted' || phase === 'defusing';
  const pulsing = spikePlanted;
  const atkPulse = isAtk && pulsing;
  const defPulse = !isAtk && (phase === 'defusing');

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
        border:`1px solid ${dimColor}`,
        background:'var(--clr-bg3)',
        position:'relative', overflow:'hidden',
        animation: atkPulse ? 'cardPulseRed 1.2s ease infinite' : defPulse ? 'cardPulseCyan 1.2s ease infinite' : 'none',
        transition:'all 0.3s ease',
      }}>
        {/* Top accent bar */}
        <div style={{
          height:'3px', background:color,
          boxShadow:`0 0 8px ${glowColor}`,
          flexShrink:0,
        }} />

        {/* Inner glow */}
        <div style={{
          position:'absolute', top:0, left:0, right:0, height:'50%',
          background:`linear-gradient(to bottom, ${softBg}, transparent)`,
          pointerEvents:'none',
        }} />

        {/* Player number — big */}
        <div style={{
          flex:1, display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:'var(--font-hud)', fontSize:'22px', fontWeight:900,
          color, letterSpacing:'1px',
          textShadow:`0 0 14px ${glowColor}`,
          position:'relative', zIndex:1,
        }}>
          {num < 10 ? `0${num}` : num}
        </div>

        {/* Label row at bottom */}
        <div style={{
          background: softBg,
          borderTop:`1px solid ${dimColor}`,
          textAlign:'center', padding:'3px 0',
          fontFamily:'var(--font-hud)', fontSize:'9px',
          letterSpacing:'2px', color, flexShrink:0,
        }}>
          {label}
        </div>

        {/* Corner accents */}
        {[['top:4px','left:4px','borderTop','borderLeft'],['bottom:4px','right:4px','borderBottom','borderRight']].map(([p1,p2,b1,b2],i)=>(
          <div key={i} style={{
            position:'absolute', ...Object.fromEntries([[p1.split(':')[0],p1.split(':')[1]],[p2.split(':')[0],p2.split(':')[1]]]),
            width:'8px', height:'8px',
            [b1]:`1px solid ${color}`, [b2]:`1px solid ${color}`,
            opacity: 0.6,
          }} />
        ))}
      </div>
    </div>
  );
};
