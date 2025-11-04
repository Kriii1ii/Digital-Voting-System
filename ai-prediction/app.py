from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json
from services import db_ingest, model as model_service

app = FastAPI(title="AI Prediction Service")

# CORS (allow frontend running on localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_META_PATH = os.path.join(os.path.dirname(__file__), "models", "model_meta.json")


class CandidatePayload(BaseModel):
    candidate_id: str
    name: str
    likes: int = 0
    hearts: int = 0
    thumbs_up: int = 0
    thumbs_down: int = 0
    support: int = 0
    shares: int = 0
    comments_count: int = 0
    avg_sentiment: float = 0.0
    unique_users: int = 0


class PredictRequest(BaseModel):
    election_id: Optional[str]
    candidates: Optional[List[CandidatePayload]]


class TrainResponse(BaseModel):
    success: bool
    message: str


@app.post("/train-from-db", response_model=TrainResponse)
def train_from_db(election_id: Optional[str] = None):
    """Trigger training using historical aggregated data from MongoDB.
    If election_id provided, attempts to load labeled data for that election.
    Otherwise, db_ingest should have logic to find labeled training set.
    """
    try:
        df = db_ingest.load_training_frame(os.getenv("MONGO_URI"), election_id)
        if df is None or df.empty:
            return {"success": False, "message": "No training data found in DB"}

        model_meta = model_service.train_and_save(df)

        # write unified model_meta.json
        os.makedirs(os.path.dirname(MODEL_META_PATH), exist_ok=True)
        try:
            with open(MODEL_META_PATH, "w") as f:
                json.dump(model_meta, f)
        except Exception:
            pass

        # return richer info
        return {"success": True, "message": "Model trained", "model_path": model_meta.get("model_path"), "metrics": {"mae": model_meta.get("mae"), "rmse": model_meta.get("rmse")}}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict")
def predict(req: PredictRequest):
    """Accepts aggregated payload (candidates array) or election_id to pull aggregation internally.
    Returns sorted predictions and usedFallback flag.
    """
    try:
        if req.candidates is None and req.election_id is not None:
            # pull from DB
            payload = db_ingest.aggregate_for_election(os.getenv("MONGO_URI"), req.election_id)
        elif req.candidates is not None:
            payload = {"election_id": req.election_id, "candidates": [c.dict() for c in req.candidates]}
        else:
            raise HTTPException(status_code=400, detail="Provide candidates payload or election_id")

        # Try to predict with model
        model_path = os.path.join(os.path.dirname(__file__), "models", "model_v1.joblib")
        model_meta = None
        if os.path.exists(model_path):
            preds = model_service.predict_from_payload(payload, model_path)
            preds["usedFallback"] = False
            # try to load meta
            meta_path = os.path.splitext(model_path)[0] + "_meta.json"
            if os.path.exists(meta_path):
                try:
                    with open(meta_path, "r") as mf:
                        model_meta = json.load(mf)
                except Exception:
                    model_meta = None
        else:
            # fallback heuristic
            preds = model_service.heuristic_predict(payload)
            preds["usedFallback"] = True

        # sort by predicted_pct
        preds["predictions"] = sorted(preds["predictions"], key=lambda x: x.get("predicted_pct", 0), reverse=True)
        return {"predictions": preds["predictions"], "usedFallback": preds.get("usedFallback", True), "model_meta": model_meta}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"ok": True, "service": "ai-prediction"}
