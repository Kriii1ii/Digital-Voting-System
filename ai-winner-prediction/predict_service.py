# predict_service.py
# Flask + Socket.IO server that loads trained model from models.pkl and streams live predictions.

import json
import joblib
import os
from flask import Flask, jsonify
from flask_socketio import SocketIO, emit
from feature_engineering import aggregate_posts_to_candidate_features
from pymongo import MongoClient
from bson import ObjectId
import random

# Sentiment analyzer (VADER) if available
try:
    from nltk.sentiment import SentimentIntensityAnalyzer
    _SIA = SentimentIntensityAnalyzer()
except Exception:
    # Try to download vader lexicon on first run
    try:
        import nltk
        nltk.download('vader_lexicon')
        from nltk.sentiment import SentimentIntensityAnalyzer
        _SIA = SentimentIntensityAnalyzer()
    except Exception:
        _SIA = None

# Config
DATA_FILE = "mock_election_dataset.json"
MODEL_FILE = "models.pkl"
DEFAULT_INTERVAL = 3  # seconds between simulated updates

# Initialize Flask & SocketIO
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

# Helper: load model & data
def load_artifacts():
    if not os.path.exists(MODEL_FILE):
        raise FileNotFoundError(f"{MODEL_FILE} not found. Run train_model.py first.")
    bundle = joblib.load(MODEL_FILE)
    if not os.path.exists(DATA_FILE):
        raise FileNotFoundError(f"{DATA_FILE} not found. Run mock_data_generator.py first.")
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        dataset = json.load(f)
    return bundle, dataset

# Build initial state
bundle = None
model = None
scaler = None
feature_columns = None
candidate_index = None
if os.path.exists(MODEL_FILE):
    try:
        bundle = joblib.load(MODEL_FILE)
        model = bundle.get("rf") or bundle.get("model")
        scaler = bundle.get("scaler")
        feature_columns = bundle.get("feature_columns")
        candidate_index = bundle.get("candidate_index")
    except Exception as e:
        print("Warning: failed to load model bundle:", e)

# MongoDB client helper used to fetch actual engagement data instead of mock file
MONGO_URI = os.environ.get("MONGO_URI") or os.environ.get("MONGO_URL") or "mongodb://localhost:27017/digitalvoting"
_mongo_client = None
def get_mongo():
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = MongoClient(MONGO_URI)
    return _mongo_client

def assemble_win_probas_from_db(election_id):
    """Query MongoDB for votes and candidate info for a given election_id and
    compute a score per candidate. Returns list of dicts: {id, name, photo, party, score}.
    If a trained model is available and feature columns match, will use model.predict_proba.
    Otherwise falls back to a simple normalized vote-count score.
    """
    db = get_mongo().get_default_database()
    try:
        # Attempt to find election document
        election = db.elections.find_one({"_id": ObjectId(election_id)})
    except Exception:
        election = None

    # If election has embedded candidates, use them for names; else try Candidate collection
    candidate_docs = []
    if election and election.get("candidates"):
        # embedded candidates array
        for c in election.get("candidates", []):
            # each c may be { name, party, votes }
            candidate_docs.append({
                "_id": c.get("_id") or c.get("id"),
                "name": c.get("name") or c.get("fullName") or c.get("party") or "Candidate",
                "party": c.get("party") or "",
                "photo": c.get("photo") or "",
            })
    else:
        # fallback: fetch candidate ids from votes collection
        votes_coll = db.votes
        agg = list(votes_coll.aggregate([
            {"$match": {"election": ObjectId(election_id)}},
            {"$group": {"_id": "$candidate", "count": {"$sum": 1}}}
        ]))
        candidate_ids = [r.get("_id") for r in agg if r.get("_id")]
        if candidate_ids:
            candidates = list(db.candidates.find({"_id": {"$in": candidate_ids}}))
            for c in candidates:
                candidate_docs.append({"_id": c.get("_id"), "name": c.get("fullName") or c.get("name"), "party": c.get("party"), "photo": c.get("photo")})

    # Build vote counts per candidate id
    votes_coll = db.votes
    vote_counts = {}
    try:
        agg = list(votes_coll.aggregate([
            {"$match": {"election": ObjectId(election_id)}},
            {"$group": {"_id": "$candidate", "count": {"$sum": 1}}}
        ]))
        for r in agg:
            vote_counts[str(r.get("_id"))] = int(r.get("count", 0))
    except Exception:
        # If votes schema different, ignore
        pass

    # Build feature matrix with enhanced engagement metrics
    rows = []
    posts_coll = db.posts
    reactions_coll = db.reactions
    comments_coll = db.comments

    # reactions weight map
    weights = {"like": 1.0, "heart": 1.5, "support": 1.4, "thumbs_down": -1.0, "love": 1.6, "laugh": 0.8}

    for c in candidate_docs:
        cid = c.get("_id")
        # base vote count
        votes_for = vote_counts.get(str(cid), 0)

        # find posts linked to this candidate and election
        post_query = {"election": ObjectId(election_id)}
        if cid:
            post_query["candidate"] = ObjectId(cid)
        posts = list(posts_coll.find(post_query, {"_id": 1}))
        post_ids = [p.get("_id") for p in posts]

        # compute reaction-weighted score
        reaction_score = 0.0
        if post_ids:
            try:
                agg = list(reactions_coll.aggregate([
                    {"$match": {"post": {"$in": post_ids}}},
                    {"$group": {"_id": "$type", "count": {"$sum": 1}}}
                ]))
                for r in agg:
                    t = r.get("_id")
                    cnt = int(r.get("count", 0))
                    reaction_score += cnt * float(weights.get(t, 0.5))
            except Exception:
                pass

        # comment sentiment
        sentiment_total = 0.0
        sentiment_count = 0
        if post_ids:
            try:
                comments = list(comments_coll.find({"post": {"$in": post_ids}}, {"text": 1}))
                for cm in comments:
                    txt = cm.get("text") or ""
                    if _SIA and txt.strip():
                        try:
                            sc = _SIA.polarity_scores(txt)
                            sentiment_total += sc.get('compound', 0.0)
                            sentiment_count += 1
                        except Exception:
                            pass
            except Exception:
                pass

        avg_sentiment = (sentiment_total / sentiment_count) if sentiment_count > 0 else 0.0

        rows.append({
            "id": str(cid) if cid else None,
            "name": c.get("name"),
            "party": c.get("party", ""),
            "photo": c.get("photo", ""),
            "raw_votes": votes_for,
            "reaction_score": reaction_score,
            "avg_sentiment": avg_sentiment,
            "num_posts": len(post_ids),
            "num_comments": sentiment_count,
        })

    # If we have a trained model and expected feature columns, attempt to compute model score
    if model and feature_columns:
        try:
            import pandas as pd
            df = pd.DataFrame(rows)
            # Ensure feature_columns exist in df. We'll attempt to create fallback features from raw_votes
            for col in feature_columns:
                if col not in df.columns:
                    # create synthetic feature from votes if possible
                    if col in ["votes", "vote_count", "raw_votes"]:
                        df[col] = df.get("raw_votes", 0)
                    else:
                        df[col] = 0
            X = df[feature_columns].fillna(0).values
            try:
                prob = model.predict_proba(X)
                # take probability of positive class if available
                scores = [float(p[1]) if len(p) > 1 else float(p[0]) for p in prob]
            except Exception:
                # model may be regressor
                preds = model.predict(X)
                scores = [float(p) for p in preds]
            # normalize
            total = sum(scores) + 1e-9
            result = []
            for i, r in enumerate(rows):
                normalized = (scores[i] / total) * 100 if total > 0 else 0.0
                result.append({"id": r["id"], "name": r["name"], "photo": r["photo"], "party": r.get("party"), "score": round(normalized, 2)})
            return sorted(result, key=lambda x: -x.get("score", 0))
        except Exception as e:
            print("Model scoring failed, falling back to vote counts:", e)

    # Fallback: normalize raw_votes to 0-100
    totalVotes = sum(r["raw_votes"] for r in rows) + 1e-9
    results = []
    for r in rows:
        score = (r["raw_votes"] / totalVotes) * 100 if totalVotes > 0 else 0.0
        results.append({"id": r["id"], "name": r["name"], "photo": r["photo"], "party": r.get("party"), "score": round(score, 2)})
    return sorted(results, key=lambda x: -x.get("score", 0))

