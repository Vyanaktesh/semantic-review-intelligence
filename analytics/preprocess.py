import json
from backend.utils.db import db

import re
import string
import spacy
from backend.utils.db import db

def ingest_reviews(path):
    collection = db["reviews"]
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            doc = json.loads(line)
            collection.insert_one(doc)


# Load spaCy model once
nlp = spacy.load("en_core_web_sm", disable=["ner", "parser"])

def clean_text(text):
    if not text:
        return ""

    # Lowercase
    text = text.lower()

    # Remove HTML tags
    text = re.sub(r"<.*?>", " ", text)

    # Remove URLs
    text = re.sub(r"http\S+|www\S+", " ", text)

    # Remove emojis and non-ASCII
    text = text.encode("ascii", "ignore").decode()

    # Remove punctuation
    text = text.translate(str.maketrans("", "", string.punctuation))

    # Remove extra whitespace
    text = re.sub(r"\s+", " ", text).strip()

    # Lemmatize + remove stopwords
    doc = nlp(text)
    tokens = [token.lemma_ for token in doc if not token.is_stop]

    return " ".join(tokens)


def clean_reviews():
    collection = db["reviews"]
    cursor = collection.find({}, {"_id": 1, "text": 1})

    for doc in cursor:
        cleaned = clean_text(doc.get("text", ""))
        collection.update_one(
            {"_id": doc["_id"]},
            {"$set": {"cleaned_text": cleaned}}
        )