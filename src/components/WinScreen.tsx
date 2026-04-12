import React from 'react';

interface WinScreenProps { team: 'attacker' | 'defender'; }

export const WinScreen: React.FC<WinScreenProps> = ({ team }) => {
  const isAtk   = team === 'attacker';
  const color    = isAtk ? 'var(--clr-red)'      : 'var(--clr-cyan)';
  const glowRgb  = isAtk ? '232,57,42'            : '0,212,240';
  const label    = isAtk ? 'ATTACKERS WIN'         : 'DEFENDERS WIN';
  const sub      = isAtk ? 'THE SPIKE HAS DETONATED' : 'SPIKE SUCCESSFULLY DEFUSED';

  return (
    <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:10, overflow:'hidden' }}>
      {/* Scan sweep line */}
      <div style={{
        position:'absolute', left:0, right:0, height:'2px',
        background:`linear-gradient(90deg, transparent, rgba(${glowRgb},0.8), transparent)`,
        animation:'scanSweep 1.2s ease forwards',
        boxShadow:`0 0 20px rgba(${glowRgb},0.6)`,
      }}/>

      {/* Full background radial */}
      <div style={{
        position:'absolute', inset:0,
        background:`radial-gradient(ellipse at center, rgba(${glowRgb},0.12) 0%, rgba(${glowRgb},0.03) 40%, transparent 70%)`,
        pointerEvents:'none',
      }}/>

      {/* Horizontal lines */}
      {[-1,1].map(dir=>(
        <div key={dir} style={{
          position:'absolute', left:0, right:0,
          top:`calc(50% + ${dir * 90}px)`, height:'1px',
          background:`linear-gradient(90deg, transparent 5%, rgba(${glowRgb},0.4) 30%, rgba(${glowRgb},0.4) 70%, transparent 95%)`,
        }}/>
      ))}

      {/* Team label */}
      <div style={{
        fontFamily:'var(--font-hud)', fontSize:'clamp(36px,7vw,80px)',
        fontWeight:900, color, letterSpacing:'6px', textAlign:'center',
        textShadow:`0 0 30px rgba(${glowRgb},0.8), 0 0 80px rgba(${glowRgb},0.4)`,
        animation:'winCrash 0.7s cubic-bezier(0.2,0.8,0.3,1) forwards',
        marginBottom:'16px',
      }}>{label}</div>

      {/* Subtitle */}
      <div style={{
        fontFamily:'var(--font-hud)', fontSize:'clamp(11px,1.8vw,16px)',
        letterSpacing:'5px', color:`rgba(${glowRgb},0.7)`,
        animation:'fadeIn 0.6s ease 0.5s both',
        marginBottom:'32px',
      }}>{sub}</div>

      {/* Divider */}
      <div style={{
        width:'200px', height:'1px',
        background:`linear-gradient(90deg, transparent, ${color}, transparent)`,
        animation:'fadeIn 0.5s ease 0.8s both',
      }}/>
    </div>
  );
};