@app.route("/predict", methods=["GET"])
def predict_route():
    """Return current predictions as JSON (one-shot).
    Prefer using /predict/<election_id> for election-specific results.
    """
    election_id = None
    # allow /predict?electionId=... for convenience
    from flask import request
    election_id = request.args.get('electionId') or request.args.get('election_id')
    if election_id:
        try:
            results = assemble_win_probas_from_db(election_id)
            return jsonify({"candidates": results, "generatedAt": str(os.path.getmtime(MODEL_FILE)) if os.path.exists(MODEL_FILE) else None})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return jsonify({"message": "Use /predict/<election_id> or /predict?electionId=<id> to get predictions."})


@app.route("/predict/<election_id>", methods=["GET"])
def predict_for_election(election_id):
    """Return predictions for a specific election id."""
    try:
        results = assemble_win_probas_from_db(election_id)
        return jsonify({"candidates": results, "generatedAt": str(os.path.getmtime(MODEL_FILE)) if os.path.exists(MODEL_FILE) else None})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@socketio.on("connect")
def handle_connect():
    print("Client connected")
    emit("welcome", {"message": "Connected to prediction service"})

@socketio.on("request_live_updates")
def handle_live_request(data):
    """
    Client asks for live updates. `data` may contain:
    - interval: seconds between updates
    We will simulate changes to probabilities by adding small noise.
    """
    # data should include election_id and optional interval
    interval = data.get("interval", DEFAULT_INTERVAL) if isinstance(data, dict) else DEFAULT_INTERVAL
    election_id = None
    if isinstance(data, dict):
        election_id = data.get('election_id') or data.get('electionId')

    # Send a sequence of updates (query DB each tick so results reflect live DB)
    for tick in range(60):  # send 60 updates then stop
        try:
            if election_id:
                results = assemble_win_probas_from_db(election_id)
                # optionally perturb slightly to emphasize change
                for r in results:
                    r['score'] = max(0.0, r.get('score', 0) + random.normalvariate(0, 0.5))
                # normalize to percentages
                total = sum(max(0.0, r.get('score', 0)) for r in results) + 1e-9
                for r in results:
                    r['pct'] = round(100.0 * (r.get('score', 0) / total), 1)
                results = sorted(results, key=lambda x: -x.get('score', 0))
                socketio.emit("live_poll_update", {"data": results})
            else:
                socketio.emit("live_poll_update", {"data": {"error": "No election_id supplied"}})
        except Exception as e:
            socketio.emit("live_poll_update", {"error": str(e)})
        socketio.sleep(interval)  # cooperative sleep for SocketIO
    # After streaming, send final snapshot
    socketio.emit("live_poll_update_finished", {"message": "stream finished"})

if __name__ == "__main__":
    print("Starting prediction service on http://localhost:5000")
    socketio.run(app, host="0.0.0.0", port=5000)
