from transformers import pipeline
from backend.utils.db import db

def score_sentiment(batch_size=64, max_docs=None):
    reviews = db["reviews"]

    # Load sentiment model
    sentiment = pipeline(
        "sentiment-analysis",
        model="distilbert-base-uncased-finetuned-sst-2-english",
        device=-1  # CPU; change to 0 if you have GPU
    )

    # Query all cleaned reviews
    query = {"cleaned_text": {"$exists": True, "$ne": ""}}
    cursor = reviews.find(query, {"cleaned_text": 1})

    if max_docs is not None:
        cursor = cursor.limit(max_docs)

    batch = []
    ids = []

    for doc in cursor:
        batch.append(doc["cleaned_text"])
        ids.append(doc["_id"])

        if len(batch) == batch_size:
            _process_batch(reviews, sentiment, ids, batch)
            batch, ids = [], []

    # Process leftover batch
    if batch:
        _process_batch(reviews, sentiment, ids, batch)


def _process_batch(reviews, sentiment, ids, texts):
    results = sentiment(texts, truncation=True, max_length=512)
    for _id, res in zip(ids, results):
        reviews.update_one(
            {"_id": _id},
            {"$set": {
                "sentiment_label": res["label"],
                "sentiment_score": float(res["score"])
            }}
        )

if __name__ == "__main__":
    score_sentiment(batch_size=64, max_docs=None)