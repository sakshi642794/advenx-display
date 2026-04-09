import { Header } from "./Header";
import { StatusDisplay } from "./StatusDisplay";
import { TeamRow } from "./TeamRow";
import ConnectionOverlay from "./ConnectionOverlay";
import { HudBrackets } from "./HudBrackets";

type Props = {
  gameState: any;
  isConnected: boolean;
};

const GameScreen: React.FC<Props> = ({ gameState, isConnected }) => {
  const phase = gameState?.phase || "idle";

  const ambientColor =
    phase === "spike_planted" || phase === "attackers_win"
      ? "rgba(255,106,0,0.08)"
      : phase === "defusing" || phase === "defenders_win"
      ? "rgba(0,212,255,0.08)"
      : phase === "spike_planting"
      ? "rgba(232,57,42,0.05)"
      : "transparent";

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--clr-bg1)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(ellipse at 50% 45%, ${ambientColor} 0%, transparent 70%)`,
        }}
      />

      <Header gameState={gameState} isConnected={isConnected} />

      <StatusDisplay
        phase={phase}
        statusMessage={gameState.statusMessage}
        timeRemaining={gameState.timeRemaining}
        spikeTimer={gameState.spikeTimer}
      />

      <TeamRow team="attacker" score={gameState.attackersScore} phase={phase} />
      <TeamRow team="defender" score={gameState.defendersScore} phase={phase} />

      <HudBrackets phase={phase} />

      <ConnectionOverlay isConnected={isConnected} />
    </div>
  );
};

export default GameScreen;
