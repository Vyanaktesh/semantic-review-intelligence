import streamlit as st
import altair as alt
import pandas as pd
from pymongo import MongoClient
import os

# Connect to MongoDB (use environment variable for credentials)
MONGO_URI = os.environ.get("MONGO_URI", "mongodb+srv://<user>:<password>@<cluster>.mongodb.net/")
client = MongoClient(MONGO_URI)
db = client["amazon_reviews"]
reviews = db["reviews"]

st.title("Amazon Review Intelligence Dashboard")
st.write("Explore topics, sentiment, and product insights.")

# Aggregation pipeline
pipeline = [
    {
        "$group": {
            "_id": { "asin": "$asin", "topic": "$cluster_label" },
            "count": { "$sum": 1 },
            "avg_sentiment": { "$avg": "$sentiment_score" }
        }
    }
]

# Run aggregation
data = list(reviews.aggregate(pipeline))
df = pd.DataFrame(data)
st.write("DEBUG SAMPLE:", df.head())

# Extract fields from _id
# Extract fields safely
df["_id"] = df["_id"].fillna({})

df["asin"] = df["_id"].apply(lambda x: x.get("asin"))
df["topic"] = df["_id"].apply(
    lambda x: x.get("topic") or x.get("cluster_label") or "Unknown Topic"
)

# Build chart
chart = alt.Chart(df).mark_bar().encode(
    x="count:Q",
    y="topic:N",
    color="avg_sentiment:Q",
    tooltip=["asin", "topic", "count", "avg_sentiment"]
)

st.altair_chart(chart, use_container_width=True)