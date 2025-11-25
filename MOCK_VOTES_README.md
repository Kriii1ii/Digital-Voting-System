Setup and run mock real-time voting simulator

Overview

This repository includes a mock votes simulator that emits real-time "prediction:update" events via Socket.IO so the frontend can display animated live polls and AI predictions.

How it works

- Backend: `backend/realtime/mockVotes.js` simulates 5 candidates and emits updates to the Socket.IO room `prediction:mock-election`.
- Frontend: `PredictionPoll` and `LivePoll` components connect to the server using socket.io and will receive `prediction:update` events when the simulator runs.

Enable/Disable

- By default the mock simulator is enabled when the server starts. To disable it, set the env var `ENABLE_MOCK_VOTES=false`.
- You may override the election id used by the mock by setting `MOCK_ELECTION_ID` (default: `mock-election`).

Run locally

1. Start the backend (from repo root):

```bash
# from repo root
cd backend
npm install
# ensure .env has FRONTEND_ORIGINS correct for your dev frontend (eg http://localhost:5173)
node server.js
```

2. Start the frontend (vite):

```bash
cd frontend
npm install
npm run dev
```

Visit the voter dashboard and admin dashboard in the frontend. The poll will appear in the right column on the voter dashboard and in the admin dashboard, and it will update automatically without page refresh.

Troubleshooting

- If you don't see updates, ensure the frontend origin matches `FRONTEND_ORIGINS` in the backend `.env` (or is one of the default allowed origins).
- To silence the mock, set `ENABLE_MOCK_VOTES=false` before starting the backend.
