"""
load_reviews.py
===============
Ingests raw review JSONL files into MongoDB, then cleans the text
(lowercase, remove HTML/punctuation, lemmatize, remove stopwords).

Usage (run from the project root):
    python -m analytics.load_reviews

HOW TO POINT THIS SCRIPT AT YOUR FILES
---------------------------------------
Edit the REVIEW_FILES list below. Each entry can be:
  - A .jsonl FILE  e.g. Path(r"C:\\Users\\vyenk\\Downloads\\beauty.jsonl")
  - A FOLDER       e.g. Path(r"C:\\Users\\vyenk\\Downloads\\All_Beauty.jsonl")
                   (the script will walk inside it and find all .jsonl files)

⚠  The meta_* folders (meta_All_Beauty.jsonl etc.) contain PRODUCT NAMES,
   not reviews. Run  python -m analytics.load_meta  for those instead.

The script is safe to re-run — it skips reviews already in MongoDB.
"""

import json
import re
import string
import sys
from pathlib import Path

# ── Point these at your REVIEW files/folders (NOT the meta_* folders) ──────
REVIEW_FILES = [
    # Examples — uncomment / edit to match where your files actually are:
    # Path(r"C:\Users\vyenk\Downloads\beauty.jsonl"),
    # Path(r"C:\Users\vyenk\Downloads\All_Beauty.jsonl"),
    # Path(r"C:\Users\vyenk\Downloads\Pet_Supplies.jsonl"),
    # Path(r"C:\Users\vyenk\Downloads\Video_Games.jsonl"),
]
# ───────────────────────────────────────────────────────────────────────────

BATCH_SIZE = 500

try:
    from backend.utils.db import db
except ImportError:
    print("ERROR: Could not import database connection.")
    print("Make sure you run this from the project root:")
    print("    python -m analytics.load_reviews")
    sys.exit(1)

# spaCy is optional
try:
    import spacy
    nlp = spacy.load("en_core_web_sm", disable=["ner", "parser"])
    USE_SPACY = True
except Exception:
    USE_SPACY = False
    print("⚠  spaCy not found — text will be cleaned but not lemmatized.")
    print("   To enable: python -m spacy download en_core_web_sm\n")


# ── Helpers ────────────────────────────────────────────────────────────────

def is_metadata_doc(doc: dict) -> bool:
    """True if this JSON object is a product metadata record, not a review."""
    meta_fields   = {"main_category", "features", "description", "store", "bought_in_last_month"}
    review_fields = {"text", "helpful_vote", "verified_purchase"}
    return bool(meta_fields & doc.keys()) and not bool(review_fields & doc.keys())


def find_jsonl_files(path: Path) -> list[Path]:
    """Return JSONL files from a path that may be a file or a folder."""
    if not path.exists():
        return []
    if path.is_file():
        return [path]
    # It's a folder — walk it
    files = sorted(path.rglob("*.jsonl")) + sorted(path.rglob("*.json"))
    return [f for f in dict.fromkeys(files) if f.stat().st_size > 100]


def clean_text(text: str) -> str:
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"<.*?>",      " ", text)
    text = re.sub(r"http\S+|www\S+", " ", text)
    text = text.encode("ascii", "ignore").decode()
    text = text.translate(str.maketrans("", "", string.punctuation))
    text = re.sub(r"\s+", " ", text).strip()
    if USE_SPACY:
        doc = nlp(text)
        text = " ".join(t.lemma_ for t in doc if not t.is_stop and len(t.lemma_) > 1)
    return text


# ── Core ingestion ─────────────────────────────────────────────────────────

