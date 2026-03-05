from fastapi import FastAPI
from backend.utils.db import db

app = FastAPI()

@app.get("/")
def root():
    return {"message": "SRIS backend is running"}

@app.get("/test-db")
def test_db():
    return {"collections": db.list_collection_names()}