You are working inside the repository `Digital-Voting-System-1`. 
Your task is to make the entire system fully runnable end-to-end (backend + frontend + AI microservice + realtime updates + seeding + training).

=============================================
SYSTEM CONTEXT
=============================================
The repo already contains:
- backend (Node.js + Express + MongoDB + Socket.IO)
- frontend (React + Vite + Tailwind)
- ai-prediction (Python FastAPI service using scikit-learn)
- biometric-service (Python service)
- realtime watcher (backend/realtime/predictionWatcher.js)
- data seeders (seedVoters.js, seed_mock_engagement.js)
- all controllers, models, and routes are present but not all are tested.

=============================================
OBJECTIVE
=============================================
Make the entire project runnable locally with the following goals:
1. All servers (frontend, backend, AI, biometric) start without errors.
2. MongoDB runs with a replica set so realtime updates work.
3. The database is seeded with mock data (voters, posts, reactions, comments, results).
4. The AI microservice trains and saves model_v1.joblib + model_meta.json.
5. The backend prediction watcher automatically emits Socket.IO `prediction:update` events whenever engagement data changes.
6. The frontend LivePoll.jsx receives real-time updates and animates poll bars automatically.
7. All curl tests and npm scripts run successfully.
8. Environment variables are set properly and fallback handling is added if missing.

=============================================
TASKS TO COMPLETE
=============================================
1. **Environment Setup**
   - Create example `.env` files for backend, ai-prediction, and biometric-service:
     ```
     # backend/.env
     MONGO_URI=mongodb://localhost:27017/digital_voting
     AI_PREDICTION_URL=http://localhost:8000
     PORT=5001
     ELECTION_ID=test-election-1
     PREDICTION_DEBOUNCE_MS=30000

     # ai-prediction/.env
     MONGO_URI=mongodb://localhost:27017/digital_voting
     MODEL_PATH=models/model_v1.joblib
     META_PATH=models/model_meta.json

     # frontend/.env
     VITE_API_URL=http://localhost:5001
     ```

2. **Dependencies**
   - Install all required Node and Python dependencies:
     ```bash
     cd backend && npm install
     cd ../frontend && npm install
     cd ../ai-prediction && python3 -m venv .venv-ai && source .venv-ai/bin/activate && pip install -r requirements.txt && deactivate
     cd ../biometric-service && python3 -m venv .venv-bio && source .venv-bio/bin/activate && pip install -r requirements.txt && deactivate
     ```

3. **MongoDB Replica Set**
   - Create local replica set for realtime change streams:
     ```bash
     mongod --dbpath ~/mongodb-data --replSet rs0 --bind_ip localhost --port 27017 &
     mongosh --eval 'rs.initiate()'
     ```

4. **Data Seeding**
   - Run:
     ```bash
     export MONGO_URI="mongodb://localhost:27017/digital_voting"
     node backend/seed/seedVoters.js
     node backend/scripts/seed_mock_engagement.js test-election-1
     ```

5. **AI Model Training**
   - Start AI microservice:
     ```bash
     cd ai-prediction
     source .venv-ai/bin/activate
     uvicorn app:app --reload --port 8000
     ```
   - Then trigger training:
     ```bash
     curl -X POST "http://localhost:8000/train-from-db?election_id=test-election-1"
     ```
   - Ensure model files are created at `ai-prediction/models/model_v1.joblib` and `model_meta.json`.

6. **Backend & Frontend Startup**
   - Start backend:
     ```bash
     cd backend
     npm run dev
     ```
   - Start frontend:
     ```bash
     cd frontend
     npm run dev
     ```
   - Both should connect to MongoDB and AI service successfully.

7. **Realtime Watcher Validation**
   - Confirm backend logs show:
     ```
     Prediction watcher started.
     📢 Emitted prediction update for election=test-election-1
     ```
   - When you add or update engagement data, Socket.IO emits `prediction:update`.
   - Frontend LivePoll.jsx should update automatically.

8. **Verification Commands**
   Run these tests to confirm all parts work:
   ```bash
   # AI health
   curl http://localhost:8000/health
   # Prediction endpoint
   ./backend/test_prediction_call.sh test-election-1
   # Watch logs for prediction:update
   tail -f backend/logs/server.log
Quality of Life
Add a DEV_SETUP.md summarizing all setup commands and environment examples.
Add "start:all" npm script in root package.json to start all services via concurrently.
Final Validation
Verify frontend dashboard loads.
Verify LivePoll.jsx auto-updates (no manual refresh).
Verify AI predictions update after each engagement.
Verify model training and seeding logs show success.
=============================================
OUTPUT EXPECTED FROM COPILOT
Copilot should:
Write or fix all missing code, environment templates, and scripts so the above steps succeed.
Ensure no duplicate default exports.
Ensure backend connects to AI microservice correctly.
Ensure LivePoll.jsx listens to prediction:update and updates automatically.
Ensure clean npm run dev and uvicorn app:app startup without any errors.
Provide confirmation instructions/logs to verify everything is working.
=============================================
AFTER COMPLETION
All these commands must work successfully:
pip install -r ai-prediction/requirements.txt
cd backend && npm install
MONGO_URI="mongodb://localhost:27017/digital_voting" node seed/seedVoters.js
MONGO_URI="mongodb://localhost:27017/digital_voting" node scripts/seed_mock_engagement.js test-election-1
uvicorn ai-prediction.app:app --reload --port 8000
cd backend && npm run dev
./backend/test_prediction_call.sh test-election-1
If any fail, automatically fix missing dependencies, path issues, or import errors.
=============================================
GOAL
Deliver a fully working, locally runnable digital voting system that:
✅ Seeds data
✅ Trains AI model
✅ Predicts election results automatically
✅ Updates live poll via realtime Socket.IO events
✅ Displays changes instantly on the React frontend.