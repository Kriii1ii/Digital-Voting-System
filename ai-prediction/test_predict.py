"""Small test client to call AI /predict endpoint locally."""
import os
import requests


AI_URL = os.getenv('AI_PREDICTION_URL', 'http://localhost:8000/predict')


def main():
    payload = {
        "election_id": "test-election-1",
        "candidates": [
            {"candidate_id": "1", "name": "Alice", "likes": 10, "hearts": 3, "shares": 2, "comments_count": 1, "avg_sentiment": 0.2, "unique_users": 8},
            {"candidate_id": "2", "name": "Bob", "likes": 5, "hearts": 6, "shares": 1, "comments_count": 2, "avg_sentiment": -0.1, "unique_users": 6},
        ]
    }

    r = requests.post(AI_URL, json=payload)
    print('Status', r.status_code)
    print(r.json())


if __name__ == '__main__':
    main()
