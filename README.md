# ADVENX Display - Live Arena Screen

A real-time display screen for the ADVENX tactical game, built with React, TypeScript, and Vite.

## Tech Stack
- **React 18** + **TypeScript**
- **Vite** for development and bundling
- **Dual WebSocket connections** for Pi-engine game state and direct admin commands

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure websocket URLs
Copy `.env.example` to `.env` and set both websocket endpoints:
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_WS_URL=ws://<YOUR_PI_IP>:8080
VITE_ADMIN_WS_URL=ws://<YOUR_ADMIN_BACKEND_IP>:8000
```

`VITE_WS_URL` is the Pi relay/game-state socket.
`VITE_ADMIN_WS_URL` is the admin/backend socket that sends ready and ability commands directly to the display.

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

The display listens on two sockets:

- Pi relay: round/game-state updates and local operator sends
- Admin backend: ready state and direct ability commands

Supported inbound events include:

| Event | Description |
|-------|-------------|
| `round_started` | Round begins, timer starts |
| `spike_planting` | Attacker is planting |
| `plant_canceled` | Planting interrupted, round resumes |
| `round_resumed` | Round continues after interruption |
| `spike_planted` | Spike is planted, countdown begins |
| `defuse_start` | Defender is defusing |
| `defuse_canceled` | Defuse interrupted |
| `defuse_success` | Spike defused - defenders win |
| `round_end` | Round has ended |
| `attackers_win` | Attackers win the round |
| `defenders_win` | Defenders win the round |
| `attackers_ready` / `defenders_ready` | Team ready state from admin |
| `attackers_not_ready` / `defenders_not_ready` | Team ready reset from admin |
| `teams_ready` | Combined ready snapshot from admin |
| `kill` / `revive` | Admin command aliases with `payload.playerId` |
| `A1-killed` / `revive-A1` | Concrete player command broadcasts |
| `fast` / `slow` / `timer_speed_update` | Time-shift ability updates |

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

`payload` fields are optional, and the UI falls back to the current state when a field is omitted.

## Project Structure
```text
advenx-display/
|-- src/
|   |-- components/
|   |-- hooks/
|   |-- types/
|   |-- styles/
|   |-- App.tsx
|   `-- main.tsx
|-- .env.example
|-- index.html
|-- package.json
|-- tsconfig.json
`-- vite.config.ts
```