def ingest_jsonl(filepath: Path, collection, existing: set) -> tuple[int, int]:
    """Read one JSONL file and insert new reviews. Returns (inserted, skipped)."""
    print(f"    • {filepath.name}  ({filepath.stat().st_size / 1024 / 1024:.1f} MB)")

    batch = []
    inserted = skipped = 0

    def flush(b):
        if b:
            collection.insert_many(b, ordered=False)

    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        for lineno, raw in enumerate(f, 1):
            raw = raw.strip()
            if not raw:
                continue
            try:
                doc = json.loads(raw)
            except json.JSONDecodeError:
                skipped += 1
                continue

            # ── Detect metadata file on first line ──────────────────────────
            if lineno == 1 and is_metadata_doc(doc):
                print()
                print(f"  ✗  '{filepath.name}' looks like a PRODUCT METADATA file, not a review file.")
                print("     Metadata files (meta_*) belong in  load_meta.py,  not here.")
                print("     Run:  python -m analytics.load_meta")
                print("     Skipping this file.\n")
                return 0, 0

            # ── Dedup check ─────────────────────────────────────────────────
            key = (doc.get("asin", ""), doc.get("user_id", ""), doc.get("timestamp", 0))
            if key in existing:
                skipped += 1
                continue

            # Normalise field names
            doc["reviewText"]   = doc.get("text") or doc.get("reviewText") or ""
            doc["overall"]      = doc.get("rating") or doc.get("overall")
            doc["cleaned_text"] = clean_text(doc["reviewText"])

            batch.append(doc)
            existing.add(key)

            if len(batch) >= BATCH_SIZE:
                flush(batch)
                inserted += len(batch)
                batch = []
                print(f"      {inserted:,} inserted…", end="\r", flush=True)

    flush(batch)
    inserted += len(batch)
    print(f"      ✓ {inserted:,} inserted  ({skipped} skipped/duplicate)")
    return inserted, skipped


def ingest_path(path: Path, collection) -> int:
    """Handle a single path (file or folder) and return total inserted."""
    files = find_jsonl_files(path)
    if not files:
        print(f"  ⚠  No .jsonl files found at: {path}")
        return 0

    # Build existing-key set once per top-level path (cheaper than per-file)
    print("  Loading existing keys from MongoDB…", end="\r", flush=True)
    existing = set(
        (d["asin"], d.get("user_id", ""), d.get("timestamp", 0))
        for d in collection.find({}, {"asin": 1, "user_id": 1, "timestamp": 1})
    )
    print(f"  {len(existing):,} reviews already in MongoDB              ")

    total = 0
    for f in files:
        ins, _ = ingest_jsonl(f, collection, existing)
        total += ins
    return total


# ── Main ───────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  SRIS — Ingest Reviews into MongoDB")
    print("=" * 60)

    # ── Guard: tell the user clearly if they haven't configured the paths ──
    if not REVIEW_FILES:
        print()
        print("⚠  REVIEW_FILES is empty — nothing to load.")
        print()
        print("Edit analytics/load_reviews.py and uncomment the paths")
        print("that point to your review JSONL files, for example:")
        print()
        print('    Path(r"C:\\Users\\vyenk\\Downloads\\beauty.jsonl"),')
        print('    Path(r"C:\\Users\\vyenk\\Downloads\\All_Beauty.jsonl"),')
        print()
        print("⚠  Do NOT add the meta_* folders here — those are product")
        print("   metadata and belong in  python -m analytics.load_meta")
        sys.exit(0)

    col = db["reviews"]
    before = col.count_documents({})
    print(f"\nExisting reviews in MongoDB: {before:,}\n")

    grand_total = 0
    for path in REVIEW_FILES:
        print(f"\n📄 {path}")
        grand_total += ingest_path(path, col)

    after = col.count_documents({})
    print()
    print("=" * 60)
    print(f"  Done!  {grand_total:,} new reviews inserted.")
    print(f"  Total reviews in MongoDB: {after:,}  (was {before:,})")
    print("=" * 60)

    if grand_total > 0:
        print()
        print("Next steps:")
        print("  1. Load product names:    python -m analytics.load_meta")
        print("  2. Generate embeddings:   python -m analytics.embeddings")
        print("  3. Run clustering:        python -m analytics.clustering")
        print("  4. Score sentiment:       python -m analytics.sentiment_scoring")
        print("  5. Start the server:      cd server && npm run dev")


if __name__ == "__main__":
    main()
