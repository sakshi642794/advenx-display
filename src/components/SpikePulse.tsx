import React from 'react';

export const SpikePulse: React.FC = () => (
  <div style={{ position:'relative', width:'80px', height:'80px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'8px' }}>
    {/* Expanding rings */}
    {[0,1,2].map(i=>(
      <div key={i} style={{
        position:'absolute', inset:0, borderRadius:'50%',
        border:'2px solid var(--clr-spike)',
        animation:`ringExpand 1.8s ease-out ${i*0.6}s infinite`,
        opacity:0,
      }}/>
    ))}
    {/* Core hexagonal spike icon */}
    <div style={{
      width:'50px', height:'50px', position:'relative',
      display:'flex', alignItems:'center', justifyContent:'center',
      animation:'spikeBeep 1s ease-in-out infinite',
    }}>
      <svg width="50" height="50" viewBox="0 0 50 50">
        <polygon points="25,4 46,16 46,34 25,46 4,34 4,16" fill="rgba(255,106,0,0.12)" stroke="#ff6a00" strokeWidth="1.5"/>
        <polygon points="25,12 38,19.5 38,30.5 25,38 12,30.5 12,19.5" fill="rgba(255,106,0,0.2)" stroke="#ff6a00" strokeWidth="1"/>
        <circle cx="25" cy="25" r="6" fill="#ff6a00" style={{ filter:'drop-shadow(0 0 6px #ff6a00)' }}/>
      </svg>
    </div>
  </div>
);
