from sentence_transformers import SentenceTransformer
from backend.utils.db import db

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

from sentence_transformers import SentenceTransformer
from backend.utils.db import db

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def generate_embeddings():
    reviews = db["reviews"]
    embed_col = db["embeddings"]

    # FIXED QUERY — ensures cleaned_text exists and is not empty
    cursor = reviews.find(
        {"cleaned_text": {"$exists": True, "$ne": ""}},
        {"_id": 1, "cleaned_text": 1}
    )

    # UPDATED LOOP — with progress logging
    for i, doc in enumerate(cursor, start=1):
        text = doc["cleaned_text"]
        vector = model.encode(text).tolist()

        embed_col.insert_one({
            "review_id": doc["_id"],
            "embedding": vector
        })

        if i % 100 == 0:
            print(f"Embedded {i} reviews...")