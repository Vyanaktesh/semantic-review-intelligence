PROJECT.md
Title: Semantic Review Intelligence System (SRIS)
Dataset: Amazon Reviews 2023 (https://amazon-reviews-2023.github.io/)
Tech Stack: MongoDB Atlas • Atlas Vector Search • Python (spaCy/HuggingFace) • Isolation Forest • React Dashboard • Seasonal Forecasting (Prophet/ARIMA)

1. Project Overview
This system analyzes Amazon product reviews using semantic search, topic clustering, sentiment trend anomaly detection, and seasonal sales forecasting.
The goal is to build an end‑to‑end pipeline:
- Store reviews as documents in MongoDB Atlas
- Generate embeddings and enable Atlas Vector Search
- Run NLP preprocessing + topic modeling + sentiment scoring in Python
- Detect anomalies in sentiment trends using Isolation Forest
- Forecast seasonal sales or review volume
- Visualize everything in a React dashboard

2. System Architecture
2.1 High-Level Diagram
Data → Preprocessing → Embeddings → MongoDB Atlas → Vector Search → Analytics → React Dashboard
2.2 Components
- MongoDB Atlas
- Collections: reviews, embeddings, topics, analytics
- Vector index for semantic search
- Python Backend
- Preprocessing (spaCy)
- Embeddings (HuggingFace)
- Topic clustering (KMeans / BERTopic)
- Sentiment scoring (VADER or transformer)
- Anomaly detection (Isolation Forest)
- Forecasting (Prophet or ARIMA)
- React Frontend
- Search UI (semantic + keyword)
- Topic clusters visualization
- Sentiment trend charts
- Anomaly alerts
- Forecasting graphs
3. Data Pipeline
3.1 Ingestion
- Download dataset from Amazon Reviews 2023
- Convert to JSONL
- Insert into MongoDB Atlas
3.2 Preprocessing
- Clean text (lowercase, remove HTML, punctuation)
- Tokenization (spaCy)
- Lemmatization
- Stopword removal
3.3 Embedding Generation
- Model: sentence-transformers/all-MiniLM-L6-v2
- Store embedding vector in MongoDB field: embedding: [float]
3.4 Topic Clustering
- Use KMeans or BERTopic
- Store:
- topic_id
- top_keywords
- representative_reviews
3.5 Sentiment Analysis
- Use VADER or HuggingFace sentiment model
- Store:
- sentiment_score
- sentiment_label
3.6 Trend + Anomaly Detection
- Aggregate sentiment by day/week
- Fit Isolation Forest
- Detect spikes/drops in sentiment
3.7 Forecasting
- Use Prophet or ARIMA to forecast:
- Review volume
- Average sentiment
- Topic frequency

4. MongoDB Atlas Setup
Collections
- reviews — raw + processed reviews
- embeddings — vector embeddings
- topics — topic clusters
- analytics — sentiment trends, anomalies, forecasts
5.1 preprocess.py
- Clean + tokenize + lemmatize
- Output: cleaned text
5.2 embed.py
- Generate embeddings
- Insert into MongoDB
5.3 topics.py
- KMeans or BERTopic
- Save topic clusters
5.4 sentiment.py
- Sentiment scoring
- Store sentiment per review
5.5 anomaly.py
- Aggregate sentiment
- Isolation Forest
- Store anomaly flags
5.6 forecast.py
- Prophet/ARIMA forecasting
- Store predictions
6. React Dashboard
Pages
- Semantic Search
- Search bar (vector search)
- Similar reviews list
- Topic Explorer
- Topic clusters
- Word clouds
- Sentiment Trends
- Time-series chart
- Anomaly markers
- Forecasting
- Future sentiment
- Future review volume
Components
- Line charts (Recharts / Chart.js)
- Word clouds
- Tables for review results

7. AI Features
7.1 Semantic Search
- Query → embedding → Atlas Vector Search → ranked results
7.2 Topic Clustering
- Group reviews into themes
- Show top keywords + representative reviews
7.3 Sentiment Trend Anomaly Detection
- Detect sudden spikes/drops
- Highlight anomalies on dashboard
7.4 Seasonal Forecasting
- Predict future review volume
- Predict sentiment trajectory
- Useful for product monitoring

8. Milestones & Timeline
Week 1
- Set up MongoDB Atlas
- Load dataset
- Build preprocessing + embedding pipeline
Week 2
- Implement vector search
- Build topic clustering
- Add sentiment scoring
Week 3
- Build anomaly detection
- Build forecasting
- Create analytics collection
Week 4
- Build React dashboard
- Integrate backend APIs
- Deploy final system

9. Deliverables
- Fully working React dashboard
- Python analytics pipeline
- MongoDB Atlas database with vector search
- Documentation + demo video
- Final report + architecture diagram







