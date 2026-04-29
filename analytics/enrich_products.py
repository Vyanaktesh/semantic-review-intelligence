"""
enrich_products.py
==================
Reads Amazon Reviews 2023 metadata files and populates a MongoDB 'products'
collection with ASIN → product name mappings.

Supported input formats:
  - .jsonl          (plain JSONL, one JSON object per line)
  - .jsonl.gz       (gzipped JSONL — standard Amazon Reviews 2023 format)
  - .gz             (same as above)
  - .zip            (ZIP archive containing one or more .jsonl files)

Usage examples:
  # From a metadata file (recommended — gives real product names):
  python -m analytics.enrich_products --file /path/to/meta_All_Beauty.jsonl.gz

  # From a plain zip containing jsonl files:
  python -m analytics.enrich_products --file /path/to/data.zip

  # Fallback — no metadata file available, just creates placeholder entries
  # using the ASIN itself as the name so the UI at least shows something:
  python -m analytics.enrich_products --from-reviews

The script is idempotent: re-running it on the same data only updates existing
entries and inserts new ones; it never deletes anything.
"""

import argparse
import gzip
import json
import os
import sys
import zipfile
from pathlib import Path

from backend.utils.db import db


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def upsert_product(collection, asin: str, name: str, category: str | None = None):
    """Insert or update a product entry in the 'products' collection."""
    if not asin:
        return
    collection.update_one(
        {"asin": asin},
        {
            "$set": {"productName": name, "category": category},
            "$setOnInsert": {"asin": asin},
        },
        upsert=True,
    )


def is_review_file(sample_doc: dict) -> bool:
    """
    Detect whether a JSONL doc is a review entry (not a metadata entry).
    Review files have 'text' (review body) and 'helpful_vote'.
    Metadata files have 'main_category', 'features', 'description', etc.
    """
    review_fields = {"text", "helpful_vote", "verified_purchase", "user_id"}
    metadata_fields = {"main_category", "features", "description", "store", "bought_in_last_month"}
    has_review = bool(review_fields & sample_doc.keys())
    has_meta = bool(metadata_fields & sample_doc.keys())
    return has_review and not has_meta


def process_line(collection, line: str):
    """Parse a single JSONL line and upsert the product."""
    try:
        doc = json.loads(line)
    except (json.JSONDecodeError, ValueError):
        return

    # Amazon Reviews 2023 metadata uses 'parent_asin' as the canonical key.
    # Review files use 'asin'. Support both plus common variants.
    asin = (
        doc.get("parent_asin")
        or doc.get("asin")
        or doc.get("ASIN")
        or doc.get("id")
    )

    # The product title lives under 'title' in metadata files.
    # Review files also have a 'title' but that is the *review* title — not
    # useful as a product name, so we fall back gracefully.
    name = (
        doc.get("title")          # metadata file: product title
        or doc.get("name")
        or doc.get("product_name")
        or doc.get("productTitle")
        or asin                   # last resort: use the ASIN itself
    )

    category = doc.get("main_category") or doc.get("category") or None

    if asin and name:
        upsert_product(collection, str(asin), str(name), category)


def ingest_lines(collection, file_obj) -> int:
    """Iterate lines from any file-like object and upsert each product."""
    # --- Peek at the first non-empty line to detect review vs metadata files ---
    first_line = ""
    for raw in file_obj:
        first_line = raw.decode("utf-8", errors="ignore") if isinstance(raw, bytes) else raw
        if first_line.strip():
            break
    if first_line.strip():
        try:
            sample = json.loads(first_line.strip())
            if is_review_file(sample):
                print()
                print("⚠️  ERROR: This looks like a REVIEW file, not a metadata file.")
                print("   The 'title' field in review files is the review title, not the product name.")
                print("   You need the metadata file instead (e.g. meta_All_Beauty.jsonl.gz).")
                print("   Download it from: https://amazon-reviews-2023.github.io/")
                print("   Or run with --from-reviews to create placeholder entries from your reviews collection.")
                sys.exit(1)
        except (json.JSONDecodeError, ValueError):
            pass
        # Process the first line we already read
        process_line(collection, first_line.strip())

    count = 1 if first_line.strip() else 0
    for raw_line in file_obj:
        if isinstance(raw_line, bytes):
            raw_line = raw_line.decode("utf-8", errors="ignore")
        line = raw_line.strip()
        if not line:
            continue
        process_line(collection, line)
        count += 1
        if count % 5000 == 0:
            print(f"  Processed {count:,} records…", end="\r", flush=True)
    print(f"  Done — {count:,} records processed.              ")
    return count


