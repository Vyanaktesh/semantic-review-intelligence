from backend.utils.db import db

def apply_labels():
    reviews = db["reviews"]
    labels = db["cluster_labels"]  # or whatever your label collection is called

    for label_doc in labels.find():
        cluster_id = label_doc["cluster_id"]
        cluster_label = label_doc["label"]

        reviews.update_many(
            {"cluster_id": cluster_id},
            {"$set": {"cluster_label": cluster_label}}
        )

if __name__ == "__main__":
    apply_labels()
