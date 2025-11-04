# sentiment_utils.py
# Wrapper around NLTK VADER sentiment analyzer.

import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# Note: ensure the 'vader_lexicon' resource is downloaded:
# python -m nltk.downloader vader_lexicon

# Initialize global analyzer for reuse
sia = SentimentIntensityAnalyzer()

def score_text(text):
    """
    Score a piece of text and return the VADER score dict.
    If text is falsy, return neutral scores.
    """
    if not text or not isinstance(text, str):
        return {"neg": 0.0, "neu": 1.0, "pos": 0.0, "compound": 0.0}
    return sia.polarity_scores(text)
