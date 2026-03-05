from collections import Counter
from backend.utils.db import db


def get_cluster_keywords(cluster_id, top_n=30):
    reviews = db["reviews"]
    cursor = reviews.find({"cluster_id": cluster_id}, {"cleaned_text": 1})

    counter = Counter()
    for doc in cursor:
        if "cleaned_text" in doc:
            counter.update(doc["cleaned_text"].split())

    return counter.most_common(top_n)

def get_cluster_samples(cluster_id, n=5):
    reviews = db["reviews"]
    cursor = reviews.find(
        {"cluster_id": cluster_id},
        {"cleaned_text": 1}
    ).limit(n)

    return [doc["cleaned_text"] for doc in cursor]


def set_cluster_label(cluster_id, label):
    db["cluster_labels"].update_one(
        {"cluster_id": cluster_id},
        {"$set": {"label": label}},
        upsert=True
    )