"""Model training and prediction utilities.
Simple implementation using scikit-learn. If scikit-learn is not available, the service
falls back to a heuristic.
"""
import os
import json
from typing import Dict, Any
import numpy as np

try:
    import joblib
    from sklearn.ensemble import RandomForestRegressor
except Exception:
    joblib = None
    RandomForestRegressor = None

import pandas as pd


MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
MODEL_PATH = os.path.abspath(os.path.join(MODEL_DIR, "model_v1.joblib"))


def _features_from_df(df: pd.DataFrame):
    feat_cols = ["likes", "hearts", "thumbs_up", "thumbs_down", "support", "shares", "comments_count", "avg_sentiment", "unique_users", "last24_reaction_delta"]
    X = df[feat_cols].fillna(0).astype(float)
    return X


def train_and_save(df: pd.DataFrame, out_path: str = MODEL_PATH) -> Dict[str, Any]:
    """Train a regressor to predict actual_pct and save model and metadata.
    Performs a train/test split, computes MAE and RMSE on test set, and saves a Pipeline
    (StandardScaler + RandomForest) to disk using joblib. Returns metadata dict containing metrics.
    """
    if RandomForestRegressor is None or joblib is None:
        raise RuntimeError("scikit-learn or joblib not available in environment")

    if "actual_pct" not in df.columns:
        raise ValueError("training DataFrame must contain 'actual_pct' label column")

    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler
    from sklearn.pipeline import Pipeline
    from sklearn.metrics import mean_absolute_error, mean_squared_error

    X = _features_from_df(df)
    y = df["actual_pct"].astype(float)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("rf", RandomForestRegressor(n_estimators=100, random_state=42)),
    ])

    pipeline.fit(X_train, y_train)

    # predictions and metrics
    y_pred = pipeline.predict(X_test)
    mae = float(mean_absolute_error(y_test, y_pred))
    rmse = float(mean_squared_error(y_test, y_pred, squared=False))

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    joblib.dump(pipeline, out_path)

    meta = {
        "model_path": out_path,
        "version": "v1",
        "trained_at": pd.Timestamp.now().isoformat(),
        "features": X.columns.tolist(),
        "train_rows": int(X_train.shape[0]),
        "test_rows": int(X_test.shape[0]),
        "mae": mae,
        "rmse": rmse,
    }

    # write model_meta.json alongside the model file
    try:
        meta_path = os.path.splitext(out_path)[0] + "_meta.json"
        with open(meta_path, "w") as mf:
            json.dump(meta, mf)
    except Exception:
        pass

    return meta


def predict_from_payload(payload: Dict[str, Any], model_path: str = MODEL_PATH) -> Dict[str, Any]:
    """Load model and predict. Returns dict with predictions list.
    payload: { election_id, candidates: [ ... ] }
    """
    if joblib is None:
        return heuristic_predict(payload)

    model = joblib.load(model_path)
    rows = []
    for c in payload["candidates"]:
        rows.append({
            "likes": c.get("likes", 0),
            "hearts": c.get("hearts", 0),
            "thumbs_up": c.get("thumbs_up", 0),
            "thumbs_down": c.get("thumbs_down", 0),
            "support": c.get("support", 0),
            "shares": c.get("shares", 0),
            "comments_count": c.get("comments_count", 0),
            "avg_sentiment": c.get("avg_sentiment", 0.0),
            "unique_users": c.get("unique_users", 0),
            "last24_reaction_delta": c.get("last24_reaction_delta", 0),
        })

    X = pd.DataFrame(rows)
    X = X.fillna(0)
    raw = model.predict(X)

    # ensure non-negative
    raw = np.maximum(raw, 0.0)
    # normalize to percentages
    if raw.sum() == 0:
        pct = np.repeat(1.0 / len(raw), len(raw))
    else:
        pct = raw / raw.sum()

    predictions = []
    for i, c in enumerate(payload["candidates"]):
        predictions.append({
            "candidate_id": c.get("candidate_id"),
            "name": c.get("name"),
            "raw_score": float(raw[i]),
            "predicted_pct": float(pct[i] * 100.0),
        })

    return {"predictions": predictions}


def heuristic_predict(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Simple weighted heuristic if model unavailable.
    Weights chosen heuristically; adjust as needed.
    """
    weights = {
        "likes": 0.8,
        "hearts": 1.2,
        "thumbs_up": 0.9,
        "thumbs_down": -0.6,
        "support": 1.5,
        "shares": 1.0,
        "comments_count": 0.5,
        "avg_sentiment": 2.0,
        "unique_users": 1.0,
        "last24_reaction_delta": 0.4,
    }

    scores = []
    for c in payload["candidates"]:
        s = 0.0
        for k, w in weights.items():
            s += float(c.get(k, 0) or 0) * w
        # boost by positive sentiment
        scores.append(max(s, 0.0))

    import numpy as _np
    scores = _np.array(scores)
    if scores.sum() == 0:
        pct = _np.repeat(1.0 / len(scores), len(scores))
    else:
        pct = scores / scores.sum()

    preds = []
    for i, c in enumerate(payload["candidates"]):
        preds.append({
            "candidate_id": c.get("candidate_id"),
            "name": c.get("name"),
            "raw_score": float(scores[i]),
            "predicted_pct": float(pct[i] * 100.0),
        })

    return {"predictions": preds}