# ---------------------------------------------------------------------------
# Entry points
# ---------------------------------------------------------------------------

def enrich_from_file(path: str) -> int:
    """Load product names from a metadata file and store them in MongoDB."""
    p = Path(path)
    collection = db["products"]

    if not p.exists():
        print(f"ERROR: File not found: {p}")
        sys.exit(1)

    print(f"Reading: {p}")
    suffix = "".join(p.suffixes).lower()

    if suffix in (".jsonl.gz", ".json.gz", ".gz"):
        with gzip.open(str(p), "rt", encoding="utf-8", errors="ignore") as f:
            return ingest_lines(collection, f)

    elif suffix == ".zip":
        with zipfile.ZipFile(str(p), "r") as z:
            jsonl_files = [
                n for n in z.namelist()
                if n.lower().endswith(".jsonl") or n.lower().endswith(".json")
            ]
            if not jsonl_files:
                print("ERROR: No .jsonl files found inside the ZIP archive.")
                print("Files in archive:", z.namelist()[:20])
                sys.exit(1)
            total = 0
            for name in jsonl_files:
                print(f"  ↳ {name}")
                with z.open(name) as f:
                    total += ingest_lines(collection, f)
            return total

    elif suffix in (".jsonl", ".json", ".txt", ".ndjson"):
        with open(str(p), "r", encoding="utf-8", errors="ignore") as f:
            return ingest_lines(collection, f)

    else:
        print(f"ERROR: Unsupported file type '{suffix}'.")
        print("Expected one of: .jsonl  .jsonl.gz  .gz  .zip")
        sys.exit(1)


def enrich_from_reviews() -> int:
    """
    Fallback when no metadata file is available.
    Scans the 'reviews' collection for every unique ASIN and creates a
    placeholder 'products' entry whose productName equals the ASIN.
    You can later run --file to overwrite these with real names.
    """
    products_col = db["products"]
    reviews_col = db["reviews"]

    print("Scanning 'reviews' collection for unique ASINs…")
    pipeline_agg = [
        {"$group": {"_id": "$asin"}},
        {"$project": {"asin": "$_id", "_id": 0}},
    ]
    asins = [
        doc["asin"]
        for doc in reviews_col.aggregate(pipeline_agg)
        if doc.get("asin")
    ]
    print(f"Found {len(asins):,} unique ASINs.")

    inserted = 0
    for asin in asins:
        result = products_col.update_one(
            {"asin": asin},
            {
                "$setOnInsert": {
                    "asin": asin,
                    "productName": asin,   # placeholder — shows the ASIN until real names are loaded
                    "category": None,
                },
            },
            upsert=True,
        )
        if result.upserted_id:
            inserted += 1

    print(f"Inserted {inserted:,} new placeholder entries (skipped {len(asins) - inserted:,} already present).")
    return inserted


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Populate MongoDB 'products' collection with ASIN → product name mappings.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--file",
        metavar="PATH",
        help="Path to Amazon Reviews 2023 metadata file (.jsonl, .jsonl.gz, or .zip).",
    )
    group.add_argument(
        "--from-reviews",
        action="store_true",
        help="No metadata file? Extract ASINs from the reviews collection and create placeholder names.",
    )
    args = parser.parse_args()

    if args.file:
        total = enrich_from_file(args.file)
        print(f"\n✓ Enriched 'products' collection — {total:,} entries processed from {args.file}")
    else:
        total = enrich_from_reviews()
        print(f"\n✓ Created {total:,} placeholder product entries from the reviews collection.")

    print("Restart your server — product names will now appear in the UI.")
