import numpy as np
from sklearn.cluster import KMeans
from backend.utils.db import db

def cluster_embeddings(n_clusters=20):
    embed_col = db["embeddings"]
    reviews_col = db["reviews"]

    # Load embeddings into memory
    cursor = embed_col.find({}, {"review_id": 1, "embedding": 1})
    review_ids = []
    vectors = []

    for doc in cursor:
        review_ids.append(doc["review_id"])
        vectors.append(doc["embedding"])

    X = np.array(vectors)

    # Run KMeans
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    labels = kmeans.fit_predict(X)

    # Write cluster labels back to reviews
    for rid, label in zip(review_ids, labels):
        reviews_col.update_one(
            {"_id": rid},
            {"$set": {"cluster_id": int(label)}}
        )