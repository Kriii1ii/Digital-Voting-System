"""MongoDB ingestion helpers for aggregated features.
This module uses pymongo to pull aggregates required by the prediction service.
"""
from pymongo import MongoClient
import os
import pandas as pd
from datetime import datetime, timedelta




def _get_db(uri):
    client = MongoClient(uri)
    dbname = os.getenv("MONGO_DB_NAME")
    if not dbname:
        # default to 'digital_voting'
        dbname = "digital_voting"
    return client[dbname]


def aggregate_for_election(mongo_uri, election_id):
    """Return aggregated JSON payload for given election_id.
    Output format:
    { election_id, candidates: [ { candidate_id, name, likes, hearts, thumbs_up, thumbs_down, shares, comments_count, avg_sentiment, unique_users } ] }
    """
    db = _get_db(mongo_uri)

    # Collections expected: candidates, posts, reactions, comments
    candidates_col = db.get_collection("candidates")
    posts_col = db.get_collection("posts")
    reactions_col = db.get_collection("reactions")
    comments_col = db.get_collection("comments")

    # find candidates for election
    candidates = list(candidates_col.find({"election_id": election_id}))
    result = {"election_id": election_id, "candidates": []}

    # compute last24h cutoff
    cutoff = datetime.utcnow() - timedelta(hours=24)

    for c in candidates:
        cid = str(c.get("_id"))
        name = c.get("name") or c.get("fullName") or c.get("title")

        # find posts associated to this candidate (if posts reference candidate_id)
        posts = list(posts_col.find({"candidate_id": cid, "election_id": election_id}, {"_id": 1}))
        post_ids = [p["_id"] for p in posts]

        # Reactions aggregation
        match = {"post_id": {"$in": post_ids}} if post_ids else {"post_id": None}

        def count_reaction(kind):
            q = match.copy()
            q.update({"type": kind})
            return reactions_col.count_documents(q)

        likes = count_reaction("like")
        hearts = count_reaction("heart")
        thumbs_up = count_reaction("thumbs_up")
        thumbs_down = count_reaction("thumbs_down")
        support = count_reaction("support")
        shares = count_reaction("share")

        # comments
        comments_count = comments_col.count_documents({"post_id": {"$in": post_ids}}) if post_ids else 0

        # avg sentiment - assume comments have 'sentiment' float or 'text' field
        pipeline = [
            {"$match": {"post_id": {"$in": post_ids}}},
            {"$project": {"sentiment": 1, "text": 1}},
            {"$group": {"_id": None, "avgSent": {"$avg": "$sentiment"}}}
        ]
        avg_sent = None
        try:
            r = list(comments_col.aggregate(pipeline))
            if r:
                avg_sent = r[0].get("avgSent")
        except Exception:
            avg_sent = None

        # unique users interacted
        users_pipeline = [
            {"$match": {"post_id": {"$in": post_ids}}},
            {"$group": {"_id": "$user_id"}},
            {"$count": "unique"}
        ]
        unique_users = 0
        try:
            ru = list(reactions_col.aggregate(users_pipeline))
            if ru:
                unique_users = ru[0].get("unique", 0)
        except Exception:
            unique_users = 0

        # last24h reaction delta (velocity)
        last24_match = {"post_id": {"$in": post_ids}, "timestamp": {"$gte": cutoff}} if post_ids else {"post_id": None}
        last24_count = reactions_col.count_documents(last24_match)

        result["candidates"].append({
            "candidate_id": cid,
            "name": name,
            "likes": likes,
            "hearts": hearts,
            "thumbs_up": thumbs_up,
            "thumbs_down": thumbs_down,
            "support": support,
            "shares": shares,
            "comments_count": comments_count,
            "avg_sentiment": float(avg_sent) if avg_sent is not None else 0.0,
            "unique_users": unique_users,
            "last24_reaction_delta": last24_count,
        })

    # Attempt to attach actual_pct labels from election_results collection if present
    try:
        results_col = db.get_collection("election_results")
        for cand in result["candidates"]:
            q = {"election_id": election_id, "candidate_id": cand["candidate_id"]}
            r = results_col.find_one(q)
            if r and "actual_pct" in r:
                cand["actual_pct"] = float(r["actual_pct"])
    except Exception:
        # ignore if collection missing
        pass

    return result


def load_training_frame(mongo_uri, election_id=None):
    """Load a pandas DataFrame from DB suitable for training.
    This expects historical elections with a column 'actual_pct' per candidate.
    If election_id specified, will try to load labeled rows only for that election.
    """
    payload = aggregate_for_election(mongo_uri, election_id) if election_id else None
    # In a real project, we'd scan historical elections and join with known ground-truths
    # Here we try to build a DataFrame if comments include 'actual_pct' field for candidates
    if not payload:
        return None

    rows = []
    for c in payload["candidates"]:
        # check for a label field - fallback: skip if missing
        # TODO: adjust to your DB schema where actual vote results are stored
        actual = c.get("actual_pct")
        if actual is None:
            continue
        rows.append({
            "candidate_id": c["candidate_id"],
            "likes": c["likes"],
            "hearts": c["hearts"],
            "thumbs_up": c["thumbs_up"],
            "thumbs_down": c["thumbs_down"],
            "support": c["support"],
            "shares": c["shares"],
            "comments_count": c["comments_count"],
            "avg_sentiment": c["avg_sentiment"],
            "unique_users": c["unique_users"],
            "last24_reaction_delta": c.get("last24_reaction_delta", 0),
            "actual_pct": actual,
        })

    if not rows:
        return None

    return pd.DataFrame(rows)
