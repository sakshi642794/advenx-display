import React from 'react';
import { PlayerCard } from './PlayerCard';
import { GamePhase } from '../types/game';

interface TeamRowProps {
  team: 'attacker' | 'defender';
  score: number;
  phase: GamePhase;
  deadPlayers: Record<string, boolean>;
  reviveFx: Record<string, number>;
}

export const TeamRow: React.FC<TeamRowProps> = ({ team, phase, deadPlayers, reviveFx }) => {
  const isAtk  = team === 'attacker';
  const color   = isAtk ? 'var(--clr-red)'     : 'var(--clr-cyan)';
  const dimColor= isAtk ? 'var(--clr-red-dim)' : 'var(--clr-cyan-dim)';
  const softBg  = isAtk ? 'var(--clr-red-soft)': 'var(--clr-cyan-soft)';
  const label   = isAtk ? 'ATTACKERS' : 'DEFENDERS';
  const prefix  = isAtk ? 'A' : 'D';

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems: isAtk ? 'flex-start' : 'flex-end', gap:'10px' }}>
      {/* Team label */}
      <div style={{
        fontFamily:'var(--font-hud)', fontSize:'10px', letterSpacing:'4px',
        color, fontWeight:700,
        padding:'3px 10px', background:softBg, border:`1px solid ${dimColor}`,
      }}>{label}</div>

      {/* Cards */}
      <div style={{ display:'flex', gap:'6px' }}>
        {[1,2,3,4,5].map(n => {
          const id = `${prefix}${n}`;
          return (
            <PlayerCard
              key={n}
              num={n}
              label={id}
              team={team}
              index={n}
              phase={phase}
              isDead={!!deadPlayers[id]}
              reviveActive={!!reviveFx[id]}
            />
          );
        })}
      </div>
    </div>
  );
};
