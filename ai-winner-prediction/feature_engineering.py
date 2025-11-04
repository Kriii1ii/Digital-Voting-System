# feature_engineering.py
# Aggregate post-level engagement and comments into candidate-level features.

import pandas as pd
import numpy as np
from sentiment_utils import score_text

def aggregate_posts_to_candidate_features(posts):
    """
    Input:
      posts: list of post documents with structure:
        {
          "_id": ...,
          "candidate_id": ...,
          "election_id": ...,
          "engagement": {"likes":..., "hearts":..., ...},
          "comments": [{"user_id":..., "text":..., "timestamp":...}, ...],
          ...
        }
    Output:
      X_df: pandas DataFrame indexed by candidate_id containing features
      feature_columns: list of column names to use for ML
    """
    cand_acc = {}

    for p in posts:
        cid = p.get("candidate_id")
        election_id = p.get("election_id")  # ✅ added
        if cid is None:
            continue
        if cid not in cand_acc:
            cand_acc[cid] = {
                "candidate_id": cid,
                "election_id": election_id,   # ✅ keep track of election
                "num_posts": 0,
                "total_likes": 0,
                "total_hearts": 0,
                "total_support": 0,
                "total_thumbs_up": 0,
                "total_thumbs_down": 0,
                "total_shares": 0,
                "total_views": 0,
                "total_comments": 0,
                "unique_commenters": set(),
                "sum_comment_compound": 0.0,
                "num_scored_comments": 0
            }

        rec = cand_acc[cid]
        rec["num_posts"] += 1

        eng = p.get("engagement", {})
        rec["total_likes"] += eng.get("likes", 0)
        rec["total_hearts"] += eng.get("hearts", 0)
        rec["total_support"] += eng.get("support", 0)
        rec["total_thumbs_up"] += eng.get("thumbs_up", 0)
        rec["total_thumbs_down"] += eng.get("thumbs_down", 0)
        rec["total_shares"] += eng.get("shares", 0)
        rec["total_views"] += eng.get("views", 0)

        comments = p.get("comments", [])
        rec["total_comments"] += len(comments)
        for c in comments:
            rec["unique_commenters"].add(c.get("user_id"))
            sc = score_text(c.get("text", ""))
            rec["sum_comment_compound"] += sc.get("compound", 0.0)
            rec["num_scored_comments"] += 1

    # Convert to DataFrame
    records = []
    for cid, rec in cand_acc.items():
        unique_commenters = len(rec["unique_commenters"])
        avg_comment_sentiment = (
            rec["sum_comment_compound"] / rec["num_scored_comments"]
            if rec["num_scored_comments"] > 0
            else 0.0
        )
        comments_per_post = (
            rec["total_comments"] / rec["num_posts"] if rec["num_posts"] > 0 else 0.0
        )
        likes_per_post = (
            rec["total_likes"] / rec["num_posts"] if rec["num_posts"] > 0 else 0.0
        )
        thumbs_up_ratio = rec["total_thumbs_up"] / (
            rec["total_thumbs_up"] + rec["total_thumbs_down"] + 1e-9
        )

        # engagement_score: heuristic aggregation (tunable)
        engagement_score = (
            rec["total_likes"] * 0.4
            + rec["total_hearts"] * 0.5
            + rec["total_support"] * 1.0
            + rec["total_shares"] * 0.7
            + rec["total_thumbs_up"] * 0.3
            - rec["total_thumbs_down"] * 0.5
            + rec["total_views"] * 0.01
            + unique_commenters * 0.5
            + avg_comment_sentiment * 100.0
        )

        records.append({
            "candidate_id": cid,
            "election_id": rec["election_id"],  # ✅ keep this for winner mapping
            "num_posts": rec["num_posts"],
            "total_likes": rec["total_likes"],
            "total_hearts": rec["total_hearts"],
            "total_support": rec["total_support"],
            "total_thumbs_up": rec["total_thumbs_up"],
            "total_thumbs_down": rec["total_thumbs_down"],
            "total_shares": rec["total_shares"],
            "total_views": rec["total_views"],
            "total_comments": rec["total_comments"],
            "unique_commenters": unique_commenters,
            "avg_comment_compound": avg_comment_sentiment,
            "comments_per_post": comments_per_post,
            "likes_per_post": likes_per_post,
            "thumbs_up_ratio": thumbs_up_ratio,
            "engagement_score": engagement_score
        })

    df = pd.DataFrame.from_records(records).set_index("candidate_id")

    # Create log transformations for heavy-tailed features
    for c in ["total_likes", "total_views", "engagement_score"]:
        if c in df.columns:
            df[f"log_{c}"] = np.log1p(df[c])

    # Choose feature columns for the model
    feature_columns = [
        "num_posts",
        "log_total_likes",
        "total_hearts",
        "total_support",
        "thumbs_up_ratio",
        "comments_per_post",
        "unique_commenters",
        "avg_comment_compound",
        "log_total_views",
        "log_engagement_score"
    ]

    # Filter only valid columns
    feature_columns = [c for c in feature_columns if c in df.columns]

    # ✅ Return DataFrame + features
    return df, feature_columns
