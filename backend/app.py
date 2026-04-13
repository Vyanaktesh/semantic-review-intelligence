from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from backend.utils.db import db
from sentence_transformers import SentenceTransformer
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_model = None
_embeddings_cache = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    return _model


def _get_embeddings() -> dict:
    global _embeddings_cache
    if _embeddings_cache is None:
        cursor = db["embeddings"].find({}, {"review_id": 1, "embedding": 1})
        review_ids, vectors = [], []
        for doc in cursor:
            review_ids.append(doc["review_id"])
            vectors.append(doc["embedding"])
        _embeddings_cache = {
            "review_ids": review_ids,
            "matrix": np.array(vectors, dtype=np.float32) if vectors else np.empty((0, 0), dtype=np.float32),
        }
    return _embeddings_cache


@app.get("/")
def root():
    return {"message": "SRIS backend is running"}


@app.get("/test-db")
def test_db():
    return {"collections": db.list_collection_names()}


@app.get("/search")
def search(q: str = Query(..., min_length=1), limit: int = Query(default=10, ge=1, le=100)):
    model = _get_model()
    cache = _get_embeddings()

    review_ids = cache["review_ids"]
    matrix = cache["matrix"]

    if matrix.size == 0:
        return []

    query_vec = model.encode(q).astype(np.float32)
    query_norm = query_vec / (np.linalg.norm(query_vec) + 1e-10)

    norms = np.linalg.norm(matrix, axis=1, keepdims=True) + 1e-10
    matrix_norm = matrix / norms
    scores = matrix_norm @ query_norm

    top_indices = np.argsort(scores)[::-1][:limit]
    top_ids = [review_ids[i] for i in top_indices]
    top_scores = {str(review_ids[i]): float(scores[i]) for i in top_indices}

    reviews = list(db["reviews"].find({"_id": {"$in": top_ids}}))

    results = []
    for review in reviews:
        results.append({
            "_id": str(review["_id"]),
            "reviewText": review.get("reviewText", ""),
            "asin": review.get("asin", ""),
            "sentiment_score": review.get("sentiment_score"),
            "cluster_label": review.get("cluster_label"),
            "overall": review.get("overall"),
            "score": top_scores.get(str(review["_id"]), 0.0),
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results