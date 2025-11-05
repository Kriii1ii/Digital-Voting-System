# DEV_SETUP — Local dev runbook

This file describes how to run the entire Digital Voting System locally: backend, frontend, AI microservice, biometric service, and MongoDB with replica set for change streams.

Prerequisites
- Node 18+ and npm
- Python 3.10+ and pip
- Docker & Docker Compose (optional, recommended to run MongoDB replica set)

1) Environment files
- Copy example envs and edit if you want custom values:
  - `cp backend/.env.example backend/.env`
  - `cp ai-prediction/.env.example ai-prediction/.env`
  - `cp frontend/.env.example frontend/.env`

2) Start MongoDB (recommended: docker-compose)
- Start the local MongoDB replica set (docker-compose provided):
  ```bash
  docker-compose up -d
  # wait a few seconds then initialize replica set (script included)
  ./scripts/init_mongo_rs.sh
  ```

If you prefer to run mongod directly, start with replSet option and then run `mongosh --eval 'rs.initiate()'`.

3) Install Node dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

4) Install Python dependencies
```bash
# AI microservice
cd ai-prediction
python3 -m venv .venv-ai
source .venv-ai/bin/activate
pip install -r requirements.txt
deactivate

# Biometric service (if used)
cd ../biometric-service
python3 -m venv .venv-bio
source .venv-bio/bin/activate
pip install -r requirements.txt
deactivate
```

5) Seed the database
```bash
export MONGO_URI="mongodb://localhost:27017/digital_voting"
node backend/seed/seedVoters.js
node scripts/seed_mock_engagement.js test-election-1
```

6) Start AI microservice and train the model
```bash
cd ai-prediction
source .venv-ai/bin/activate
uvicorn app:app --reload --port 8000
# In another shell (after uvicorn is ready):
curl -X POST "http://localhost:8000/train-from-db?election_id=test-election-1"
```

7) Start backend and frontend
```bash
# backend (port from backend/.env or 5001)
cd backend
npm run dev

# frontend
cd ../frontend
npm run dev
```

8) Sanity checks
- AI health: `curl http://localhost:8000/health`
- Prediction call: `./backend/test_prediction_call.sh test-election-1`
- Tail backend logs and watch for `prediction:update` emits when seeding or adding reactions.

9) Helpful scripts and notes
- `docker-compose.yml` spins up a MongoDB replica set (single-node). Use `./scripts/init_mongo_rs.sh` if automatic init doesn't complete.
- Use `git status` to make sure you are on `main` and have pulled latest changes.

If anything fails, paste the exact log output and I'll help fix it.
