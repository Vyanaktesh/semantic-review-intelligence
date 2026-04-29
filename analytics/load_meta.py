"""
load_meta.py
============
Loads product names from your meta_*.jsonl folders into MongoDB's
'products' collection.

Usage (run from the project root):
    python -m analytics.load_meta

Reads from:
    C:\\Users\\vyenk\\Downloads\\meta_All_Beauty.jsonl\\
    C:\\Users\\vyenk\\Downloads\\meta_Pet_Supplies.jsonl\\
    C:\\Users\\vyenk\\Downloads\\meta_Video_Games.jsonl\\

Writes to:
    MongoDB -> products collection  (asin, productName, category)
"""

import json
import sys
from pathlib import Path
from pymongo import UpdateOne

# ── adjust this if your Downloads folder is elsewhere ──────────────────────
DOWNLOADS = Path(r"C:\Users\vyenk\Downloads")

META_FOLDERS = [
    DOWNLOADS / "meta_All_Beauty.jsonl",
    DOWNLOADS / "meta_Pet_Supplies.jsonl",
    DOWNLOADS / "meta_Video_Games.jsonl",
]
# ───────────────────────────────────────────────────────────────────────────

try:
    from backend.utils.db import db
except ImportError:
    print("ERROR: Could not import database connection.")
    print("Make sure you run this from the project root:")
    print("    python -m analytics.load_meta")
    sys.exit(1)


def find_jsonl_files(folder: Path) -> list[Path]:
    """
    Return all .jsonl files inside a folder.
    Handles the common Hugging Face layout where the folder is named
    'meta_X.jsonl' and contains files like:
      - meta_X.jsonl            (same name as folder)
      - train-00000-of-00001.jsonl
      - data-00000.jsonl
      - part_0.jsonl  etc.
    """
    if not folder.exists():
        print(f"  ⚠  Folder not found, skipping: {folder}")
        return []
    if folder.is_file():
        return [folder]

    files = sorted(folder.rglob("*.jsonl")) + sorted(folder.rglob("*.json"))
    # de-duplicate and filter out tiny files (< 100 bytes)
    seen = set()
    result = []
    for f in files:
        if f not in seen and f.stat().st_size > 100:
            seen.add(f)
            result.append(f)
    return result


def is_review_doc(doc: dict) -> bool:
    """True if this JSON object is a review, not a product metadata record."""
    review_fields = {"text", "helpful_vote", "verified_purchase", "user_id"}
    return bool(review_fields & doc.keys())


BULK_SIZE = 2_000   # send 2000 upserts to MongoDB in one round-trip


def load_folder(folder: Path, collection) -> int:
    """Process all JSONL files in a folder and bulk-upsert products."""
    files = find_jsonl_files(folder)
    if not files:
        print(f"  No .jsonl files found inside {folder.name}")
        return 0

    total = 0
    for filepath in files:
        print(f"  Reading: {filepath.name}  ({filepath.stat().st_size / 1024 / 1024:.1f} MB)")
        ops = []
        inserted = skipped = 0

        def flush(ops_list):
            if ops_list:
                collection.bulk_write(ops_list, ordered=False)

        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            for lineno, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue

                try:
                    doc = json.loads(line)
                except json.JSONDecodeError:
                    skipped += 1
                    continue

                # Safety check on first line
                if lineno == 1 and is_review_doc(doc):
                    print()
                    print(f"  ✗ ERROR: '{filepath.name}' looks like a REVIEW file, not metadata.")
                    print("    Skipping. Use  python -m analytics.load_reviews  for review files.")
                    break

                asin = (doc.get("parent_asin") or doc.get("asin") or
                        doc.get("ASIN") or doc.get("id") or "")
                name = (doc.get("title") or doc.get("name") or
                        doc.get("product_name") or "")
                category = doc.get("main_category") or doc.get("category") or ""

                if not asin or not name:
                    skipped += 1
                    continue

                ops.append(UpdateOne(
                    {"asin": asin},
                    {"$set": {"productName": name, "category": category},
                     "$setOnInsert": {"asin": asin}},
                    upsert=True,
                ))
                inserted += 1

                if len(ops) >= BULK_SIZE:
                    flush(ops)
                    ops = []
                    print(f"    {inserted:,} products loaded…", end="\r", flush=True)

        flush(ops)
        print(f"    ✓ {inserted:,} products upserted  ({skipped} skipped)")
        total += inserted

    return total


def main():
    print("=" * 60)
    print("  SRIS — Load Product Metadata into MongoDB")
    print("=" * 60)

    col = db["products"]
    before = col.count_documents({})
    print(f"\nExisting products in MongoDB: {before:,}\n")

    grand_total = 0
    for folder in META_FOLDERS:
        print(f"\n📂 {folder.name}")
        count = load_folder(folder, col)
        grand_total += count

    after = col.count_documents({})
    print()
    print("=" * 60)
    print(f"  Done!  {grand_total:,} records processed.")
    print(f"  Products in MongoDB now: {after:,}  (was {before:,})")
    print("=" * 60)
    print()
    print("Next step: restart your server (or POST /products/reload-names)")
    print("Product names will appear across the entire dashboard.")


if __name__ == "__main__":
    main()
