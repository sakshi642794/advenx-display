# ADVENX Display — Live Arena Screen

A real-time display screen for the ADVENX tactical game. Built with React + TypeScript + Vite.

## Tech Stack
- **React 18** + **TypeScript**
- **Vite** (dev server + bundler)
- **WebSocket** — connects to Raspberry Pi backend

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure backend URL
Copy `.env.example` to `.env` and set your Pi's WebSocket URL:
```bash
cp .env.example .env
```
Edit `.env`:
```
VITE_WS_URL=ws://<YOUR_PI_IP>:8080
```

### 3. Run development server
```bash
npm run dev
```

### 4. Build for production
```bash
npm run build
npm run preview
```

## WebSocket Events

The UI reacts to the following events from the backend:

| Event | Description |
|-------|-------------|
| `round_started` | Round begins, timer starts |
| `spike_planting` | Attacker is planting |
| `plant_canceled` | Planting interrupted, round resumes |
| `round_resumed` | Round continues after interruption |
| `spike_planted` | Spike is planted, countdown begins |
| `defuse_start` | Defender is defusing |
| `defuse_canceled` | Defuse interrupted |
| `defuse_success` | Spike defused — defenders win |
| `round_end` | Round has ended |
| `attackers_win` | Attackers win the round |
| `defenders_win` | Defenders win the round |

### Expected message format
```json
{
  "event": "round_started",
  "payload": {
    "round": 1,
    "total_rounds": 3,
    "time_remaining": 600
  }
}
```
`payload` fields are all optional — the UI has sensible defaults.

## Project Structure
```
advenx-display/
├── src/
│   ├── components/
│   │   ├── GameScreen.tsx       # Root layout
│   │   ├── Header.tsx           # Top bar (logo, round, live)
│   │   ├── StatusDisplay.tsx    # Main center area
│   │   ├── TimerDisplay.tsx     # Countdown timer
│   │   ├── TeamRow.tsx          # Player cards row
│   │   ├── PlayerCard.tsx       # Individual player card
│   │   └── ConnectionOverlay.tsx
│   ├── hooks/
│   │   ├── useWebSocket.ts      # WebSocket + auto-reconnect
│   │   └── useGameState.ts      # Game logic + timers
│   ├── types/
│   │   └── game.ts              # TypeScript types
│   ├── styles/
│   │   └── globals.css          # CSS variables, animations
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```
