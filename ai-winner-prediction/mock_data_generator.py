# mock_data_generator.py
# Generates multiple synthetic election datasets (candidates, posts, engagements, comments)
# and inserts them into an in-memory mongomock DB, then saves everything as JSON.

import random
import json
from datetime import datetime, timedelta
import uuid
import numpy as np
from tqdm import tqdm
import mongomock

# -----------------------------
# Configuration
# -----------------------------
RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

NUM_ELECTIONS = 10          # ✅ number of elections to generate
NUM_CANDIDATES = 5
POSTS_PER_CANDIDATE = 200
START_DATE = datetime(2025, 9, 1)
END_DATE = datetime(2025, 10, 25)
OUTPUT_FILE = "mock_election_dataset.json"

# -----------------------------
# Comment text examples
# -----------------------------
POSITIVE_COMMENTS = [
    "Great plan!", "I support this!", "Very promising", "Love this idea", "Well said"
]
NEGATIVE_COMMENTS = [
    "Not convinced", "This won't work", "Terrible", "I'm skeptical", "No thanks"
]
NEUTRAL_COMMENTS = [
    "Interesting", "Maybe", "Can you explain?", "What about the cost?", "Thanks for sharing"
]

# -----------------------------
# Utility functions
# -----------------------------
def random_ts(start, end):
    """Return ISO8601 string between start and end datetimes"""
    delta = end - start
    seconds = random.randint(0, int(delta.total_seconds()))
    return (start + timedelta(seconds=seconds)).isoformat() + "Z"

# -----------------------------
# Data generation functions
# -----------------------------
def generate_candidates(n, election_id):
    candidates = []
    for i in range(n):
        cid = f"{election_id}_cand_{i+1}"
        candidates.append({
            "_id": cid,
            "name": f"Candidate {i+1} ({election_id})",
            "party": random.choice(["Independent", "Party A", "Party B"]),
            "registration_date": random_ts(START_DATE - timedelta(days=30), START_DATE),
            "election_id": election_id
        })
    return candidates


def generate_posts(candidates, posts_per_cand):
    """Generate posts per candidate with engagement and sentiment bias."""
    # Assign latent popularity to each candidate
    candidate_true_scores = {c["_id"]: random.uniform(0.2, 1.0) for c in candidates}
    posts = []

    for cand in tqdm(candidates, desc="Generating posts"):
        base_score = candidate_true_scores[cand["_id"]]
        for _ in range(posts_per_cand):
            post_id = f"post_{uuid.uuid4().hex[:8]}"
            post_time = random_ts(START_DATE, END_DATE)

            # Engagements: scale with latent popularity and some noise
            base = base_score * 1000
            likes = max(0, int(np.random.normal(base, base * 0.5)))
            hearts = max(0, int(np.random.normal(base * 0.2, base * 0.1)))
            support = max(0, int(np.random.normal(base * 0.05, base * 0.03)))
            thumbs_up = max(0, int(np.random.normal(base * 0.4, base * 0.2)))
            thumbs_down = max(0, int(np.random.normal(base * 0.05, base * 0.05)))
            shares = max(0, int(np.random.normal(base * 0.1, base * 0.05)))
            views = max(likes + hearts + shares, int(np.random.normal(base * 10, base * 5)))

            # Comments
            num_comments = random.randint(0, 30)
            comments = []
            for _ in range(num_comments):
                r = random.random()
                prob_pos = base_score
                if r < prob_pos * 0.7:
                    txt = random.choice(POSITIVE_COMMENTS)
                elif r < 0.7:
                    txt = random.choice(NEUTRAL_COMMENTS)
                else:
                    txt = random.choice(NEGATIVE_COMMENTS)
                comments.append({
                    "user_id": f"user_{random.randint(1,2000)}",
                    "text": txt,
                    "timestamp": random_ts(START_DATE, END_DATE)
                })

            posts.append({
                "_id": post_id,
                "candidate_id": cand["_id"],
                "election_id": cand["election_id"],
                "text": random.choice([
                    "I will invest in schools.",
                    "We need cleaner streets.",
                    "Healthcare access for everyone.",
                    "Reduce taxes for small businesses.",
                    "Improve public transport."
                ]),
                "timestamp": post_time,
                "engagement": {
                    "likes": likes,
                    "hearts": hearts,
                    "support": support,
                    "thumbs_up": thumbs_up,
                    "thumbs_down": thumbs_down,
                    "shares": shares,
                    "views": views
                },
                "comments": comments
            })
    return posts, candidate_true_scores


def create_multiple_elections(num_elections=NUM_ELECTIONS):
    """Generate multiple synthetic elections with different winners."""
    all_posts = []
    all_candidates = []
    all_metadata = []

    for i in range(num_elections):
        election_id = f"election_{i+1}"
        print(f"\n🔹 Generating data for {election_id}...")
        candidates = generate_candidates(NUM_CANDIDATES, election_id)
        posts, candidate_true_scores = generate_posts(candidates, POSTS_PER_CANDIDATE)
        winner = max(candidate_true_scores.items(), key=lambda kv: kv[1])[0]

        all_posts.extend(posts)
        all_candidates.extend(candidates)
        all_metadata.append({
            "election_id": election_id,
            "winner": winner,
            "candidate_true_scores": candidate_true_scores
        })

        print(f"✅ Winner for {election_id}: {winner}")

    dataset = {
        "candidates": all_candidates,
        "posts": all_posts,
        "metadata": {
            "elections": all_metadata,
            "generated_at": datetime.now().isoformat() + "Z"
        }
    }
    return dataset


def save_dataset(dataset, out_file=OUTPUT_FILE):
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2)
    print(f"\n💾 Saved mock dataset to {out_file}")


def create_mongomock_db(dataset):
    client = mongomock.MongoClient()
    db = client["digital_voting"]
    db.candidates.insert_many(dataset["candidates"])
    db.posts.insert_many(dataset["posts"])
    db.metadata.insert_one(dataset["metadata"])
    return db


# -----------------------------
# Main
# -----------------------------
if __name__ == "__main__":
    ds = create_multiple_elections(num_elections=NUM_ELECTIONS)
    save_dataset(ds)
    db = create_mongomock_db(ds)
    print("Inserted data into in-memory mongomock database for testing.")
    print(f"📊 Total elections: {len(ds['metadata']['elections'])}")
    print(f"📈 Total candidates: {len(ds['candidates'])}")
    print(f"📰 Total posts: {len(ds['posts'])}")
