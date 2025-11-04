# train_model.py
# Train models on the mock dataset and save model + scaler to models.pkl

import json
import joblib
import numpy as np
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
import xgboost as xgb
from feature_engineering import aggregate_posts_to_candidate_features

# -----------------------------
# Paths
# -----------------------------
DATA_FILE = "mock_election_dataset.json"
OUTPUT_MODEL_FILE = "models.pkl"

# -----------------------------
# Dataset loading
# -----------------------------
def load_dataset(path=DATA_FILE):
    if not os.path.exists(path):
        raise FileNotFoundError(f"{path} not found. Run mock_data_generator.py first.")
    with open(path, "r", encoding="utf-8") as f:
        dataset = json.load(f)
    return dataset

# -----------------------------
# Feature matrix builder
# -----------------------------
def build_feature_matrix(dataset):
    posts = dataset.get("posts", [])
    X_df, feature_cols = aggregate_posts_to_candidate_features(posts)
    candidate_ids = list(X_df.index)

    # Handle multiple elections
    metadata = dataset.get("metadata", {})
    elections = metadata.get("elections", [])

    # Build a lookup of winner per election
    winner_map = {m["election_id"]: m["winner"] for m in elections} if elections else {}

    # Assign labels: 1 if candidate is winner of their election, else 0
    y_binary = []
    for cid in candidate_ids:
        election_id = X_df.loc[cid].get("election_id") if "election_id" in X_df.columns else None
        winner = winner_map.get(election_id)
        y_binary.append(1 if cid == winner else 0)

    y_binary = np.array(y_binary, dtype=int)
    X = X_df[feature_cols].values
    return X, y_binary, X_df, feature_cols

# -----------------------------
# Training + Evaluation
# -----------------------------
def train_and_evaluate(X, y):
    print("Unique labels in y:", np.unique(y))

    if len(np.unique(y)) < 2:
        raise ValueError("Dataset only has one class — check label generation logic.")

    # Split dataset
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.4, random_state=42, stratify=y
    )

    # Scale numeric features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    results = {}

    # Logistic Regression
    lr = LogisticRegression(random_state=42, solver="lbfgs")
    lr.fit(X_train_scaled, y_train)
    y_pred_lr = lr.predict(X_test_scaled)
    y_proba_lr = lr.predict_proba(X_test_scaled)[:, 1]
    results["logistic"] = {
        "model": lr,
        "accuracy": accuracy_score(y_test, y_pred_lr),
        "f1": f1_score(y_test, y_pred_lr, zero_division=0),
        "precision": precision_score(y_test, y_pred_lr, zero_division=0),
        "recall": recall_score(y_test, y_pred_lr, zero_division=0),
        "auc": roc_auc_score(y_test, y_proba_lr),
    }

    # Random Forest
    rf = RandomForestClassifier(n_estimators=200, random_state=42)
    rf.fit(X_train, y_train)
    y_pred_rf = rf.predict(X_test)
    y_proba_rf = rf.predict_proba(X_test)[:, 1]
    results["random_forest"] = {
        "model": rf,
        "accuracy": accuracy_score(y_test, y_pred_rf),
        "f1": f1_score(y_test, y_pred_rf, zero_division=0),
        "precision": precision_score(y_test, y_pred_rf, zero_division=0),
        "recall": recall_score(y_test, y_pred_rf, zero_division=0),
        "auc": roc_auc_score(y_test, y_proba_rf),
    }

    # XGBoost
    xgb_model = xgb.XGBClassifier(use_label_encoder=False, eval_metric="logloss", random_state=42)
    xgb_model.fit(X_train, y_train)
    y_pred_xgb = xgb_model.predict(X_test)
    y_proba_xgb = xgb_model.predict_proba(X_test)[:, 1]
    results["xgboost"] = {
        "model": xgb_model,
        "accuracy": accuracy_score(y_test, y_pred_xgb),
        "f1": f1_score(y_test, y_pred_xgb, zero_division=0),
        "precision": precision_score(y_test, y_pred_xgb, zero_division=0),
        "recall": recall_score(y_test, y_pred_xgb, zero_division=0),
        "auc": roc_auc_score(y_test, y_proba_xgb),
    }

    return results, scaler

# -----------------------------
# Main
# -----------------------------
def main():
    print("Loading dataset...")
    dataset = load_dataset()
    print("Building features...")
    X, y, X_df, feature_cols = build_feature_matrix(dataset)
    print("Feature shape:", X.shape)
    print("Training models...")

    results, scaler = train_and_evaluate(X, y)

    print("\nTraining results summary:")
    for name, info in results.items():
        print(f"\nModel: {name}")
        print(f"  Accuracy:  {info['accuracy']:.3f}")
        print(f"  F1:        {info['f1']:.3f}")
        print(f"  Precision: {info['precision']:.3f}")
        print(f"  Recall:    {info['recall']:.3f}")
        print(f"  AUC:       {info['auc']:.3f}")

    # Save trained models
    model_bundle = {
        "rf": results["random_forest"]["model"],
        "lr": results["logistic"]["model"],
        "xgb": results["xgboost"]["model"],
        "scaler": scaler,
        "feature_columns": feature_cols,
        "candidate_index": list(X_df.index),
    }
    joblib.dump(model_bundle, OUTPUT_MODEL_FILE)
    print(f"\n✅ Saved model bundle to {OUTPUT_MODEL_FILE}")

if __name__ == "__main__":
    main()
