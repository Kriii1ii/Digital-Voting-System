# Docker / Compose Quickstart

This repository includes Dockerfiles and docker-compose configurations for both production-like builds and development with hot reload.

Quick commands (from project root)

- Production (build optimized frontend and run all services):
```bash
docker compose up --build
```

- Development (hot reload for backend and frontend):
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Services
- `mongo` — MongoDB (replica-set single node), data persisted in `mongo-data` volume.
- `backend` — Node/Express backend (port 5001).
- `frontend` — Static frontend served via nginx (host port 5173 -> container 80).
- `test-emitter` — Optional simple emitter used to test realtime frontend updates (port 5002).

Notes
- Vite/static frontend: `VITE_BACKEND_URL` is read at build time for production. Rebuild the frontend image if you change this.
- Dev mode frontend uses Vite dev server (port 5173) and gets `VITE_BACKEND_URL` from runtime environment in `docker-compose.dev.yml`.
- To point the frontend at the test-emitter in dev: set `VITE_BACKEND_URL` to `http://host.docker.internal:5002` in `docker-compose.dev.yml` or your local `.env`.

Rebuilding frontend with a new backend URL
```bash
docker compose build --no-cache frontend --build-arg VITE_BACKEND_URL=http://localhost:5002
docker compose up frontend
```

Stopping and removing containers
```bash
docker compose down -v
```

Troubleshooting
- If the frontend cannot reach the backend in production, ensure `VITE_BACKEND_URL` points to an address reachable from the client (containers use service names, but static builds run in the browser and must use a browser-accessible URL).
- If Mongo fails to initialize: check `docker compose logs mongo` and run the replica set init script if necessary (see `DEV_SETUP.md`).
