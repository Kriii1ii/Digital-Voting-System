"""Preprocessing utilities to convert payloads into DataFrame features."""
import pandas as pd


def payload_to_df(payload):
    rows = []
    for c in payload.get('candidates', []):
        rows.append({
            'candidate_id': c.get('candidate_id'),
            'likes': c.get('likes', 0),
            'hearts': c.get('hearts', 0),
            'thumbs_up': c.get('thumbs_up', 0),
            'thumbs_down': c.get('thumbs_down', 0),
            'support': c.get('support', 0),
            'shares': c.get('shares', 0),
            'comments_count': c.get('comments_count', 0),
            'avg_sentiment': c.get('avg_sentiment', 0.0),
            'unique_users': c.get('unique_users', 0),
            'last24_reaction_delta': c.get('last24_reaction_delta', 0),
        })
    if not rows:
        return pd.DataFrame()
    return pd.DataFrame(rows)
