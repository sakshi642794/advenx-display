import React from 'react';
import { GameState } from '../types/game';

interface HeaderProps { gameState: GameState; isConnected: boolean; }

export const Header: React.FC<HeaderProps> = ({ gameState, isConnected }) => (
  <header style={{
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'0 28px', height:'54px', background:'var(--clr-bg2)',
    borderBottom:'1px solid var(--clr-border)', position:'relative', flexShrink:0,
  }}>
    {/* Logo */}
    <div style={{ fontFamily:'var(--font-hud)', fontWeight:900, fontSize:'20px', letterSpacing:'4px', animation:'glitch 9s infinite' }}>
      ADVEN<span style={{ color:'var(--clr-red)', textShadow:'0 0 12px var(--clr-red-glow)' }}>X</span>
    </div>

    {/* Center: Round + Score */}
    <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', display:'flex', alignItems:'center', gap:'0', fontFamily:'var(--font-hud)' }}>
      {/* Attackers score */}
      <div style={{
        padding:'4px 18px', background:'var(--clr-red-soft)', border:'1px solid var(--clr-red-dim)',
        borderRight:'none', fontSize:'18px', fontWeight:900, color:'var(--clr-red)',
        textShadow:'0 0 10px var(--clr-red-glow)', letterSpacing:'2px',
      }}>{gameState.attackersScore}</div>

      {/* Round badge */}
      <div style={{
        padding:'4px 20px', border:'1px solid var(--clr-red-dim)', background:'rgba(232,57,42,0.06)',
        fontSize:'11px', fontWeight:700, letterSpacing:'3px', color:'var(--clr-white)',
        borderLeft:'1px solid var(--clr-red-dim)', borderRight:'1px solid var(--clr-cyan-dim)',
      }}>ROUND {gameState.currentRound} / {gameState.totalRounds}</div>

      {/* Defenders score */}
      <div style={{
        padding:'4px 18px', background:'var(--clr-cyan-soft)', border:'1px solid var(--clr-cyan-dim)',
        borderLeft:'none', fontSize:'18px', fontWeight:900, color:'var(--clr-cyan)',
        textShadow:'0 0 10px var(--clr-cyan-glow)', letterSpacing:'2px',
      }}>{gameState.defendersScore}</div>
    </div>

    {/* Live indicator */}
    <div style={{ display:'flex', alignItems:'center', gap:'14px', fontFamily:'var(--font-hud)', fontSize:'11px', letterSpacing:'2px', color: isConnected ? 'var(--clr-grey)' : '#444' }}>
      {gameState.timerSpeedMode !== 'normal' && (
        <div style={{
          padding: '4px 10px',
          border: `1px solid ${gameState.timerSpeedMode === 'fast' ? 'var(--clr-red-dim)' : 'var(--clr-cyan-dim)'}`,
          background: gameState.timerSpeedMode === 'fast' ? 'var(--clr-red-soft)' : 'var(--clr-cyan-soft)',
          color: gameState.timerSpeedMode === 'fast' ? 'var(--clr-red)' : 'var(--clr-cyan)',
          boxShadow: gameState.timerSpeedMode === 'fast'
            ? '0 0 14px var(--clr-red-glow)'
            : '0 0 14px var(--clr-cyan-glow)',
          fontSize: '10px',
          letterSpacing: '3px',
        }}>
          {gameState.timerSpeedMode === 'fast' ? 'TIME FLOW 2X' : 'TIME FLOW 0.5X'}
        </div>
      )}
      <div style={{
        width:'7px', height:'7px', borderRadius:'50%',
        background: isConnected ? 'var(--clr-red)' : '#333',
        boxShadow: isConnected ? '0 0 8px var(--clr-red)' : 'none',
        animation: isConnected ? 'pulseRed 2s infinite' : 'none',
      }} />
      {isConnected ? 'LIVE ARENA' : 'CONNECTING...'}
    </div>
  </header>
);
