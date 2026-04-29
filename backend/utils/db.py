import os
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv

# Always load from the project root .env (the one next to server/, analytics/, etc.)
# This prevents backend/.env with stale credentials from being picked up instead.
_root_env = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=_root_env, override=True)

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "amazon_reviews")

if not MONGO_URI:
    raise RuntimeError(
        f"MONGO_URI not set. Check your .env file at: {_root_env}"
    )

client = MongoClient(MONGO_URI)
db = client[DB_NAME]