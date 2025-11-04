# AI Winner Prediction - ai_winner_prediction

This folder contains a minimal ML pipeline and a live prediction microservice for the
"winner prediction based on engagement" feature.

## Overview of files
- `mock_data_generator.py` : creates a synthetic dataset and inserts into an in-memory mongomock DB (and saves JSON).
- `sentiment_utils.py` : VADER-based sentiment scoring wrapper.
- `feature_engineering.py` : aggregates posts/comments -> candidate-level features.
- `train_model.py` : trains models (LogisticRegression, RandomForest, XGBoost), evaluates, and saves `models.pkl`.
- `predict_service.py` : Flask + SocketIO server that loads saved model and streams live prediction updates.
- `mock_election_dataset.json` : auto-created by `mock_data_generator.py`.
- `models.pkl` : created by `train_model.py` (contains model(s) and scaler).

## Quick start (Linux/macOS)
1. Create & activate a virtual env:

```